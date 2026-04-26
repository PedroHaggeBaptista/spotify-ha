# Spotify Plus

Integração customizada para Home Assistant que adiciona serviços avançados do Spotify
e um cartão Lovelace com busca integrada.

**Requisito:** A integração oficial do Spotify deve estar configurada no Home Assistant.

Após instalar, adicione ao `configuration.yaml`:
```yaml
spotify_plus:
```

E adicione o cartão ao seu dashboard:
```yaml
type: custom:spotify-plus-card
```
