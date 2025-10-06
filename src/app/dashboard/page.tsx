import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/nextauth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import SignOutButton from '@/components/SignOutButton'
import { createDriver } from './drivers/actions'
import { createViolation, VIOLATION_TYPES } from './violations/actions'
import React from 'react'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const role = session.user.role
  const companyId = session.user.company_id

  if (role === 'system_admin') {
    redirect('/admin')
  }

  if (!companyId) {
    return (
      <main style={{ padding: 24 }}>
        <Header name={session.user.name ?? session.user.email ?? 'there'} />
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <EmptyCompanyNotice />
        </div>
      </main>
    )
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      name: true,
      contact_email: true,
      contact_phone: true,
    },
  })

  const sp = await searchParams
  const getFirst = (v: string | string[] | undefined) => Array.isArray(v) ? v[0] ?? '' : v ?? ''

  const q = getFirst(sp.q).toString().trim()
  const created = Boolean(sp.created)
  const updated = Boolean(sp.updated)
  const deleted = Boolean(sp.deleted)
  const vadded = Boolean(sp.vadded)
  const error = getFirst(sp.error) || undefined

  const drivers = await prisma.driver.findMany({
    where: {
      company_id: companyId,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { external_driver_id: { contains: q, mode: 'insensitive' } },
              { vehicle_number: { contains: q, mode: 'insensitive' } },
              { whatsapp_e164: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      external_driver_id: true,
      whatsapp_e164: true,
      vehicle_number: true,
    },
  })

  const violationCounts = await prisma.violation.groupBy({
    by: ['driver_id'],
    where: { company_id: companyId },
    _count: { _all: true },
  })
  const countMap = new Map<string, number>(
    violationCounts.map((row) => [row.driver_id as string, row._count._all])
  )

  const latestViolations = await prisma.violation.findMany({
    where: { company_id: companyId },
    orderBy: { created_at: 'desc' },
    take: 10,
    select: {
      id: true,
      driver_id: true,
      violation_type: true,     // nullable in schema -> string | null
      created_at: true,
    },
  })

  const latestDriverIds = Array.from(new Set(latestViolations.map(v => v.driver_id as string)))
  const latestDrivers = await prisma.driver.findMany({
    where: { id: { in: latestDriverIds } },
    select: { id: true, name: true, external_driver_id: true, vehicle_number: true },
  })
  const driverInfoMap = new Map(latestDrivers.map(d => [d.id, d]))

  return (
    <main style={{ paddingBottom: 40 }}>
      <Header
        name={session.user.name ?? session.user.email ?? 'there'}
        companyName={company?.name}
      />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        <FlashMessages
          created={created}
          updated={updated}
          deleted={deleted}
          vadded={vadded}
          error={error}
        />

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
            marginTop: -48,
            marginBottom: 24,
          }}
        >
          <InfoCard
            title="Company details"
            items={[
              { label: 'Name', value: company?.name ?? '—' },
              { label: 'ID', value: company?.id ?? '—' },
              { label: 'Email', value: company?.contact_email ?? '—' },
              { label: 'Phone', value: company?.contact_phone ?? '—' },
            ]}
          />
          <HighlightCard
            title="Status"
            color="#10b981"
            subtitle="Active"
            description="Your company account is active and ready."
          />
            <HighlightCard
            title="Onboarding"
            color="#6366f1"
            subtitle="Getting started"
            description="Add drivers and log violations."
          />
        </section>

        <DriversSection drivers={drivers} counts={countMap} q={q} />

        <ViolationsSection
          items={latestViolations.map(v => ({
            id: v.id as string,
            driver: driverInfoMap.get(v.driver_id as string),
            violation_type: v.violation_type, // string | null
            created_at: v.created_at,
          }))}
        />
      </div>
    </main>
  )
}

function Header({ name, companyName }: { name: string; companyName?: string }) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 60%, #8b5cf6 100%)',
        color: 'white',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 24px 88px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ opacity: 0.9, fontSize: 14, letterSpacing: 0.2 }}>Company Dashboard</div>
            <h1 style={{ margin: '6px 0 0', fontSize: 26, fontWeight: 700 }}>
              Welcome, {name}.
            </h1>
            {companyName ? (
              <div
                style={{
                  marginTop: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 10px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.28)',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: '#10b981',
                    display: 'inline-block',
                  }}
                />
                {companyName}
              </div>
            ) : null}
          </div>
          <SignOutButton />
        </div>
      </div>
    </div>
  )
}

function FlashMessages({
  created,
  updated,
  deleted,
  vadded,
  error,
}: {
  created?: boolean
  updated?: boolean
  deleted?: boolean
  vadded?: boolean
  error?: string
}) {
  if (error) {
    return (
      <div
        style={{
          marginTop: 16,
          marginBottom: 8,
          border: '1px solid #fecaca',
          background: '#fee2e2',
          color: '#7f1d1d',
          borderRadius: 12,
          padding: 12,
        }}
      >
        {error}
      </div>
    )
  }

  if (vadded || created || updated || deleted) {
    const text = vadded
      ? 'Violation added'
      : created
      ? 'Driver created'
      : updated
      ? 'Driver updated'
      : 'Driver deleted'
    return (
      <div
        style={{
          marginTop: 16,
          marginBottom: 8,
          border: '1px solid #bbf7d0',
          background: '#dcfce7',
          color: '#14532d',
          borderRadius: 12,
          padding: 12,
        }}
      >
        {text}
      </div>
    )
  }

  return null
}

function DriversSection({
  drivers,
  counts,
  q,
}: {
  drivers: {
    id: string
    name: string
    external_driver_id: string
    whatsapp_e164: string | null
    vehicle_number: string | null
  }[]
  counts: Map<string, number>
  q: string
}) {
  return (
    <section style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: '8px 0 12px' }}>Drivers</h2>

        <form role="search" style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            name="q"
            placeholder="Search by name, external ID, vehicle or WhatsApp"
            defaultValue={q}
            style={{
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              outline: 'none',
              minWidth: 280,
            }}
          />
          <button
            type="submit"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              background: '#111827',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Search
          </button>
        </form>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 16,
          marginTop: 12,
        }}
      >
        <AddDriverForm />

        <div
            style={{
              border: '1px solid #e5e7eb',
              background: '#ffffff',
              borderRadius: 16,
              padding: 0,
              overflow: 'hidden',
            }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                  {['Name', 'External ID', 'WhatsApp', 'Vehicle', 'Violations'].map((h) => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drivers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 16, color: '#6b7280' }}>
                      No drivers found.
                    </td>
                  </tr>
                ) : (
                  drivers.map((d) => (
                    <DriverRow key={d.id} d={d} count={counts.get(d.id) ?? 0} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}

function AddDriverForm() {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        background: '#ffffff',
        borderRadius: 16,
        padding: 16,
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 16 }}>Add a driver</h3>
      <form action={createDriver} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <input name="name" placeholder="Name" required style={inputStyle} />
        <input name="driver_id" placeholder="External driver ID" required style={inputStyle} />
        <input
          name="driver_whatsapp"
          placeholder="WhatsApp (e.g. +1234567890)"
          required
          inputMode="tel"
          style={inputStyle}
          title="Use international format, e.g. +1234567890"
        />
        <input name="vehicle_number" placeholder="Vehicle number" required style={inputStyle} />
        <div style={{ alignSelf: 'end' }}>
          <button type="submit" style={primaryButton}>
            Add driver
          </button>
        </div>
      </form>
      <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
        Tip: If you enter a local number without +, we’ll try to prepend your DEFAULT_COUNTRY_CODE (set in env).
      </div>
    </div>
  )
}

function DriverRow({
  d,
  count,
}: {
  d: {
    id: string
    name: string
    external_driver_id: string
    whatsapp_e164: string | null
    vehicle_number: string | null
  }
  count: number
}) {
  return (
    <tr style={{ borderTop: '1px solid #f3f4f6' }}>
      <td style={cellStyle}>{d.name}</td>
      <td style={cellStyle}>{d.external_driver_id}</td>
      <td style={cellStyle}>{d.whatsapp_e164 || '—'}</td>
      <td style={cellStyle}>{d.vehicle_number || '—'}</td>
      <td style={{ ...cellStyle, minWidth: 340 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ color: '#374151' }}>
            Total: <strong>{count}</strong>
          </span>
          <form action={createViolation} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <input type="hidden" name="driver_id" value={d.id} />
            <select
              name="violation_type"
              required
              style={{ ...inputStyle, padding: '6px 8px', width: 200 }}
              defaultValue=""
            >
              <option value="" disabled>
                Add violation…
              </option>
              {VIOLATION_TYPES.map((t: typeof VIOLATION_TYPES[number]) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button type="submit" style={primaryButton}>Add</button>
          </form>
        </div>
      </td>
    </tr>
  )
}

function ViolationsSection({
  items,
}: {
  items: {
    id: string
    driver?: { id: string; name: string; external_driver_id: string; vehicle_number: string | null }
    violation_type: string | null
    created_at: Date
  }[]
}) {
  return (
    <section style={{ marginTop: 24 }}>
      <h2 style={{ margin: '8px 0 12px' }}>Latest violations</h2>
      <div
        style={{
          border: '1px solid #e5e7eb',
          background: '#ffffff',
          borderRadius: 16,
          padding: 0,
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr style={{ background: '#f9fafb', textAlign: 'left' }}>
                {['Driver', 'External ID', 'Vehicle', 'Type', 'When'].map((h) => (
                  <th key={h} style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: 16, color: '#6b7280' }}>
                    No recent violations.
                  </td>
                </tr>
              ) : (
                items.map((v) => (
                  <tr key={v.id}>
                    <td style={cellStyle}>{v.driver?.name ?? '—'}</td>
                    <td style={cellStyle}>{v.driver?.external_driver_id ?? '—'}</td>
                    <td style={cellStyle}>{v.driver?.vehicle_number ?? '—'}</td>
                    <td style={cellStyle}>{v.violation_type ?? '—'}</td>
                    <td style={cellStyle}>{new Date(v.created_at).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function EmptyCompanyNotice() {
  return (
    <div
      style={{
        marginTop: 24,
        border: '1px solid #fee2e2',
        background: '#fef2f2',
        color: '#7f1d1d',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 8, fontSize: 18 }}>No company linked</h2>
      <p style={{ margin: 0 }}>
        Your account isn’t linked to a company yet. Please ask a system admin to assign your user to a company.
      </p>
    </div>
  )
}

function InfoCard({
  title,
  items,
}: {
  title: string
  items: { label: string; value: string }[]
}) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        background: '#ffffff',
        borderRadius: 16,
        padding: 18,
        boxShadow:
          '0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -12px rgba(24,39,75,0.16), 0 12px 48px -18px rgba(24,39,75,0.2)',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 18 }}>{title}</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((it) => (
          <li key={it.label} style={{ display: 'flex', gap: 8, padding: '6px 0', color: '#374151' }}>
            <span style={{ width: 110, color: '#6b7280' }}>{it.label}:</span>
            <span style={{ wordBreak: 'break-all' }}>{it.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function HighlightCard({
  title,
  subtitle,
  description,
  color,
}: {
  title: string
  subtitle: string
  description: string
  color: string
}) {
  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        background:
          'linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(250,250,255,1) 100%)',
        borderRadius: 16,
        padding: 18,
        boxShadow:
          '0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -12px rgba(24,39,75,0.16), 0 12px 48px -18px rgba(24,39,75,0.2)',
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: color,
            display: 'inline-block',
          }}
        />
        <div style={{ fontSize: 18, fontWeight: 700, color: '#111827' }}>{subtitle}</div>
      </div>
      <p style={{ margin: '8px 0 0', color: '#4b5563' }}>{description}</p>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  outline: 'none',
  width: '100%',
}

const primaryButton: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid #111827',
  background: '#111827',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
}

const cellStyle: React.CSSProperties = { padding: '10px 12px', borderTop: '1px solid #f3f4f6' }