// src/lib/shopify.js

const rawShopDomain = process.env.SHOPIFY_SHOP_DOMAIN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;

// Stable Shopify Admin REST API version.
const API_VERSION = '2026-04';
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
const PAGE_LIMIT = 250;
const DEFAULT_CACHE_TTL_MS = 60 * 1000;

function getCacheTtlMs() {
  const ttl = Number(process.env.SHOPIFY_CACHE_TTL_MS ?? DEFAULT_CACHE_TTL_MS);
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 0;
}

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;
const requestCache = globalThis.__barradasShopifyRequestCache || new Map();
globalThis.__barradasShopifyRequestCache = requestCache;

function normalizeShopDomain(value) {
  if (!value) return null;

  return value
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/admin.*$/, '')
    .replace(/\/$/, '');
}

function getShopDomain() {
  const shopDomain = normalizeShopDomain(rawShopDomain);

  if (!shopDomain) {
    throw new Error('Configura SHOPIFY_SHOP_DOMAIN en .env.local.');
  }

  return shopDomain;
}

async function getAdminAccessToken() {
  if (ADMIN_TOKEN) return ADMIN_TOKEN;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      'Configura SHOPIFY_CLIENT_ID y SHOPIFY_CLIENT_SECRET en .env.local.'
    );
  }

  if (cachedAccessToken && Date.now() < cachedAccessTokenExpiresAt) {
    return cachedAccessToken;
  }

  const shopDomain = getShopDomain();
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  });

  if (!res.ok) {
    const bodyText = await res.text();
    console.error('Error Shopify OAuth:', res.status, bodyText);
    throw new Error('No se pudo generar el token de acceso de Shopify.');
  }

  const data = await res.json();

  if (!data.access_token) {
    throw new Error('Shopify no devolvio un token de acceso valido.');
  }

  cachedAccessToken = data.access_token;
  cachedAccessTokenExpiresAt =
    Date.now() +
    Number(data.expires_in || 86400) * 1000 -
    TOKEN_REFRESH_BUFFER_MS;

  return cachedAccessToken;
}

function buildAdminApiUrl(pathOrUrl) {
  if (pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }

  const shopDomain = getShopDomain();
  return `https://${shopDomain}/admin/api/${API_VERSION}/${pathOrUrl}`;
}

function getNextPageUrl(linkHeader) {
  if (!linkHeader) return null;

  const links = linkHeader.split(',');
  const nextLink = links.find((link) => /rel="?next"?/.test(link));
  const match = nextLink?.match(/<([^>]+)>/);

  return match?.[1] || null;
}

export const SHOP_DOMAIN = normalizeShopDomain(rawShopDomain);
export const SHOPIFY_API_VERSION = API_VERSION;
export const SHOPIFY_AUTH_MODE = ADMIN_TOKEN
  ? 'Admin API access token'
  : 'Client credentials';

async function shopifyFetch(pathOrUrl) {
  const accessToken = await getAdminAccessToken();
  const url = buildAdminApiUrl(pathOrUrl);
  const cacheTtlMs = getCacheTtlMs();
  const cached = requestCache.get(url);

  if (cacheTtlMs > 0 && cached) {
    if (cached.value && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    if (cached.promise) {
      return cached.promise;
    }
  }

  const requestPromise = (async () => {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const bodyText = await res.text();
      console.error('Error Shopify:', res.status, bodyText);

      // If customers scope is missing, keep the rest of the dashboard usable.
      if (res.status === 403 && pathOrUrl.startsWith('customers')) {
        return { data: { customers: [] }, nextPageUrl: null };
      }

      throw new Error('Error al consultar Shopify');
    }

    return {
      data: await res.json(),
      nextPageUrl: getNextPageUrl(res.headers.get('link')),
    };
  })();

  if (cacheTtlMs > 0) {
    requestCache.set(url, { promise: requestPromise });
  }

  try {
    const value = await requestPromise;

    if (cacheTtlMs > 0) {
      requestCache.set(url, {
        value,
        expiresAt: Date.now() + cacheTtlMs,
      });
    }

    return value;
  } catch (error) {
    requestCache.delete(url);
    throw error;
  }
}

async function shopifyRequest(path) {
  const { data } = await shopifyFetch(path);
  return data;
}

async function shopifyPaginatedRequest(path, resourceName) {
  let nextPathOrUrl = path;
  const items = [];

  while (nextPathOrUrl) {
    const { data, nextPageUrl } = await shopifyFetch(nextPathOrUrl);
    items.push(...(data[resourceName] || []));
    nextPathOrUrl = nextPageUrl;
  }

  return items;
}

export async function getProducts() {
  return shopifyPaginatedRequest(
    `products.json?limit=${PAGE_LIMIT}`,
    'products'
  );
}

export async function getOrders() {
  return shopifyPaginatedRequest(
    `orders.json?limit=${PAGE_LIMIT}&status=any`,
    'orders'
  );
}

export async function getCustomers() {
  return shopifyPaginatedRequest(
    `customers.json?limit=${PAGE_LIMIT}`,
    'customers'
  );
}

export async function getShopInfo() {
  const data = await shopifyRequest('shop.json');
  return data.shop;
}
