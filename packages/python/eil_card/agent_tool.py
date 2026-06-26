from __future__ import annotations

import json
from typing import Any

from eil_card.client import DigitalCard, DigitalCardClient
from eil_card.errors import InvalidResolveInputError
from eil_card.tool_schema import EIL_RESOLVE_TOOL_DESCRIPTION, EIL_RESOLVE_TOOL_NAME


async def invoke_eil_resolve_async(
    *,
    domain: str | None = None,
    handle: str | None = None,
    registry_base_url: str = "https://eilcard.com",
    api_key: str | None = None,
    timeout: float = 10.0,
    skip_well_known_fallback: bool = False,
) -> dict[str, Any]:
    """Async wrapper — runs sync resolve in thread pool if needed by frameworks."""
    return invoke_eil_resolve(
        domain=domain,
        handle=handle,
        registry_base_url=registry_base_url,
        api_key=api_key,
        timeout=timeout,
        skip_well_known_fallback=skip_well_known_fallback,
    )


def invoke_eil_resolve(
    *,
    domain: str | None = None,
    handle: str | None = None,
    registry_base_url: str = "https://eilcard.com",
    api_key: str | None = None,
    timeout: float = 10.0,
    skip_well_known_fallback: bool = False,
) -> dict[str, Any]:
    """Framework-agnostic handler for tool-calling agents."""
    client = DigitalCardClient(
        registry_base_url=registry_base_url,
        api_key=api_key,
        timeout=timeout,
        skip_well_known_fallback=skip_well_known_fallback,
    )
    if domain:
        return client.resolve(domain=domain)
    if handle:
        return client.resolve(handle=handle)
    raise InvalidResolveInputError()


def format_resolve_tool_result(result: dict[str, Any]) -> str:
    return json.dumps(result, indent=2, ensure_ascii=False)


def format_resolve_tool_error(entity: str, error: Exception | str) -> str:
    message = str(error)
    return f"Could not resolve EIL identity for {entity}: {message}"
