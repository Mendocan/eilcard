from __future__ import annotations

from typing import Any, Literal, TypedDict

SCHEMA_VERSION = "1.2"

CardEdition = Literal["core", "registry_plus"]
ResolveSource = Literal["registry", "well-known"]


class ResolveMeta(TypedDict, total=False):
    source: ResolveSource
    registry_url: str
    well_known_url: str
    resolved_at: str


class ResolveResult(TypedDict):
    card: dict[str, Any]
    meta: ResolveMeta


class DiscoveredCapabilities(TypedDict, total=False):
    available: bool
    edition: CardEdition
    agent_gateway: str
    auth: Literal["none", "oauth2", "api_key"]
    scopes: list[str]
    reason: str


class ParsedCapabilityScopes(TypedDict):
    read: list[str]
    write: list[str]
    act: list[str]
    unknown: list[str]
    all: list[str]


class CapabilityActionManifest(TypedDict, total=False):
    id: str
    label: str
    method: Literal["POST", "PUT", "PATCH", "DELETE"]
    path: str
    scopes: list[str]
    idempotent: bool


class DiscoveredActCapabilities(DiscoveredCapabilities, total=False):
    scopes_parsed: ParsedCapabilityScopes
    actions: list[CapabilityActionManifest]
    has_write_or_act: bool
