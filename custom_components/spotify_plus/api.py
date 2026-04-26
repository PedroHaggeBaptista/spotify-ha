import aiohttp
from .const import SPOTIFY_API_BASE


class SpotifyPlusAPI:
    def __init__(self, token: str):
        self._token = token

    @property
    def _headers(self):
        return {"Authorization": f"Bearer {self._token}"}

    async def search(self, query: str, types: list = None, limit: int = 10) -> dict:
        if types is None:
            types = ["track", "album", "playlist"]
        params = {
            "q": query,
            "type": ",".join(types),
            "limit": limit,
        }
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{SPOTIFY_API_BASE}/search",
                headers=self._headers,
                params=params,
            ) as resp:
                resp.raise_for_status()
                return await resp.json()

    async def get_me(self) -> dict:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{SPOTIFY_API_BASE}/me",
                headers=self._headers,
            ) as resp:
                resp.raise_for_status()
                return await resp.json()

    async def get_devices(self) -> list:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{SPOTIFY_API_BASE}/me/player/devices",
                headers=self._headers,
            ) as resp:
                resp.raise_for_status()
                data = await resp.json()
                return data.get("devices", [])

    async def transfer_playback(self, device_id: str) -> None:
        async with aiohttp.ClientSession() as session:
            async with session.put(
                f"{SPOTIFY_API_BASE}/me/player",
                headers=self._headers,
                json={"device_ids": [device_id], "play": True},
            ) as resp:
                resp.raise_for_status()

    async def get_queue(self) -> dict:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{SPOTIFY_API_BASE}/me/player/queue",
                headers=self._headers,
            ) as resp:
                resp.raise_for_status()
                return await resp.json()

    async def get_playlists(self, limit: int = 20) -> dict:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{SPOTIFY_API_BASE}/me/playlists",
                headers=self._headers,
                params={"limit": limit},
            ) as resp:
                resp.raise_for_status()
                return await resp.json()

    async def get_playlist_tracks(self, playlist_id: str, limit: int = 50) -> dict:
        # /tracks was deprecated in Feb 2026 — replaced by /items
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{SPOTIFY_API_BASE}/playlists/{playlist_id}/items",
                headers=self._headers,
                params={"limit": limit},
            ) as resp:
                resp.raise_for_status()
                return await resp.json()

    async def play_uri(self, uri: str, device_id: str = None) -> None:
        # tracks use "uris", albums/playlists use "context_uri"
        body = {"uris": [uri]} if ":track:" in uri else {"context_uri": uri}

        async with aiohttp.ClientSession() as session:
            target = device_id

            # If no device specified, find the active one (or first available)
            if not target:
                async with session.get(
                    f"{SPOTIFY_API_BASE}/me/player/devices",
                    headers=self._headers,
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        devices = data.get("devices", [])
                        active = next((d for d in devices if d.get("is_active")), None)
                        fallback = devices[0] if devices else None
                        chosen = active or fallback
                        if chosen:
                            target = chosen["id"]

            params = {"device_id": target} if target else {}
            async with session.put(
                f"{SPOTIFY_API_BASE}/me/player/play",
                headers=self._headers,
                params=params,
                json=body,
            ) as resp:
                resp.raise_for_status()
