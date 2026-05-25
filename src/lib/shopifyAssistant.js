const CURRENCY_FORMATTER = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

const STOP_WORDS = new Set([
  'a',
  'al',
  'algo',
  'con',
  'cual',
  'cuales',
  'cuanto',
  'cuesta',
  'busco',
  'disponible',
  'disponibles',
  'de',
  'del',
  'el',
  'en',
  'economica',
  'economico',
  'es',
  'esta',
  'existencia',
  'hay',
  'inventario',
  'la',
  'las',
  'lo',
  'los',
  'mas',
  'me',
  'mi',
  'opcion',
  'para',
  'por',
  'precio',
  'producto',
  'productos',
  'que',
  'quiero',
  'recomiendas',
  'recomendar',
  'recomendacion',
  'si',
  'tiene',
  'tener',
  'tienen',
  'tienes',
  'un',
  'una',
  'vale',
  'y',
]);

const INTENT_PATTERNS = {
  greeting: /\b(hola|buenas|hey|inicio|empezar)\b/i,
  price:
    /\b(precio|cuesta|costo|vale|barato|economico|economica|accesible|presupuesto|\$)\b/i,
  lowPrice: /\b(barato|economico|economica|accesible|presupuesto)\b/i,
  stock: /\b(stock|disponible|inventario|existencia|hay|tienen|tendras|tendran)\b/i,
  handoff:
    /\b(whatsapp|asesor|asesora|humano|humana|vendedor|vendedora|contacto|llamar|llamada|cotizar|cotizacion|ayuda humana|persona|agente|representante)\b/i,
};

function stripHtml(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeText(value = '') {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCompact(value = '') {
  return normalizeText(value).replace(/[^a-z0-9]/g, '');
}

function getTokens(message) {
  return normalizeText(message)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function getMeaningfulWords(message) {
  return normalizeText(message)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => {
      if (!token || STOP_WORDS.has(token)) return false;
      if (token.length > 2) return true;
      return /[a-z]/.test(token) || /\d/.test(token);
    });
}

function getQuerySignals(message) {
  const normalized = normalizeText(message);
  const rawWords = normalized.split(' ').filter(Boolean);
  const words = getMeaningfulWords(message);
  const signals = new Set();

  for (const word of words) {
    const compact = normalizeCompact(word);
    if (compact.length > 2) signals.add(compact);
  }

  for (let index = 0; index < words.length - 1; index += 1) {
    const first = words[index];
    const second = words[index + 1];

    if (/[a-z]/.test(first) && /\d/.test(second)) {
      signals.add(normalizeCompact(`${first}${second}`));
    }

    if (/\d/.test(first) && /[a-z]/.test(second)) {
      signals.add(normalizeCompact(`${first}${second}`));
    }

    if (
      /^[a-z]{1,4}$/.test(first) &&
      /^[a-z]{1,5}$/.test(second) &&
      (first.length <= 3 || second.length <= 3)
    ) {
      signals.add(normalizeCompact(`${first}${second}`));
    }
  }

  for (let index = 0; index < rawWords.length - 1; index += 1) {
    const first = rawWords[index];
    const second = rawWords[index + 1];

    if (
      /^[a-z]{1,4}$/.test(first) &&
      /^[a-z0-9]{1,5}$/.test(second) &&
      (first.length <= 3 || second.length <= 3)
    ) {
      signals.add(normalizeCompact(`${first}${second}`));
    }
  }

  const modelMatches = normalized.match(/[a-z]{1,6}\s*-?\s*\d{1,4}\s*-?\s*[a-z]{0,4}/g);
  for (const match of modelMatches || []) {
    signals.add(normalizeCompact(match));
  }

  const capacityMatches = normalized.match(/\d{1,3}\s*(pies|pie|ft|ft3|ft³|l|litros|kg)/g);
  for (const match of capacityMatches || []) {
    signals.add(normalizeCompact(match));
  }

  return Array.from(signals).filter((signal) => signal.length > 2);
}

function getWords(value) {
  return normalizeText(value)
    .split(/[\s-]+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2);
}

function getEditDistance(a, b) {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );

      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }

  return matrix[a.length][b.length];
}

function getDigitGroups(value) {
  return String(value).match(/\d+/g) || [];
}

function hasCompatibleDigits(query, target) {
  const queryDigits = getDigitGroups(query);
  if (queryDigits.length === 0) return true;

  const targetDigits = getDigitGroups(target);
  if (targetDigits.length === 0) return false;

  return queryDigits.every((queryDigit) =>
    targetDigits.some(
      (targetDigit) =>
        targetDigit === queryDigit ||
        targetDigit.startsWith(queryDigit) ||
        queryDigit.startsWith(targetDigit)
    )
  );
}

function isCloseMatch(query, target) {
  if (!query || !target) return false;
  if (!hasCompatibleDigits(query, target)) return false;
  if (target.includes(query) || query.includes(target)) return true;

  const longest = Math.max(query.length, target.length);
  const maxDistance = longest <= 4 ? 1 : Math.ceil(longest * 0.24);
  return getEditDistance(query, target) <= maxDistance;
}

function getProductPrice(product) {
  const prices = (product.variants || [])
    .map((variant) => Number.parseFloat(variant.price || 0))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (prices.length === 0) return 0;
  return Math.min(...prices);
}

function getInventoryTotal(product) {
  return (product.variants || []).reduce((sum, variant) => {
    const quantity = Number(variant.inventory_quantity || 0);
    return sum + (Number.isFinite(quantity) ? quantity : 0);
  }, 0);
}

function isVariantAvailable(variant) {
  if (!variant) return false;

  if (!variant.inventory_management) {
    return true;
  }

  const quantity = Number(variant.inventory_quantity || 0);
  return quantity > 0 || variant.inventory_policy === 'continue';
}

function isProductAvailable(product) {
  return product.status === 'active' && (product.variants || []).some(isVariantAvailable);
}

function getImageUrl(product) {
  return product.image?.src || product.images?.[0]?.src || null;
}

function getTags(product) {
  if (!product.tags) return [];
  return product.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function getProductAliases(product) {
  const rawValues = [
    product.title,
    product.product_type,
    product.vendor,
    product.tags,
    ...(product.variants || []).flatMap((variant) => [
      variant.title,
      variant.sku,
      variant.barcode,
    ]),
  ].filter(Boolean);

  const aliases = new Set();

  for (const value of rawValues) {
    const normalized = normalizeText(String(value));
    const compact = normalizeCompact(String(value));

    if (compact.length > 2) aliases.add(compact);

    for (const word of getWords(normalized)) {
      aliases.add(normalizeCompact(word));
    }

    const modelLikeMatches = String(value).match(/[a-z0-9]+(?:[-/][a-z0-9]+)+/gi);
    for (const model of modelLikeMatches || []) {
      aliases.add(normalizeCompact(model));
      for (const part of model.split(/[-/]/)) {
        if (part.length > 1) aliases.add(normalizeCompact(part));
      }
    }
  }

  return Array.from(aliases).filter((alias) => alias.length > 2);
}

function getModelAliases(product) {
  const rawValues = [
    product.title,
    product.handle,
    ...(product.variants || []).flatMap((variant) => [
      variant.title,
      variant.sku,
      variant.barcode,
    ]),
  ].filter(Boolean);

  const aliases = new Set();

  for (const value of rawValues) {
    const normalized = normalizeText(String(value));
    const compact = normalizeCompact(normalized);
    const modelMatches = normalized.match(/[a-z]{1,8}\s*-?\s*\d{1,4}\s*-?\s*[a-z]{0,6}/g);
    const dashedModelMatches = normalized.match(/[a-z0-9]+(?:[-/][a-z0-9]+)+/g);
    const capacityMatches = normalized.match(/\d{1,3}\s*(pies|pie|ft|ft3|ft³|l|litros|kg)/g);

    for (const match of modelMatches || []) {
      const model = normalizeCompact(match);
      if (model.length > 2) aliases.add(model);
    }

    for (const match of dashedModelMatches || []) {
      const model = normalizeCompact(match);
      if (model.length > 2) aliases.add(model);
    }

    for (const match of capacityMatches || []) {
      const capacity = normalizeCompact(match);
      if (capacity.length > 2) aliases.add(capacity);
    }

    if (compact.length > 2) {
      aliases.add(compact);
    }
  }

  return Array.from(aliases);
}

function matchModelSignal(signal, aliases) {
  if (!signal || signal.length < 3) return false;

  return aliases.find((alias) => {
    if (alias === signal) return true;
    if (/^[a-z]+$/.test(signal) && signal.length >= 3 && alias.startsWith(signal)) {
      return true;
    }

    if (signal.length >= 4 && alias.includes(signal)) return true;
    if (alias.length >= 4 && signal.includes(alias)) return true;

    const hasLetterAndNumber = /[a-z]/.test(signal) && /\d/.test(signal);
    if (!hasLetterAndNumber || signal.length < 4 || alias.length < 4) {
      return false;
    }

    return isCloseMatch(signal, alias);
  });
}

function getProductTerms(product) {
  return [
    ...getWords(product.title || ''),
    ...getWords(product.product_type || ''),
    ...getWords(product.vendor || ''),
    ...getTags(product).flatMap(getWords),
    ...getWords(stripHtml(product.body_html || '')),
  ];
}

function getStorefrontBaseUrl(shopDomain) {
  const configured =
    process.env.SHOPIFY_STOREFRONT_DOMAIN ||
    process.env.SHOPIFY_PUBLIC_STORE_URL ||
    shopDomain;

  if (!configured) return null;

  const withoutProtocol = configured.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return `https://${withoutProtocol}`;
}

function buildProductUrl(product, shopDomain) {
  const baseUrl = getStorefrontBaseUrl(shopDomain);
  if (!baseUrl || !product.handle) return null;
  return `${baseUrl}/products/${product.handle}`;
}

function getInventoryLabel(product) {
  const total = getInventoryTotal(product);

  if (!isProductAvailable(product)) {
    return 'No disponible';
  }

  if (total > 0 && total <= 3) {
    return `Ultimas ${total} piezas`;
  }

  if (total > 3) {
    return 'Disponible';
  }

  return 'Disponible bajo pedido';
}

function getSearchBlob(product) {
  return normalizeText(
    [
      product.title,
      product.product_type,
      product.vendor,
      product.tags,
      stripHtml(product.body_html || ''),
    ]
      .filter(Boolean)
      .join(' ')
  );
}

function scoreProduct(product, tokens, modelSignals, message) {
  const title = normalizeText(product.title || '');
  const type = normalizeText(product.product_type || '');
  const vendor = normalizeText(product.vendor || '');
  const tags = normalizeText(product.tags || '');
  const body = normalizeText(stripHtml(product.body_html || ''));
  const fullBlob = getSearchBlob(product);
  const aliases = getProductAliases(product);
  const modelAliases = getModelAliases(product);
  const terms = getProductTerms(product);
  let score = 0;
  let matchScore = 0;
  let modelMatched = false;
  const reasons = [];

  if (product.status === 'active') score += 3;
  if (isProductAvailable(product)) score += 3;
  if (getProductPrice(product) > 0) score += 1;

  for (const signal of modelSignals) {
    const modelMatch = matchModelSignal(signal, modelAliases);

    if (modelMatch) {
      const boost = modelMatch === signal ? 40 : 34;
      score += boost;
      matchScore += boost;
      modelMatched = true;
      reasons.push('coincide con el modelo');
    }
  }

  for (const token of tokens) {
    const compactToken = normalizeCompact(token);
    const aliasMatch = aliases.find((alias) => isCloseMatch(compactToken, alias));
    const fuzzyTermMatch = terms.find((term) => isCloseMatch(token, term));

    if (title.includes(token)) {
      score += 8;
      matchScore += 8;
      reasons.push('coincide con el nombre');
    } else if (type.includes(token)) {
      score += 6;
      matchScore += 6;
      reasons.push('coincide con la categoria');
    } else if (tags.includes(token)) {
      score += 5;
      matchScore += 5;
      reasons.push('coincide con etiquetas');
    } else if (vendor.includes(token)) {
      score += 4;
      matchScore += 4;
      reasons.push('coincide con proveedor');
    } else if (aliasMatch) {
      score += aliasMatch.includes(compactToken) ? 8 : 6;
      matchScore += aliasMatch.includes(compactToken) ? 8 : 6;
      reasons.push('coincide con un modelo parecido');
    } else if (fuzzyTermMatch) {
      score += 4;
      matchScore += 4;
      reasons.push('coincide aunque este escrito distinto');
    } else if (body.includes(token) || fullBlob.includes(token)) {
      score += 2;
      matchScore += 2;
      reasons.push('coincide con la descripcion');
    }
  }

  if (INTENT_PATTERNS.stock.test(message) && isProductAvailable(product)) {
    score += 2;
  }

  if (INTENT_PATTERNS.price.test(message) && getProductPrice(product) > 0) {
    score += 2;
  }

  return {
    score,
    matched: matchScore > 0,
    modelMatched,
    reason: [...new Set(reasons)].slice(0, 2).join(' y '),
  };
}

function summarizeProduct(product, shopDomain, reason = '') {
  const price = getProductPrice(product);

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    productType: product.product_type || 'Sin categoria',
    vendor: product.vendor || null,
    price,
    formattedPrice: price ? CURRENCY_FORMATTER.format(price) : 'Precio por confirmar',
    image: getImageUrl(product),
    url: buildProductUrl(product, shopDomain),
    inventory: getInventoryTotal(product),
    stockStatus: getInventoryLabel(product),
    reason: reason || 'buena opcion para revisar',
  };
}

function getTopCategories(products) {
  const counts = new Map();

  for (const product of products) {
    if (product.status !== 'active') continue;
    const type = product.product_type || 'productos';
    counts.set(type, (counts.get(type) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type]) => type);
}

function getDefaultSuggestions(categories) {
  const categorySuggestions = categories.slice(0, 2).map((category) => `Busco ${category}`);

  return [
    ...categorySuggestions,
    'Busco una opcion economica',
    'Quiero hablar con un asesor',
  ].slice(0, 4);
}

function detectIntent(message) {
  if (INTENT_PATTERNS.handoff.test(message)) return 'handoff';
  if (INTENT_PATTERNS.stock.test(message)) return 'stock';
  if (INTENT_PATTERNS.price.test(message)) return 'price';
  if (INTENT_PATTERNS.greeting.test(message)) return 'greeting';
  return 'recommendation';
}

function buildAnswer({ intent, matches, categories, tokens }) {
  if (intent === 'handoff') {
    return 'Claro, soy Barry. Te paso con un asesor de Barradas para que te atiendan directamente.';
  }

  if (matches.length === 0 && tokens.length > 0) {
    const categoryText = categories.length
      ? ` Tambien puedes buscar por categorias como ${categories.slice(0, 3).join(', ')}.`
      : '';
    return `No encontre una coincidencia clara en el catalogo activo.${categoryText} Prueba con el tipo de producto, medida, marca o uso que necesitas.`;
  }

  if (matches.length === 0) {
    const categoryText = categories.length
      ? ` Puedo guiarte por categorias como ${categories.slice(0, 3).join(', ')}.`
      : '';
    return `Hola, soy Barry, el asistente de Barradas. Dime que estas buscando y te muestro opciones del catalogo real.${categoryText}`;
  }

  const leadProduct = matches[0];

  if (intent === 'stock') {
    return `${leadProduct.title} aparece como ${leadProduct.stockStatus.toLowerCase()}. Te dejo las opciones mas cercanas para que revises disponibilidad y precio.`;
  }

  if (intent === 'price') {
    if (leadProduct.reason.includes('modelo')) {
      if (matches.length > 1) {
        return `Encontre varias opciones relacionadas. La primera es ${leadProduct.title}, con precio desde ${leadProduct.formattedPrice}.`;
      }

      return `${leadProduct.title} tiene precio desde ${leadProduct.formattedPrice}.`;
    }

    return `La opcion que mejor coincide empieza en ${leadProduct.formattedPrice}. Tambien te dejo alternativas cercanas por si quieres comparar.`;
  }

  return `Estas son las mejores coincidencias que encontre en el catalogo. La primera opcion es ${leadProduct.title}, ${leadProduct.formattedPrice}, ${leadProduct.stockStatus.toLowerCase()}.`;
}

export function createAssistantReply({
  message,
  products,
  shopDomain,
  advisorUrl = null,
}) {
  const safeMessage = String(message || '').slice(0, 500);
  const tokens = getTokens(safeMessage);
  const modelSignals = getQuerySignals(safeMessage);
  const intent = detectIntent(safeMessage);
  const wantsLowPrice = INTENT_PATTERNS.lowPrice.test(safeMessage);
  const categories = getTopCategories(products);
  const activeProducts = products.filter((product) => product.status === 'active');

  if (intent === 'handoff') {
    return {
      answer: buildAnswer({ intent, matches: [], categories, tokens }),
      intent,
      products: [],
      suggestions: getDefaultSuggestions(categories),
      assistant: {
        name: 'Barry',
        avatar: '/barry-avatar.png',
      },
      handoff: {
        recommended: true,
        label: 'Hablar con asesor',
        url: advisorUrl,
      },
    };
  }

  const scoredProducts = activeProducts
    .map((product) => {
      const score = scoreProduct(product, tokens, modelSignals, safeMessage);
      return {
        product,
        score: score.score,
        matched: score.matched,
        modelMatched: score.modelMatched,
        reason: score.reason,
      };
    })
    .filter((entry) => {
      if (modelSignals.length > 0) {
        return isProductAvailable(entry.product) && entry.modelMatched;
      }

      if (tokens.length === 0) return isProductAvailable(entry.product);

      if (wantsLowPrice || intent === 'stock' || intent === 'price') {
        return isProductAvailable(entry.product) && (entry.matched || tokens.length === 0);
      }

      return entry.matched && entry.score >= 9;
    })
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;

      if (wantsLowPrice && Math.abs(scoreDiff) <= 2) {
        return getProductPrice(a.product) - getProductPrice(b.product);
      }

      return scoreDiff;
    })
    .slice(0, 3);

  const matches = scoredProducts.map((entry) =>
    summarizeProduct(entry.product, shopDomain, entry.reason)
  );

  return {
    answer: buildAnswer({ intent, matches, categories, tokens }),
    intent,
    products: matches,
    suggestions: getDefaultSuggestions(categories),
    assistant: {
      name: 'Barry',
      avatar: '/barry-avatar.png',
    },
    handoff: {
      recommended: intent === 'handoff' || (tokens.length > 0 && matches.length === 0),
      label: 'Hablar con asesor',
      url: advisorUrl,
    },
  };
}
