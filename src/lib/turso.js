import { createClient } from '@libsql/client/web'

let _client = null

function getClient() {
  if (!_client) {
    _client = createClient({
      url:       import.meta.env.VITE_TURSO_DB_URL,
      authToken: import.meta.env.VITE_TURSO_DB_AUTH_TOKEN,
    })
  }
  return _client
}

export const turso = {
  execute: (sql) => getClient().execute(sql),
}
