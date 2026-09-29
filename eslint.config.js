import js from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      'apps/api/drizzle/**',
      'docs/khung-mau.html',
    ],
  },

  js.configs.recommended,

  // Kiểm tra CÓ thông tin kiểu: bắt được `any` rò rỉ, promise quên await —
  // đúng loại lỗi mã do AI viết hay mắc mà vẫn biên dịch được.
  ...tseslint.configs.recommendedTypeChecked.map((c) => ({ ...c, files: ['**/*.{ts,tsx}'] })),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  {
    files: ['**/*.{js,mjs}'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // HTML thô chỉ được vào DOM qua DOMPurify (ADR-0005). Chặn ở đây để
      // không ai phải nhớ — GDOS cũ có 3 chỗ lọt vì không có luật này.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            'Không dùng dangerouslySetInnerHTML trực tiếp. HTML thô phải đi qua một component bọc DOMPurify (ADR-0005).',
        },
        {
          selector: "AssignmentExpression[left.property.name='innerHTML']",
          message: 'Không gán innerHTML trực tiếp. Lọc qua DOMPurify trước.',
        },
      ],
    },
  },

  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
)
