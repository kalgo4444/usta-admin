'use client';

import { useState } from 'react';

/**
 * True from the first time `open` is true. Mount a lazily loaded dialog with it: its chunk
 * loads on first open, and it stays mounted afterwards so the close animation still plays.
 */
export function useOpenedOnce(open: boolean) {
	const [opened, setOpened] = useState(open);
	if (open && !opened) setOpened(true);
	return opened || open;
}
