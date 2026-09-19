from wifi_framework.routing import NatRule, RoutingError
from wifi_framework.qos import QosConfig, QosError


def test_nat_rule_requires_distinct_interfaces():
    try:
        NatRule("wlan0", "wlan0").validate()
    except RoutingError:
        pass
    else:
        raise AssertionError("same interface must be rejected")


def test_qos_rates_must_be_positive():
    try:
        QosConfig("wlan0", download_kbit=0).validate()
    except QosError:
        pass
    else:
        raise AssertionError("zero rate must be rejected")
