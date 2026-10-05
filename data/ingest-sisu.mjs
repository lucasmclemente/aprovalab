// =====================================================================
// Ingestão de dados do SISU (notas de corte) para o Supabase.
//
// Fonte: repositório público KanegaeGabriel/sisu-data (dados públicos do SISU).
//   all_courses.csv -> instituições + ofertas de curso (vagas)
//   grades.csv      -> nota de corte (Ampla concorrência) por oferta
//
// Uso (nunca commitar segredos):
//   SUPABASE_URL=...  SUPABASE_SERVICE_ROLE_KEY=...  [YEAR=2025]  npm run ingest:sisu
// =====================================================================
import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const YEAR = Number(process.env.YEAR || 2025);
if (!URL || !SERVICE) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const BASE = `https://raw.githubusercontent.com/KanegaeGabriel/sisu-data/main/data/${YEAR}/scraping`;
const sb = createClient(URL, SERVICE, { auth: { persistSession: false } });

// --- parser CSV (delimitador ';', aspas '"') ---
function parseLine(line) {
  const fields = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ';') { fields.push(cur); cur = ''; }
    else cur += c;
  }
  fields.push(cur);
  return fields;
}

async function fetchCsv(name) {
  const res = await fetch(`${BASE}/${name}`);
  if (!res.ok) throw new Error(`Falha ao baixar ${name}: ${res.status}`);
  const text = await res.text();
  return text.split(/\r?\n/).filter((l) => l.trim().length).map(parseLine);
}

const num = (v) => {
  const n = Number(String(v).trim().replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const clean = (v) => String(v ?? '').trim();

async function upsertInBatches(table, rows, onConflict, size = 500) {
  for (let i = 0; i < rows.length; i += size) {
    const batch = rows.slice(i, i + size);
    const { error } = await sb.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

async function main() {
  console.log(`Baixando dados do SISU ${YEAR}...`);
  const courses = await fetchCsv('all_courses.csv');
  const grades = await fetchCsv('grades.csv');
  console.log(`  all_courses: ${courses.length} linhas | grades: ${grades.length} linhas`);

  // 1) Instituições (únicas por nome)
  const instByName = new Map();
  for (const r of courses) {
    const name = clean(r[1]);
    if (name && !instByName.has(name)) {
      instByName.set(name, { name, sigla: clean(r[2]) || null, uf: clean(r[0]) || null });
    }
  }
  const instRows = [...instByName.values()];
  console.log(`Inserindo ${instRows.length} instituições...`);
  await upsertInBatches('institutions', instRows, 'name');
  const { data: instData } = await sb.from('institutions').select('id, name');
  const instId = new Map((instData ?? []).map((i) => [i.name, i.id]));

  // 2) Ofertas de curso
  const offeringRows = courses.map((r) => ({
    sisu_id: clean(r[9]),
    year: YEAR,
    institution_id: instId.get(clean(r[1])) ?? null,
    course_name: clean(r[5]),
    degree: clean(r[6]) || null,
    shift: clean(r[7]) || null,
    campus: clean(r[4]) || null,
    city: clean(r[3]) || null,
    uf: clean(r[0]) || null,
    vagas: num(r[8]),
  })).filter((o) => o.sisu_id);
  console.log(`Inserindo ${offeringRows.length} ofertas de curso...`);
  await upsertInBatches('course_offerings', offeringRows, 'sisu_id,year');
  const { data: offData } = await sb
    .from('course_offerings')
    .select('id, sisu_id')
    .eq('year', YEAR);
  const offId = new Map((offData ?? []).map((o) => [o.sisu_id, o.id]));

  // 3) Notas de corte (Ampla concorrência) a partir do grades.csv
  const cutoffRows = [];
  for (const r of grades) {
    const sisuId = clean(r[0]);
    const oid = offId.get(sisuId);
    if (!oid) continue;
    const idx = r.findIndex((f) => clean(f) === 'Ampla concorrência');
    if (idx === -1) continue;
    const vagas = num(r[idx + 1]);
    const score = num(r[idx + 2]);
    if (score === null) continue;
    cutoffRows.push({ offering_id: oid, year: YEAR, modalidade: 'Ampla concorrência', score, vagas });
  }
  console.log(`Inserindo ${cutoffRows.length} notas de corte...`);
  await upsertInBatches('cutoffs', cutoffRows, 'offering_id,modalidade,year');

  console.log('✔ Ingestão concluída.');
}

main().catch((e) => {
  console.error('✖ Erro:', e.message);
  process.exit(1);
});
