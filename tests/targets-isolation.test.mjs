// =====================================================================
// Teste de isolamento das METAS do aluno (student_targets).
// Cada aluno só vê/edita as próprias metas; o catálogo é legível por todos.
// =====================================================================
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !ANON || !SERVICE) {
  console.error('Defina SUPABASE_URL, SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
const rand = Math.random().toString(36).slice(2, 7);
const PASSWORD = 'Teste-' + rand + '-123!';
const s = {};

async function mkUser(email) {
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true, user_metadata: { name: 'QA' },
  });
  assert.equal(error, null, `user ${email}: ${error?.message}`);
  return data.user.id;
}
async function signIn(email) {
  const c = createClient(URL, ANON, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  assert.equal(error, null, `login ${email}: ${error?.message}`);
  return c;
}

before(async () => {
  s.emailA = `qa.a.${rand}@aprovalab.dev`;
  s.emailB = `qa.b.${rand}@aprovalab.dev`;
  s.a = await mkUser(s.emailA);
  s.b = await mkUser(s.emailB);
  // pega 2 ofertas reais do catálogo
  const { data } = await admin.from('course_offerings').select('id').limit(2);
  s.off1 = data?.[0]?.id;
  s.off2 = data?.[1]?.id;
  assert.ok(s.off1 && s.off2, 'precisa de ofertas no catálogo (rode a ingestão antes)');
});

after(async () => {
  for (const id of [s.a, s.b]) {
    if (id) { try { await admin.auth.admin.deleteUser(id); } catch { /* */ } }
  }
});

test('Catálogo é legível por qualquer aluno autenticado', async () => {
  const a = await signIn(s.emailA);
  const { data, error } = await a.from('course_offerings').select('id').limit(1);
  assert.equal(error, null);
  assert.ok((data ?? []).length === 1, 'aluno deve conseguir ler o catálogo');
});

test('Aluno A salva uma meta e a vê; aluno B NÃO vê', async () => {
  const a = await signIn(s.emailA);
  const { error } = await a.from('student_targets').insert({ user_id: s.a, offering_id: s.off1 });
  assert.equal(error, null, `A deveria salvar meta: ${error?.message}`);

  const { data: aList } = await a.from('student_targets').select('offering_id');
  assert.ok((aList ?? []).some((t) => t.offering_id === s.off1), 'A deve ver a própria meta');

  const b = await signIn(s.emailB);
  const { data: bList } = await b.from('student_targets').select('offering_id');
  assert.equal((bList ?? []).length, 0, 'B não deve ver metas de A');
});

test('Aluno A NÃO consegue criar meta em nome de outro (B)', async () => {
  const a = await signIn(s.emailA);
  const { error } = await a.from('student_targets').insert({ user_id: s.b, offering_id: s.off2 });
  assert.ok(error, 'não deve permitir salvar meta com user_id de outro');
});
