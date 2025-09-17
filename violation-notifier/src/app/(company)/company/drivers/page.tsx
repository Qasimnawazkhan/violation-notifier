import { prisma } from '@/server/db'
import AppShell from '@/components/AppShell'

export default async function DriversPage() {
  const drivers = await prisma.driver.findMany({
    take: 50,
    orderBy: { id: 'desc' } // change to createdAt when confirmed available in schema/types
  })

  type Driver = (typeof drivers)[number]

  return (
    <AppShell>
      <div>
        <h2 className="text-xl font-semibold mb-4">Drivers</h2>
        <ul className="space-y-2">
          {drivers.map((d: Driver) => (
            <li key={d.id} className="p-3 border rounded bg-white">
              <div className="font-medium">{d.name}</div>
              <div className="text-xs text-gray-600">
                {d.whatsapp_e164}
                {d.vehicle_number ? ` • ${d.vehicle_number}` : ''}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  )
}