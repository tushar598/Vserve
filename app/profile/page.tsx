"use client"
import ProfileForm from "@/components/profile/profile-form"
import Navbar from "@/components/Navbar"
export default function ProfilePage() {
  return (
    <div >
      <Navbar />
    <main className="max-w-2xl mx-auto mt-[4vw] p-4">
      <h1 className="text-2xl font-semibold mb-4 text-balance">Employee Profile</h1>
      <ProfileForm />
    </main>
    </div>
  )
}
