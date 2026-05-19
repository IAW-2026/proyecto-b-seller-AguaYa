import { startOutboxProcessor } from '@/lib/outbox'

const isBuildTime =
  process.env.NODE_ENV === 'production' &&
  process.argv.some((a) => a.includes('build'))

if (typeof setInterval !== 'undefined' && !isBuildTime) {
  startOutboxProcessor()
}
