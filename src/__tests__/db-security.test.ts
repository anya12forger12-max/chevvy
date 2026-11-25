import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  generateId,
  hashPassword,
  initDatabase,
  loginUser,
  verifyPassword,
} from '../services/db'

const USERS_KEY = 'chevvy_users'

describe('credential hardening', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('derives identifiers from the CSPRNG, never Math.random', () => {
    const random = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random is not allowed for security values')
    })
    try {
      const ids = new Set(Array.from({ length: 50 }, () => generateId()))
      expect(ids.size).toBe(50)
      for (const id of ids) expect(id).toMatch(/^[0-9a-f]{32}$/)
    } finally {
      random.mockRestore()
    }
  })

  it('stores PBKDF2 hashes and rejects a wrong password', async () => {
    const salt = generateId()
    const stored = await hashPassword('correct horse battery staple', salt)
    expect(stored).toMatch(/^pbkdf2\$310000\$[0-9a-f]{64}$/)
    expect((await verifyPassword('correct horse battery staple', stored, salt)).ok).toBe(true)
    expect((await verifyPassword('wrong password', stored, salt)).ok).toBe(false)
  })

  it('upgrades a legacy single-round SHA-256 hash on successful login', async () => {
    const salt = generateId()
    const data = new TextEncoder().encode(`password123${salt}`)
    const legacy = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)), b =>
      b.toString(16).padStart(2, '0'),
    ).join('')
    localStorage.setItem(USERS_KEY, JSON.stringify([
      {
        id: 'legacy-user',
        name: 'Legacy',
        email: 'legacy@example.com',
        passwordHash: legacy,
        salt,
        role: 'user',
        spotifyConnected: false,
        createdAt: new Date().toISOString(),
      },
    ]))

    const result = await loginUser('legacy@example.com', 'password123')
    expect(result.user.id).toBe('legacy-user')
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    expect(stored[0].passwordHash).toMatch(/^pbkdf2\$310000\$/)
    expect((await verifyPassword('password123', stored[0].passwordHash, salt)).ok).toBe(true)
  })

  it('does not seed a known admin or demo password on a clean install', async () => {
    await initDatabase()
    expect(JSON.parse(localStorage.getItem(USERS_KEY) || '[]')).toEqual([])
    await expect(loginUser('admin@chevvy.app', 'admin123')).rejects.toThrow('Invalid email or password')
    await expect(loginUser('jane@example.com', 'password123')).rejects.toThrow('Invalid email or password')
  })
})
