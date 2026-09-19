from dataclasses import dataclass
from .models import Network, Security
from .mode import WifiMode, validate_mode

class WispConfigError(ValueError):
    pass

@dataclass(frozen=True)
class WispPlan:
    upstream_ssid: str
    upstream_interface: str
    downstream_interface: str
    mode: WifiMode = WifiMode.WISP
    credential_ref: str | None = None
    def validate(self, concurrent_ap_sta: bool, protected: bool = True) -> None:
        if not self.upstream_ssid or not self.upstream_interface or not self.downstream_interface:
            raise WispConfigError('SSID and both interfaces are required')
        if self.upstream_interface == self.downstream_interface:
            raise WispConfigError('Upstream and downstream interfaces must differ')
        validate_mode(self.mode, concurrent_ap_sta)
        if protected and not self.credential_ref:
            raise WispConfigError('Administrator credential reference required for protected network')

def build_wisp_plan(network: Network, upstream_interface: str, downstream_interface: str, credential_ref: str | None, concurrent_ap_sta: bool) -> WispPlan:
    protected = network.security != Security.OPEN
    if protected and not credential_ref:
        raise WispConfigError('Protected network requires administrator-supplied credentials')
    plan=WispPlan(network.ssid,upstream_interface,downstream_interface,WifiMode.WISP,credential_ref)
    plan.validate(concurrent_ap_sta, protected=protected)
    return plan
