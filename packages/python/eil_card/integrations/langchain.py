from __future__ import annotations

from typing import Any

from eil_card.agent_tool import (
    format_resolve_tool_error,
    format_resolve_tool_result,
    invoke_eil_resolve,
)
from eil_card.tool_schema import EIL_RESOLVE_TOOL_DESCRIPTION, EIL_RESOLVE_TOOL_NAME


def create_eil_resolve_tool(
    *,
    registry_base_url: str = "https://eilcard.com",
    api_key: str | None = None,
    timeout: float = 10.0,
    skip_well_known_fallback: bool = False,
    name: str = EIL_RESOLVE_TOOL_NAME,
):
    """
    LangChain tool factory — matches TS `createEILResolveTool`.

    pip install eil-card[langchain]
    """
    try:
        from langchain_core.tools import StructuredTool
    except ImportError as exc:
        raise ImportError(
            "LangChain integration requires: pip install eil-card[langchain]"
        ) from exc

    def _run(domain: str | None = None, handle: str | None = None) -> str:
        entity = domain or handle or "unknown"
        try:
            result = invoke_eil_resolve(
                domain=domain,
                handle=handle,
                registry_base_url=registry_base_url,
                api_key=api_key,
                timeout=timeout,
                skip_well_known_fallback=skip_well_known_fallback,
            )
            return format_resolve_tool_result(result)
        except Exception as exc:  # noqa: BLE001 — LLM tool surface
            return format_resolve_tool_error(entity, exc)

    return StructuredTool.from_function(
        func=_run,
        name=name,
        description=EIL_RESOLVE_TOOL_DESCRIPTION,
    )


def verify_entity_identity(domain: str) -> str:
    """Backward-compatible alias used in early Python examples."""
    tool = create_eil_resolve_tool()
    return tool.invoke({"domain": domain})
