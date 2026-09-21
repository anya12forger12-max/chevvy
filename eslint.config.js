import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Keep only the classic rules-of-hooks + exhaustive-deps checks.
      // eslint-plugin-react-hooks v7 bundles React-Compiler-aware rules
      // (purity, immutability, set-state-in-effect, ...) in every preset;
      // those are intentionally not enabled: this app targets plain React
      // without the compiler and uses standard effect-driven data loading.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Shared destructure-omit pattern, e.g.
      // const { passwordHash, salt, ...safeUser } = user;
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      // Codebase-wide parity with the other org frontends.
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
])