
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    try {
        const { count: totalLinks, error: countError } = await supabase
            .from('short_links')
            .select('*', { count: 'exact', head: true });

        const { data: allLinks, error: linksError } = await supabase
            .from('short_links')
            .select('click_count');

        let totalClicks = 0;
        if (allLinks && !linksError) {
            totalClicks = allLinks.reduce((sum, link) => sum + (link.click_count || 0), 0);
        }

        if (countError || linksError) {
            console.error('Ошибки при получении статистики:', { countError, linksError });
        }

        res.status(200).json({
            totalLinks: totalLinks || 0,
            totalClicks: totalClicks
        });

    } catch (error) {
        console.error('Критическая ошибка в api/stats:', error);
        res.status(500).json({
            totalLinks: 0,
            totalClicks: 0,
            error: 'Не удалось загрузить статистику'
        });
    }
}
