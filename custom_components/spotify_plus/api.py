from __future__ import annotations

import asyncio

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

    async def _resolve_device_id(self, device_id: str | None = None) -> str | None:
        if device_id:
            return device_id
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{SPOTIFY_API_BASE}/me/player/devices",
                headers=self._headers,
            ) as resp:
                if resp.status != 200:
                    return None
                data = await resp.json()
                devices = data.get("devices", [])
                active = next((d for d in devices if d.get("is_active")), None)
                fallback = devices[0] if devices else None
                chosen = active or fallback
                return chosen["id"] if chosen else None

    async def set_shuffle(self, state: bool, device_id: str | None = None) -> None:
        target = await self._resolve_device_id(device_id)
        params: dict = {"state": "true" if state else "false"}
        if target:
            params["device_id"] = target
        async with aiohttp.ClientSession() as session:
            async with session.put(
                f"{SPOTIFY_API_BASE}/me/player/shuffle",
                headers=self._headers,
                params=params,
            ) as resp:
                resp.raise_for_status()

    async def play_uri(
        self, uri: str, device_id: str = None, *, shuffle: bool = False
    ) -> None:
        # tracks use "uris", albums/playlists use "context_uri"
        body = {"uris": [uri]} if ":track:" in uri else {"context_uri": uri}
        is_track = ":track:" in uri

        async with aiohttp.ClientSession() as session:
            target = await self._resolve_device_id(device_id)

            params = {"device_id": target} if target else {}
            async with session.put(
                f"{SPOTIFY_API_BASE}/me/player/play",
                headers=self._headers,
                params=params,
                json=body,
            ) as resp:
                resp.raise_for_status()

            # For playlists/albums/artists, Spotify may reset shuffle when starting
            # playback; re-enable shuffle after play (Premium + user-modify-playback-state).
            # Small delay so Spotify finishes switching context before we toggle shuffle.
            if shuffle and not is_track:
                await asyncio.sleep(0.3)
                await self.set_shuffle(True, device_id=target)
