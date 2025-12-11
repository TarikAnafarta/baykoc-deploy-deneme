// Migrate to ESLint Flat Config using the compatibility helper
// See: https://eslint.org/docs/latest/use/configure/migration-guide#using-the-compatibility-utility
import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';

export default [
  // Base recommended rules from ESLint
  js.configs.recommended,

  // Our project rules
  {
    files: ['**/*.{js,jsx}', '*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.mjs', '.cjs'],
          moduleDirectory: ['node_modules', 'src'],
        },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      // recommended sets for plugins in flat-config style
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...(importPlugin.configs?.recommended?.rules ?? {}),
      ...(jsxA11yPlugin.configs?.recommended?.rules ?? {}),

      // custom overrides
      'react/prop-types': 'off',
      // Allow function declarations before use (they're hoisted), but keep checks for variables/classes
      'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
      // Ignore unused vars that start with _ and ignore caught errors
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
    },
  },

  // Test files: provide globals like describe/it etc.
  {
    files: ['**/__tests__/**/*.*', '**/*.test.*'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
      },
    },
    rules: {
      'import/no-unresolved': 'off',
    },
  },

  // Vite config specific tweaks
  {
    files: ['**/vite.config.js'],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
];
