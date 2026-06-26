from __future__ import annotations

import re
from typing import Any

from eil_card.capabilities import discover_capabilities
from eil_card.types import DiscoveredActCapabilities, ParsedCapabilityScopes

_SCOPE_KIND_PATTERN = re.compile(r"^(read|write|act):")


def parse_capability_scopes(scopes: list[str] | None = None) -> ParsedCapabilityScopes:
    result: ParsedCapabilityScopes = {
        "read": [],
        "write": [],
        "act": [],
        "unknown": [],
        "all": list(scopes) if scopes else [],
    }
    if not scopes:
        return result

    for scope in scopes:
        if scope.startswith("read:"):
            result["read"].append(scope)
        elif scope.startswith("write:"):
            result["write"].append(scope)
        elif scope.startswith("act:"):
            result["act"].append(scope)
        elif _SCOPE_KIND_PATTERN.match(scope):
            result["unknown"].append(scope)
        else:
            result["unknown"].append(scope)

    return result


def discover_act_capabilities(card: dict[str, Any]) -> DiscoveredActCapabilities:
    base = discover_capabilities(card)
    scopes_parsed = parse_capability_scopes(base.get("scopes"))
    actions = (card.get("capabilities") or {}).get("actions")

    return {
        **base,
        "scopes_parsed": scopes_parsed,
        "actions": actions,
        "has_write_or_act": bool(
            scopes_parsed["write"] or scopes_parsed["act"] or (actions or [])
        ),
    }


def build_idempotency_key(
    *,
    agent_client_id: str,
    action_id: str,
    entity_id: str,
    nonce: str,
) -> str:
    def slug(value: str) -> str:
        out = value.strip().lower()
        out = re.sub(r"[^a-z0-9._-]+", "-", out)
        out = re.sub(r"-+", "-", out)
        return out.strip("-")

    return "/".join(
        [
            "eil-act",
            slug(agent_client_id),
            slug(action_id),
            slug(entity_id),
            slug(nonce),
        ]
    )


def build_agent_act_headers(
    *,
    access_token: str,
    idempotency_key: str,
    action_id: str,
    card_id: str,
) -> dict[str, str]:
    return {
        "authorization": f"Bearer {access_token}",
        "idempotency_key": idempotency_key,
        "action_id": action_id,
        "card_id": card_id,
    }


def agent_act_headers_to_fetch(headers: dict[str, str]) -> dict[str, str]:
    return {
        "Authorization": headers["authorization"],
        "Idempotency-Key": headers["idempotency_key"],
        "X-EIL-Action-Id": headers["action_id"],
        "X-EIL-Card-Id": headers["card_id"],
    }
