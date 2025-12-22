
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


function generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Метод не разрешен' });
    }

    let { shortCode, originalUrl } = req.body;
    console.log('Начало обработки запроса. Код:', shortCode, 'URL:', originalUrl);

    try {
        console.log('Проверяем, существует ли уже URL...');
        const { data: existingLink, error: searchError } = await supabase
            .from('short_links')
            .select('short_code')
            .eq('original_url', originalUrl)
            .maybeSingle();

        if (searchError) {
            console.error('Ошибка при поиске дубликата:', JSON.stringify(searchError));
            throw new Error('Ошибка при проверке базы данных');
        }

        if (existingLink) {
            console.log('URL уже существует, его код:', existingLink.short_code);
            return res.status(200).json({
                success: true,
                shortCode: existingLink.short_code,
                existed: true
            });
        }

        let saved = false;
        let attempts = 0;
        const maxAttempts = 3;

        console.log('URL новый. Пытаемся сохранить...');
        while (!saved && attempts < maxAttempts) {
            const { error: insertError } = await supabase
                .from('short_links')
                .insert([{
                    short_code: shortCode,
                    original_url: originalUrl,
                    click_count: 0
                }]);

            if (insertError) {
                // Код ошибки PostgreSQL для нарушения уникальности (код уже занят)
                if (insertError.code === '23505') {
                    console.log(`Код "${shortCode}" уже занят. Генерируем новый...`);
                    attempts++;
                    shortCode = generateShortCode();
                } else {
                    // ЛЮБАЯ ДРУГАЯ ОШИБКА БД (например, нет столбца, синтаксис)
                    console.error('КРИТИЧЕСКАЯ Ошибка вставки в БД:', JSON.stringify(insertError, null, 2));
                    throw new Error(`Ошибка базы данных: ${insertError.message || 'Неизвестная ошибка'}`);
                }
            } else {
                saved = true;
                console.log('Ссылка успешно сохранена с кодом:', shortCode);
            }
        }

        if (!saved) {
            throw new Error('Не удалось создать уникальную короткую ссылку после нескольких попыток');
        }


        res.status(200).json({
            success: true,
            shortCode: shortCode,
            existed: false
        });

    } catch (error) {
        console.error('Общая ошибка в api/create:', error.message);
        res.status(500).json({ 
            error: 'Не удалось сохранить ссылку',
            details: error.message 
        });
    }
}
