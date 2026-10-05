// Runner: executa cada *.test.mjs em seu PRÓPRIO processo (evita interferência
// do lock de auth do supabase-js entre muitos logins no mesmo processo).
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const files = readdirSync(new URL('.', import.meta.url))
  .filter((f) => f.endsWith('.test.mjs'))
  .sort();

let total = 0;
let pass = 0;
let fail = 0;

for (const file of files) {
  const res = spawnSync(process.execPath, ['--test', file], { encoding: 'utf8' });
  const out = (res.stdout || '') + (res.stderr || '');
  const num = (re) => Number((out.match(re) || [])[1] || 0);
  const t = num(/\btests (\d+)/);
  const p = num(/\bpass (\d+)/);
  const f = num(/\bfail (\d+)/);
  total += t;
  pass += p;
  fail += f;
  console.log(`${f > 0 ? '✖' : '✔'} ${file} — tests:${t} pass:${p} fail:${f}`);
}

console.log('='.repeat(40));
console.log(`TOTAL: ${total} | PASS: ${pass} | FAIL: ${fail}`);
process.exit(fail > 0 ? 1 : 0);
