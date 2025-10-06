import { prisma } from '@/server/db'
import AppShell from '@/components/AppShell'

export default async function ViolationsPage() {
  const violations = await prisma.violation.findMany({
    take: 50,
    orderBy: { id: 'desc' }, // change to createdAt if/when available
  })

  const hasData = violations.length > 0

  return (
    <AppShell>
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Violations</h2>

        {!hasData ? (
          <div className="text-sm text-gray-600">
            No violations yet.
            <br />
            Tip: Run “npx prisma studio” to add a Company, Driver, and a Violation, then refresh this page.
          </div>
        ) : (
          <ul className="space-y-2">
            {violations.map((v) => (
              <li key={v.id} className="p-3 bg-white rounded border">
                <div className="font-medium">Violation #{v.id}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  )
}