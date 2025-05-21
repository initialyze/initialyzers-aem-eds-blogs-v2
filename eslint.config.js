// eslint.config.cjs
module.exports = [
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
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
      },
    },
    rules: {
      // your existing rules …
    },
  },
];
