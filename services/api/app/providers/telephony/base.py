from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class OutboundCallResult:
    provider_call_id: str
    status: str
    from_number: str
    to_number: str


class TelephonyProvider(ABC):
    """Abstract interface for telephony providers."""

    @abstractmethod
    async def initiate_outbound_call(
        self,
        to_number: str,
        from_number: str,
        webhook_url: str,
        status_callback_url: str,
        record: bool = False,
    ) -> OutboundCallResult:
        ...

    @abstractmethod
    async def end_call(self, provider_call_id: str) -> bool:
        ...

    @abstractmethod
    def validate_webhook_signature(
        self,
        url: str,
        params: dict,
        signature: str,
    ) -> bool:
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        ...

    @property
    @abstractmethod
    def is_configured(self) -> bool:
        ...
