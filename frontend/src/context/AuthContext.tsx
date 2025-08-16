import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'

type Token = { access_token: string; token_type: string; username: string; role: string }

type Ctx = {
  token: Token | null
  login: (t: Token) => void
  logout: () => void
}

const AuthCtx = createContext<Ctx | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<Token | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem('token')
    if (raw) setToken(JSON.parse(raw))
  }, [])

  const value = useMemo(
    () => ({
      token,
      login: (t: Token) => {
        setToken(t)
        localStorage.setItem('token', JSON.stringify(t))
      },
      logout: () => {
        setToken(null)
        localStorage.removeItem('token')
      },
    }),
    [token]
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
