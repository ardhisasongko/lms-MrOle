import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Catches components used in JSX but never imported (no-undef ignores JSXIdentifier)
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-vars': 'error',
      'no-unused-vars': 'warn',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: ['functions/**/*.js', 'scripts/**/*.mjs', '*.config.js', '.lighthouserc.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  // Service seam enforcement: pages/hooks gak boleh akses supabase langsung
  {
    files: ['src/pages/**/*.{js,jsx}', 'src/hooks/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [{
          group: ['**/supabase'],
          message: 'Jangan import supabase langsung dari pages/hooks. Gunakan services layer (services/*).',
        }],
      }],
    },
  },
]
