import logging
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from .const import DOMAIN
from .services import register_services

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    entries = hass.config_entries.async_entries("spotify")
    if not entries:
        _LOGGER.error("Integração oficial do Spotify não encontrada.")
        return False

    hass.data.setdefault(DOMAIN, {})
    register_services(hass)
    _LOGGER.info("Spotify Plus configurado com sucesso.")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    for service in ("search", "get_devices", "play_uri", "get_playlists", "get_playlist_tracks"):
        hass.services.async_remove(DOMAIN, service)
    hass.data.pop(DOMAIN, None)
    return True
