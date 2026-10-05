// =====================================================================
// Teste de isolamento por usuário (B2C): cada aluno só vê o próprio perfil.
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

async function mkUser(email, name) {
  const { data, error } = await admin.auth.admin.createUser({
    email, password: PASSWORD, email_confirm: true, user_metadata: { name },
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
  s.a = await mkUser(s.emailA, 'Aluno A');
  s.b = await mkUser(s.emailB, 'Aluno B');
});

after(async () => {
  for (const id of [s.a, s.b]) {
    if (id) { try { await admin.auth.admin.deleteUser(id); } catch { /* */ } }
  }
});

test('O trigger criou o perfil ao cadastrar', async () => {
  const { data } = await admin.from('profiles').select('id, name').eq('id', s.a).maybeSingle();
  assert.ok(data, 'perfil de A deve existir');
  assert.equal(data.name, 'Aluno A');
});

test('Aluno A vê apenas o próprio perfil', async () => {
  const a = await signIn(s.emailA);
  const { data } = await a.from('profiles').select('id');
  assert.equal((data ?? []).length, 1, 'deve ver exatamente 1 perfil');
  assert.equal(data[0].id, s.a);
});

test('Aluno A NÃO vê o perfil de outro aluno (B)', async () => {
  const a = await signIn(s.emailA);
  const { data } = await a.from('profiles').select('id').eq('id', s.b);
  assert.equal((data ?? []).length, 0, 'não deve ver o perfil de B');
});

test('Aluno A NÃO consegue alterar o perfil de B', async () => {
  const a = await signIn(s.emailA);
  const { data } = await a.from('profiles').update({ name: 'INVADIDO' }).eq('id', s.b).select('id');
  assert.equal((data ?? []).length, 0, 'update no perfil de B não deve afetar nada');
  const { data: check } = await admin.from('profiles').select('name').eq('id', s.b).single();
  assert.notEqual(check.name, 'INVADIDO');
});
