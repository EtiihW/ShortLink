import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // 1. Принимаем только POST-запросы
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Метод не разрешен' });
  }

  const { shortCode, originalUrl } = req.body;

  try {
    // 2. ПРОВЕРКА: Существует ли уже ТАКАЯ ЖЕ оригинальная ссылка?
    const { data: existingLink, error: searchError } = await supabase
      .from('short_links')
      .select('short_code, click_count') // Выбираем код и счётчик кликов
      .eq('original_url', originalUrl)
      .maybeSingle(); // Используем maybeSingle, чтобы не было ошибки если записи нет

    if (searchError) {
      console.error('Ошибка поиска ссылки:', searchError);
      throw new Error('Ошибка при проверке базы данных');
    }

    let finalShortCode = shortCode;

    // 3. Если ссылка уже существует — возвращаем её старый код
    if (existingLink) {
      console.log(`Ссылка уже существует с кодом: ${existingLink.short_code}`);
      finalShortCode = existingLink.short_code;
      // Можете вернуть флаг, чтобы фронтенд показал сообщение
      return res.status(200).json({
        success: true,
        shortCode: finalShortCode,
        existed: true,
        clickCount: existingLink.click_count || 0
      });
    }

    // 4. Если ссылки нет — сохраняем новую
    console.log(`Сохраняем новую ссылку: ${finalShortCode} -> ${originalUrl}`);
    const { data: newLink, error: insertError } = await supabase
      .from('short_links')
      .insert([
        {
          short_code: finalShortCode,
          original_url: originalUrl,
          click_count: 0, // Начальное значение счётчика
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertError) {
      // Если ошибка из-за дублирования кода (уже маловероятно, но на всякий случай)
      if (insertError.code === '23505') {
        // Генерируем новый код и пытаемся снова (можно сделать 2-3 попытки)
        const newCode = generateShortCode(); // Нужна функция generateShortCode
        // ... здесь можно повторить вставку с новым кодом
        return res.status(409).json({ error: 'Код уже занят, попробуйте ещё раз' });
      }
      console.error('Ошибка вставки:', insertError);
      throw new Error('Не удалось сохранить ссылку в БД');
    }

    // 5. Возвращаем успешный ответ
    res.status(200).json({
      success: true,
      shortCode: finalShortCode,
      existed: false,
      clickCount: 0
    });

  } catch (error) {
    console.error('Общая ошибка в api/create:', error);
    res.status(500).json({ error: error.message || 'Внутренняя ошибка сервера' });
  }
}

// Вспомогательная функция для генерации кода (если нужно)
function generateShortCode(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
