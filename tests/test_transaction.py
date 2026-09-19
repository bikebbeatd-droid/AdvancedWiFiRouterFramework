import pytest
from wifi_framework.transaction import ApplyTransaction,ApplyState,ApplyError

def test_transaction_executes_staged_actions():
    calls=[]; tx=ApplyTransaction()
    tx.stage(lambda:calls.append("apply"),lambda:calls.append("rollback")); tx.mark_applied()
    assert calls==["apply"] and tx.state==ApplyState.APPLIED

def test_transaction_rolls_back_when_apply_fails():
    calls=[]; tx=ApplyTransaction()
    tx.stage(lambda: (_ for _ in ()).throw(RuntimeError("boom")),lambda:calls.append("rollback"))
    with pytest.raises(ApplyError): tx.mark_applied()
    assert calls==["rollback"] and tx.state==ApplyState.ROLLED_BACK

def test_transaction_verify_failure_rolls_back():
    calls=[]; tx=ApplyTransaction()
    tx.stage(lambda:calls.append("apply"),lambda:calls.append("rollback")); tx.mark_applied()
    with pytest.raises(ApplyError): tx.verify(False)
    assert calls==["apply","rollback"] and tx.state==ApplyState.ROLLED_BACK
