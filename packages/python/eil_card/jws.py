from __future__ import annotations

import base64
import json
import re
from typing import Any, TypedDict


class JwsVerifyResult(TypedDict, total=False):
    ok: bool
    alg: str
    kid: str
    payload_matches: bool
    signature_valid: bool
    message: str


def canonical_card_without_signatures(card: dict[str, Any]) -> dict[str, Any]:
    out = dict(card)
    out.pop("signatures", None)
    return out


def _decode_b64url(value: str) -> bytes:
    padded = value + "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(padded.encode("ascii"))


def _payload_matches_card(payload: dict[str, Any], card: dict[str, Any]) -> bool:
    canonical = canonical_card_without_signatures(card)
    if payload == canonical:
        return True

    def sort_keys(value: Any) -> Any:
        if isinstance(value, dict):
            return {k: sort_keys(value[k]) for k in sorted(value)}
        if isinstance(value, list):
            return [sort_keys(item) for item in value]
        return value

    return sort_keys(payload) == sort_keys(canonical)


def verify_registry_jws(
    card: dict[str, Any],
    *,
    public_key_pem: str | None = None,
) -> JwsVerifyResult:
    """
    Verify Registry+ signatures.registry.jws on a resolved card.

    Without public_key_pem: payload structure check only.
    With public_key_pem + cryptography installed: RS256/ES256 crypto verify.
    """
    jws = (card.get("signatures") or {}).get("registry", {}).get("jws")
    if not jws:
        return {
            "ok": False,
            "payload_matches": False,
            "message": "No signatures.registry.jws on card",
        }

    parts = jws.split(".")
    if len(parts) != 3:
        return {
            "ok": False,
            "payload_matches": False,
            "message": "Invalid compact JWS format",
        }

    header_b64, payload_b64, sig_b64 = parts
    header = json.loads(_decode_b64url(header_b64))
    payload = json.loads(_decode_b64url(payload_b64))
    alg = str(header.get("alg") or (card.get("signatures") or {}).get("registry", {}).get("alg") or "")
    kid = (card.get("signatures") or {}).get("registry", {}).get("kid") or header.get("kid")
    payload_matches = _payload_matches_card(payload, card)

    if not public_key_pem:
        return {
            "ok": payload_matches,
            "alg": alg,
            "kid": kid,
            "payload_matches": payload_matches,
            "message": (
                "JWS payload matches card (crypto verify skipped — pass public_key_pem)"
                if payload_matches
                else "JWS payload does not match public card JSON"
            ),
        }

    if alg not in ("RS256", "ES256"):
        return {
            "ok": False,
            "alg": alg,
            "kid": kid,
            "payload_matches": payload_matches,
            "message": f"Unsupported JWS alg for verify: {alg}",
        }

    try:
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import ec, padding
    except ImportError:
        return {
            "ok": payload_matches,
            "alg": alg,
            "kid": kid,
            "payload_matches": payload_matches,
            "message": (
                "cryptography package required for signature verify "
                "(pip install eil-card[crypto])"
            ),
        }

    try:
        key = serialization.load_pem_public_key(public_key_pem.encode("utf-8"))
        signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
        signature = _decode_b64url(sig_b64)

        if alg == "RS256":
            key.verify(signature, signing_input, padding.PKCS1v15(), hashes.SHA256())  # type: ignore[union-attr]
            signature_valid = True
        else:
            from cryptography.exceptions import InvalidSignature

            try:
                key.verify(signature, signing_input, ec.ECDSA(hashes.SHA256()))  # type: ignore[union-attr]
                signature_valid = True
            except InvalidSignature:
                signature_valid = False

        ok = signature_valid and payload_matches
        return {
            "ok": ok,
            "alg": alg,
            "kid": kid,
            "payload_matches": payload_matches,
            "signature_valid": signature_valid,
            "message": (
                "Registry JWS signature valid"
                if ok
                else f"Signature valid: {signature_valid}, payload matches: {payload_matches}"
            ),
        }
    except Exception as exc:  # noqa: BLE001
        return {
            "ok": False,
            "alg": alg,
            "kid": kid,
            "payload_matches": payload_matches,
            "signature_valid": False,
            "message": str(exc),
        }
