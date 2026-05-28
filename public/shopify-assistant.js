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
  var mascotUrl =
    (script && script.dataset.mascotUrl) || baseUrl + '/barry-avatar.png';
  var host = document.createElement('div');

  var fieldLabels = {
    need: 'Necesidad',
    category: 'Categoria',
    supportType: 'Tipo de soporte',
    useCase: 'Uso o contexto',
    urgency: 'Urgencia',
    budget: 'Presupuesto',
  };
  var resetFields = {
    need: ['category', 'supportType', 'useCase', 'urgency', 'budget'],
    category: ['supportType', 'useCase', 'urgency', 'budget'],
    supportType: ['category', 'useCase', 'urgency', 'budget'],
    useCase: ['supportType', 'urgency', 'budget'],
    urgency: ['budget'],
  };

  var flowSteps = {
    need: {
      title: 'Que necesitas?',
      description: 'Elige la opcion que mejor describe tu visita.',
      options: [
        {
          label: 'Comprar o cotizar equipo',
          field: 'need',
          value: 'Comprar o cotizar equipo',
          next: 'category',
        },
        {
          label: 'Ver disponibilidad',
          field: 'need',
          value: 'Ver disponibilidad',
          next: 'category',
        },
        {
          label: 'Soporte o refacciones',
          field: 'need',
          value: 'Soporte, refacciones o servicio',
          next: 'supportType',
        },
        {
          label: 'Hablar con asesor',
          field: 'need',
          value: 'Asesoria personalizada',
          next: 'final',
        },
      ],
    },
    category: {
      title: 'Que tipo de producto buscas?',
      description: 'Esto ayuda a que el asesor ubique mejor tu solicitud.',
      options: [
        { label: 'Vitrinas', field: 'category', value: 'Vitrinas', next: 'useCase' },
        { label: 'Enfriadores', field: 'category', value: 'Enfriadores', next: 'useCase' },
        { label: 'Congeladores', field: 'category', value: 'Congeladores', next: 'useCase' },
        { label: 'Basculas', field: 'category', value: 'Basculas', next: 'useCase' },
        { label: 'No estoy seguro', field: 'category', value: 'No estoy seguro', next: 'useCase' },
      ],
    },
    supportType: {
      title: 'Sobre que necesitas apoyo?',
      description: 'Selecciona el tipo de atencion que necesitas.',
      options: [
        { label: 'Servicio tecnico', field: 'supportType', value: 'Servicio tecnico', next: 'urgency' },
        { label: 'Refacciones', field: 'supportType', value: 'Refacciones', next: 'urgency' },
        { label: 'Instalacion', field: 'supportType', value: 'Instalacion', next: 'urgency' },
        { label: 'Garantia', field: 'supportType', value: 'Garantia', next: 'urgency' },
        { label: 'No estoy seguro', field: 'supportType', value: 'No estoy seguro', next: 'urgency' },
      ],
    },
    useCase: {
      title: 'Para que lo necesitas?',
      description: 'Esta respuesta da contexto comercial al ticket.',
      options: [
        { label: 'Restaurante o cocina', field: 'useCase', value: 'Restaurante o cocina', next: 'urgency' },
        { label: 'Tienda o autoservicio', field: 'useCase', value: 'Tienda o autoservicio', next: 'urgency' },
        { label: 'Carniceria o cremeria', field: 'useCase', value: 'Carniceria o cremeria', next: 'urgency' },
        { label: 'Exhibicion y venta', field: 'useCase', value: 'Exhibicion y venta', next: 'urgency' },
        { label: 'No estoy seguro', field: 'useCase', value: 'No estoy seguro', next: 'urgency' },
      ],
    },
    urgency: {
      title: 'Que tan pronto lo necesitas?',
      description: 'La urgencia ayuda a priorizar la atencion.',
      options: [
        { label: 'Hoy o urgente', field: 'urgency', value: 'Hoy o urgente', next: 'budget' },
        { label: 'Esta semana', field: 'urgency', value: 'Esta semana', next: 'budget' },
        { label: 'Este mes', field: 'urgency', value: 'Este mes', next: 'budget' },
        { label: 'Solo estoy comparando', field: 'urgency', value: 'Solo estoy comparando', next: 'budget' },
      ],
    },
    budget: {
      title: 'Ya tienes presupuesto?',
      description: 'No es obligatorio, pero orienta mejor al asesor.',
      options: [
        { label: 'Busco algo economico', field: 'budget', value: 'Busca opcion economica', next: 'final' },
        { label: 'Calidad/precio', field: 'budget', value: 'Busca calidad/precio', next: 'final' },
        { label: 'Alto rendimiento', field: 'budget', value: 'Busca alto rendimiento', next: 'final' },
        { label: 'No definido', field: 'budget', value: 'No definido', next: 'final' },
      ],
    },
  };

  host.id = 'barradas-shopify-assistant';
  document.body.appendChild(host);

  var shadow = host.attachShadow({ mode: 'open' });
  var isOpen = false;
  var isLoading = false;
  var stepId = 'need';
  var history = ['need'];
  var answers = {};
  var handoff = null;
  var errorMessage = '';

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getTicketEntries() {
    return Object.keys(fieldLabels)
      .map(function (key) {
        return {
          key: key,
          label: fieldLabels[key],
          value: answers[key],
        };
      })
      .filter(function (entry) {
        return entry.value;
      });
  }

  function summaryTemplate() {
    var entries = getTicketEntries();

    if (!entries.length) {
      return (
        '<p class="ba-note">' +
        'Si contactas directo, el asesor recibira un mensaje general de asesoria personalizada.' +
        '</p>'
      );
    }

    return entries
      .map(function (entry) {
        return (
          '<div class="ba-summary-row"><span>' +
          escapeHtml(entry.label) +
          '</span><strong>' +
          escapeHtml(entry.value) +
          '</strong></div>'
        );
      })
      .join('');
  }

  function optionsTemplate(step) {
    return step.options
      .map(function (option, index) {
        return (
          '<button class="ba-option" type="button" data-option-index="' +
          index +
          '">' +
          escapeHtml(option.label) +
          '</button>'
        );
      })
      .join('');
  }

  function currentStepTemplate() {
    var step = flowSteps[stepId];

    if (stepId === 'final') {
      return (
        '<div class="ba-card">' +
        '<div class="ba-eyebrow">Ticket para asesor digital</div>' +
        '<h3>Listo para contactar</h3>' +
        '<p>Barry usara estas respuestas para crear el mensaje de WhatsApp.</p>' +
        '<div class="ba-summary">' +
        summaryTemplate() +
        '</div>' +
        (errorMessage ? '<div class="ba-error">' + escapeHtml(errorMessage) + '</div>' : '') +
        (handoff && handoff.url
          ? '<a class="ba-advisor" href="' +
            escapeHtml(handoff.url) +
            '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(handoff.label || 'Contactar asesor digital') +
            '</a>'
          : '<button class="ba-ticket" type="button" ' +
            (isLoading ? 'disabled' : '') +
            '>' +
            (isLoading ? 'Creando ticket...' : 'Crear ticket por WhatsApp') +
            '</button>') +
        '</div>'
      );
    }

    return (
      '<div class="ba-card">' +
      '<div class="ba-eyebrow">Paso ' +
      history.length +
      '</div>' +
      '<h3>' +
      escapeHtml(step.title) +
      '</h3>' +
      '<p>' +
      escapeHtml(step.description) +
      '</p>' +
      '<div class="ba-options">' +
      optionsTemplate(step) +
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
      '.ba-panel{width:min(390px,calc(100vw - 28px));background:#fff;border:1px solid #dbe3ef;border-radius:14px;box-shadow:0 22px 60px rgba(15,23,42,.26);overflow:hidden;display:flex;flex-direction:column}' +
      '.ba-head{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#0f172a;color:#fff;padding:13px 14px}' +
      '.ba-brand{display:flex;align-items:center;gap:10px;min-width:0}' +
      '.ba-head-mascot{width:48px;height:48px;border-radius:50%;background:#fff;object-fit:cover;flex:0 0 auto}' +
      '.ba-title{font:700 14px Arial}.ba-subtitle{margin-top:3px;color:#cbd5e1;font:400 12px Arial}' +
      '.ba-close{width:34px;height:34px;border-radius:50%;border:1px solid rgba(255,255,255,.18);background:transparent;color:#fff;font:700 18px Arial;cursor:pointer}' +
      '.ba-body{background:#f8fafc;padding:14px}.ba-card{border:1px solid #e2e8f0;border-radius:12px;background:#fff;padding:14px}' +
      '.ba-eyebrow{color:#64748b;font:700 11px Arial;text-transform:uppercase;letter-spacing:.05em}.ba-card h3{margin:8px 0 4px;color:#0f172a;font:700 18px Arial}.ba-card p{margin:0;color:#64748b;font:400 13px/1.4 Arial}' +
      '.ba-options{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}.ba-option{border:1px solid #cbd5e1;border-radius:10px;background:#fff;color:#0f172a;padding:10px 11px;text-align:left;font:700 13px/1.25 Arial;cursor:pointer}.ba-option:hover{border-color:var(--ba-accent);background:#eff6ff}' +
      '.ba-summary{display:flex;flex-direction:column;gap:8px;margin-top:13px}.ba-summary-row{display:flex;justify-content:space-between;gap:10px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc;padding:8px 10px}.ba-summary-row span{color:#64748b;font:400 12px Arial}.ba-summary-row strong{color:#0f172a;text-align:right;font:700 12px Arial}.ba-note{margin-top:10px!important}' +
      '.ba-ticket,.ba-advisor{display:block;width:100%;box-sizing:border-box;margin-top:13px;border:0;border-radius:10px;background:#16a34a;color:#fff;text-align:center;text-decoration:none;padding:11px 12px;font:700 13px Arial;cursor:pointer}.ba-ticket:disabled{opacity:.6;cursor:not-allowed}' +
      '.ba-error{margin-top:12px;border-radius:10px;background:#fee2e2;color:#991b1b;padding:9px 10px;font:600 12px/1.35 Arial}' +
      '.ba-foot{display:flex;justify-content:space-between;gap:8px;border-top:1px solid #e2e8f0;background:#fff;padding:10px 12px}.ba-secondary{border:1px solid #cbd5e1;border-radius:9px;background:#fff;color:#334155;padding:8px 10px;font:700 12px Arial;cursor:pointer}.ba-secondary:disabled{opacity:.45;cursor:not-allowed}' +
      '@media(max-width:480px){.ba-wrap{right:12px;bottom:12px}.ba-panel{width:calc(100vw - 24px)}.ba-options{grid-template-columns:1fr}}' +
      '</style>' +
      '<div class="ba-wrap">' +
      (isOpen ? panelTemplate() : buttonTemplate()) +
      '</div>';

    bindEvents();
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
      '</div><div class="ba-subtitle">Asistente guiado de ' +
      escapeHtml(storeName) +
      '</div></div></div>' +
      '<button class="ba-close" type="button" aria-label="Cerrar">x</button>' +
      '</header>' +
      '<div class="ba-body">' +
      currentStepTemplate() +
      '</div>' +
      '<div class="ba-foot">' +
      '<button class="ba-secondary ba-back" type="button" ' +
      (history.length <= 1 || isLoading ? 'disabled' : '') +
      '>Regresar</button>' +
      '<button class="ba-secondary ba-reset" type="button">Reiniciar</button>' +
      '</div>' +
      '</section>'
    );
  }

  function bindEvents() {
    var button = shadow.querySelector('.ba-button');
    var close = shadow.querySelector('.ba-close');
    var options = shadow.querySelectorAll('.ba-option');
    var back = shadow.querySelector('.ba-back');
    var reset = shadow.querySelector('.ba-reset');
    var ticket = shadow.querySelector('.ba-ticket');

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

    Array.prototype.forEach.call(options, function (optionButton) {
      optionButton.addEventListener('click', function () {
        var step = flowSteps[stepId];
        var option = step.options[Number(optionButton.dataset.optionIndex)];
        selectOption(option);
      });
    });

    if (back) back.addEventListener('click', goBack);
    if (reset) reset.addEventListener('click', resetFlow);
    if (ticket) ticket.addEventListener('click', createTicket);
  }

  function selectOption(option) {
    if (!option || isLoading) return;

    if (option.field) {
      (resetFields[option.field] || []).forEach(function (field) {
        delete answers[field];
      });
      answers[option.field] = option.value;
    }

    handoff = null;
    errorMessage = '';
    stepId = option.next;
    history.push(option.next);
    render();
  }

  function goBack() {
    if (history.length <= 1 || isLoading) return;
    history.pop();
    stepId = history[history.length - 1];
    handoff = null;
    errorMessage = '';
    render();
  }

  function resetFlow() {
    stepId = 'need';
    history = ['need'];
    answers = {};
    handoff = null;
    errorMessage = '';
    isLoading = false;
    render();
  }

  function createTicket() {
    if (isLoading) return;

    isLoading = true;
    errorMessage = '';
    render();

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'guided-ticket', ticket: answers }),
    })
      .then(function (response) {
        return response.json().then(function (data) {
          if (!response.ok) {
            throw new Error(data.error || 'No se pudo crear el ticket.');
          }
          return data;
        });
      })
      .then(function (data) {
        handoff = data.handoff || null;
      })
      .catch(function (error) {
        errorMessage =
          error.message ||
          'No pude crear el ticket en este momento. Intenta de nuevo.';
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
