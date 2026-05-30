import { Redis } from '@upstash/redis'

let redis: Redis | null = null

function getRedis(): Redis {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Upstash Redis env vars not configured')
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

const CACHE_TTL_SECONDS = 60 * 60 * 6 // 6 hours

export function buildCacheKey(brand: string, model: string, year: number, part: string): string {
  return `search:${brand}:${model}:${year}:${part}`.toLowerCase().replace(/\s+/g, '-')
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const data = await getRedis().get<T>(key)
    return data
  } catch {
    return null
  }
}

export async function setCache<T>(key: string, value: T, ttl = CACHE_TTL_SECONDS): Promise<void> {
  try {
    await getRedis().setex(key, ttl, value)
  } catch (err) {
    console.error('[Redis] setCache error:', err)
  }
}
