from wifi_framework.api import DashboardState

def test_dashboard_state_serializes():
    state = DashboardState(mode="WISP", uplink="HomeWiFi", signal_dbm=-55, latency_ms=23.5, clients=3, health="good")
    data = state.as_dict()
    assert data["mode"] == "WISP"
    assert data["clients"] == 3
