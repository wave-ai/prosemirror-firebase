module.exports = {
  root: true,
  env: {
    node: true,
  },
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'airbnb-typescript',
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-underscore-dangle': 'off',
    'max-classes-per-file': 'off',
    'implicit-arrow-linebreak': 'off',
    '@typescript-eslint/member-ordering': 'error',
    'object-curly-newline': ['error', {
      'ImportDeclaration': { 'minProperties': 5, 'consistent': false, 'multiline': true },
    }],
  },
  settings: {
    /* This is a non-React project, but this silences an irrelevant warning. */
    react: {
      version: 'latest',
    },
  },
}