/**
 * LINK VAULT — Rails API + React (Vite + TypeScript)
 *
 * link-vault/
 * ├── backend/                  ← rails new backend --api --database=postgresql -T
 * │   ├── Gemfile               ← rails, pg, rack-cors
 * │   ├── config/routes.rb      ← resources :links
 * │   ├── config/database.yml
 * │   ├── app/models/link.rb
 * │   └── app/controllers/links_controller.rb  ← index, create, destroy
 * │
 * └── frontend/                 ← npm create vite@latest -- --template react-ts
 *     └── src/
 *         ├── App.tsx           ← YOU ARE HERE
 *         ├── api/links.ts      ← getLinks, createLink, deleteLink
 *         └── components/
 *             ├── LinkCard.tsx
 *             └── AddLinkForm.tsx
 *
 * DB: links (id, title, url, description, tags string[], created_at)
 * API: GET /links  POST /links  DELETE /links/:id
 */
