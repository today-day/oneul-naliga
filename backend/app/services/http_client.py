"""공유 httpx AsyncClient (연결 재사용으로 SSL 핸드셰이크 최소화)"""
import httpx

_client: httpx.AsyncClient | None = None


def get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=10.0, follow_redirects=False)
    return _client


async def close_client():
    global _client
    if _client and not _client.is_closed:
        await _client.close()
        _client = None
