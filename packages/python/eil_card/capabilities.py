from __future__ import annotations

from typing import Any

from eil_card.types import DiscoveredCapabilities


def discover_capabilities(card: dict[str, Any]) -> DiscoveredCapabilities:
    """Read capability manifest from a resolved card (Registry+ only)."""
    edition = card.get("edition") or "core"

    if edition != "registry_plus":
        return {
            "available": False,
            "edition": edition,
            "reason": "Capabilities require Registry+ edition (schema 1.2)",
        }

    caps = card.get("capabilities")
    if not caps:
        return {
            "available": False,
            "edition": edition,
            "reason": "No capabilities object on card",
        }

    if not caps.get("agent_gateway"):
        return {
            "available": False,
            "edition": edition,
            "auth": caps.get("auth"),
            "scopes": caps.get("scopes"),
            "reason": "capabilities.agent_gateway is not set",
        }

    return {
        "available": True,
        "edition": edition,
        "agent_gateway": caps["agent_gateway"],
        "auth": caps.get("auth"),
        "scopes": caps.get("scopes"),
    }
