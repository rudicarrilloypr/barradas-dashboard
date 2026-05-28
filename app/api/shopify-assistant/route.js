import { getProducts, SHOP_DOMAIN } from '../../../src/lib/shopify';
import { createAssistantReply } from '../../../src/lib/shopifyAssistant';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const allowedOrigins = (process.env.SHOPIFY_ASSISTANT_ALLOWED_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const DEFAULT_ADVISOR_PHONE = '522281335996';
const FALLBACK_TICKET_MESSAGE =
  'Hola, vengo de la pagina de Barradas y busco asesoria personalizada.';
const TICKET_FIELD_LABELS = {
  need: 'Necesidad',
  category: 'Categoria',
  supportType: 'Tipo de soporte',
  useCase: 'Uso o contexto',
  urgency: 'Urgencia',
  budget: 'Presupuesto',
};

function normalizeWhatsappPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');

  if (digits.length === 10) {
    return `52${digits}`;
  }

  return digits || DEFAULT_ADVISOR_PHONE;
}

function cleanTicketValue(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 160);
}

function normalizeGuidedTicket(ticket = {}) {
  return Object.entries(TICKET_FIELD_LABELS)
    .map(([key, label]) => ({
      key,
      label,
      value: cleanTicketValue(ticket[key]),
    }))
    .filter((item) => item.value);
}

function buildTicketMessageFromEntries(entries) {
  if (!entries || entries.length < 2) {
    return FALLBACK_TICKET_MESSAGE;
  }

  return [
    'Hola, vengo de la pagina de Barradas y busco asesoria personalizada.',
    '',
    'Ticket del cliente:',
    ...entries.map((entry) => `${entry.label}: ${entry.value}`),
  ].join('\n');
}

function buildTicketMessage(message) {
  const cleanMessage = String(message || '').replace(/\s+/g, ' ').trim();
  const wordCount = cleanMessage.split(' ').filter(Boolean).length;

  if (cleanMessage.length < 12 || wordCount < 3) {
    return FALLBACK_TICKET_MESSAGE;
  }

  return [
    'Hola, vengo de la pagina de Barradas y busco asesoria personalizada.',
    '',
    'Ticket del cliente:',
    `Solicitud: ${cleanMessage.slice(0, 700)}`,
  ].join('\n');
}

function addTicketToAdvisorUrl(url, ticketMessage) {
  try {
    const parsedUrl = new URL(url);
    const isWhatsappUrl =
      parsedUrl.hostname.includes('wa.me') ||
      parsedUrl.hostname.includes('whatsapp.com');

    if (isWhatsappUrl) {
      parsedUrl.searchParams.set('text', ticketMessage);
    }

    return parsedUrl.toString();
  } catch {
    return url;
  }
}

function getAdvisorUrl({ message, ticketEntries } = {}) {
  const ticketMessage = ticketEntries
    ? buildTicketMessageFromEntries(ticketEntries)
    : buildTicketMessage(message);

  if (process.env.SHOPIFY_ASSISTANT_ADVISOR_URL) {
    return addTicketToAdvisorUrl(
      process.env.SHOPIFY_ASSISTANT_ADVISOR_URL,
      ticketMessage
    );
  }

  const phone = normalizeWhatsappPhone(
    process.env.SHOPIFY_ASSISTANT_WHATSAPP_PHONE || DEFAULT_ADVISOR_PHONE
  );

  return `https://wa.me/${phone}?text=${encodeURIComponent(ticketMessage)}`;
}

function getAllowedOrigin(request) {
  if (allowedOrigins.includes('*')) return '*';

  const requestOrigin = request?.headers?.get('origin');

  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }

  return allowedOrigins[0] || '*';
}

function corsHeaders(request) {
  const origin = getAllowedOrigin(request);

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    ...(origin === '*' ? {} : { Vary: 'Origin' }),
  };
}

function jsonResponse(body, init = {}, request = null) {
  return Response.json(body, {
    ...init,
    headers: {
      ...corsHeaders(request),
      ...(init.headers || {}),
    },
  });
}

export async function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  });
}

export async function POST(request) {
  let payload = {};

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      { error: 'Envia un JSON valido con el campo message.' },
      { status: 400 },
      request
    );
  }

  const mode = String(payload.mode || '').trim();
  const ticketEntries = normalizeGuidedTicket(payload.ticket);

  if (mode === 'guided-ticket' || ticketEntries.length > 0) {
    const hasEnoughTicket = ticketEntries.length >= 2;

    return jsonResponse(
      {
        answer: hasEnoughTicket
          ? 'Listo. Prepare un ticket para el asesor digital con tus respuestas.'
          : 'Listo. Te paso con el asesor digital para atencion personalizada.',
        intent: 'guided_handoff',
        products: [],
        suggestions: [],
        ticket: ticketEntries,
        assistant: {
          name: 'Barry',
          avatar: '/barry-avatar.png',
        },
        handoff: {
          recommended: true,
          label: 'Contactar asesor digital',
          url: getAdvisorUrl({ ticketEntries }),
        },
      },
      {},
      request
    );
  }

  const message = String(payload.message || '').trim();

  if (!message) {
    return jsonResponse(
      { error: 'Escribe una pregunta para el asistente.' },
      { status: 400 },
      request
    );
  }

  try {
    const products = await getProducts();
    const reply = createAssistantReply({
      message,
      products,
      shopDomain: SHOP_DOMAIN,
      advisorUrl: getAdvisorUrl({ message }),
    });

    return jsonResponse(
      {
        ...reply,
        catalog: {
          productsRead: products.length,
          source: 'shopify',
        },
      },
      {},
      request
    );
  } catch (error) {
    console.error('Error en shopify-assistant:', error);

    return jsonResponse(
      {
        error:
          'No pude leer el catalogo de Shopify en este momento. Revisa la conexion y vuelve a intentar.',
      },
      { status: 500 },
      request
    );
  }
}
