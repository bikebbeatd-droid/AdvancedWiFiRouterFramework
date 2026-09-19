from wifi_framework.transaction import ApplyTransaction,ApplyError,ApplyState

def test_failed_verification_rolls_back():
    called=[]
    tx=ApplyTransaction(); tx.stage(lambda: called.append('rollback')); tx.mark_applied()
    try: tx.verify(False)
    except ApplyError: pass
    assert tx.state==ApplyState.ROLLED_BACK and called==['rollback']

def test_verify_success():
    tx=ApplyTransaction(); tx.stage(lambda: None); tx.mark_applied(); tx.verify(True)
    assert tx.state==ApplyState.VERIFIED
