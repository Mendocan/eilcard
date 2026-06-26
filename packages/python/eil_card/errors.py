from __future__ import annotations

from typing import Any


class DigitalCardError(Exception):
    """Base error for EIL Card SDK operations."""


class CardNotFoundError(DigitalCardError):
    def __init__(self, *, domain: str | None = None, handle: str | None = None) -> None:
        target = domain or handle or "unknown"
        super().__init__(f"Digital card not found: {target}")
        self.domain = domain
        self.handle = handle


class InvalidResolveInputError(DigitalCardError):
    def __init__(self) -> None:
        super().__init__("Provide exactly one of domain or handle")


class RegistryError(DigitalCardError):
    def __init__(self, message: str, status: int | None = None) -> None:
        super().__init__(message)
        self.status = status


class SchemaValidationError(DigitalCardError):
    pass
