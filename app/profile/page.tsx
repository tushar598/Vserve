"use client"
import ProfileForm from "@/components/profile/profile-form"

export default function ProfilePage() {
  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4 text-balance">Employee Profile</h1>
      <ProfileForm />
    </main>
  )
}
