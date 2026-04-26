# Spotify Plus

Integração customizada para Home Assistant com cartão Lovelace que expõe serviços avançados
do Spotify reutilizando o token OAuth da integração oficial.

## Requisitos

- Home Assistant 2023.1.0 ou superior (2023.2+ recomendado: `search` e `get_playlists` retornam dados na resposta do serviço, o que o cartão usa — incluindo no app móvel)
- [Integração oficial do Spotify](https://www.home-assistant.io/integrations/spotify/) já configurada e autenticada

## Instalação via HACS

1. Abra o HACS no seu Home Assistant
2. Vá em **Integrations** → menu de três pontos → **Custom repositories**
3. Adicione a URL deste repositório com categoria **Integration**
4. Clique em **Install** na integração "Spotify Plus"
5. Reinicie o Home Assistant

### Cartão Lovelace

1. No HACS vá em **Frontend** → **Custom repositories**
2. Adicione a URL deste repositório com categoria **Lovelace**
3. Instale o cartão "Spotify Plus Card"

## Configuração

Adicione ao `configuration.yaml`:

```yaml
spotify_plus:
```

Reinicie o Home Assistant. A integração irá detectar automaticamente o token da integração oficial do Spotify.

## Cartão Lovelace

Adicione ao seu dashboard via interface gráfica ou YAML:

```yaml
type: custom:spotify-plus-card
```

## Serviços disponíveis

### `spotify_plus.search`

Busca no catálogo do Spotify. Em instâncias com suporte a [respostas de serviço](https://www.home-assistant.io/integrations/script/#response-variable), o resultado retorna no próprio ato do serviço. Caso contrário, o evento de barramento `spotify_plus_search_results` ainda é emitido (comportamento legado).

```yaml
service: spotify_plus.search
data:
  query: "Pink Floyd"
  limit: 10
```

### `spotify_plus.get_devices`

Lista os dispositivos Spotify ativos. O resultado é disparado no evento `spotify_plus_devices`.

```yaml
service: spotify_plus.get_devices
```

### `spotify_plus.get_playlists`

Lista as playlists do utilizador. Com resposta de serviço suportada, o corpo de retorno contém `items` (cada item inclui `uri`, `name`, etc.).

### `spotify_plus.play_uri`

Inicia a reprodução de uma faixa, álbum ou playlist pelo URI do Spotify. Para playlists (e contextos que não sejam `spotify:track:…`), use `shuffle: true` para ativar o modo aleatório após o início (requer [Premium](https://developer.spotify.com/documentation/web-api/concepts/quota-modes) e scope `user-modify-playback-state`).

```yaml
service: spotify_plus.play_uri
data:
  uri: "spotify:track:6rqhFgbbKwnb9MLmUQDhG6"
  device_id: "abc123"  # opcional
  shuffle: true        # opcional; típico para spotify:playlist:…
```

O serviço `spotify_plus.get_playlist_tracks` continua disponível para automações, mas o cartão não listava faixas de forma fiável (restrições da API) e toca a playlist com shuffle a partir do separador de playlists.

## Troubleshooting

| Problema | Solução |
|---|---|
| Serviço não aparece | Verifique os logs em Settings → System → Logs |
| Token expirado (401) | O token é buscado a cada chamada; verifique se a integração oficial está ativa |
| Integração não encontrada | Configure a integração oficial do Spotify primeiro |
