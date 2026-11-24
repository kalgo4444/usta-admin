import Link from 'next/link';

export default function NotFound() {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center gap-4 text-center'>
			<p className='num text-[64px] leading-none font-normal tracking-[-1.6px]'>404</p>
			<Link
				href='/'
				className='rounded-pill bg-primary px-5 py-3 font-semibold text-primary-foreground'
			>
				Usta Admin
			</Link>
		</div>
	);
}
