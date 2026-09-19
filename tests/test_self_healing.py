from wifi_framework.self_healing import HealthPolicy,SelfHealing,RecoveryAction

def test_reconnect_before_rollback():
    h=SelfHealing(HealthPolicy(min_score=60,failure_limit=3))
    assert h.evaluate(40)==RecoveryAction.RECONNECT
    assert h.evaluate(40)==RecoveryAction.RECONNECT
    assert h.evaluate(40)==RecoveryAction.ROLLBACK

def test_healthy_resets_failures():
    h=SelfHealing(); h.evaluate(20); assert h.evaluate(90)==RecoveryAction.NONE; assert h.failures==0

def test_invalid_policy():
    try: HealthPolicy(min_score=101).validate()
    except ValueError: pass
    else: raise AssertionError('invalid policy accepted')
