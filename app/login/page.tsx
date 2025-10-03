"use client"
import LoginOTP from "@/components/auth/login-otp"

export default function LoginPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginOTP />
      </div>
    </main>
  )
}
