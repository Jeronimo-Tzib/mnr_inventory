"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "../auth-context"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login, user } = useAuth()

  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(username, password)
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Invalid credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-neutral-900 border-neutral-700">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-orange-500" />
          </div>
          <CardTitle className="text-xl font-bold text-white tracking-widest">
            MNR SYSTEM LOGIN
          </CardTitle>
          <p className="text-xs text-neutral-500 tracking-wider">AUTHORIZED PERSONNEL ONLY</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="USERNAME"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600 focus:border-orange-500 focus:ring-orange-500/20 text-center tracking-wider"
                required
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-600 focus:border-orange-500 focus:ring-orange-500/20 text-center tracking-wider"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-center">
                <p className="text-xs text-red-500 tracking-wider">{error.toUpperCase()}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white tracking-widest mt-6"
            >
              {loading ? (
                "AUTHENTICATING..."
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" /> ACCESS SYSTEM
                </>
              )}
            </Button>
          </form>
          <div className="mt-8 text-center text-[10px] text-neutral-600 tracking-widest space-y-1">
            <p>Admin: admin / admin</p>
            <p>Employee: employee / employee</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
