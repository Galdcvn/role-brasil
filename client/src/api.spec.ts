import { describe, expect, it, vi, beforeEach } from 'vitest'
import { api, ApiError } from './api'

describe('api', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('adds Authorization header when token exists', async () => {
    localStorage.setItem('token', 'fake.jwt.token')
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true }),
    } as Response)

    await api('/test')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer fake.jwt.token' }),
      }),
    )
  })

  it('does not add Authorization header when no token', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response)

    await api('/test')

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.not.objectContaining({ Authorization: expect.any(String) }),
      }),
    )
  })

  it('throws ApiError on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    } as Response)

    await expect(api('/test')).rejects.toThrow(ApiError)
  })

  it('throws ApiError with status code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: 'Not found' }),
    } as Response)

    try {
      await api('/test')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).status).toBe(404)
    }
  })

  it('returns parsed JSON on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' }),
    } as Response)

    const result = await api<{ data: string }>('/test')
    expect(result).toEqual({ data: 'test' })
  })
})
