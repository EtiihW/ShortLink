import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { shortCode } = req.query;

  // Ищем оригинальный URL в базе данных по short_code [citation:3]
  const { data, error } = await supabase
    .from('short_links')
    .select('original_url')
    .eq('short_code', shortCode)
    .single(); // Ожидаем одну запись

  if (error || !data) {
    return res.status(404).json({ error: 'Ссылка не найдена' });
  }

  // Делаем редирект на найденный URL
  res.redirect(301, data.original_url);
}
