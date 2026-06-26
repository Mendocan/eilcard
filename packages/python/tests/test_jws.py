from eil_card.jws import canonical_card_without_signatures, verify_registry_jws

CARD = {
    "card_id": "example.com",
    "type": "organization",
    "edition": "registry_plus",
    "name": {"official": "Example"},
    "signatures": {
        "registry": {
            "alg": "RS256",
            "kid": "test",
            "jws": "eyJhbGciOiJSUzI1NiJ9.eyJjYXJkX2lkIjoiZXhhbXBsZS5jb20ifQ.sig",
        }
    },
}


def test_canonical_without_signatures():
    canonical = canonical_card_without_signatures(CARD)
    assert "signatures" not in canonical
    assert canonical["card_id"] == "example.com"


def test_verify_missing_jws():
    result = verify_registry_jws({"card_id": "x.com", "type": "organization"})
    assert result["ok"] is False
    assert "No signatures" in result["message"]


def test_verify_invalid_jws_format():
    bad = {**CARD, "signatures": {"registry": {"jws": "not-a-jws"}}}
    result = verify_registry_jws(bad)
    assert result["ok"] is False
    assert "Invalid compact JWS" in result["message"]
