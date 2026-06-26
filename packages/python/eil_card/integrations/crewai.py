from __future__ import annotations

from typing import Any

from eil_card.agent_tool import (
    format_resolve_tool_error,
    format_resolve_tool_result,
    invoke_eil_resolve,
)
from eil_card.tool_schema import EIL_RESOLVE_TOOL_DESCRIPTION, EIL_RESOLVE_TOOL_NAME


def create_eil_resolve_crewai_tool(
    *,
    registry_base_url: str = "https://eilcard.com",
    api_key: str | None = None,
    timeout: float = 10.0,
    skip_well_known_fallback: bool = False,
    name: str = EIL_RESOLVE_TOOL_NAME,
):
    """
    CrewAI tool factory for entity identity resolve.

    pip install eil-card[crewai]

    Example:
        from crewai import Agent
        from eil_card.integrations.crewai import create_eil_resolve_crewai_tool

        tool = create_eil_resolve_crewai_tool()
        researcher = Agent(role="Researcher", tools=[tool], ...)
    """
    try:
        from crewai.tools import BaseTool
        from pydantic import BaseModel, Field
    except ImportError as exc:
        raise ImportError("CrewAI integration requires: pip install eil-card[crewai]") from exc

    class EILResolveInput(BaseModel):
        domain: str | None = Field(
            default=None,
            description="Verified root domain (e.g. sinyalle.com)",
        )
        handle: str | None = Field(
            default=None,
            description="Registry handle when domain is unknown",
        )

    class EILResolveTool(BaseTool):
        name: str = name
        description: str = EIL_RESOLVE_TOOL_DESCRIPTION
        args_schema: type[BaseModel] = EILResolveInput

        def _run(self, domain: str | None = None, handle: str | None = None) -> str:
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
            except Exception as exc:  # noqa: BLE001 — agent tool surface
                return format_resolve_tool_error(entity, exc)

    return EILResolveTool()
