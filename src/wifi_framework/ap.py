from dataclasses import dataclass
from .hostapd import HostapdControl
from .openwrt_network import validate_interface, NetworkApplyError

@dataclass(frozen=True)
class ApConfig:
    interface: str
    ssid: str
    channel: int | None = None
    country: str | None = None
    def validate(self):
        validate_interface(self.interface)
        if not self.ssid or len(self.ssid.encode('utf-8')) > 32: raise NetworkApplyError('SSID must be 1-32 UTF-8 bytes')
        if self.channel is not None and not 1 <= self.channel <= 233: raise NetworkApplyError('Invalid channel')
        if self.country is not None and (len(self.country)!=2 or not self.country.isalpha()): raise NetworkApplyError('Invalid country code')

@dataclass
class ApRuntime:
    hostapd: HostapdControl
    def validate(self, config): config.validate(); return config
    def status(self): return self.hostapd.status()
    def stations(self): return self.hostapd.stations()
