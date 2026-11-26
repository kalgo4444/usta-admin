import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Header-based CSP without nonces: nonces force dynamic rendering and are incompatible with
 * PPR (see Next's CSP guide), so inline scripts stay allowed and everything else is locked
 * down. All API calls go through the same-origin proxy; presigned media come from https.
 */
const csp = [
	"default-src 'self'",
	`script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
	"style-src 'self' 'unsafe-inline'",
	"img-src 'self' data: blob: https:",
	"media-src 'self' blob: https:",
	"font-src 'self'",
	"connect-src 'self'",
	'frame-src https://www.openstreetmap.org',
	"object-src 'none'",
	"base-uri 'self'",
	"form-action 'self'",
	"frame-ancestors 'none'",
	...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

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
					{ key: 'Content-Security-Policy', value: csp },
					{ key: 'X-Content-Type-Options', value: 'nosniff' },
					{ key: 'Referrer-Policy', value: 'same-origin' },
					{
						key: 'Permissions-Policy',
						value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
					},
					...(process.env.NODE_ENV === 'production'
						? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000' }]
						: []),
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
