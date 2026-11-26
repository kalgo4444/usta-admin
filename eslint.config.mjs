import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';

/**
 * FSD import rules: `shared → entities → features → widgets → views → app`, downward only.
 * Other slices are imported through their `index.ts` public API; same-layer slices never
 * import each other (inside a slice, use relative imports). A later `no-restricted-imports`
 * block replaces an earlier one, so every layer block repeats the deep-import pattern.
 */
const SLICED = ['entities', 'features', 'widgets', 'views'];

const deepImports = {
	group: SLICED.map(layer => `@/${layer}/*/**`),
	message: 'Import from the slice public API (index.ts), e.g. `@/entities/catalog`.',
};

const forbidLayers = (layers, reason) => ({
	group: layers.flatMap(layer => [`@/${layer}`, `@/${layer}/**`]),
	message: reason,
});

const layerRule = (files, layers) => ({
	files,
	rules: {
		'no-restricted-imports': [
			'error',
			{
				patterns: [
					deepImports,
					forbidLayers(
						layers,
						'FSD: import only from lower layers; use relative imports inside a slice.',
					),
				],
			},
		],
	},
});

export default defineConfig([
	...nextVitals,
	...nextTs,
	{
		files: ['src/**/*.{ts,tsx}'],
		rules: { 'no-restricted-imports': ['error', { patterns: [deepImports] }] },
	},
	layerRule(['src/shared/**/*.{ts,tsx}'], ['entities', 'features', 'widgets', 'views', 'app']),
	layerRule(['src/entities/**/*.{ts,tsx}'], ['entities', 'features', 'widgets', 'views', 'app']),
	layerRule(['src/features/**/*.{ts,tsx}'], ['features', 'widgets', 'views', 'app']),
	layerRule(['src/widgets/**/*.{ts,tsx}'], ['widgets', 'views', 'app']),
	layerRule(['src/views/**/*.{ts,tsx}'], ['views', 'app']),
	globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'src/shared/api/schema.d.ts']),
]);
