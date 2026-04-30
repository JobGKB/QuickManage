# AI module (NL → SQL WHERE)

Accepts a Dutch natural-language question, returns a sanitised SQL `WHERE` clause that can be applied to an ArcGIS Feature Layer.

- **Controller**: [app/Http/Controllers/AIController.php](../../app/Http/Controllers/AIController.php)
- **Middleware**: [app/Http/Middleware/RequireArcgisLogin.php](../../app/Http/Middleware/RequireArcgisLogin.php) (alias `arcgis.required`, registered in [bootstrap/app.php](../../bootstrap/app.php))
- **View**: [resources/views/AI/index.blade.php](../../resources/views/AI/index.blade.php), layout [aiTest.blade.php](../../resources/views/layouts/aiTest.blade.php)
- **Client JS**: [public/js/testAI.js](../../public/js/testAI.js)
- **Logout helper**: [app/Http/Controllers/Auth/LogoutAGOLController.php](../../app/Http/Controllers/Auth/LogoutAGOLController.php)

## Routes

Grouped in [routes/web.php](../../routes/web.php):

| Method | Path | Middleware | Name |
|---|---|---|---|
| GET | `/arcgis/loginAGOL` | — (public) | `arcgis.loginAGOL` |
| GET | `/oauth-callback` | — (public) | — |
| GET | `/testAI` | `auth, arcgis.required` | `testAI` |
| POST | `/logoutAGOL` | `auth, arcgis.required` | `logoutAGOL` |
| POST | `/ai/nl2where` | `auth, throttle:10,1` | `ai.nl2where` |
| GET | `/ai/nl2where-stream` | `auth, throttle:10,1` | — |

## Controller actions

| Method | Purpose |
|---|---|
| `index()` | Renders the test UI; hits the ArcGIS `GKB_DL_Bomen` FeatureServer with `outStatistics` (group-by `projectcode`) to seed the page |
| `callback(Request)` | ArcGIS OAuth2 token exchange at `{portal}/sharing/rest/oauth2/token`; stores token in session |
| `nl2where(Request)` | Sends question + allow-listed layer fields to Ollama; parses `{where, explanation}`; sanitises WHERE; returns JSON |
| `nl2whereStream(Request)` | SSE endpoint — streams a Dutch explanation of a supplied WHERE clause via raw `curl` + `CURLOPT_WRITEFUNCTION` |

Private helpers: `csv()`, `sanitizeWhere()` (rejects `;`, `--`, `DROP/DELETE/...`, requires identifiers be in the allow-list), `getLayerFields()` (GET `{layer}?f=json&token=`), `extractJsonObject()` (strips ` ```json ` fences).

## OAuth flow

See sequence diagram in [../integrations.md#oauth-sequence](../integrations.md#oauth-sequence).

Session keys set on success:

```
arcgis.access_token
arcgis.expires_in
arcgis.expires_at     // now + expires_in
arcgis.username
```

`RequireArcgisLogin` middleware:
1. If `arcgis.access_token` missing → redirect to `route('arcgis.loginAGOL')`.
2. If `arcgis.expires_at` has passed → clear the four keys, redirect to login with "sessie verlopen" flash error.

`LogoutAGOLController@logout` clears ArcGIS session keys + invalidates the Laravel session + regenerates the CSRF token.

## Ollama

- Endpoint: `http://127.0.0.1:11434/api/chat` (loopback only).
- Model: `gemma3:12b`.
- Temperature: `0.1`.
- System prompt enforces strict `{where, explanation}` JSON output.
- The streaming endpoint sets `Content-Type: text/event-stream`, flushes each model token as its own SSE chunk, and terminates with `event: done`.

## Client

[public/js/testAI.js](../../public/js/testAI.js) opens `new EventSource('/ai/nl2where-stream?question=...&where=...')`, appends incoming text into `#aiAnswer`, hides the loader on the first non-empty token, and closes the stream on the `done` event.

⚠️ The same file contains a hard-coded `fmetoken token=…` literal used elsewhere. See [../known-issues.md#hard-coded-fme-bearer-token-in-client-js](../known-issues.md#hard-coded-fme-bearer-token-in-client-js).
