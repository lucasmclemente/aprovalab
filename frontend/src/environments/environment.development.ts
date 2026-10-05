// Ambiente de DESENVOLVIMENTO.
// A URL é pública; a "anon key" também é publicável (protegida por RLS no banco).
// NUNCA coloque a service_role key aqui — ela só vive em Edge Functions.
export const environment = {
  production: false,
  supabaseUrl: 'https://kkjenldkhldxwkqtqdcz.supabase.co',
  supabaseAnonKey: 'sb_publishable_ggtrO8H25z0qBSFJd9O-5w__yVfKRpe',
};
