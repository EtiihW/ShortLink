// Файл: api/redirect.js
export default function handler(req, res) {
  // 1. Получаем короткий код из запроса
  //    Если пользователь зашел на your-site.vercel.app/abc123,
  //    то req.query.shortCode будет равно "abc123"
  const { shortCode } = req.query;

  // 2. Простая "база данных" в памяти (ДЛЯ ТЕСТА!)
  //    В реальном проекте здесь нужно подключиться к настоящей БД
  const linkDatabase = {
    'test': 'https://example.com',
    'google': 'https://google.com'
  };

  // 3. Ищем оригинальную ссылку по коду
  const originalUrl = linkDatabase[shortCode];

  // 4. Если нашли — делаем редирект, если нет — показываем 404
  if (originalUrl) {
    res.redirect(308, originalUrl); // 308 — permanent redirect
  } else {
    res.status(404).send('Ссылка не найдена');
  }
}
