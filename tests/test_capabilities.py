from wifi_framework.iw_capabilities import parse_iw_list

SAMPLE = '''
Band 1:
	Frequencies:
		* 2412 MHz [1]
		* 2437 MHz [6]
Band 2:
	Frequencies:
		* 5180 MHz [36]
	Supported interface modes:
		* managed
		* AP
		* mesh point
	valid interface combinations:
		 * #{ managed } <= 1, #{ AP } <= 1
'''

def test_parse_iw_list_capabilities():
    cap = parse_iw_list(SAMPLE)
    assert cap.bands_2ghz and cap.bands_5ghz
    assert cap.ap and cap.sta and cap.concurrent_ap_sta and cap.mesh_80211s
    assert cap.channels_2ghz == (1, 6)
    assert cap.channels_5ghz == (36,)
