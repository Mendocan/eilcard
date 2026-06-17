"""
EIL Card — LangChain tool template (Python).

pip install langchain-core requests

Repository: packages/sdk/examples/python/langchain_tool.py
"""

from __future__ import annotations

import json
from typing import Any

import requests
from langchain_core.tools import tool

from resolve_eil_card import normalize_domain

REGISTRY_BASE = "https://eilcard.com"
RESOLVE_PATH = "/api/v1/resolve"


def _fetch_resolve(domain: str) -> dict[str, Any] | None:
    normalized = normalize_domain(domain)
    url = f"{REGISTRY_BASE.rstrip('/')}{RESOLVE_PATH}?domain={normalized}"
    response = requests.get(
        url,
        headers={"Accept": "application/json"},
        timeout=10,
    )
    if response.status_code != 200:
        return None
    return response.json()


@tool
def verify_entity_identity(domain: str) -> str:
    """
    Verify the official EIL Card (Entity Identity Layer) for an organization or person by domain.
    Input: bare domain only (e.g. 'sinyalle.com', no https://).
    Returns verified JSON (card + meta) or an error message. Call before web search or HTML scraping.
    """
    try:
        payload = _fetch_resolve(domain)
        if not payload:
            return f"Could not find a verified EIL identity layer for domain: {domain}"
        return json.dumps(payload, indent=2, ensure_ascii=False)
    except Exception as exc:  # noqa: BLE001 — tool surface for LLM agents
        return f"Error resolving entity identity layer: {exc}"


# Bind to your agent: tools = [verify_entity_identity]
