import voluptuous as vol
from homeassistant import config_entries
from .const import DOMAIN


class SpotifyPlusConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    VERSION = 1

    async def async_step_user(self, user_input=None):
        entries = self.hass.config_entries.async_entries("spotify")
        if not entries:
            return self.async_abort(reason="spotify_not_configured")

        await self.async_set_unique_id(DOMAIN)
        self._abort_if_unique_id_configured()

        return self.async_create_entry(title="Spotify Plus", data={})
