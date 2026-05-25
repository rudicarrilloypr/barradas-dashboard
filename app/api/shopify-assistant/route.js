import { getProducts, SHOP_DOMAIN } from '../../../src/lib/shopify';
import { createAssistantReply } from '../../../src/lib/shopifyAssistant';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const allowedOrigin = process.env.SHOPIFY_ASSISTANT_ALLOWED_ORIGIN || '*';

function getAdvisorUrl() {
  if (process.env.SHOPIFY_ASSISTANT_ADVISOR_URL) {
    return process.env.SHOPIFY_ASSISTANT_ADVISOR_URL;
  }

  const phone = (process.env.SHOPIFY_ASSISTANT_WHATSAPP_PHONE || '').replace(
    /\D/g,
    ''
  );

  if (!phone) return null;

  const text = encodeURIComponent(
    'Hola, vengo de la pagina de Barradas y quiero hablar con un asesor.'
  );

  return `https://wa.me/${phone}?text=${text}`;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(body, init = {}) {
  return Response.json(body, {
    ...init,
    headers: {
      ...corsHeaders(),
      ...(init.headers || {}),
    },
  });
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(request) {
  let payload = {};

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      { error: 'Envia un JSON valido con el campo message.' },
      { status: 400 }
    );
  }

  const message = String(payload.message || '').trim();

  if (!message) {
    return jsonResponse(
      { error: 'Escribe una pregunta para el asistente.' },
      { status: 400 }
    );
  }

  try {
    const products = await getProducts();
    const reply = createAssistantReply({
      message,
      products,
      shopDomain: SHOP_DOMAIN,
      advisorUrl: getAdvisorUrl(),
    });

    return jsonResponse({
      ...reply,
      catalog: {
        productsRead: products.length,
        source: 'shopify',
      },
    });
  } catch (error) {
    console.error('Error en shopify-assistant:', error);

    return jsonResponse(
      {
        error:
          'No pude leer el catalogo de Shopify en este momento. Revisa la conexion y vuelve a intentar.',
      },
      { status: 500 }
    );
  }
}
