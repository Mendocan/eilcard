import pytest
import responses

from eil_card import (
    CardNotFoundError,
    DigitalCard,
    InvalidResolveInputError,
    build_idempotency_key,
    discover_act_capabilities,
    discover_capabilities,
    invoke_eil_resolve,
)
from eil_card.client import normalize_domain

SAMPLE_CARD = {
    "card_id": "sinyalle.com",
    "type": "organization",
    "edition": "registry_plus",
    "schema_version": "1.2",
    "name": {"official": "Sinyalle"},
    "contact": {"website": "https://sinyalle.com"},
    "capabilities": {
        "agent_gateway": "https://agent-gateway.eilcard.com",
        "auth": "oauth2",
        "scopes": ["read:profile", "write:post", "act:comment"],
        "actions": [{"id": "create_post", "method": "POST", "path": "/v1/posts", "scopes": ["write:post"]}],
    },
}


def test_normalize_domain():
    assert normalize_domain("https://Sinyalle.com/path") == "sinyalle.com"


def test_invalid_resolve_input():
    with pytest.raises(InvalidResolveInputError):
        DigitalCard.resolve()
    with pytest.raises(InvalidResolveInputError):
        DigitalCard.resolve(domain="a.com", handle="foo")


@responses.activate
def test_resolve_by_domain_registry():
    responses.add(
        responses.GET,
        "https://eilcard.com/api/v1/resolve?domain=sinyalle.com",
        json={"card": SAMPLE_CARD},
        status=200,
    )
    result = DigitalCard.resolve(domain="sinyalle.com")
    assert result["card"]["card_id"] == "sinyalle.com"
    assert result["meta"]["source"] == "registry"


@responses.activate
def test_resolve_by_handle():
    responses.add(
        responses.GET,
        "https://eilcard.com/api/v1/cards/sinyal24",
        json={"card": SAMPLE_CARD},
        status=200,
    )
    result = DigitalCard.resolve(handle="sinyal24")
    assert result["meta"]["source"] == "registry"


@responses.activate
def test_well_known_fallback():
    responses.add(
        responses.GET,
        "https://eilcard.com/api/v1/resolve?domain=example.test",
        status=404,
    )
    responses.add(
        responses.GET,
        "https://example.test/.well-known/digital-card",
        json=SAMPLE_CARD,
        status=200,
    )
    result = DigitalCard.resolve(domain="example.test")
    assert result["meta"]["source"] == "well-known"


@responses.activate
def test_card_not_found():
    responses.add(
        responses.GET,
        "https://eilcard.com/api/v1/resolve?domain=missing.test",
        status=404,
    )
    responses.add(
        responses.GET,
        "https://missing.test/.well-known/digital-card",
        status=404,
    )
    with pytest.raises(CardNotFoundError):
        DigitalCard.resolve(domain="missing.test")


def test_discover_capabilities():
    caps = discover_capabilities(SAMPLE_CARD)
    assert caps["available"] is True
    assert caps["agent_gateway"] == "https://agent-gateway.eilcard.com"


def test_discover_act_capabilities():
    act = discover_act_capabilities(SAMPLE_CARD)
    assert act["has_write_or_act"] is True
    assert "write:post" in act["scopes_parsed"]["write"]


def test_build_idempotency_key():
    key = build_idempotency_key(
        agent_client_id="eil-pilot-agent",
        action_id="create_post",
        entity_id="sinyalle.com",
        nonce="abc-123",
    )
    assert key.startswith("eil-act/eil-pilot-agent/create_post/sinyalle.com/")


@responses.activate
def test_invoke_eil_resolve():
    responses.add(
        responses.GET,
        "https://eilcard.com/api/v1/resolve?domain=sinyalle.com",
        json={"card": SAMPLE_CARD},
        status=200,
    )
    result = invoke_eil_resolve(domain="sinyalle.com")
    assert result["card"]["name"]["official"] == "Sinyalle"
