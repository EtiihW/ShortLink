// api/create.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Вспомогательная функция для генерации нового кода при конфликте
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

    try {
        // 1. ПРОВЕРКА: Есть ли уже такая оригинальная ссылка в БД?
        const { data: existingLink, error: searchError } = await supabase
            .from('short_links')
            .select('short_code, click_count')
            .eq('original_url', originalUrl)
            .maybeSingle(); // Важно: не вызывает ошибку, если записи нет

        if (searchError) {
            console.error('Ошибка при поиске дубликата:', searchError);
            throw new Error('Ошибка при проверке базы данных');
        }

        // 2. Если ссылка уже существует — возвращаем её код
        if (existingLink) {
            console.log(`URL уже существует, код: ${existingLink.short_code}`);
            return res.status(200).json({
                success: true,
                shortCode: existingLink.short_code,
                existed: true,
                clickCount: existingLink.click_count || 0
            });
        }

        // 3. Если ссылки нет — пытаемся вставить новую запись
        let saved = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!saved && attempts < maxAttempts) {
            const { error: insertError } = await supabase
                .from('short_links')
                .insert([{
                    short_code: shortCode,
                    original_url: originalUrl,
                    click_count: 0,
                    created_at: new Date().toISOString()
                }]);

            if (insertError) {
                // Код ошибки PostgreSQL для нарушения уникальности
                if (insertError.code === '23505') {
                    attempts++;
                    shortCode = generateShortCode(); // Генерируем новый код для повторной попытки
                    console.log(`Код занят, пробуем новый: ${shortCode}`);
                } else {
                    // Любая другая ошибка БД
                    console.error('Ошибка вставки в БД:', insertError);
                    throw new Error('Не удалось сохранить ссылку');
                }
            } else {
                saved = true;
            }
        }

        if (!saved) {
            throw new Error('Не удалось создать уникальную короткую ссылку после нескольких попыток');
        }

        // 4. Успех!
        res.status(200).json({
            success: true,
            shortCode: shortCode,
            existed: false,
            clickCount: 0
        });

    } catch (error) {
        console.error('Общая ошибка в api/create:', error);
        res.status(500).json({ error: error.message || 'Внутренняя ошибка сервера' });
    }
}
