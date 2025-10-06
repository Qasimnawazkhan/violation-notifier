'use client'

import * as React from 'react'

type Manager = { id: string; email: string }
type Company = {
  id: string
  name: string
  slug: string
  contact_email?: string | null
  contact_phone?: string | null
  whatsapp_sender_id?: string | null
  users: Manager[]
}

export default function AdminCompaniesPage() {
  const [query, setQuery] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [companies, setCompanies] = React.useState<Company[]>([])
  const [name, setName] = React.useState('')
  const [contactEmail, setContactEmail] = React.useState('')
  const [contactPhone, setContactPhone] = React.useState('')
  const [whatsappNumber, setWhatsappNumber] = React.useState('')
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)

  // Edit state
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editName, setEditName] = React.useState('')
  const [editContactEmail, setEditContactEmail] = React.useState('')
  const [editContactPhone, setEditContactPhone] = React.useState('')
  const [editWhatsappNumber, setEditWhatsappNumber] = React.useState('')

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/companies?query=${encodeURIComponent(query)}`)
      const data = await res.json()
      setCompanies(data.companies ?? [])
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contact_email: contactEmail || undefined,
          contact_phone: contactPhone || undefined,
          whatsapp_sender_id: whatsappNumber || undefined,
          // username/password create an initial company manager account
          username: username || undefined,
          password: password || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Failed to register company')
        return
      }
      setName('')
      setContactEmail('')
      setContactPhone('')
      setWhatsappNumber('')
      setUsername('')
      setPassword('')
      await load()
    } catch {
      setError('Failed to register company')
    }
  }

  function beginEdit(c: Company) {
    setEditingId(c.id)
    setEditName(c.name ?? '')
    setEditContactEmail(c.contact_email ?? '')
    setEditContactPhone(c.contact_phone ?? '')
    setEditWhatsappNumber(c.whatsapp_sender_id ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditName('')
    setEditContactEmail('')
    setEditContactPhone('')
    setEditWhatsappNumber('')
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/admin/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName || undefined,
        contact_email: editContactEmail || undefined,
        contact_phone: editContactPhone || undefined,
        whatsapp_sender_id: editWhatsappNumber || undefined,
      }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error ?? 'Failed to update company')
      return
    }
    cancelEdit()
    await load()
  }

  async function onDelete(id: string) {
    if (!confirm('Delete this company? This will also remove its managers.')) return
    await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Companies</h1>
        <p className="text-sm text-gray-600">Register, search, and manage companies and their manager accounts.</p>
      </div>

      <form onSubmit={onCreate} className="grid gap-3 sm:grid-cols-3 bg-white border rounded p-4">
        <div>
          <label className="block text-sm font-medium">Company Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="Acme Transport"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Contact Email</label>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="ops@acme.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Contact Phone</label>
          <input
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="+1 555 0100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">WhatsApp Number</label>
          <input
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="+1 555 0101 or Sender ID"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Company Username</label>
          <input
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="manager@acme.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="Temporary password"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="rounded bg-indigo-600 text-white px-4 py-2 hover:bg-indigo-700"
          >
            Register Company
          </button>
        </div>
        {error && <div className="sm:col-span-3 text-sm text-red-600">{error}</div>}
      </form>

      <div className="flex items-center gap-2">
        <input
          placeholder="Search by name or slug…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="rounded border px-3 py-2 w-64"
        />
        <button onClick={() => void load()} className="rounded border px-3 py-2">
          Search
        </button>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : companies.length === 0 ? (
        <div className="text-gray-600 text-sm">No companies found.</div>
      ) : (
        <ul className="space-y-2">
          {companies.map((c) => (
            <li key={c.id} className="p-4 bg-white border rounded space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-gray-600">Slug: {c.slug}</div>
                  <div className="text-xs text-gray-600">
                    Managers: {c.users.map((u) => u.email).join(', ') || 'None'}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {editingId === c.id ? (
                    <>
                      <button
                        onClick={() => void saveEdit(c.id)}
                        className="text-indigo-600 hover:underline text-sm"
                      >
                        Save
                      </button>
                      <button onClick={cancelEdit} className="text-gray-600 hover:underline text-sm">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => beginEdit(c)}
                        className="text-indigo-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => void onDelete(c.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editingId === c.id && (
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <label className="block text-xs font-medium">Company Name</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 w-full rounded border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Contact Email</label>
                    <input
                      type="email"
                      value={editContactEmail}
                      onChange={(e) => setEditContactEmail(e.target.value)}
                      className="mt-1 w-full rounded border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">Contact Phone</label>
                    <input
                      value={editContactPhone}
                      onChange={(e) => setEditContactPhone(e.target.value)}
                      className="mt-1 w-full rounded border px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium">WhatsApp Number</label>
                    <input
                      value={editWhatsappNumber}
                      onChange={(e) => setEditWhatsappNumber(e.target.value)}
                      className="mt-1 w-full rounded border px-3 py-2"
                    />
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}