from eil_card import (
    discover_access_policy,
    is_gateway_operational,
    is_interaction_allowed,
    is_interaction_denied,
    is_training_denied,
)

OPEN_CARD = {"card_id": "x.com", "type": "organization"}

GATEWAY_CARD = {
    "card_id": "sinyalle.com",
    "type": "organization",
    "edition": "registry_plus",
    "access_policy": {
        "version": "0.1",
        "default": "gateway",
        "agents": {"read": "gateway", "act": "gateway", "training": "deny"},
        "state": "active",
        "updated_at": "2026-06-27T10:00:00Z",
    },
}

PAUSED_CARD = {
    "card_id": "y.com",
    "type": "organization",
    "edition": "registry_plus",
    "access_policy": {
        "default": "deny",
        "state": "paused",
        "expires_at": "2000-01-01T00:00:00Z",
    },
}


def test_no_policy_defaults_to_gateway():
    p = discover_access_policy(OPEN_CARD)
    assert p["declared"] is False
    assert p["read"] == "gateway"
    assert p["act"] == "gateway"
    assert p["training"] == "allow"
    assert p["state"] == "active"


def test_gateway_card():
    p = discover_access_policy(GATEWAY_CARD)
    assert p["declared"] is True
    assert p["read"] == "gateway"
    assert is_training_denied(GATEWAY_CARD) is True
    assert is_gateway_operational(GATEWAY_CARD) is True
    assert is_interaction_allowed(GATEWAY_CARD, "read") is False


def test_paused_and_expired():
    p = discover_access_policy(PAUSED_CARD)
    assert p["state"] == "paused"
    assert p["expired"] is True
    assert is_gateway_operational(PAUSED_CARD) is False
    assert is_interaction_denied(PAUSED_CARD, "act") is True
