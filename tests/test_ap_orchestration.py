from wifi_framework.ap import ApConfig

def test_ap_validation(): ApConfig('wlan0','MyRouter').validate()
def test_ssid_too_long():
    try: ApConfig('wlan0','x'*33).validate()
    except Exception: pass
    else: raise AssertionError('long SSID must fail')
