import type { MetadataRoute } from 'next';

/** Private admin panel: keep every crawler out (backs up the `noindex` meta in layout). */
export default function robots(): MetadataRoute.Robots {
	return { rules: { userAgent: '*', disallow: '/' } };
}
