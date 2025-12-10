// База данных ссылок в localStorage
const DB_KEY = 'shortlinks_db';
const STATS_KEY = 'shortlinks_stats';

// Инициализация базы данных
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

// Генерация короткого кода
function generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Проверка валидности URL
function isValidUrl(url) {
    try {
        // Добавляем протокол если его нет
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        new URL(url);
        return { isValid: true, url };
    } catch (error) {
        return { isValid: false, url: null };
    }
}

// Сохранение ссылки в базу данных
function saveLink(originalUrl, shortCode) {
    const db = JSON.parse(localStorage.getItem(DB_KEY));
    const stats = JSON.parse(localStorage.getItem(STATS_KEY));
    
    db[shortCode] = {
        originalUrl,
        createdAt: new Date().toISOString(),
        clicks: 0
    };
    
    stats.totalLinks += 1;
    
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    
    return stats.totalLinks;
}

// Получение оригинальной ссылки
function getOriginalUrl(shortCode) {
    const db = JSON.parse(localStorage.getItem(DB_KEY));
    return db[shortCode];
}

// Увеличение счетчика кликов
function incrementClick(shortCode) {
    const db = JSON.parse(localStorage.getItem(DB_KEY));
    const stats = JSON.parse(localStorage.getItem(STATS_KEY));
    
    if (db[shortCode]) {
        db[shortCode].clicks += 1;
        stats.totalClicks += 1;
        
        localStorage.setItem(DB_KEY, JSON.stringify(db));
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
        
        return stats.totalClicks;
    }
    return null;
}

// Показ уведомления
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.background = type === 'success' ? '#48bb78' : '#f56565';
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Обновление статистики на странице
function updateStats() {
    const stats = JSON.parse(localStorage.getItem(STATS_KEY));
    document.getElementById('totalLinks').textContent = stats.totalLinks;
    document.getElementById('totalClicks').textContent = stats.totalClicks;
}

// Основная функция
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
        
        // Имитация задержки сети
        await new Promise(resolve => setTimeout(resolve, 800));
        
        try {
            const originalUrl = validation.url;
            const shortCode = generateShortCode();
            
            // Сохраняем в базу данных
            const totalLinks = saveLink(originalUrl, shortCode);
            
            // Формируем короткую ссылку
            const shortUrl = `${window.location.origin}/redirect.html?code=${shortCode}`;
            
            // Показываем результат
            originalUrlSpan.textContent = originalUrl;
            shortUrlLink.textContent = shortUrl;
            shortUrlLink.href = shortUrl;
            resultCard.style.display = 'block';
            
            // Обновляем статистику
            updateStats();
            
            // Скроллим к результату
            resultCard.scrollIntoView({ behavior: 'smooth' });
            
            showNotification('Ссылка успешно сокращена!');
            
        } catch (error) {
            showNotification('Ошибка при создании короткой ссылки', 'error');
            console.error('Error:', error);
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
    
});