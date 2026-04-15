/**
 * LINK VAULT — Sinatra API + Tauri + React (TypeScript) macOS Desktop App
 *
 * link-vault/
 * ├── backend/                      ← Ruby/Sinatra local HTTP server
 * │   ├── Gemfile                   ← sinatra, pg, sinatra-contrib, rack-cors
 * │   ├── app.rb                    ← Sinatra routes: GET/POST/DELETE /links
 * │   └── config/database.yml       ← PostgreSQL connection
 * │
 * └── frontend/                     ← Tauri + React + TypeScript
 *     ├── src-tauri/                ← Tauri native layer (Rust)
 *     │   ├── tauri.conf.json       ← app name, window size, sidecar config
 *     │   └── src/main.rs           ← spawns backend/app.rb as sidecar on launch
 *     └── src/
 *         ├── App.tsx               ← YOU ARE HERE
 *         ├── api/links.ts          ← fetch calls to localhost:4567
 *         └── components/
 *             ├── LinkCard.tsx
 *             └── AddLinkForm.tsx
 *
 * DB: links (id, title, url, description, created_at)
 * API: GET /links  POST /links  DELETE /links/:id  (localhost:4567)
 *
 * Setup:
 *   npm create tauri-app@latest frontend -- --template react-ts
 *   gem install sinatra pg
 *   bundle exec ruby backend/app.rb   ← dev: run manually on :4567
 */
