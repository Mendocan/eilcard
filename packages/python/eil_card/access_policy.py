from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal, TypedDict

AccessInteractionKind = Literal["read", "act"]
AccessPolicyStance = Literal["open", "gateway", "deny"]
AccessPolicyTraining = Literal["allow", "deny"]
AccessPolicyState = Literal["active", "paused", "maintenance"]

IMPLICIT_DEFAULT: AccessPolicyStance = "gateway"


class DiscoveredAccessPolicy(TypedDict):
    declared: bool
    read: AccessPolicyStance
    act: AccessPolicyStance
    training: AccessPolicyTraining
    state: AccessPolicyState
    expired: bool
    contact: str | None
    policy_url: str | None
    raw: dict[str, Any] | None


def _resolve_stance(policy: dict[str, Any] | None, kind: AccessInteractionKind) -> AccessPolicyStance:
    if not policy:
        return IMPLICIT_DEFAULT
    explicit = (policy.get("agents") or {}).get(kind)
    if explicit:
        return explicit
    if policy.get("default"):
        return policy["default"]
    return IMPLICIT_DEFAULT


def _is_expired(policy: dict[str, Any] | None) -> bool:
    if not policy or not policy.get("expires_at"):
        return False
    try:
        expires = datetime.fromisoformat(str(policy["expires_at"]).replace("Z", "+00:00"))
    except ValueError:
        return False
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    return expires < datetime.now(timezone.utc)


def discover_access_policy(card: dict[str, Any]) -> DiscoveredAccessPolicy:
    """
    Normalize a card's access_policy into resolved stances.

    @see docs/eil-access-policy-spec-v0.1.md
    """
    policy = card.get("access_policy")
    return {
        "declared": bool(policy),
        "read": _resolve_stance(policy, "read"),
        "act": _resolve_stance(policy, "act"),
        "training": (policy or {}).get("agents", {}).get("training", "allow"),
        "state": (policy or {}).get("state", "active"),
        "expired": _is_expired(policy),
        "contact": (policy or {}).get("contact"),
        "policy_url": (policy or {}).get("policy_url"),
        "raw": policy,
    }


def is_interaction_allowed(card: dict[str, Any], kind: AccessInteractionKind) -> bool:
    return discover_access_policy(card)[kind] == "open"


def is_interaction_denied(card: dict[str, Any], kind: AccessInteractionKind) -> bool:
    return discover_access_policy(card)[kind] == "deny"


def is_training_denied(card: dict[str, Any]) -> bool:
    return discover_access_policy(card)["training"] == "deny"


def is_gateway_operational(card: dict[str, Any]) -> bool:
    policy = discover_access_policy(card)
    return policy["state"] == "active" and not policy["expired"]
