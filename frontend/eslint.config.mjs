import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    files: ["**/*.{js,jsx}"],
    rules: {
      "no-console": ["warn", { allow: ["error"] }],
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": "warn",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**"]),
]);

export default eslintConfig;
