import { cn } from '@/shared/lib/utils';
import { RemoteImage } from '@/shared/ui/remote-image';

export function MasterAvatar({
	url,
	name,
	size = 32,
	className,
}: {
	url?: string;
	name?: string;
	size?: number;
	className?: string;
}) {
	const initials = (name ?? '?')
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(s => s[0]?.toUpperCase())
		.join('');
	return (
		<span
			className={cn(
				'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-semibold',
				className,
			)}
			style={{ width: size, height: size }}
		>
			{url ? (
				<RemoteImage eager src={url} alt='' className='size-full object-cover' />
			) : (
				initials || '?'
			)}
		</span>
	);
}
