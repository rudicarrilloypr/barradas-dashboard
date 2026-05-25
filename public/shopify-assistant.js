(function () {
  if (window.__barradasShopifyAssistantLoaded) return;
  window.__barradasShopifyAssistantLoaded = true;

  var script =
    document.currentScript ||
    Array.prototype.find.call(document.scripts, function (item) {
      return item.src && item.src.indexOf('shopify-assistant.js') !== -1;
    });

  var scriptUrl = script && script.src ? new URL(script.src) : null;
  var baseUrl = scriptUrl ? scriptUrl.origin : window.location.origin;
  var apiUrl =
    (script && script.dataset.assistantApi) ||
    baseUrl + '/api/shopify-assistant';
  var storeName = (script && script.dataset.storeName) || 'Barradas';
  var assistantName = (script && script.dataset.assistantName) || 'Barry';
  var accent = (script && script.dataset.accent) || '#2563eb';
  var advisorUrl = (script && script.dataset.advisorUrl) || '';
  var mascotUrl =
    (script && script.dataset.mascotUrl) || baseUrl + '/barry-avatar.png';
  var host = document.createElement('div');

  host.id = 'barradas-shopify-assistant';
  document.body.appendChild(host);

  var shadow = host.attachShadow({ mode: 'open' });
  var isOpen = false;
  var isLoading = false;
  var messages = [
    {
      role: 'assistant',
      text:
        'Hola, soy ' +
        assistantName +
        ', el asistente de ' +
        storeName +
        '. Dime que estas buscando y te muestro opciones.',
      products: [],
    },
  ];

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function productTemplate(product) {
    var title = escapeHtml(product.title);
    var type = escapeHtml(product.productType || 'Producto');
    var stock = escapeHtml(product.stockStatus || 'Disponibilidad por revisar');
    var price = escapeHtml(product.formattedPrice || 'Precio por confirmar');
    var image = product.image
      ? '<img src="' + escapeHtml(product.image) + '" alt="">'
      : '<span>Sin imagen</span>';
    var href = product.url ? escapeHtml(product.url) : '#';

    return (
      '<a class="ba-product" href="' +
      href +
      '" target="_blank" rel="noopener noreferrer">' +
      '<div class="ba-product-image">' +
      image +
      '</div>' +
      '<div class="ba-product-body">' +
      '<div class="ba-product-title">' +
      title +
      '</div>' +
      '<div class="ba-product-meta">' +
      type +
      ' &middot; ' +
      stock +
      '</div>' +
      '<div class="ba-product-price">' +
      price +
      '</div>' +
      '</div>' +
      '</a>'
    );
  }

  function handoffTemplate(handoff) {
    if (!handoff || !handoff.recommended) return '';

    var url = handoff.url || advisorUrl;
    var label = escapeHtml(handoff.label || 'Hablar con asesor');

    if (url) {
      return (
        '<a class="ba-advisor" href="' +
        escapeHtml(url) +
        '" target="_blank" rel="noopener noreferrer">' +
        label +
        '</a>'
      );
    }

    return (
      '<div class="ba-advisor-note">' +
      'Falta configurar el WhatsApp o link del asesor para activar este boton.' +
      '</div>'
    );
  }

  function messageTemplate(message) {
    var products = (message.products || []).map(productTemplate).join('');
    var handoff = handoffTemplate(message.handoff);
    var avatar =
      message.role === 'assistant'
        ? '<img class="ba-avatar" src="' +
          escapeHtml(mascotUrl) +
          '" alt="' +
          escapeHtml(assistantName) +
          '">'
        : '';

    return (
      '<div class="ba-row ba-row-' +
      message.role +
      '">' +
      avatar +
      '<div class="ba-message ba-message-' +
      message.role +
      '">' +
      '<div>' +
      escapeHtml(message.text) +
      '</div>' +
      (products ? '<div class="ba-products">' + products + '</div>' : '') +
      handoff +
      '</div>' +
      '</div>'
    );
  }

  function render() {
    shadow.innerHTML =
      '<style>' +
      ':host{all:initial;--ba-accent:' +
      accent +
      ';font-family:Arial,Helvetica,sans-serif;color:#0f172a}' +
      '.ba-wrap{position:fixed;right:20px;bottom:20px;z-index:2147483000}' +
      '.ba-button{display:flex;align-items:center;gap:9px;height:58px;border:0;border-radius:999px;background:var(--ba-accent);color:#fff;padding:0 18px 0 8px;font:700 14px Arial;box-shadow:0 14px 35px rgba(15,23,42,.24);cursor:pointer}' +
      '.ba-button img{width:44px;height:44px;border-radius:50%;background:#fff}' +
      '.ba-panel{width:min(390px,calc(100vw - 28px));height:min(640px,calc(100vh - 92px));background:#fff;border:1px solid #dbe3ef;border-radius:14px;box-shadow:0 22px 60px rgba(15,23,42,.26);overflow:hidden;display:flex;flex-direction:column}' +
      '.ba-head{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#0f172a;color:#fff;padding:13px 14px}' +
      '.ba-brand{display:flex;align-items:center;gap:10px;min-width:0}' +
      '.ba-head-mascot{width:48px;height:48px;border-radius:50%;background:#fff;object-fit:cover;flex:0 0 auto}' +
      '.ba-title{font:700 14px Arial}.ba-subtitle{margin-top:3px;color:#cbd5e1;font:400 12px Arial}' +
      '.ba-close{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:transparent;color:#fff;font:700 18px Arial;cursor:pointer}' +
      '.ba-log{flex:1;overflow-y:auto;background:#f8fafc;padding:14px;display:flex;flex-direction:column;gap:12px}' +
      '.ba-row{display:flex;align-items:flex-end;gap:8px}.ba-row-user{justify-content:flex-end}.ba-row-assistant{justify-content:flex-start}' +
      '.ba-avatar{width:30px;height:30px;border-radius:50%;background:#fff;border:1px solid #e2e8f0;flex:0 0 auto}' +
      '.ba-message{max-width:82%;border-radius:14px;padding:10px 12px;font:400 14px/1.4 Arial;word-break:break-word}' +
      '.ba-message-user{background:var(--ba-accent);color:#fff;border-bottom-right-radius:4px}' +
      '.ba-message-assistant{background:#fff;color:#111827;border:1px solid #e2e8f0;border-bottom-left-radius:4px}' +
      '.ba-products{display:flex;flex-direction:column;gap:8px;margin-top:10px}' +
      '.ba-product{display:flex;gap:10px;padding:9px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;color:inherit;text-decoration:none}' +
      '.ba-product:hover{border-color:var(--ba-accent)}' +
      '.ba-product-image{width:58px;height:58px;border-radius:8px;overflow:hidden;background:#e2e8f0;display:flex;align-items:center;justify-content:center;flex:0 0 auto;color:#64748b;font:400 10px Arial;text-align:center}' +
      '.ba-product-image img{width:100%;height:100%;object-fit:cover;display:block}' +
      '.ba-product-body{min-width:0}.ba-product-title{font:700 13px/1.25 Arial;color:#0f172a;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
      '.ba-product-meta{margin-top:4px;font:400 11px/1.25 Arial;color:#64748b}.ba-product-price{margin-top:5px;font:700 13px Arial;color:#166534}' +
      '.ba-advisor{display:block;margin-top:10px;border-radius:10px;background:#16a34a;color:#fff;text-align:center;text-decoration:none;padding:10px 12px;font:700 13px Arial}' +
      '.ba-advisor-note{margin-top:10px;border-radius:10px;background:#fef3c7;color:#92400e;padding:9px 10px;font:600 12px/1.35 Arial}' +
      '.ba-chips{display:flex;gap:7px;overflow-x:auto;padding:10px 12px;border-top:1px solid #e2e8f0;background:#fff}' +
      '.ba-chip{white-space:nowrap;border:1px solid #cbd5e1;border-radius:999px;background:#fff;color:#334155;padding:7px 10px;font:600 12px Arial;cursor:pointer}' +
      '.ba-form{display:flex;gap:8px;padding:12px;border-top:1px solid #e2e8f0;background:#fff}' +
      '.ba-input{flex:1;min-width:0;border:1px solid #cbd5e1;border-radius:10px;padding:10px 11px;font:400 14px Arial;color:#0f172a;outline:none}' +
      '.ba-input:focus{border-color:var(--ba-accent);box-shadow:0 0 0 3px rgba(37,99,235,.13)}' +
      '.ba-send{border:0;border-radius:10px;background:var(--ba-accent);color:#fff;padding:0 13px;font:700 13px Arial;cursor:pointer}' +
      '.ba-send:disabled{opacity:.55;cursor:not-allowed}' +
      '@media(max-width:480px){.ba-wrap{right:12px;bottom:12px}.ba-panel{width:calc(100vw - 24px);height:calc(100vh - 80px)}}' +
      '</style>' +
      '<div class="ba-wrap">' +
      (isOpen ? panelTemplate() : buttonTemplate()) +
      '</div>';

    bindEvents();
    scrollToBottom();
  }

  function buttonTemplate() {
    return (
      '<button class="ba-button" type="button" aria-label="Abrir asistente ' +
      escapeHtml(assistantName) +
      '">' +
      '<img src="' +
      escapeHtml(mascotUrl) +
      '" alt="">' +
      '<span>' +
      escapeHtml(assistantName) +
      '</span>' +
      '</button>'
    );
  }

  function panelTemplate() {
    var body = messages.map(messageTemplate).join('');
    var loading = isLoading
      ? messageTemplate({
          role: 'assistant',
          text: 'Revisando catalogo...',
          products: [],
        })
      : '';

    return (
      '<section class="ba-panel" aria-label="Asistente virtual">' +
      '<header class="ba-head">' +
      '<div class="ba-brand">' +
      '<img class="ba-head-mascot" src="' +
      escapeHtml(mascotUrl) +
      '" alt="' +
      escapeHtml(assistantName) +
      '">' +
      '<div><div class="ba-title">' +
      escapeHtml(assistantName) +
      '</div><div class="ba-subtitle">Asistente de ' +
      escapeHtml(storeName) +
      '</div></div></div>' +
      '<button class="ba-close" type="button" aria-label="Cerrar">x</button>' +
      '</header>' +
      '<div class="ba-log">' +
      body +
      loading +
      '</div>' +
      '<div class="ba-chips">' +
      '<button class="ba-chip" type="button" data-prompt="Que productos tienen disponibles?">Disponibles</button>' +
      '<button class="ba-chip" type="button" data-prompt="Busco una opcion economica">Precio</button>' +
      '<button class="ba-chip" type="button" data-prompt="Quiero hablar con un asesor">Asesor</button>' +
      '</div>' +
      '<form class="ba-form">' +
      '<input class="ba-input" name="message" autocomplete="off" placeholder="Escribe lo que buscas...">' +
      '<button class="ba-send" type="submit" ' +
      (isLoading ? 'disabled' : '') +
      '>Enviar</button>' +
      '</form>' +
      '</section>'
    );
  }

  function bindEvents() {
    var button = shadow.querySelector('.ba-button');
    var close = shadow.querySelector('.ba-close');
    var form = shadow.querySelector('.ba-form');
    var chips = shadow.querySelectorAll('.ba-chip');

    if (button) {
      button.addEventListener('click', function () {
        isOpen = true;
        render();
      });
    }

    if (close) {
      close.addEventListener('click', function () {
        isOpen = false;
        render();
      });
    }

    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var input = shadow.querySelector('.ba-input');
        sendMessage(input ? input.value : '');
      });
    }

    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        sendMessage(chip.dataset.prompt || chip.textContent);
      });
    });
  }

  function scrollToBottom() {
    var log = shadow.querySelector('.ba-log');
    if (log) {
      log.scrollTop = log.scrollHeight;
    }
  }

  function sendMessage(text) {
    var message = String(text || '').trim();
    if (!message || isLoading) return;

    messages.push({ role: 'user', text: message, products: [] });
    isLoading = true;
    render();

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message }),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) {
            throw new Error(data.error || 'No se pudo responder.');
          }
          return data;
        });
      })
      .then(function (data) {
        var handoff = data.handoff || null;

        if (handoff && !handoff.url && advisorUrl) {
          handoff.url = advisorUrl;
        }

        messages.push({
          role: 'assistant',
          text: data.answer,
          products: data.products || [],
          handoff: handoff,
        });
      })
      .catch(function (error) {
        messages.push({
          role: 'assistant',
          text:
            error.message ||
            'No pude leer el catalogo en este momento. Intenta de nuevo.',
          products: [],
        });
      })
      .finally(function () {
        isLoading = false;
        render();
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
