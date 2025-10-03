"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const OTP_CODE = "123456"

export default function LoginOTP() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [sent, setSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [role, setRole] = useState<"executive" | "manager" | "admin">("executive")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // if already logged-in, go to appropriate area
    try {
      const auth = localStorage.getItem("auth")
      if (auth) {
        const a = JSON.parse(auth)
        if (a?.role === "executive") router.replace("/dashboard")
        else router.replace("/admin")
      }
    } catch {}
  }, [router])

  const sendOtp = () => {
    setError(null)
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number")
      return
    }
    setSent(true)
  }

  const verifyOtp = () => {
    setError(null)
    if (otp !== OTP_CODE) {
      setError("Invalid OTP. Try 123456 for demo.")
      return
    }
    setLoading(true)
    // Save auth session
    const auth = { phone, role, ts: Date.now() }
    localStorage.setItem("auth", JSON.stringify(auth))
    // bootstrap user record store if not present
    const users = JSON.parse(localStorage.getItem("users") || "[]")
    const exists = users.find((u: any) => u.phone === phone)
    if (!exists) {
      users.push({
        phone,
        role,
        name: "",
        profileCompleted: false,
        id: `U${Math.floor(Math.random() * 100000)}`,
      })
      localStorage.setItem("users", JSON.stringify(users))
    }
    setTimeout(() => {
      setLoading(false)
      if (role === "executive") {
        router.replace("/dashboard")
      } else {
        router.replace("/admin")
      }
    }, 400)
  }

  return (
    <Card className="border">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-center">
          <Image src="/images/logo.jpg" alt="Company Logo" width={64} height={64} className="rounded-md" />
        </div>
        <CardTitle className="text-center text-balance">Sign in with Mobile OTP</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="phone">Mobile Number</Label>
          <Input
            id="phone"
            inputMode="numeric"
            maxLength={10}
            placeholder="Enter 10-digit number"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="role">Login as</Label>
          <Select value={role} onValueChange={(v: any) => setRole(v)}>
            <SelectTrigger id="role" aria-label="Select role">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="executive">Executive</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!sent ? (
          <Button className="w-full" onClick={sendOtp}>
            Send OTP
          </Button>
        ) : (
          <>
            <div className="grid gap-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter OTP (123456)"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              />
            </div>
            <Button className="w-full" disabled={loading} onClick={verifyOtp}>
              {loading ? "Verifying..." : "Verify & Continue"}
            </Button>
          </>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          By continuing you agree to our Terms and acknowledge our Privacy Policy.
        </p>
      </CardContent>
    </Card>
  )
}
