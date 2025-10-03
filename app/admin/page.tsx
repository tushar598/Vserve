"use client"

import AdminPanel from "@/components/admin/admin-panel"

export default function AdminPage() {
  return (
    <main className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4 text-balance">Manager / Admin Panel</h1>
      <AdminPanel />
    </main>
  )
}
