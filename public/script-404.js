document.addEventListener('DOMContentLoaded', function() {
    // Загрузка статистики
    loadStats();
    
    // Инициализация поиска
    initSearch();
    
    // Подсчет активных ссылок
    countActiveLinks();
});

// Загрузка статистики из localStorage
function loadStats() {
    try {
        const stats = JSON.parse(localStorage.getItem('shortlinks_stats') || '{"totalLinks":0,"totalClicks":0}');
        document.getElementById('totalLinks').textContent = stats.totalLinks;
        document.getElementById('totalClicks').textContent = stats.totalClicks;
    } catch (e) {
        console.error('Ошибка загрузки статистики:', e);
        document.getElementById('totalLinks').textContent = '0';
        document.getElementById('totalClicks').textContent = '0';
    }
}

// Подсчет активных ссылок
function countActiveLinks() {
    try {
        const db = JSON.parse(localStorage.getItem('shortlinks_db') || '{}');
        const activeLinks = Object.keys(db).length;
        document.getElementById('activeLinks').textContent = activeLinks;
    } catch (e) {
        console.error('Ошибка подсчета ссылок:', e);
        document.getElementById('activeLinks').textContent = '0';
    }
}

// Инициализация поиска
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.querySelector('.search-box button');
    
    if (searchInput) {
        // Поиск по Enter
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
        
        // Поиск по клику на кнопку
        if (searchButton) {
            searchButton.addEventListener('click', performSearch);
        }
        
        // Автофокус на поле поиска
        setTimeout(() => {
            searchInput.focus();
        }, 500);
    }
}

// Выполнение поиска
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    
    if (!query) {
        // Если поле пустое, просто перенаправляем на главную
        window.location.href = 'index.html';
        return;
    }
    
    // Сохраняем поисковый запрос в localStorage для отображения на главной
    localStorage.setItem('lastSearchQuery', query);
    
    // Перенаправляем на главную с параметром поиска
    window.location.href = `index.html?search=${encodeURIComponent(query)}`;
}

// Показ уведомления
function showNotification(message, type = 'info') {
    // Создаем уведомление если его нет
    let notification = document.getElementById('custom-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'custom-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            color: white;
            font-weight: 500;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 1000;
            display: none;
            `
        ;
        document.body.appendChild(notification);
    }
    
    // Устанавливаем стиль в зависимости от типа
    const colors = {
        success: '#48bb78',
        error: '#f56565',
        info: '#4299e1',
        warning: '#ed8936'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    notification.style.display = 'block';
    
    // Скрываем через 3 секунды
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// CSS анимация для уведомлений
const style = document.createElement('style');
style.textContent = `
    @ keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }`
;
document.head.appendChild(style);