// api/redirect.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { shortCode } = req.query;

  try {
    // 1. Находим ссылку
    const { data: link, error: findError } = await supabase
      .from('short_links')
      .select('original_url, click_count')
      .eq('short_code', shortCode)
      .single();

    if (findError || !link) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }

    // 2. УВЕЛИЧИВАЕМ СЧЁТЧИК ПЕРЕХОДОВ
    const { error: updateError } = await supabase
      .from('short_links')
      .update({ click_count: (link.click_count || 0) + 1 })
      .eq('short_code', shortCode);

    if (updateError) {
      console.error('Ошибка обновления счётчика:', updateError);
      // НЕ прерываем редирект, просто логируем ошибку
    }

    // 3. Делаем редирект
    res.redirect(301, link.original_url);

  } catch (error) {
    console.error('Ошибка в redirect:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
}
