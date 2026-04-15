/**
 * LINK VAULT — Rails API + React (Vite + TypeScript) Portfolio Project
 *
 * ─────────────────────────────────────────────────────────────────
 * PROJECT STRUCTURE
 * ─────────────────────────────────────────────────────────────────
 *
 * link-vault/
 * ├── backend/                          ← Rails API (API mode)
 * │   ├── Gemfile                       ← gems: rails, pg, rack-cors, puma
 * │   ├── config/
 * │   │   ├── application.rb            ← API-only mode, CORS config
 * │   │   ├── routes.rb                 ← namespace :api, :v1 → resources :links
 * │   │   └── database.yml              ← PostgreSQL connection
 * │   ├── config/initializers/
 * │   │   └── cors.rb                   ← allow localhost:5173 (Vite dev)
 * │   ├── db/
 * │   │   ├── migrate/
 * │   │   │   └── TIMESTAMP_create_links.rb  ← title, url, description, tags[]
 * │   │   └── schema.rb
 * │   └── app/
 * │       ├── models/
 * │       │   └── link.rb               ← validates :url presence; tags default []
 * │       └── controllers/api/v1/
 * │           └── links_controller.rb   ← index, create, update, destroy
 * │
 * └── frontend/                         ← React + Vite + TypeScript
 *     ├── index.html
 *     ├── vite.config.ts                ← proxy /api → localhost:3000
 *     ├── tsconfig.json
 *     ├── package.json                  ← react, react-dom, axios + @types/*
 *     └── src/
 *         ├── main.tsx                  ← ReactDOM.createRoot entry
 *         ├── App.tsx                   ← ← YOU ARE HERE
 *         ├── types/
 *         │   └── link.ts               ← Link interface (id, title, url, description, tags)
 *         ├── api/
 *         │   └── links.ts              ← axios calls: getLinks, createLink,
 *         │                                             deleteLink, updateLink
 *         └── components/
 *             ├── LinkCard.tsx          ← displays title, url, description, tags
 *             │                            with delete button; props: Link, onDelete
 *             ├── AddLinkForm.tsx       ← controlled form: url, title, description,
 *             │                            tags (comma-separated input → string[])
 *             └── TagFilter.tsx         ← renders unique tag pills, filters list
 *                                          on click; props: tags, active, onChange
 *
 * ─────────────────────────────────────────────────────────────────
 * DATABASE SCHEMA (links table)
 * ─────────────────────────────────────────────────────────────────
 *   id          bigint PK
 *   title       string  not null
 *   url         string  not null
 *   description text
 *   tags        string[] default []   ← Postgres array column
 *   created_at  datetime
 *   updated_at  datetime
 *
 * ─────────────────────────────────────────────────────────────────
 * API ENDPOINTS
 * ─────────────────────────────────────────────────────────────────
 *   GET    /api/v1/links         → returns all links (optional ?tag= filter)
 *   POST   /api/v1/links         → create link
 *   PATCH  /api/v1/links/:id     → update link
 *   DELETE /api/v1/links/:id     → destroy link
 *
 * ─────────────────────────────────────────────────────────────────
 * SETUP COMMANDS
 * ─────────────────────────────────────────────────────────────────
 *   Backend:
 *     gem install rails
 *     rails new backend --api --database=postgresql -T
 *     cd backend && bundle install
 *     rails db:create && rails db:migrate
 *     rails server                     ← runs on :3000
 *
 *   Frontend:
 *     npm create vite@latest frontend -- --template react-ts
 *     cd frontend && npm install axios
 *     npm install -D @types/node
 *     npm run dev                      ← runs on :5173
 */

import { useState, useEffect } from 'react'
import { getLinks, createLink, deleteLink } from './api/links'
import type { Link } from './types/link'
// import AddLinkForm from './components/AddLinkForm'
// import LinkCard from './components/LinkCard'
// import TagFilter from './components/TagFilter'

export default function App() {
  const [links, setLinks] = useState<Link[]>([])
  const [activeTag, setActiveTag] = useState<string | null>(null)

  useEffect(() => {
    getLinks(activeTag).then(setLinks)
  }, [activeTag])

  const handleAdd = async (data: Omit<Link, 'id'>) => {
    const newLink = await createLink(data)
    setLinks((prev) => [newLink, ...prev])
  }

  const handleDelete = async (id: number) => {
    await deleteLink(id)
    setLinks((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div>
      <h1>Link Vault</h1>
      {/* <AddLinkForm onAdd={handleAdd} /> */}
      {/* <TagFilter links={links} active={activeTag} onChange={setActiveTag} /> */}
      {/* {links.map((link) => (
        <LinkCard key={link.id} link={link} onDelete={handleDelete} />
      ))} */}
    </div>
  )
}
