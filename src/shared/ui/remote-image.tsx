/**
 * Image from a presigned, expiring storage URL. Plain `<img>` on purpose: `next/image`
 * would cache the optimised file under a URL that stops working. Lazy by default; pass
 * `eager` for an image that is on screen as soon as it mounts.
 */
export function RemoteImage({
	alt = '',
	eager,
	...props
}: React.ComponentProps<'img'> & { eager?: boolean }) {
	return (
		// eslint-disable-next-line @next/next/no-img-element -- presigned URL, see above
		<img alt={alt} loading={eager ? 'eager' : 'lazy'} decoding='async' {...props} />
	);
}
