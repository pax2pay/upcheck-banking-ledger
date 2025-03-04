import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		typecheck: { tsconfig: "./tsconfig.json" },
		globals: true,
		include: ["**/*.spec.[tj]s"],
		testTimeout: 20000,
		isolate: false,
		exclude: ["node_modules", "dist"],
		server: { deps: { inline: true } },
	},
})
