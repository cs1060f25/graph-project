import { defineConfig } from 'vitest/config';
export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['**/*.test.ts'],
        exclude: ['node_modules', 'dist'],
    },
    resolve: {
        alias: {
            '^(\\.{1,2}/.*)\\.js$': '$1',
        },
    },
});
//# sourceMappingURL=vitest.config.js.map