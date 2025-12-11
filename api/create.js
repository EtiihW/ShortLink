import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Разрешаем только POST-запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешен' });
  }

  const { shortCode, originalUrl } = req.body;

  // Вставляем новую запись в таблицу short_links [citation:3]
  const { data, error } = await supabase
    .from('short_links')
    .insert([
      { short_code: shortCode, original_url: originalUrl }
    ])
    .select();

  if (error) {
    console.error('Ошибка Supabase:', error);
    return res.status(500).json({ error: 'Не удалось сохранить ссылку в БД' });
  }

  res.status(200).json({ success: true, data });
}
