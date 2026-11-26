/**
 * `next dev|start` on PORT from the shell, .env.local or .env (default 4010). Next itself
 * can't take PORT from .env files: the HTTP server boots before they are loaded.
 */
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { parseEnv } from 'node:util';

const [command, ...args] = process.argv.slice(2);

// Only PORT is taken here; Next loads the rest with its own precedence rules.
const filePort = ['.env.local', '.env']
	.filter(file => existsSync(file))
	.map(file => parseEnv(readFileSync(file, 'utf8')).PORT)
	.find(Boolean);
const port = process.env.PORT || filePort || '4010';

const next = createRequire(import.meta.url).resolve('next/dist/bin/next');
// Extra args come last, so `npm run dev -- -p 5000` still wins.
const child = spawn(process.execPath, [next, command, '-p', port, ...args], { stdio: 'inherit' });

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('exit', code => process.exit(code ?? 0));
