import { createCompany } from './action'

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const created = searchParams?.created === '1'
  const error =
    typeof searchParams?.error === 'string' ? searchParams?.error : undefined

  return (
    <main style={{ padding: 24, maxWidth: 720 }}>
      <h1 style={{ marginBottom: 16 }}>Companies</h1>

      <section
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 16,
          background: 'white',
          marginBottom: 24,
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>
          Register company
        </h2>

        {created && (
          <div
            style={{
              marginBottom: 12,
              padding: 12,
              border: '1px solid #bbf7d0',
              background: '#f0fdf4',
              color: '#166534',
              borderRadius: 6,
            }}
          >
            Company created successfully.
          </div>
        )}

        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: 12,
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#991b1b',
              borderRadius: 6,
            }}
          >
            {error}
          </div>
        )}

        <form action={createCompany}>
          <div style={{ display: 'grid', gap: 12 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span>Company name</span>
              <input
                name="name"
                placeholder="Acme Inc."
                required
                style={{
                  padding: '8px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span>Slug</span>
              <input
                name="slug"
                placeholder="acme-inc"
                style={{
                  padding: '8px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                }}
              />
              <small style={{ color: '#6b7280' }}>
                Optional: leave blank to auto-generate from name
              </small>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span>Contact email</span>
              <input
                name="contact_email"
                type="email"
                placeholder="admin@acme.com"
                style={{
                  padding: '8px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span>Contact phone</span>
              <input
                name="contact_phone"
                placeholder="+1 555 987 6543"
                style={{
                  padding: '8px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span>WhatsApp sender ID</span>
              <input
                name="whatsapp_sender_id"
                placeholder="wamid.example.channel"
                style={{
                  padding: '8px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                }}
              />
            </label>

            <div>
              <button
                type="submit"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  background: '#111827',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Create company
              </button>
            </div>
          </div>
        </form>
      </section>
    </main>
  )
}