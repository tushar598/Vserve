"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

type Profile = {
  name: string
  fatherName: string
  pan: string
  bankAccount: string
  doj: string
  poiDataUrl?: string
  poaDataUrl?: string
}

async function fileToDataUrl(file: File): Promise<string> {
  const reader = new FileReader()
  return new Promise((resolve, reject) => {
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ProfileForm() {
  const router = useRouter()
  const [phone, setPhone] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile>({
    name: "",
    fatherName: "",
    pan: "",
    bankAccount: "",
    doj: "",
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "null")
      if (!auth) {
        router.replace("/login")
        return
      }
      setPhone(auth.phone)
      const key = `profile:${auth.phone}`
      const p = JSON.parse(localStorage.getItem(key) || "null")
      if (p) setProfile(p)
    } catch {}
  }, [router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return
    setSaving(true)
    try {
      localStorage.setItem(`profile:${phone}`, JSON.stringify(profile))
      // mark profile completion in users
      const users = JSON.parse(localStorage.getItem("users") || "[]")
      const idx = users.findIndex((u: any) => u.phone === phone)
      if (idx >= 0) {
        users[idx].profileCompleted = true
        users[idx].name = profile.name
        localStorage.setItem("users", JSON.stringify(users))
      }
      setMsg("Profile saved successfully")
      setTimeout(() => setMsg(null), 2000)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card asChild>
      <form onSubmit={onSubmit} className="space-y-4">
        <CardHeader>
          <CardTitle className="text-balance">Complete your details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="father">Father’s Name</Label>
            <Input
              id="father"
              value={profile.fatherName}
              onChange={(e) => setProfile({ ...profile, fatherName: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pan">PAN</Label>
            <Input
              id="pan"
              value={profile.pan}
              onChange={(e) => setProfile({ ...profile, pan: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bank">Bank Account</Label>
            <Input
              id="bank"
              value={profile.bankAccount}
              onChange={(e) => setProfile({ ...profile, bankAccount: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="doj">Date of Joining</Label>
            <Input
              type="date"
              id="doj"
              value={profile.doj}
              onChange={(e) => setProfile({ ...profile, doj: e.target.value })}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="poi">Upload POI (ID)</Label>
              <Input
                id="poi"
                type="file"
                accept="image/*,.pdf"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const dataUrl = await fileToDataUrl(f)
                  setProfile((p) => ({ ...p, poiDataUrl: dataUrl }))
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="poa">Upload POA (Address)</Label>
              <Input
                id="poa"
                type="file"
                accept="image/*,.pdf"
                onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const dataUrl = await fileToDataUrl(f)
                  setProfile((p) => ({ ...p, poaDataUrl: dataUrl }))
                }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => history.back()}>
              Back
            </Button>
          </div>
          {msg && <p className="text-sm text-green-600">{msg}</p>}
        </CardContent>
      </form>
    </Card>
  )
}
