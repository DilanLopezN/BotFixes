module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'prettier',
    ],
    plugins: ['prettier'],
    rules: {
        'prettier/prettier': 'warn',
    },
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json',
    },
};
