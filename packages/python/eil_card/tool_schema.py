from __future__ import annotations

from typing import Any

EIL_RESOLVE_TOOL_NAME = "resolve_entity_identity"

EIL_RESOLVE_TOOL_DESCRIPTION = (
    "Resolve verified organization or person identity from the EIL Card registry. "
    "Call before web search when the user asks about official company name, contact, "
    "products, or corporate facts."
)


def build_resolve_input_json_schema(registry_base_url: str = "https://eilcard.com") -> dict[str, Any]:
    base = registry_base_url.rstrip("/")
    return {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "$id": "https://eilcard.com/schema/tool/resolve-entity-input.json",
        "title": "EILResolveInput",
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "domain": {
                "type": "string",
                "description": (
                    f"Verified root domain (e.g. sinyalle.com). Registry: {base}/api/v1/resolve"
                ),
                "pattern": (
                    r"^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$"
                ),
            },
            "handle": {
                "type": "string",
                "description": "Registry handle if domain is unknown (e.g. sinyal24)",
                "minLength": 2,
                "maxLength": 50,
            },
        },
        "oneOf": [{"required": ["domain"]}, {"required": ["handle"]}],
    }


def _parameters_for_provider(schema: dict[str, Any]) -> dict[str, Any]:
    return {k: v for k, v in schema.items() if k not in ("$schema", "$id", "title")}


def build_eil_resolve_tool_definitions(
    registry_base_url: str = "https://eilcard.com",
) -> dict[str, Any]:
    json_schema = build_resolve_input_json_schema(registry_base_url)
    parameters = _parameters_for_provider(json_schema)
    return {
        "json_schema": json_schema,
        "openai": {
            "type": "function",
            "function": {
                "name": EIL_RESOLVE_TOOL_NAME,
                "description": EIL_RESOLVE_TOOL_DESCRIPTION,
                "parameters": parameters,
            },
        },
        "anthropic": {
            "name": EIL_RESOLVE_TOOL_NAME,
            "description": EIL_RESOLVE_TOOL_DESCRIPTION,
            "input_schema": parameters,
        },
        "gemini": {
            "name": EIL_RESOLVE_TOOL_NAME,
            "description": EIL_RESOLVE_TOOL_DESCRIPTION,
            "parameters": parameters,
        },
    }
