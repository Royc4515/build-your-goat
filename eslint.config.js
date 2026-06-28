import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// Flat ESLint config. The engine-purity guardrail (no DOM / Math.random / Date /
// localStorage inside src/engine) lands in M1 once src/engine exists, as a scoped
// override using no-restricted-globals / no-restricted-properties.
export default tseslint.config(
  { ignores: ['dist/', 'node_modules/', 'coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  // Existing vanilla JS predates the TS migration; don't fail the lint on it.
  {
    files: ['src/**/*.js'],
    ...tseslint.configs.disableTypeChecked,
  },
);
