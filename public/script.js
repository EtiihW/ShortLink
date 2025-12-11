// public/script.js

// Инициализация локальной статистики (теперь только как fallback)
const STATS_KEY = 'shortlinks_stats';
function initLocalStats() {
    if (!localStorage.getItem(STATS_KEY)) {
        localStorage.setItem(STATS_KEY, JSON.stringify({
            totalLinks: 0,
            totalClicks: 0
        }));
    }
}

// Загрузка РЕАЛЬНОЙ статистики с сервера
async function loadRealStats() {
    try {
        const response = await fetch('/api/stats');
        if (response.ok) {
            const data = await response.json();
            document.getElementById('totalLinks').textContent = data.totalLinks;
            document.getElementById('totalClicks').textContent = data.totalClicks;
            // Опционально: сохраняем в localStorage для оффлайн-показа
            localStorage.setItem(STATS_KEY, JSON.stringify(data));
        } else {
            throw new Error('Сервер статистики не ответил');
        }
    } catch (error) {
        console.warn('Не удалось загрузить статистику с сервера, показываем локальную:', error);
        // Fallback на локальные данные
        const localStats = JSON.parse(localStorage.getItem(STATS_KEY) || '{"totalLinks":0,"totalClicks":0}');
        document.getElementById('totalLinks').textContent = localStats.totalLinks;
        document.getElementById('totalClicks').textContent = localStats.totalClicks;
    }
}

// Генерация короткого кода (клиентская версия, 6 символов)
function generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Валидация URL
function isValidUrl(url) {
    try {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        new URL(url);
        return { isValid: true, url };
    } catch (error) {
        return { isValid: false, url: null };
    }
}

// Уведомления
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    notification.textContent = message;
    notification.style.background = type === 'success' ? '#48bb78' : '#f56565';
    notification.style.display = 'block';
    setTimeout(() => { notification.style.display = 'none'; }, 3000);
}

// ===== ОСНОВНОЙ КОД =====
document.addEventListener('DOMContentLoaded', function() {
    initLocalStats();
    loadRealStats(); // Загружаем реальную статистику!

    const shortenBtn = document.getElementById('shortenBtn');
    const longUrlInput = document.getElementById('longUrl');
    const resultCard = document.getElementById('resultCard');
    const originalUrlSpan = document.getElementById('originalUrl');
    const shortUrlLink = document.getElementById('shortUrl');
    const copyBtn = document.getElementById('copyBtn');
    const btnText = document.querySelector('.btn-text');
    const btnLoader = document.querySelector('.btn-loader');

    // Обработчик создания короткой ссылки
    shortenBtn.addEventListener('click', async function() {
        const url = longUrlInput.value.trim();
        if (!url) {
            showNotification('Пожалуйста, введите ссылку', 'error');
            return;
        }

        const validation = isValidUrl(url);
        if (!validation.isValid) {
            showNotification('Пожалуйста, введите корректную ссылку', 'error');
            return;
        }

        // UI: показываем загрузку
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        shortenBtn.disabled = true;

        try {
            const originalUrl = validation.url;
            const shortCode = generateShortCode();

            // ОТПРАВКА НА СЕРВЕР
            const response = await fetch('/api/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shortCode, originalUrl })
            });
const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Не удалось сохранить ссылку');
            }

            // ОБРАБОТКА УСПЕШНОГО ОТВЕТА
            const shortUrl = `${window.location.origin}/${result.shortCode}`;
            originalUrlSpan.textContent = originalUrl;
            shortUrlLink.textContent = shortUrl;
            shortUrlLink.href = shortUrl;
            resultCard.style.display = 'block';

            // Обновляем статистику на странице (перезапрашиваем с сервера)
            if (result.existed) {
                showNotification(`Эта ссылка уже была сокращена ранее! Код: ${result.shortCode}`, 'info');
            } else {
                showNotification('Ссылка успешно сокращена и сохранена!');
                // После создания новой ссылки обновляем общую статистику
                loadRealStats();
            }

            // Прокрутка к результату
            resultCard.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Ошибка:', error);
            showNotification(`Ошибка: ${error.message}`, 'error');
        } finally {
            // Восстанавливаем кнопку
            btnText.style.display = 'inline-block';
            btnLoader.style.display = 'none';
            shortenBtn.disabled = false;
        }
    });

    // Копирование ссылки
    copyBtn.addEventListener('click', function() {
        const shortUrl = shortUrlLink.textContent;
        navigator.clipboard.writeText(shortUrl).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Скопировано!';
            copyBtn.style.background = '#38a169';
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
            }, 2000);
            showNotification('Ссылка скопирована в буфер обмена!');
        }).catch(err => {
            console.error('Ошибка копирования:', err);
            showNotification('Не удалось скопировать ссылку', 'error');
        });
    });

    // Enter в поле ввода
    longUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') shortenBtn.click();
    });

    // Пример для теста (можно убрать)
    longUrlInput.value = 'https://example.com/очень-длинная-ссылка-для-примера';
});
