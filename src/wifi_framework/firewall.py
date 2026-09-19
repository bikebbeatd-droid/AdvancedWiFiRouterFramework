from dataclasses import dataclass
from .openwrt_network import validate_interface, NetworkApplyError
from .uci_runtime import UCI

@dataclass(frozen=True)
class FirewallForward:
    lan_zone: str='lan'
    wan_zone: str='wan'
    def validate(self):
        if not self.lan_zone or not self.wan_zone or self.lan_zone == self.wan_zone:
            raise NetworkApplyError('LAN and WAN zones must differ')

@dataclass
class OpenWrtFirewallRuntime:
    uci: UCI
    def validate(self, rule): rule.validate(); return rule
    def prepare_wan_forward(self, rule):
        rule.validate()
        self.uci.set('firewall.lan_wan_forward.src',rule.lan_zone)
        self.uci.set('firewall.lan_wan_forward.dest',rule.wan_zone)
        return True
