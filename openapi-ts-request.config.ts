import path from 'node:path'
import process from 'node:process'
import { defineConfig } from 'openapi-ts-request'
import { loadEnv } from 'vite'

const env = loadEnv('development', path.resolve(process.cwd(), 'env'), '')
if (!env.OPENAPI_SCHEMA_URL) {
  throw new Error('请先在 env/.env.local 配置 OPENAPI_SCHEMA_URL，再运行 pnpm openapi')
}

export default defineConfig([
  {
    describe: 'timelynote-api',
    schemaPath: env.OPENAPI_SCHEMA_URL,
    serversPath: './src/service',
    requestLibPath: `import request from '@/http/vue-query';\n import { CustomRequestOptions_ } from '@/http/types';`,
    requestOptionsType: 'CustomRequestOptions_',
    isGenReactQuery: false,
    reactQueryMode: 'vue',
    isGenJavaScript: false,
  },
])
