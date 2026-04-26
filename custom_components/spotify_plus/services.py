import logging
import voluptuous as vol
from homeassistant.helpers import config_validation as cv
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

SERVICE_SEARCH = "search"
SERVICE_GET_DEVICES = "get_devices"
SERVICE_PLAY_URI = "play_uri"

SCHEMA_SEARCH = vol.Schema({
    vol.Required("query"): cv.string,
    vol.Optional("limit", default=10): vol.All(int, vol.Range(min=1, max=50)),
})

SCHEMA_GET_DEVICES = vol.Schema({})

SCHEMA_PLAY_URI = vol.Schema({
    vol.Required("uri"): cv.string,
    vol.Optional("device_id"): cv.string,
})


def _get_token(hass):
    entries = hass.config_entries.async_entries("spotify")
    if not entries:
        return None
    return entries[0].data.get("token", {}).get("access_token")


def register_services(hass):
    async def handle_search(call):
        token = _get_token(hass)
        if not token:
            _LOGGER.error("Spotify token not available")
            return

        from .api import SpotifyPlusAPI
        api = SpotifyPlusAPI(token)
        query = call.data["query"]
        limit = call.data.get("limit", 10)

        try:
            results = await api.search(query, limit=limit)
            hass.bus.async_fire("spotify_plus_search_results", results)
        except Exception as err:
            _LOGGER.error("Search failed: %s", err)

    async def handle_get_devices(call):
        token = _get_token(hass)
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
        token = _get_token(hass)
        if not token:
            _LOGGER.error("Spotify token not available")
            return

        from .api import SpotifyPlusAPI
        api = SpotifyPlusAPI(token)
        uri = call.data["uri"]
        device_id = call.data.get("device_id")

        try:
            await api.play_uri(uri, device_id=device_id)
        except Exception as err:
            _LOGGER.error("Play URI failed: %s", err)

    hass.services.async_register(DOMAIN, SERVICE_SEARCH, handle_search, schema=SCHEMA_SEARCH)
    hass.services.async_register(DOMAIN, SERVICE_GET_DEVICES, handle_get_devices, schema=SCHEMA_GET_DEVICES)
    hass.services.async_register(DOMAIN, SERVICE_PLAY_URI, handle_play_uri, schema=SCHEMA_PLAY_URI)
