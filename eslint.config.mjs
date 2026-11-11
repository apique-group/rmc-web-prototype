import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __dirname = dirname(fileURLToPath(import.meta.url))
const compat = new FlatCompat({ baseDirectory: __dirname })

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  // images are plain <img>: admin uploads are data: URLs and the look must match the pre-Next build
  { rules: { '@next/next/no-img-element': 'off', '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] } },
  { ignores: ['node_modules/**', '.next/**', 'out/**', 'next-env.d.ts', 'test/**', 'tools/**'] },
]
