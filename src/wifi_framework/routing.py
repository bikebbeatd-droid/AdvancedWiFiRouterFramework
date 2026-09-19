from dataclasses import dataclass
from enum import Enum


class RoutingError(RuntimeError):
    pass


class NatBackend(str, Enum):
    LINUX_NFT = "nft"
    OPENWRT_UCI = "uci"


@dataclass(frozen=True)
class NatRule:
    uplink_interface: str
    lan_interface: str

    def validate(self) -> None:
        if not self.uplink_interface or not self.lan_interface:
            raise RoutingError("Both uplink and LAN interfaces are required")
        if self.uplink_interface == self.lan_interface:
            raise RoutingError("Uplink and LAN interfaces must be different")


def validate_nat_rule(rule: NatRule) -> NatRule:
    rule.validate()
    return rule
