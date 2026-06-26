from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

import requests

from eil_card.errors import CardNotFoundError, InvalidResolveInputError, RegistryError
from eil_card.types import ResolveResult

DEFAULT_REGISTRY = "https://eilcard.com"
API_PREFIX = "/api/v1"
DEFAULT_TIMEOUT = 10.0
WELL_KNOWN_PATH = "/.well-known/digital-card"


def normalize_domain(domain: str) -> str:
    value = domain.strip().lower()
    value = re.sub(r"^https?://", "", value)
    return value.split("/")[0]


class DigitalCardClient:
    """Resolve verified EIL Card JSON from registry or well-known fallback."""

    def __init__(
        self,
        *,
        registry_base_url: str = DEFAULT_REGISTRY,
        api_key: str | None = None,
        timeout: float = DEFAULT_TIMEOUT,
        skip_well_known_fallback: bool = False,
        session: requests.Session | None = None,
    ) -> None:
        self.registry_base_url = registry_base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        self.skip_well_known_fallback = skip_well_known_fallback
        self.session = session or requests.Session()

    def resolve(
        self,
        *,
        domain: str | None = None,
        handle: str | None = None,
    ) -> ResolveResult:
        if bool(domain) == bool(handle):
            raise InvalidResolveInputError()

        if handle:
            return self._resolve_by_handle(handle.strip())
        return self._resolve_by_domain(domain or "")

    def _resolve_by_handle(self, handle: str) -> ResolveResult:
        url = f"{self.registry_base_url}{API_PREFIX}/cards/{handle}"
        card = self._fetch_registry_card(url)
        well_known_url = None
        website = (card.get("contact") or {}).get("website")
        if website:
            well_known_url = f"{website.rstrip('/')}{WELL_KNOWN_PATH}"

        return {
            "card": card,
            "meta": {
                "source": "registry",
                "registry_url": url,
                "well_known_url": well_known_url,
                "resolved_at": _utc_now(),
            },
        }

    def _resolve_by_domain(self, domain: str) -> ResolveResult:
        normalized = normalize_domain(domain)
        registry_url = (
            f"{self.registry_base_url}{API_PREFIX}/resolve"
            f"?domain={requests.utils.quote(normalized, safe='')}"
        )

        try:
            card = self._fetch_registry_card(registry_url)
            return {
                "card": card,
                "meta": {
                    "source": "registry",
                    "registry_url": registry_url,
                    "well_known_url": f"https://{normalized}{WELL_KNOWN_PATH}",
                    "resolved_at": _utc_now(),
                },
            }
        except RegistryError as error:
            if error.status != 404:
                raise

        if self.skip_well_known_fallback:
            raise CardNotFoundError(domain=normalized)

        well_known_url = f"https://{normalized}{WELL_KNOWN_PATH}"
        card = self._fetch_well_known_card(well_known_url)
        if not card:
            raise CardNotFoundError(domain=normalized)

        return {
            "card": card,
            "meta": {
                "source": "well-known",
                "well_known_url": well_known_url,
                "resolved_at": _utc_now(),
            },
        }

    def _fetch_registry_card(self, url: str) -> dict[str, Any]:
        response = self._get(url, headers={"Accept": "application/json"})
        if response.status_code == 404:
            raise RegistryError(f"Registry returned 404 for {url}", 404)
        if not response.ok:
            raise RegistryError(f"Registry error {response.status_code}", response.status_code)

        body = response.json()
        if isinstance(body, dict) and "card" in body:
            return body["card"]
        if isinstance(body, dict):
            return body
        raise RegistryError(f"Unexpected registry response from {url}")

    def _fetch_well_known_card(self, url: str) -> dict[str, Any] | None:
        try:
            response = self._get(url, headers={"Accept": "application/json"})
            if response.status_code == 404 or not response.ok:
                return None
            body = response.json()
            return body if isinstance(body, dict) else None
        except requests.RequestException:
            return None

    def _get(self, url: str, *, headers: dict[str, str]) -> requests.Response:
        merged = dict(headers)
        if self.api_key:
            merged["Authorization"] = f"Bearer {self.api_key}"
        return self.session.get(url, headers=merged, timeout=self.timeout)


class DigitalCard:
    """Convenience namespace matching the TypeScript SDK."""

    @staticmethod
    def resolve(
        *,
        domain: str | None = None,
        handle: str | None = None,
        registry_base_url: str = DEFAULT_REGISTRY,
        api_key: str | None = None,
        timeout: float = DEFAULT_TIMEOUT,
        skip_well_known_fallback: bool = False,
    ) -> ResolveResult:
        client = DigitalCardClient(
            registry_base_url=registry_base_url,
            api_key=api_key,
            timeout=timeout,
            skip_well_known_fallback=skip_well_known_fallback,
        )
        return client.resolve(domain=domain, handle=handle)


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
