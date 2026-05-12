module.exports = {
    env: {
        es6: true,
        node: true
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    rules: {
        'semi': ['error', 'always'],
        'eqeqeq': ['error', 'always'],
        'no-var': 'error',
        'prefer-const': 'warn',
        'no-mixed-spaces-and-tabs': 'error'
    }
}
