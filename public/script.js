// public/script.js

// База данных в localStorage (теперь используется только для статистики на главной, не для хранения ссылок)
const DB_KEY = 'shortlinks_stats';
const STATS_KEY = 'shortlinks_stats';

function initDatabase() {
    if (!localStorage.getItem(DB_KEY)) {
        localStorage.setItem(DB_KEY, JSON.stringify({}));
    }
    if (!localStorage.getItem(STATS_KEY)) {
        localStorage.setItem(STATS_KEY, JSON.stringify({
            totalLinks: 0,
            totalClicks: 0
        }));
    }
}

function generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

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

function updateStats() {
    const stats = JSON.parse(localStorage.getItem(STATS_KEY));
    document.getElementById('totalLinks').textContent = stats.totalLinks;
    document.getElementById('totalClicks').textContent = stats.totalClicks;
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.background = type === 'success' ? '#48bb78' : '#f56565';
    notification.style.display = 'block';
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// ===== ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    initDatabase();
    updateStats();
    
    const shortenBtn = document.getElementById('shortenBtn');
    const longUrlInput = document.getElementById('longUrl');
    const resultCard = document.getElementById('resultCard');
    const originalUrlSpan = document.getElementById('originalUrl');
    const shortUrlLink = document.getElementById('shortUrl');
    const copyBtn = document.getElementById('copyBtn');
    const btnText = document.querySelector('.btn-text');
    const btnLoader = document.querySelector('.btn-loader');
    
    // Функция сокращения ссылки
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
        
        // Показываем загрузку
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline-block';
        shortenBtn.disabled = true;
        
        try {
            const originalUrl = validation.url;
            const shortCode = generateShortCode();
            
            // ---- ОТПРАВКА ДАННЫХ НА СЕРВЕР ДЛЯ СОХРАНЕНИЯ В БД ----
            const response = await fetch('/api/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    shortCode: shortCode,
                    originalUrl: originalUrl
                })
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || 'Не удалось сохранить ссылку');
            }
            // ---- КОНЕЦ ОТПРАВКИ ДАННЫХ ----
            
            // Если сохранение успешно, показываем результат
            const shortUrl = `${window.location.origin}/${shortCode}`;
            
            // Обновляем интерфейс
            originalUrlSpan.textContent = originalUrl;
            shortUrlLink.textContent = shortUrl;
            shortUrlLink.href = shortUrl;
            resultCard.style.display = 'block';
            
            // Обновляем локальную статистику (только для отображения на главной)
            const stats = JSON.parse(localStorage.getItem(STATS_KEY));
            stats.totalLinks += 1;
            localStorage.setItem(STATS_KEY, JSON.stringify(stats));
            updateStats();
            
            // Скроллим к результату
            resultCard.scrollIntoView({ behavior: 'smooth' });
            
            showNotification('Ссылка успешно сокращена и сохранена!');
            
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification(Ошибка: ${error.message}, 'error');
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
            // Временно меняем текст кнопки
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
    
    // Поддержка клавиши Enter
    longUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            shortenBtn.click();
        }
    });
    
    // Пример ссылки для тестирования
    longUrlInput.value = 'https://example.com/очень-длинная-ссылка-для-примера';
});
