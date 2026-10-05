// =====================================================================
// Teste do fluxo do simulado diagnóstico + proteção do gabarito.
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

before(async () => {
  s.email = `qa.${rand}@aprovalab.dev`;
  const { data, error } = await admin.auth.admin.createUser({
    email: s.email, password: PASSWORD, email_confirm: true, user_metadata: { name: 'QA' },
  });
  assert.equal(error, null, error?.message);
  s.uid = data.user.id;
  s.user = createClient(URL, ANON, { auth: { persistSession: false } });
  const { error: e2 } = await s.user.auth.signInWithPassword({ email: s.email, password: PASSWORD });
  assert.equal(e2, null, e2?.message);
});

after(async () => {
  if (s.uid) { try { await admin.auth.admin.deleteUser(s.uid); } catch { /* */ } }
});

test('Inicia o diagnóstico e recebe questões SEM o gabarito', async () => {
  const { data: sim, error } = await s.user.rpc('start_diagnostic');
  assert.equal(error, null, `start_diagnostic: ${error?.message}`);
  s.sim = sim;
  const { data: qs, error: e2 } = await s.user.rpc('get_simulado', { p_simulado: s.sim });
  assert.equal(e2, null, `get_simulado: ${e2?.message}`);
  assert.ok(Array.isArray(qs) && qs.length >= 4, 'deve retornar questões');
  s.questions = qs;
  // nenhuma opção pode conter is_correct
  const leaked = qs.some((q) => (q.options ?? []).some((o) => 'is_correct' in o));
  assert.equal(leaked, false, 'o gabarito NÃO pode vir no get_simulado');
});

test('O cliente NÃO consegue ler o gabarito direto (RLS)', async () => {
  const { data } = await s.user.from('question_options').select('is_correct').limit(1);
  assert.equal((data ?? []).length, 0, 'question_options não deve ser legível pelo cliente');
});

test('Respondendo tudo certo, a nota é 100', async () => {
  // o teste (admin) descobre o gabarito para montar as respostas corretas
  const answers = [];
  for (const q of s.questions) {
    const { data } = await admin
      .from('question_options')
      .select('label')
      .eq('question_id', q.question_id)
      .eq('is_correct', true)
      .single();
    answers.push({ question_id: q.question_id, label: data.label });
  }
  const { data: res, error } = await s.user.rpc('submit_simulado', {
    p_simulado: s.sim,
    p_answers: answers,
  });
  assert.equal(error, null, `submit: ${error?.message}`);
  assert.equal(res.total, s.questions.length);
  assert.equal(res.correct, s.questions.length);
  assert.equal(Number(res.score), 100);
  for (const acc of Object.values(res.by_area)) assert.equal(Number(acc), 100);
});

test('Não consigo corrigir o simulado de outro usuário', async () => {
  // cria outro usuário e tenta submeter no simulado de A
  const email2 = `qa.b.${rand}@aprovalab.dev`;
  const { data: u2 } = await admin.auth.admin.createUser({
    email: email2, password: PASSWORD, email_confirm: true,
  });
  s.uid2 = u2.user.id;
  const other = createClient(URL, ANON, { auth: { persistSession: false } });
  await other.auth.signInWithPassword({ email: email2, password: PASSWORD });
  const { error } = await other.rpc('submit_simulado', { p_simulado: s.sim, p_answers: [] });
  assert.ok(error, 'não deve corrigir simulado alheio');
  await admin.auth.admin.deleteUser(s.uid2);
});
