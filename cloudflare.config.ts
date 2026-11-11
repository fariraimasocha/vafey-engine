import { bindings, defineConfig } from 'cf/config'

export default defineConfig({
  accountId: '4b0774f7fcd2db73dbe26b3904dc632e',
  worker: {
    name: 'vafey-engine',
    entrypoint: '@tanstack/react-start/server-entry',
    compatibilityDate: '2026-11-11',
    compatibilityFlags: ['nodejs_compat'],
    observability: { enabled: true },
    env: {
      DB: bindings.d1({ id: '331637db-c8ac-473f-8322-2427ebe54ed5', name: 'vafey-engine' }),
      BUCKET: bindings.r2({ name: 'vafey-engine' }),
      // Local: read from .env. Production: set with `cf` secrets.
      BETTER_AUTH_SECRET: bindings.secret(),
      BETTER_AUTH_URL: bindings.secret(),
    },
  },
})
