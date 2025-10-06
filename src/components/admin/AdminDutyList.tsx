import Link from 'next/link'

type Duty = {
  key: string
  title: string
  href: string // keep as string for simplicity
  description: string
}

const duties: Duty[] = [
  {
    key: 'violations',
    title: 'Review violations',
    href: '/admin/violations',
    description: 'View new and pending violations; assign and update statuses.',
  },
  {
    key: 'users',
    title: 'Manage users & roles',
    href: '/admin/users',
    description: 'Create, edit, and assign roles to users.',
  },
  {
    key: 'companies',
    title: 'Manage companies',
    href: '/admin/companies',
    description: 'Add companies, link users, and configure details.',
  },
  {
    key: 'notifications',
    title: 'Notification templates',
    href: '/admin/notifications',
    description: 'Configure email/SMS templates and delivery settings.',
  },
  {
    key: 'audit',
    title: 'Audit logs',
    href: '/admin/audit-logs',
    description: 'Track important actions across the system.',
  },
  {
    key: 'settings',
    title: 'System settings',
    href: '/admin/settings',
    description: 'General configuration, access policies, and app settings.',
  },
]

export default function AdminDutyList() {
  return (
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
      {duties.map((duty) => (
        <Link
          key={duty.key}
          href={{ pathname: duty.href }} // pass a UrlObject to satisfy types
          style={{
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: 16,
            textDecoration: 'none',
            color: 'inherit',
            background: 'white',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', fontSize: 18 }}>{duty.title}</h3>
          <p style={{ margin: 0, color: '#4b5563' }}>{duty.description}</p>
        </Link>
      ))}
    </section>
  )
}