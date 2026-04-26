import logging
from homeassistant.core import HomeAssistant
from .const import DOMAIN
from .services import register_services

_LOGGER = logging.getLogger(__name__)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    entries = hass.config_entries.async_entries("spotify")
    if not entries:
        _LOGGER.error("Integração oficial do Spotify não encontrada. Configure-a primeiro.")
        return False

    token = entries[0].data.get("token", {}).get("access_token")
    if not token:
        _LOGGER.error("Token do Spotify não disponível na config entry.")
        return False

    from .api import SpotifyPlusAPI
    api = SpotifyPlusAPI(token)
    hass.data[DOMAIN] = api

    register_services(hass)
    _LOGGER.info("Spotify Plus configurado com sucesso.")
    return True
