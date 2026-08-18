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
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Berkas rute per role sengaja mengekspor array RouteObject, bukan komponen.
    // Ini pola wajib proyek, dan fast refresh tidak relevan untuk berkas rute.
    files: ['src/components/router/routes/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Provider yang mengekspor hook pendampingnya adalah pola React yang lazim.
    // Memisahkan hook ke berkas lain hanya menambah berkas tanpa manfaat nyata.
    files: ['src/components/router/AuthContext.tsx', 'src/components/ui/Snackbar.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
