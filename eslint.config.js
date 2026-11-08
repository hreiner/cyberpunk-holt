import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // `art-masters/` est hors depot (voir .gitignore) : outillage local de la fabrique d'images.
    ignores: [
      'dist/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
      'art-masters/**',
      '.dream-loop/**',
      'tmp/**',
      'public/comics/blue-purple/v*/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['tests/**/*.ts', 'scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['anime/**/*.cjs', 'docs/comics/blue-purple-motion/production/pages-05-08/**/*.cjs', 'docs/comics/blue-purple-motion/production/chapter-03-continuation/**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly', module: 'readonly', __dirname: 'readonly', __filename: 'readonly', process: 'readonly',
        console: 'readonly', Buffer: 'readonly', URL: 'readonly', structuredClone: 'readonly',
        // Browser callbacks passed to Playwright execute in the reader, not in Node.
        window: 'readonly', document: 'readonly', Image: 'readonly',
        XMLSerializer: 'readonly', btoa: 'readonly', unescape: 'readonly',
        URLSearchParams: 'readonly', location: 'readonly', innerWidth: 'readonly',
        fetch: 'readonly', innerHeight: 'readonly', getComputedStyle: 'readonly',
        setTimeout: 'readonly', setImmediate: 'readonly',
      },
    },
    rules: { '@typescript-eslint/no-require-imports': 'off', 'no-console': 'off', 'no-redeclare': ['error', { builtinGlobals: false }] },
  },
  {
    // Both branches invoke Promise callbacks; the frozen reader uses this form
    // to settle a bounded media wait without altering its rendering or hashes.
    files: ['anime/motion-comics/reader.js'],
    rules: { '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }] },
  },
  {
    // This character range deliberately rejects control bytes in asset paths.
    files: ['anime/motion-comics/publish.cjs'],
    rules: { 'no-control-regex': 'off' },
  },
  {
    // Reader API globals in Playwright callbacks run in the browser context.
    files: ['docs/comics/blue-purple-motion/production/chapter-03-continuation/publish-01/runtime/**/*.cjs'],
    languageOptions: { globals: { motionComic: 'readonly' } },
  },
  {
    // These pure timing helpers are SHA-locked by the production contracts. Keep
    // their unused forEach index byte-identical, including the historical v1 copy.
    files: ['docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/timing/retime.cjs', 'docs/comics/blue-purple-motion/production/chapter-03-continuation/motion-03/timing/retime-v1.cjs'],
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^(?:_|index$)', varsIgnorePattern: '^_' }] },
  },
  {
    files: ['docs/comics/blue-purple-motion/production/pages-05-08/**/*.mjs'],
    languageOptions: { globals: { URL: 'readonly', process: 'readonly', console: 'readonly' } },
    rules: { 'no-console': 'off' },
  },
  {
    files: ['anime/motion-comics/effects.js'],
    languageOptions: { globals: { window: 'readonly', document: 'readonly' } },
  },
);
