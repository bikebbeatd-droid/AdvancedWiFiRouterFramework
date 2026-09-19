from dataclasses import dataclass
from .uci_runtime import UCI
from .openwrt_network import validate_interface, NetworkApplyError

@dataclass(frozen=True)
class DhcpConfig:
    lan_interface: str
    start: int=100
    limit: int=100
    leasetime: str='12h'
    def validate(self):
        validate_interface(self.lan_interface)
        if not 1 <= self.start <= 254 or not 1 <= self.limit <= 254 or self.start + self.limit > 255:
            raise NetworkApplyError('Invalid DHCP range')
        if not self.leasetime: raise NetworkApplyError('Lease time required')

@dataclass
class OpenWrtDhcpRuntime:
    uci: UCI
    def validate(self, config): config.validate(); return config
    def prepare(self, config):
        config.validate()
        self.uci.set('dhcp.lan.interface',config.lan_interface)
        self.uci.set('dhcp.lan.start',str(config.start))
        self.uci.set('dhcp.lan.limit',str(config.limit))
        self.uci.set('dhcp.lan.leasetime',config.leasetime)
        return True
