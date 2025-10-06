import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'
import prisma from '@/lib/prisma'
import type { Prisma } from '@prisma/client'
import CompanyRowActions from '@/components/admin/CompanyRowActions'
import SignOutButton from '@/components/auth/SignOutButton'
import RegisterCompanyForm from '@/components/admin/RegisterCompanyForm'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

// Updated CompanyRow type to include IMAP fields
export type CompanyRowData = {
  id: string
  name: string
  contact_email: string | null
  contact_phone: string | null
  whatsapp_sender_id: string | null
  slug?: string | null
  imap_server?: string | null
  imap_user?: string | null
}

async function getCompanies(q?: string) {
  let where: Prisma.CompanyWhereInput | undefined

  if (q && q.length > 0) {
    const insensitive = 'insensitive' as const
    where = {
      OR: [
        { name: { contains: q, mode: insensitive } },
        { contact_email: { contains: q, mode: insensitive } },
        { contact_phone: { contains: q, mode: insensitive } },
        { whatsapp_sender_id: { contains: q, mode: insensitive } },
      ],
    }
  }

  const companies = await prisma.company.findMany({
    where,
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      contact_email: true,
      contact_phone: true,
      whatsapp_sender_id: true,
      slug: true,
      imap_user: true,
    },
  })

  return companies as CompanyRowData[]
}
export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  // Await the dynamic API first (Next.js 15)
  const params = await searchParams

  // Read query params safely
  const q = typeof params.q === 'string' ? params.q.trim() : undefined
  const created = params.created === '1'
  const updated = params.updated === '1'
  const deleted = params.deleted === '1'
  const error = typeof params.error === 'string' ? params.error : undefined

  // Auth session
  const session = await getServerSession(authOptions)
  const email = session?.user?.email ?? 'admin'

  // Data
  const companies = await getCompanies(q)

  return (
    <main style={{ padding: 24 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 4px 0' }}>Admin dashboard</h1>
          <p style={{ margin: 0, color: '#4b5563' }}>Welcome, {email}.</p>
        </div>
        <div>
          <SignOutButton />
        </div>
      </header>

      {/* Global status banners */}
      {(created || updated || deleted) && (
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
          {created && 'Company created successfully.'}
          {updated && 'Company updated successfully.'}
          {deleted && 'Company deleted successfully.'}
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

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* Left: Search + List */}
        <section>
          <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>Search</h2>

          <form method="get" style={{ marginBottom: 16 }}>
            <input
              type="text"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Search by name, email, phone, or WhatsApp"
              style={{
                width: '100%',
                padding: '8px 10px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
              }}
            />
          </form>

          <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>
            List of Registered Companies
          </h2>

          <div
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              overflow: 'hidden',
              background: 'white',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb', width: 60 }}>
                    No
                  </th>
                  <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>
                    Company name
                  </th>
                  <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>
                    WhatsApp number
                  </th>
                  <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>
                    Contact email
                  </th>
                  <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>
                    Phone
                  </th>
                  <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>
                    IMAP Server
                  </th>
                  <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb' }}>
                    IMAP Username
                  </th>
                  <th style={{ textAlign: 'left', padding: 10, borderBottom: '1px solid #e5e7eb', width: 180 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: 12, color: '#6b7280', fontStyle: 'italic' }}>
                      No companies found.
                    </td>
                  </tr>
                ) : (
                  companies.map((c, idx) => (
                    <tr key={c.id}>
                      <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>{idx + 1}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>{c.name}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>
                        {c.whatsapp_sender_id ?? '—'}
                      </td>
                      <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>
                        {c.contact_email ?? '—'}
                      </td>
                      <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>
                        {c.contact_phone ?? '—'}
                      </td>
                      <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>
                        {c.imap_server ?? '—'}
                      </td>
                      <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>
                        {c.imap_user ?? '—'}
                      </td>
                      <td style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>
                        <CompanyRowActions company={c} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: Register form */}
        <section
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 16,
            background: 'white',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>
            Register Company
          </h2>
          <RegisterCompanyForm loading={false}
          />
        </section>
      </div>
    </main>
  )
}