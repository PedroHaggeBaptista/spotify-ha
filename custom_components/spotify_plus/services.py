import logging
import voluptuous as vol
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.config_entry_oauth2_flow import (
    OAuth2Session,
    async_get_config_entry_implementation,
)
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

SERVICE_SEARCH = "search"
SERVICE_GET_DEVICES = "get_devices"
SERVICE_PLAY_URI = "play_uri"
SERVICE_GET_PLAYLISTS = "get_playlists"
SERVICE_GET_PLAYLIST_TRACKS = "get_playlist_tracks"

SCHEMA_SEARCH = vol.Schema({
    vol.Required("query"): cv.string,
    vol.Optional("limit", default=10): vol.All(int, vol.Range(min=1, max=50)),
})

SCHEMA_GET_DEVICES = vol.Schema({})

SCHEMA_PLAY_URI = vol.Schema({
    vol.Required("uri"): cv.string,
    vol.Optional("device_id"): cv.string,
})

SCHEMA_GET_PLAYLISTS = vol.Schema({
    vol.Optional("limit", default=20): vol.All(int, vol.Range(min=1, max=50)),
})

SCHEMA_GET_PLAYLIST_TRACKS = vol.Schema({
    vol.Required("playlist_id"): cv.string,
    vol.Optional("limit", default=50): vol.All(int, vol.Range(min=1, max=100)),
})


async def _get_token(hass):
    entries = hass.config_entries.async_entries("spotify")
    if not entries:
        return None
    entry = entries[0]
    try:
        implementation = await async_get_config_entry_implementation(hass, entry)
        session = OAuth2Session(hass, entry, implementation)
        await session.async_ensure_token_valid()
        return session.token["access_token"]
    except Exception as err:
        _LOGGER.warning("OAuth2Session failed (%s); falling back to stored token", err)
        return entry.data.get("token", {}).get("access_token")


def register_services(hass):
    async def handle_search(call):
        token = await _get_token(hass)
        if not token:
            _LOGGER.error("Spotify token not available")
            return
        from .api import SpotifyPlusAPI
        api = SpotifyPlusAPI(token)
        try:
            results = await api.search(call.data["query"], limit=call.data.get("limit", 10))
            hass.bus.async_fire("spotify_plus_search_results", results)
        except Exception as err:
            _LOGGER.error("Search failed: %s", err)

    async def handle_get_devices(call):
        token = await _get_token(hass)
        if not token:
            _LOGGER.error("Spotify token not available")
            return
        from .api import SpotifyPlusAPI
        api = SpotifyPlusAPI(token)
        try:
            devices = await api.get_devices()
            hass.bus.async_fire("spotify_plus_devices", {"devices": devices})
        except Exception as err:
            _LOGGER.error("Get devices failed: %s", err)

    async def handle_play_uri(call):
        token = await _get_token(hass)
        if not token:
            _LOGGER.error("Spotify token not available")
            return
        from .api import SpotifyPlusAPI
        api = SpotifyPlusAPI(token)
        try:
            await api.play_uri(call.data["uri"], device_id=call.data.get("device_id"))
        except Exception as err:
            _LOGGER.error("Play URI failed: %s", err)

    async def handle_get_playlists(call):
        token = await _get_token(hass)
        if not token:
            _LOGGER.error("Spotify token not available")
            return
        from .api import SpotifyPlusAPI
        api = SpotifyPlusAPI(token)
        try:
            raw = await api.get_playlists(limit=call.data.get("limit", 20))
            # Slim down — raw response is too large for HA event bus
            items = [
                {
                    "id": pl.get("id"),
                    "name": pl.get("name"),
                    "uri": pl.get("uri"),
                    "images": pl.get("images", [])[:1],
                    "tracks": {"total": pl.get("tracks", {}).get("total")},
                }
                for pl in raw.get("items", []) if pl
            ]
            hass.bus.async_fire("spotify_plus_playlists", {"items": items})
        except Exception as err:
            _LOGGER.error("Get playlists failed: %s", err)
            hass.bus.async_fire("spotify_plus_playlists", {"items": [], "error": str(err)})

    async def handle_get_playlist_tracks(call):
        token = await _get_token(hass)
        if not token:
            _LOGGER.error("Spotify token not available")
            return
        from .api import SpotifyPlusAPI
        api = SpotifyPlusAPI(token)
        try:
            raw = await api.get_playlist_tracks(
                call.data["playlist_id"],
                limit=call.data.get("limit", 50),
            )
            items = []
            for entry in raw.get("items", []):
                t = entry.get("track")
                if not t or t.get("is_local"):
                    continue
                items.append({
                    "track": {
                        "name": t.get("name"),
                        "uri": t.get("uri"),
                        "is_local": False,
                        "artists": [{"name": a.get("name")} for a in t.get("artists", [])],
                        "album": {"images": t.get("album", {}).get("images", [])[:1]},
                    }
                })
            hass.bus.async_fire("spotify_plus_playlist_tracks", {"items": items})
        except Exception as err:
            _LOGGER.error("Get playlist tracks failed: %s", err)
            hass.bus.async_fire("spotify_plus_playlist_tracks", {"items": [], "error": str(err)})

    hass.services.async_register(DOMAIN, SERVICE_SEARCH, handle_search, schema=SCHEMA_SEARCH)
    hass.services.async_register(DOMAIN, SERVICE_GET_DEVICES, handle_get_devices, schema=SCHEMA_GET_DEVICES)
    hass.services.async_register(DOMAIN, SERVICE_PLAY_URI, handle_play_uri, schema=SCHEMA_PLAY_URI)
    hass.services.async_register(DOMAIN, SERVICE_GET_PLAYLISTS, handle_get_playlists, schema=SCHEMA_GET_PLAYLISTS)
    hass.services.async_register(DOMAIN, SERVICE_GET_PLAYLIST_TRACKS, handle_get_playlist_tracks, schema=SCHEMA_GET_PLAYLIST_TRACKS)
