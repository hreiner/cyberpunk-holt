"""Contrats d'adaptation : aucun fournisseur externe n'est activé."""
from typing import Protocol

class Provider(Protocol):
    def submit(self, parameters: dict) -> dict: ...
    def inspect(self, provider_id: str) -> dict: ...
    def cancel(self, provider_id: str) -> None: ...

class ImageProvider(Provider, Protocol): pass
class VideoProvider(Provider, Protocol): pass
class AudioProvider(Provider, Protocol): pass

class MockProvider:
    def submit(self, parameters):
        return {'provider_id': 'mock-local', 'parameters': parameters, 'actual': 0}
    def inspect(self, provider_id):
        return {'provider_id': provider_id, 'state': 'completed'}
    def cancel(self, provider_id):
        return None
