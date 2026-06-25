"""
EIL Card — Python native resolve helper (zero SDK dependency).

pip install requests

Repository: packages/sdk/examples/python/resolve_eil_card.py
API: GET https://eilcard.com/api/v1/resolve?domain={domain}
"""

from __future__ import annotations

import re
from typing import Any

import requests

DEFAULT_REGISTRY = "https://eilcard.com"
RESOLVE_PATH = "/api/v1/resolve"


def normalize_domain(domain: str) -> str:
    value = domain.strip().lower()
    value = re.sub(r"^https?://", "", value)
    return value.split("/")[0]


def resolve_eil_entity(
    *,
    domain: str | None = None,
    handle: str | None = None,
    registry_base: str = DEFAULT_REGISTRY,
    timeout: float = 10,
) -> dict[str, Any] | None:
    """
    Resolve EIL Card by domain or registry handle.

    Provide exactly one of domain or handle.
    """
    if bool(domain) == bool(handle):
        raise ValueError("Provide exactly one of domain or handle")

    base = registry_base.rstrip("/")

    if handle:
        url = f"{base}/api/v1/cards/{handle.strip()}"
    else:
        normalized = normalize_domain(domain or "")
        url = f"{base}{RESOLVE_PATH}?domain={normalized}"

    try:
        response = requests.get(
            url,
            headers={"Accept": "application/json"},
            timeout=timeout,
        )
        if response.status_code != 200:
            return None
        body = response.json()
        if isinstance(body, dict) and "card" in body:
            return body
        return {"card": body, "meta": {"source": "registry", "registry_url": url}}
    except requests.RequestException:
        return None


def resolve_eil_card(
    domain: str,
    *,
    registry_base: str = DEFAULT_REGISTRY,
    timeout: float = 10,
) -> dict[str, Any] | None:
    """
    Resolve the verified EIL Card JSON for a domain via the public registry API.

    Returns {"card": {...}, "meta": {"source": "registry", ...}} or None on failure.
    """
    return resolve_eil_entity(
        domain=domain,
        registry_base=registry_base,
        timeout=timeout,
    )


if __name__ == "__main__":
    result = resolve_eil_card("sinyalle.com")
    if result and "card" in result:
        card = result["card"]
        print(card.get("name", {}).get("official"), card.get("verified"))
    else:
        print("Not found")
