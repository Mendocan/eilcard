"""
EIL Card — LlamaIndex data connector (EILReader).

Load verified entity identity into LlamaIndex Document objects for RAG pipelines —
without scraping HTML.

pip install llama-index-core requests

Repository: packages/sdk/examples/python/eil_reader.py
Docs: https://eilcard.com/docs/agents
"""

from __future__ import annotations

import json
from typing import Any

from llama_index.core.readers.base import BaseReader
from llama_index.core.schema import Document

from resolve_eil_card import resolve_eil_entity

DEFAULT_REGISTRY = "https://eilcard.com"


def _entity_name(card: dict[str, Any]) -> str:
    if card.get("type") == "organization":
        name = card.get("name") or {}
        return str(name.get("official") or name.get("short") or card.get("card_id", ""))
    name = card.get("name") or {}
    return str(name.get("full") or card.get("card_id", ""))


def _contact_lines(card: dict[str, Any]) -> list[str]:
    contact = card.get("contact") or {}
    lines: list[str] = []
    if contact.get("email"):
        lines.append(f"Email: {contact['email']}")
    if contact.get("phone"):
        lines.append(f"Phone: {contact['phone']}")
    if contact.get("website"):
        lines.append(f"Website: {contact['website']}")
    if contact.get("whatsapp"):
        lines.append(f"WhatsApp: {contact['whatsapp']}")
    return lines


def _description_block(card: dict[str, Any]) -> str:
    desc = card.get("description") or {}
    parts = [p for p in (desc.get("tagline"), desc.get("summary")) if p]
    return "\n".join(parts)


def _products_block(card: dict[str, Any]) -> list[str]:
    lines: list[str] = []
    for product in card.get("products") or []:
        title = product.get("name", "Product")
        detail = product.get("description") or ""
        url = product.get("url") or ""
        chunk = f"- {title}"
        if detail:
            chunk += f": {detail}"
        if url:
            chunk += f" ({url})"
        lines.append(chunk)
    return lines


def _offerings_block(card: dict[str, Any], depth: int = 0) -> list[str]:
    lines: list[str] = []
    prefix = "  " * depth
    for offering in card.get("offerings") or []:
        title = offering.get("name", "Offering")
        kind = offering.get("kind") or "line"
        detail = offering.get("description") or ""
        url = offering.get("url") or ""
        chunk = f"{prefix}- [{kind}] {title}"
        if detail:
            chunk += f": {detail}"
        if url:
            chunk += f" ({url})"
        lines.append(chunk)
        lines.extend(_offerings_block({"offerings": offering.get("items") or []}, depth + 1))
    return lines


def card_to_identity_text(card: dict[str, Any]) -> str:
    """Human-readable identity block for a single Document."""
    lines = [
        f"Entity: {_entity_name(card)}",
        f"Type: {card.get('type', 'unknown')}",
        f"Card ID: {card.get('card_id', '')}",
    ]
    if card.get("handle"):
        lines.append(f"Handle: @{card['handle']}")
    if card.get("verified") is not None:
        lines.append(f"Verified: {card['verified']}")
    if card.get("edition"):
        lines.append(f"Edition: {card['edition']}")
    if card.get("schema_version"):
        lines.append(f"Schema: {card['schema_version']}")

    desc = _description_block(card)
    if desc:
        lines.extend(["", "Description:", desc])

    contact = _contact_lines(card)
    if contact:
        lines.extend(["", "Contact:", *contact])

    products = _products_block(card)
    if products:
        lines.extend(["", "Products:", *products])

    offerings = _offerings_block(card)
    if offerings:
        lines.extend(["", "Offerings:", *offerings])

    same_as = card.get("same_as") or []
    if same_as:
        lines.extend(["", "Profiles (sameAs):", *[f"- {url}" for url in same_as]])

    caps = card.get("capabilities") or {}
    if caps.get("agent_gateway"):
        lines.extend(
            [
                "",
                "Agent gateway:",
                str(caps["agent_gateway"]),
            ]
        )
        if caps.get("scopes"):
            lines.append(f"Scopes: {', '.join(caps['scopes'])}")

    return "\n".join(lines).strip()


def base_metadata(card: dict[str, Any], meta: dict[str, Any] | None = None) -> dict[str, Any]:
    """Shared metadata for all documents from one resolve."""
    out: dict[str, Any] = {
        "source": "eil_card",
        "eil_card_id": card.get("card_id"),
        "handle": card.get("handle"),
        "type": card.get("type"),
        "verified": card.get("verified"),
        "edition": card.get("edition"),
        "schema_version": card.get("schema_version"),
        "human_url": card.get("human_url"),
        "registry_url": card.get("registry_url"),
    }
    if meta:
        out["resolve_source"] = meta.get("source")
        if meta.get("well_known_url"):
            out["well_known_url"] = meta["well_known_url"]
    return {k: v for k, v in out.items() if v is not None}


def card_to_documents(
    card: dict[str, Any],
    meta: dict[str, Any] | None = None,
    *,
    split_catalog: bool = False,
) -> list[Document]:
    """
    Convert resolved EIL Card JSON to LlamaIndex Document list.

    split_catalog=True emits separate docs per product/offering for finer retrieval.
    """
    shared = base_metadata(card, meta)
    documents: list[Document] = [
        Document(
            text=card_to_identity_text(card),
            metadata={
                **shared,
                "document_kind": "identity",
            },
        )
    ]

    if not split_catalog:
        return documents

    for product in card.get("products") or []:
        text = f"Product: {product.get('name', '')}\n"
        if product.get("description"):
            text += f"{product['description']}\n"
        if product.get("url"):
            text += f"URL: {product['url']}"
        documents.append(
            Document(
                text=text.strip(),
                metadata={
                    **shared,
                    "document_kind": "product",
                    "product_id": product.get("id"),
                },
            )
        )

    def append_offering(offering: dict[str, Any], parent_kind: str | None = None) -> None:
        kind = offering.get("kind") or parent_kind or "line"
        text = f"Offering [{kind}]: {offering.get('name', '')}\n"
        if offering.get("description"):
            text += f"{offering['description']}\n"
        if offering.get("url"):
            text += f"URL: {offering['url']}"
        documents.append(
            Document(
                text=text.strip(),
                metadata={
                    **shared,
                    "document_kind": "offering",
                    "offering_id": offering.get("id"),
                    "offering_kind": kind,
                },
            )
        )
        for item in offering.get("items") or []:
            append_offering(item, kind)

    for offering in card.get("offerings") or []:
        append_offering(offering)

    return documents


class EILReader(BaseReader):
    """
    LlamaIndex reader for EIL Card registry resolve.

    Example:
        reader = EILReader()
        docs = reader.load_data(domain="sinyalle.com")
        index = VectorStoreIndex.from_documents(docs)
    """

    def __init__(
        self,
        registry_base: str = DEFAULT_REGISTRY,
        timeout: float = 10,
    ) -> None:
        self.registry_base = registry_base.rstrip("/")
        self.timeout = timeout

    def load_data(
        self,
        domain: str | None = None,
        handle: str | None = None,
        *,
        split_catalog: bool = False,
        **kwargs: Any,
    ) -> list[Document]:
        """
        Resolve entity identity and return LlamaIndex Documents.

        Provide domain or handle (not both).
        """
        del kwargs  # BaseReader compatibility

        result = resolve_eil_entity(
            domain=domain,
            handle=handle,
            registry_base=self.registry_base,
            timeout=self.timeout,
        )
        if not result or "card" not in result:
            entity = domain or handle or "unknown"
            raise ValueError(f"EIL Card not found for: {entity}")

        return card_to_documents(
            result["card"],
            result.get("meta"),
            split_catalog=split_catalog,
        )


def load_eil_documents(
    *,
    domain: str | None = None,
    handle: str | None = None,
    registry_base: str = DEFAULT_REGISTRY,
    split_catalog: bool = False,
) -> list[Document]:
    """Functional helper without instantiating EILReader."""
    return EILReader(registry_base=registry_base).load_data(
        domain=domain,
        handle=handle,
        split_catalog=split_catalog,
    )


if __name__ == "__main__":
    reader = EILReader()
    sample = reader.load_data(domain="sinyalle.com")
    print(f"Loaded {len(sample)} document(s)")
    print(sample[0].text[:400], "...")
    print(json.dumps(sample[0].metadata, indent=2))
