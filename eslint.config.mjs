import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([
    globalIgnores(["**/node_modules", "**/dist", "**/transpiled", "**/*.js", "**/*.d.ts"]),
    {
        extends: compat.extends(
            "eslint:recommended",
            "plugin:@typescript-eslint/eslint-recommended",
            "plugin:@typescript-eslint/recommended",
            "plugin:prettier/recommended",
        ),
        plugins: {
            "@typescript-eslint": typescriptEslint,
            prettier,
            "simple-import-sort": simpleImportSort,
        },
        languageOptions: {
            parser: tsParser,
        },
        settings: {},
        rules: {
            curly: ["error", "all"],
            "prettier/prettier": "warn",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-namespace": "off",
            "prefer-const": 1,
            "@typescript-eslint/no-unused-vars": [2, {
                vars: "all",
                args: "none",
                varsIgnorePattern: "h",
            }],
            "@typescript-eslint/no-unused-expressions": [1, {
                allowShortCircuit: true,
                allowTernary: true,
            }],
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "no-case-declarations": "off",
            "no-inner-declarations": "off",
            "sort-imports": "off",
            "simple-import-sort/imports": ["error", {
                groups: [[
                    "@stencil/core",
                    "cryptly",
                    "flagly",
                    "gracely",
                    "isoly",
                    "paramly",
                    "selectively",
                    "langly",
                    "tidily",
                    "uply",
                    "authly",
                    "persistly",
                    "servly",
                    "servly-azure",
                    "smoothly",
                    "^\\u0000",
                    "^@?\\w",
                    "^",
                    "^\\.",
                ]],
            }],
        },
    },
]);
