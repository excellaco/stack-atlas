import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";
import sonarjs from "eslint-plugin-sonarjs";
import prettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "node_modules/",
      "**/node_modules/",
      "**/dist/",
      "infrastructure/",
      "scripts/",
      "**/*.min.js",
      // stackData.ts is a large generated-style data file (~4000 lines).
      // Linting it adds no value and triggers max-lines violations.
      "frontend/src/data/**",
    ],
  },

  // Complexity limits are enforced as warnings so CI doesn't fail on them,
  // but they show up in the editor. If a function exceeds these, it should
  // be refactored — extract helpers, split components, etc.
  {
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      complexity: ["warn", 10],
      "max-lines": ["warn", { max: 400, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": ["warn", { max: 75, skipBlankLines: true, skipComments: true }],
      "max-depth": ["warn", 4],
    },
  },

  // TypeScript: recommended type-checked rules
  ...tseslint.configs.recommendedTypeChecked,

  // TypeScript parser options
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Disable type-checked rules for non-TS files (config files, etc.)
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...tseslint.configs.disableTypeChecked,
  },

  // Backend: Node.js
  {
    files: ["backend/src/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2025,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-unused-vars": "off",
      "no-console": "off",
    },
  },

  // Frontend: React + Browser + Accessibility
  {
    files: ["frontend/src/**/*.{ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2025,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      // These two react-hooks rules from v7+ are too strict for Zustand patterns
      // where setState calls happen in store actions, not in component effects.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react/react-in-jsx-scope": "off",
      // TypeScript handles prop validation; runtime PropTypes are redundant.
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-unused-vars": "off",
    },
  },

  // Test files use long describe blocks and repeat fixture strings.
  // Enforcing complexity/size limits on tests hurts readability.
  {
    files: ["**/*.test.ts"],
    rules: {
      "max-lines-per-function": "off",
      "max-lines": "off",
      "sonarjs/no-duplicate-string": "off",
    },
  },

  // SonarJS provides SonarQube-equivalent analysis locally.
  // Keep prefer-read-only-props ON — it enforces Readonly<> on React props,
  // which prevents accidental mutation. We fixed all 80+ violations to comply.
  sonarjs.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // FormEvent warnings are expected — @types/react marks it deprecated in
      // favor of specific event types (SubmitEvent, etc.). Harmless until migrated.
      "sonarjs/deprecation": "warn",
      // Stylistic preference — .match() vs .exec() doesn't matter for correctness.
      "sonarjs/prefer-regexp-exec": "off",
    },
  },

  // Prettier: must be last
  prettier
);
