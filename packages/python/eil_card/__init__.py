"""EIL Card Python SDK — resolve verified entity identity for AI agents."""

from eil_card.act import (
    agent_act_headers_to_fetch,
    build_agent_act_headers,
    build_idempotency_key,
    discover_act_capabilities,
    parse_capability_scopes,
)
from eil_card.agent_tool import (
    format_resolve_tool_error,
    format_resolve_tool_result,
    invoke_eil_resolve,
    invoke_eil_resolve_async,
)
from eil_card.capabilities import discover_capabilities
from eil_card.client import DigitalCard, DigitalCardClient, normalize_domain
from eil_card.errors import (
    CardNotFoundError,
    DigitalCardError,
    InvalidResolveInputError,
    RegistryError,
    SchemaValidationError,
)
from eil_card.tool_schema import (
    EIL_RESOLVE_TOOL_DESCRIPTION,
    EIL_RESOLVE_TOOL_NAME,
    build_eil_resolve_tool_definitions,
    build_resolve_input_json_schema,
)
from eil_card.types import SCHEMA_VERSION

__all__ = [
    "SCHEMA_VERSION",
    "DigitalCard",
    "DigitalCardClient",
    "normalize_domain",
    "discover_capabilities",
    "discover_act_capabilities",
    "parse_capability_scopes",
    "build_idempotency_key",
    "build_agent_act_headers",
    "agent_act_headers_to_fetch",
    "invoke_eil_resolve",
    "invoke_eil_resolve_async",
    "format_resolve_tool_result",
    "format_resolve_tool_error",
    "EIL_RESOLVE_TOOL_NAME",
    "EIL_RESOLVE_TOOL_DESCRIPTION",
    "build_resolve_input_json_schema",
    "build_eil_resolve_tool_definitions",
    "DigitalCardError",
    "CardNotFoundError",
    "InvalidResolveInputError",
    "RegistryError",
    "SchemaValidationError",
]

__version__ = "0.1.0"
