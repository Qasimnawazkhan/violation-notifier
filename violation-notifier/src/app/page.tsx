import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'

export default async function Home() {
  const session = await getServerSession()

  // Not logged in → send to /login
  if (!session) {
    redirect('/login')
  }

  // Logged in → choose where to send user
  // You can refine role-based landing logic here
  redirect('/violations')
}