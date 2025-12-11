import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешен' });
  }
  const { shortCode, originalUrl } = req.body;
  const { data, error } = await supabase
    .from('short_links')
    .insert([{ short_code: shortCode, original_url: originalUrl }]);
  if (error) {
    return res.status(500).json({ error: 'Ошибка базы данных' });
  }
  res.status(200).json({ success: true });
}
