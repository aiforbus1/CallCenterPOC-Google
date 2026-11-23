from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class ConversationMessage:
    role: str  # system | user | assistant
    content: str


@dataclass
class ConversationResponse:
    text: str
    finish_reason: str = "stop"
    model_used: str = ""
    usage: Optional[dict] = None


class ConversationProvider(ABC):
    """Abstract interface for LLM conversation providers."""

    @abstractmethod
    async def chat(
        self,
        messages: List[ConversationMessage],
        max_tokens: int = 512,
        temperature: float = 0.7,
    ) -> ConversationResponse:
        """Send a conversation history and get the next assistant response."""
        ...

    @abstractmethod
    async def health_check(self) -> bool:
        ...
