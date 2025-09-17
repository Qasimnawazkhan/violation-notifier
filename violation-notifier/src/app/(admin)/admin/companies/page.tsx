import { prisma } from '@/server/db'
import AppShell from '@/components/AppShell'

export default async function CompaniesPage() {
  // Query companies (adjust orderBy if you later add createdAt)
  const companies = await prisma.company.findMany({
    orderBy: { id: 'desc' }
  })

  // Derive element type of the result array
  type Company = (typeof companies)[number]

  return (
    <AppShell>
      <div>
        <h2 className="text-xl font-semibold mb-4">Companies</h2>
        <ul className="space-y-2">
          {companies.map((c: Company) => (
            <li key={c.id} className="p-3 border rounded bg-white">
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-gray-600">{c.id}</div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  )
}