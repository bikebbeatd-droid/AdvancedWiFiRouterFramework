from wifi_framework.openwrt_network import NetworkApplyError,WispNetworkConfig

def test_interfaces_must_differ():
    try: WispNetworkConfig('wlan0','wlan0').validate()
    except NetworkApplyError: pass
    else: raise AssertionError('same interface must fail')

def test_invalid_interface_rejected():
    try: WispNetworkConfig('wlan0;reboot','br-lan').validate()
    except NetworkApplyError: pass
    else: raise AssertionError('invalid interface must fail')
