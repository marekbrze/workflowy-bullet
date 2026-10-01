import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default tseslint.config(
  {
    ignores: ['dist', 'storybook-static', 'coverage'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // Accessibility rules for JSX.
  // For WCAG AAA, swap `flatConfigs.recommended` for `flatConfigs.strict`.
  jsxA11y.flatConfigs.recommended,
)
