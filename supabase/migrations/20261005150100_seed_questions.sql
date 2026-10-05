-- =====================================================================
-- 20261005150100_seed_questions
-- Banco inicial de questões CURADAS (origem: 'curated'). Questões objetivas,
-- claramente corretas, cobrindo as 4 áreas objetivas do ENEM.
-- O banco será expandido por IA (geração + curadoria) nas próximas etapas.
-- Idempotente (ON CONFLICT por code / por (question_id, label)).
-- =====================================================================

insert into public.questions (code, area_key, topic, difficulty, statement, source) values
  ('MAT-001', 'matematica', 'Porcentagem', 'facil', 'Quanto é 15% de 300?', 'curated'),
  ('MAT-002', 'matematica', 'Porcentagem', 'facil', 'Um produto que custa R$ 80,00 recebe um desconto de 25%. Qual é o preço final?', 'curated'),
  ('MAT-003', 'matematica', 'Geometria', 'facil', 'Qual é a área de um retângulo de base 8 cm e altura 5 cm?', 'curated'),
  ('LIN-001', 'linguagens', 'Semântica', 'facil', 'A conjunção "mas" expressa, tipicamente, ideia de:', 'curated'),
  ('LIN-002', 'linguagens', 'Semântica', 'medio', 'Qual é o antônimo (palavra de sentido oposto) de "efêmero"?', 'curated'),
  ('LIN-003', 'linguagens', 'Norma-padrão', 'medio', 'Assinale a frase escrita de acordo com a norma-padrão da língua portuguesa.', 'curated'),
  ('HUM-001', 'humanas', 'História do Brasil', 'facil', 'Em que ano foi proclamada a República no Brasil?', 'curated'),
  ('HUM-002', 'humanas', 'História do Brasil', 'facil', 'A Lei Áurea, que aboliu a escravidão no Brasil, foi assinada em que ano?', 'curated'),
  ('HUM-003', 'humanas', 'Geografia', 'facil', 'Qual é a capital federal do Brasil?', 'curated'),
  ('NAT-001', 'natureza', 'Química', 'facil', 'A molécula de água (H2O) é formada por quais elementos químicos?', 'curated'),
  ('NAT-002', 'natureza', 'Física', 'facil', 'No Sistema Internacional de Unidades, qual é a unidade de força?', 'curated'),
  ('NAT-003', 'natureza', 'Biologia', 'facil', 'Como se chama o processo pelo qual as plantas produzem seu próprio alimento utilizando a luz solar?', 'curated')
on conflict (code) do nothing;

insert into public.question_options (question_id, label, text, is_correct)
select q.id, v.label, v.text, v.is_correct
from public.questions q
join (values
  ('MAT-001','A','30',false),('MAT-001','B','45',true),('MAT-001','C','15',false),('MAT-001','D','50',false),('MAT-001','E','4,5',false),
  ('MAT-002','A','R$ 55,00',false),('MAT-002','B','R$ 60,00',true),('MAT-002','C','R$ 65,00',false),('MAT-002','D','R$ 20,00',false),('MAT-002','E','R$ 75,00',false),
  ('MAT-003','A','13 cm²',false),('MAT-003','B','26 cm²',false),('MAT-003','C','40 cm²',true),('MAT-003','D','80 cm²',false),('MAT-003','E','20 cm²',false),
  ('LIN-001','A','adição',false),('LIN-001','B','oposição',true),('LIN-001','C','conclusão',false),('LIN-001','D','causa',false),('LIN-001','E','tempo',false),
  ('LIN-002','A','passageiro',false),('LIN-002','B','breve',false),('LIN-002','C','duradouro',true),('LIN-002','D','fugaz',false),('LIN-002','E','raro',false),
  ('LIN-003','A','Faz dois anos que não o vejo.',true),('LIN-003','B','Fazem dois anos que não o vejo.',false),('LIN-003','C','Houveram muitos problemas.',false),('LIN-003','D','Entre eu e você não há segredos.',false),('LIN-003','E','Nós vai ao cinema hoje.',false),
  ('HUM-001','A','1822',false),('HUM-001','B','1888',false),('HUM-001','C','1889',true),('HUM-001','D','1891',false),('HUM-001','E','1930',false),
  ('HUM-002','A','1850',false),('HUM-002','B','1871',false),('HUM-002','C','1888',true),('HUM-002','D','1889',false),('HUM-002','E','1822',false),
  ('HUM-003','A','Rio de Janeiro',false),('HUM-003','B','São Paulo',false),('HUM-003','C','Brasília',true),('HUM-003','D','Goiânia',false),('HUM-003','E','Salvador',false),
  ('NAT-001','A','Hidrogênio e oxigênio',true),('NAT-001','B','Carbono e oxigênio',false),('NAT-001','C','Hidrogênio e carbono',false),('NAT-001','D','Nitrogênio e oxigênio',false),('NAT-001','E','Oxigênio e hélio',false),
  ('NAT-002','A','Joule',false),('NAT-002','B','Watt',false),('NAT-002','C','Newton',true),('NAT-002','D','Pascal',false),('NAT-002','E','Volt',false),
  ('NAT-003','A','Respiração',false),('NAT-003','B','Fotossíntese',true),('NAT-003','C','Transpiração',false),('NAT-003','D','Digestão',false),('NAT-003','E','Fermentação',false)
) as v(code, label, text, is_correct) on q.code = v.code
on conflict (question_id, label) do nothing;
