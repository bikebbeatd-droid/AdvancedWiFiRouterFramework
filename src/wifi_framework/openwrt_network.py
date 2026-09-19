from dataclasses import dataclass
import re
from .routing import NatRule, validate_nat_rule
from .uci_runtime import UCI

class NetworkApplyError(RuntimeError): pass

_IFACE=re.compile(r'^[A-Za-z0-9_.:-]{1,64}$')

def validate_interface(name):
    if not _IFACE.fullmatch(name): raise NetworkApplyError('Invalid interface name')
    return name

@dataclass(frozen=True)
class WispNetworkConfig:
    uplink: str
    lan: str
    lan_ip: str='192.168.50.1'
    lan_netmask: str='255.255.255.0'
    def validate(self):
        validate_interface(self.uplink); validate_interface(self.lan)
        validate_nat_rule(NatRule(self.uplink,self.lan))
        if not self.lan_ip or not self.lan_netmask: raise NetworkApplyError('LAN address settings are required')

@dataclass
class OpenWrtNetworkRuntime:
    uci: UCI
    def validate(self, config): config.validate(); return config
    def prepare_lan(self, config):
        config.validate()
        self.uci.set('network.lan.ipaddr',config.lan_ip)
        self.uci.set('network.lan.netmask',config.lan_netmask)
        return True
