// api/stats.js
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  try {
    // Получаем общее количество ссылок
    const { count: totalLinks, error: countError } = await supabase
      .from('short_links')
      .select('*', { count: 'exact', head: true });

    // Получаем общее количество кликов (сумма по всем строкам)
    const { data: links, error: sumError } = await supabase
      .from('short_links')
      .select('click_count');

    let totalClicks = 0;
    if (links) {
      totalClicks = links.reduce((sum, link) => sum + (link.click_count || 0), 0);
    }

    if (countError || sumError) {
      throw new Error('Ошибка получения статистики');
    }

    res.status(200).json({
      totalLinks: totalLinks || 0,
      totalClicks: totalClicks
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
