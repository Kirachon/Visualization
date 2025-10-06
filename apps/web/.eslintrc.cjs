module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    jest: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    project: ['./tsconfig.eslint.json'],
  },
  settings: {
    react: { version: 'detect' },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['./tsconfig.eslint.json'],
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    },
  },
  plugins: [
    'react-hooks',
    'jsx-a11y',
    '@typescript-eslint',
    'prettier',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:prettier/recommended',
  ],
  rules: {
    'prettier/prettier': 'error',

    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'jsx-a11y/anchor-is-valid': 'off',
  },
};

