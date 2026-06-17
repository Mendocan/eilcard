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
    normalized = normalize_domain(domain)
    url = f"{registry_base.rstrip('/')}{RESOLVE_PATH}?domain={normalized}"

    try:
        response = requests.get(
            url,
            headers={"Accept": "application/json"},
            timeout=timeout,
        )
        if response.status_code != 200:
            return None
        return response.json()
    except requests.RequestException:
        return None


if __name__ == "__main__":
    result = resolve_eil_card("sinyalle.com")
    if result and "card" in result:
        card = result["card"]
        print(card.get("name", {}).get("official"), card.get("verified"))
    else:
        print("Not found")
