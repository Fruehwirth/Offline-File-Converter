import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  {
    ignores: ['dist', 'node_modules']
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Network calls are forbidden. This app must work 100% offline.'
        },
        {
          name: 'XMLHttpRequest',
          message: 'Network calls are forbidden. This app must work 100% offline.'
        },
        {
          name: 'WebSocket',
          message: 'Network calls are forbidden. This app must work 100% offline.'
        }
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'navigator',
          property: 'sendBeacon',
          message: 'Network calls are forbidden. This app must work 100% offline.'
        }
      ]
    }
  }
]

