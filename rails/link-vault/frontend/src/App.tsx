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

import { useState, useEffect } from 'react'
import { getLinks, createLink, deleteLink } from './api/links'
import type { Link } from './api/links'
// import LinkCard from './components/LinkCard'
// import AddLinkForm from './components/AddLinkForm'

export default function App() {
  const [links, setLinks] = useState<Link[]>([])

  useEffect(() => {
    getLinks().then(setLinks)
  }, [])

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
      {/* {links.map((link) => (
        <LinkCard key={link.id} link={link} onDelete={handleDelete} />
      ))} */}
    </div>
  )
}
