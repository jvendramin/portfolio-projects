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

import { useState } from 'react'

interface Link {
  id: number
  title: string
  url: string
}

export default function App() {
  const [links, setLinks] = useState<Link[]>([])
  const [search, setSearch] = useState('')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  const filtered = links.filter(
    (l) =>
      l.title.toLowerCase().includes(search.toLowerCase()) ||
      l.url.toLowerCase().includes(search.toLowerCase())
  )

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url) return
    setLinks((prev) => [...prev, { id: Date.now(), title, url }])
    setTitle('')
    setUrl('')
  }

  const handleDelete = (id: number) => {
    setLinks((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', fontFamily: 'sans-serif', padding: '0 16px' }}>
      <h1>Link Vault</h1>

      <input
        type="text"
        placeholder="Search links..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: '100%', padding: '8px', marginBottom: 24, boxSizing: 'border-box' }}
      />

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ flex: 1, padding: '8px' }}
        />
        <input
          type="url"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{ flex: 2, padding: '8px' }}
        />
        <button type="submit">Add</button>
      </form>

      {filtered.length === 0 && <p style={{ color: '#888' }}>No links yet.</p>}

      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {filtered.map((link) => (
          <li key={link.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.title}
            </a>
            <button onClick={() => handleDelete(link.id)} style={{ marginLeft: 16 }}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
