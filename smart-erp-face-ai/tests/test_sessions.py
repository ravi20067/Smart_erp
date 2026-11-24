import time
import pytest
from app.services.session_processor import SessionProcessor


def test_session_creation_and_retrieval():
    sp = SessionProcessor()
    session = sp.create_session("SESS-001", "CH-01", expires_in_seconds=60)
    assert session.session_id == "SESS-001"
    assert session.challenge_id == "CH-01"
    assert not session.is_expired

    retrieved = sp.get_session("SESS-001")
    assert retrieved is not None
    assert retrieved.session_id == "SESS-001"


def test_session_expiration():
    sp = SessionProcessor()
    # Create with 1 second TTL
    sp.create_session("SESS-EXP", "CH-02", expires_in_seconds=1)
    time.sleep(1.2)

    session = sp.get_session("SESS-EXP")
    assert session is not None
    assert session.is_expired is True
    assert session.face_detection_state == "EXPIRED"


def test_session_completion():
    sp = SessionProcessor()
    sp.create_session("SESS-COMP", "CH-03", expires_in_seconds=60)
    evidence = sp.complete_session("SESS-COMP")
    assert evidence is not None
    assert evidence["processing_status"] == "COMPLETED"

    session = sp.get_session("SESS-COMP")
    assert session.is_completed is True


def test_session_deletion():
    sp = SessionProcessor()
    sp.create_session("SESS-DEL", "CH-04")
    assert sp.delete_session("SESS-DEL") is True
    assert sp.get_session("SESS-DEL") is None
    assert sp.delete_session("SESS-DEL") is False


def test_session_pruning():
    sp = SessionProcessor()
    sp.create_session("SESS-P1", expires_in_seconds=1)
    sp.create_session("SESS-P2", expires_in_seconds=60)
    time.sleep(1.2)
    pruned = sp.cleanup_expired_sessions()
    assert pruned == 1
    assert sp.get_session("SESS-P1") is None
    assert sp.get_session("SESS-P2") is not None
