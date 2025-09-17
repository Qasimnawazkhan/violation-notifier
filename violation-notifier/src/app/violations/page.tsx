import { prisma } from '@/server/db'
import AppShell from '@/components/AppShell'

export default async function ViolationsPage() {
  const violations = await prisma.violation.findMany({
    take: 50,
    orderBy: { id: 'desc' } // switch to createdAt if available
  })

  type Violation = (typeof violations)[number]

  return (
    <AppShell>
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Violations</h2>
        <ul className="space-y-2">
          {violations.map((v: Violation) => (
            <li key={v.id} className="p-3 bg-white rounded border">
              <div className="font-medium">Violation #{v.id}</div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  )
}