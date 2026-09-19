from dataclasses import dataclass
from collections.abc import Callable
from .dhcp import DhcpConfig, OpenWrtDhcpRuntime
from .firewall import FirewallForward, OpenWrtFirewallRuntime
from .openwrt_network import WispNetworkConfig, OpenWrtNetworkRuntime
from .transaction import ApplyError, ApplyTransaction

@dataclass(frozen=True)
class WispApplyPlan:
    network:WispNetworkConfig
    dhcp:DhcpConfig
    firewall:FirewallForward

@dataclass
class OpenWrtWispRuntime:
    network_runtime:OpenWrtNetworkRuntime
    dhcp_runtime:OpenWrtDhcpRuntime
    firewall_runtime:OpenWrtFirewallRuntime
    transaction_factory:type[ApplyTransaction]=ApplyTransaction
    uci_packages:tuple[str,...]=("network","dhcp","firewall")

    def validate(self,plan):
        plan.network.validate(); plan.dhcp.validate(); plan.firewall.validate()
        if plan.dhcp.lan_interface!=plan.network.lan: raise ApplyError("DHCP interface must match WISP LAN interface")
        return True

    def prepare(self,plan):
        self.validate(plan); tx=self.transaction_factory()
        tx.stage(lambda:self.network_runtime.prepare_lan(plan.network), lambda:self.network_runtime.uci.revert("network"))
        tx.stage(lambda:self.dhcp_runtime.prepare(plan.dhcp), lambda:self.dhcp_runtime.uci.revert("dhcp"))
        tx.stage(lambda:self.firewall_runtime.prepare_wan_forward(plan.firewall), lambda:self.firewall_runtime.uci.revert("firewall"))
        return tx

    def apply(self,plan,healthy:Callable[[],bool]):
        tx=self.prepare(plan)
        try:
            tx.mark_applied()
            tx.verify(bool(healthy()))
            for package in self.uci_packages:
                self.network_runtime.uci.commit(package)
            return tx
        except Exception as exc:
            try: tx.rollback()
            except Exception as rollback_exc: raise ApplyError("WISP apply failed and rollback also failed") from rollback_exc
            raise ApplyError("WISP apply failed; configuration was rolled back") from exc
