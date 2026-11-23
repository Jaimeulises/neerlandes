// Reglas: TypeScript estricto con tipos, hooks de React bien usados y una
// frontera dura: src/motor no importa nada de src/neerlandes ni de src/ui.

import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['node_modules/', 'dist/', 'public/'] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unnecessary-condition': 'off',
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['src/motor/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/neerlandes/**', '**/ui/**', 'react', 'react-dom'],
              message: 'El motor no sabe de idiomas ni de pantallas.',
            },
          ],
        },
      ],
    },
  },
);
