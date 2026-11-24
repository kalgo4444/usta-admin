import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
	/* config options here */
	output: 'standalone',
	cacheComponents: true,
	partialPrefetching: true,
	reactCompiler: true,
	async headers() {
		return [
			{
				source: '/:path*',
				headers: [
					{ key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'Referrer-Policy', value: 'same-origin' },
				],
			},
		];
	},
	turbopack: {
		rules: {
			'*.css': {
				loaders: ['@tailwindcss/turbopack'],
				as: '*.css',
			},
		},
	},
};

export default nextConfig;
