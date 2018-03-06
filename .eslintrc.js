module.exports = {
  env: {
    es6: true,
    node: true,
    mocha: true
  },
  extends: 'eslint:recommended',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2017
  },
  rules: {
    indent: ['error', 2, {
      'SwitchCase': 1,
      'VariableDeclarator': { 'var': 2, 'let': 2, 'const': 3 }
    }],
    'linebreak-style': ['error', 'unix'],
    'no-console': 'off',
    quotes: ['error', 'single', { allowTemplateLiterals: true  }],
    semi: ['error', 'never']
  }
}
