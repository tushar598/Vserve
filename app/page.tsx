"use client"

import Link from "next/link"
import LoginOTP from "@/components/auth/login-otp"

export default function HomePage() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginOTP />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New User?{" "}
          <Link className="underline hover:text-primary" href="/register">
            Open Registration Form
          </Link>
        </p>
      </div>
    </main>
  )
}
