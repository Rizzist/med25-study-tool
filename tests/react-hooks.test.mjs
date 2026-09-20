import assert from 'node:assert/strict';
import test from 'node:test';
import { ESLint } from 'eslint';
import { fileURLToPath } from 'node:url';

const eslint = new ESLint({ cwd: fileURLToPath(new URL('..', import.meta.url)) });
const hookErrors = results => results.flatMap(result => result.messages
  .filter(message => message.fatal || message.ruleId === 'react-hooks/rules-of-hooks')
  .map(message => `${result.filePath}:${message.line} ${message.message}`));

test('hook-order guard catches setup-only hooks skipped by active/review screens', async () => {
  const fixture = `import { useMemo } from 'react';
    export default function Practice({ phase }: { phase: string }) {
      if (phase === 'active') return <main>Question</main>;
      if (phase === 'review') return <main>Results</main>;
      const subjects = useMemo(() => new Map(), []);
      return <main>{subjects.size}</main>;
    }`;
  const result = await eslint.lintText(fixture, { filePath: 'app/hook-order-regression.tsx' });
  assert.equal(result.flatMap(r => r.messages).filter(m => m.ruleId === 'react-hooks/rules-of-hooks').length, 1);
});

test('application hooks run unconditionally across all screens and components', async () => {
  const errors = hookErrors(await eslint.lintFiles(['app', 'src']));
  assert.deepEqual(errors, [], errors.join('\n'));
});
