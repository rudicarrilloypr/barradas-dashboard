// src/lib/shopify.js

const SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

// Versión de API, la puedes actualizar luego si Shopify cambia
const API_VERSION = '2024-01';

async function shopifyRequest(path) {
  const url = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/${path}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': ADMIN_TOKEN,
      'Content-Type': 'application/json',
    },
    // Importante para Next (cuando haces fetch en server components)
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error('Error Shopify:', res.status, await res.text());
    throw new Error('Error al consultar Shopify');
  }

  return res.json();
}

export async function getProducts() {
  // Puedes ajustar límites, filtros, etc.
  const data = await shopifyRequest('products.json?limit=20');
  return data.products || [];
}

export async function getOrders() {
  const data = await shopifyRequest('orders.json?limit=20&status=any');
  return data.orders || [];
}