import { defineConfig } from "eslint/config";
import babelParser from '@babel/eslint-parser';

export default defineConfig([
  {
    // your ignore globs (formerly in .eslintignore)
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'legacy/**/*.js',
    ],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false, // Tells Babel parser not to look for Babel config files
        allowImportExportEverywhere: true,
      },
    },
    rules: {
      'import/extensions': ['error', { js: 'always' }], // require js file extensions in imports
      'linebreak-style': ['error', 'unix'], // enforce unix linebreaks
      'no-param-reassign': ['error', { props: false }], // allow modifying properties of param,
      'max-len': ['warn'], // Enforces a maximum line length.
    },
  },
]);
