/**
 * Only allow http(s) URLs (absolute, relative or protocol-relative) for backend-supplied
 * links — blocks `javascript:`, `data:` and other schemes in href. The dummy base only
 * makes relative URLs parseable; the original string is returned unchanged.
 */
export function safeHttpUrl(url: string | null | undefined): string | undefined {
	if (!url) return undefined;
	try {
		const { protocol } = new URL(url, 'http://relative.invalid');
		return protocol === 'https:' || protocol === 'http:' ? url : undefined;
	} catch {
		return undefined;
	}
}
