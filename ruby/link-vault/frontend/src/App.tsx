/**
 * LINK VAULT — Ruby (standalone) + Tauri + React (TypeScript) macOS Desktop App
 *
 * link-vault/
 * ├── backend/
 * │   ├── Gemfile           ← activerecord, pg, sinatra, rack-cors
 * │   ├── db.rb             ← ActiveRecord.establish_connection; defines Link model
 * │   └── server.rb         ← Sinatra routes (GET/POST/DELETE /links) on :4567
 * │
 * └── frontend/             ← Tauri + React + TypeScript
 *     ├── src-tauri/
 *     │   └── tauri.conf.json  ← window config; sidecar spawns backend/server.rb
 *     └── src/
 *         ├── App.tsx          ← YOU ARE HERE
 *         ├── api/links.ts     ← fetch calls to localhost:4567
 *         └── components/
 *             ├── LinkCard.tsx
 *             └── AddLinkForm.tsx
 *
 * DB: links (id, title, url, description, created_at)
 * API: GET /links  POST /links  DELETE /links/:id
 *
 * Run backend: bundle exec ruby backend/server.rb
 * Run frontend: npm run tauri dev
 */
