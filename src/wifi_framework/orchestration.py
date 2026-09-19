from dataclasses import dataclass
from .wisp import WispPlan
from .openwrt_network import WispNetworkConfig
from .dhcp import DhcpConfig
from .firewall import FirewallForward

@dataclass(frozen=True)
class WispOrchestrationPlan:
    wisp: WispPlan
    network: WispNetworkConfig
    dhcp: DhcpConfig
    firewall: FirewallForward
    def validate(self, concurrent_ap_sta: bool):
        self.wisp.validate(concurrent_ap_sta)
        self.network.validate(); self.dhcp.validate(); self.firewall.validate()
        return self
