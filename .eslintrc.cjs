module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
    'plugin:prettier/recommended' // 必须放在最后
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module'
  },
  plugins: ['vue', '@typescript-eslint'],
  rules: {
    // TypeScript规则
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',

    // Vue规则
    'vue/multi-word-component-names': 'off',
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'always',
          normal: 'never',
          component: 'always'
        }
      }
    ],
    // 'prettier/prettier': [
    //   'error',
    //   {
    //     printWidth: 100,
    //     tabWidth: 2,
    //     useTabs: false,
    //     semi: true,
    //     singleQuote: true,
    //     quoteProps: 'as-needed',
    //     jsxSingleQuote: true,
    //     trailingComma: 'none',
    //     bracketSpacing: true,
    //     bracketSameLine: false,
    //     arrowParens: 'always',
    //     endOfLine: 'lf',
    //     vueIndentScriptAndStyle: true,
    //     htmlWhitespaceSensitivity: 'ignore'
    //   }
    // ],
    // 通用规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off'
  }
};
