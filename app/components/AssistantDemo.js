"use client";

import { useRef, useState } from 'react';

const QUICK_PROMPTS = [
  'Hola, que productos tienen disponibles?',
  'Busco una opcion economica',
  'Busco basclua bms 40 eoc',
  'Quiero hablar con un asesor',
];

function HandoffCta({ handoff }) {
  if (!handoff?.recommended) return null;

  if (handoff.url) {
    return (
      <a
        href={handoff.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 block rounded-md bg-emerald-600 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-500"
      >
        {handoff.label || 'Hablar con asesor'}
      </a>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-amber-800 bg-amber-950/50 px-3 py-2 text-xs text-amber-200">
      Falta configurar el link o WhatsApp del asesor para activar este boton.
    </div>
  );
}

function ProductResult({ product }) {
  return (
    <a
      href={product.url || '#'}
      target={product.url ? '_blank' : undefined}
      rel={product.url ? 'noopener noreferrer' : undefined}
      className="flex gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3 transition-colors hover:border-blue-500"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-slate-800 bg-slate-900">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
            Sin imagen
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="line-clamp-2 text-sm font-medium text-slate-100">
          {product.title}
        </div>
        <div className="mt-1 text-xs text-slate-400">
          {product.productType} · {product.stockStatus}
        </div>
        <div className="mt-1 text-sm font-semibold text-blue-300">
          {product.formattedPrice}
        </div>
      </div>
    </a>
  );
}

export default function AssistantDemo() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hola, soy Barry, el asistente de Barradas. Preguntame por un producto, categoria, precio o disponibilidad.',
      products: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);

  async function sendMessage(nextMessage) {
    const message = String(nextMessage || input).trim();
    if (!message || isLoading) return;

    setInput('');
    setIsLoading(true);
    setMessages((current) => [...current, { role: 'user', text: message }]);

    try {
      const response = await fetch('/api/shopify-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo consultar el asistente.');
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: data.answer,
          products: data.products || [],
          suggestions: data.suggestions || [],
          handoff: data.handoff || null,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text:
            error.message ||
            'No pude responder en este momento. Revisa la conexion con Shopify.',
          products: [],
        },
      ]);
    } finally {
      setIsLoading(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-xl border border-slate-800 bg-slate-900/70">
        <div className="flex items-center gap-3 border-b border-slate-800 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/barry-avatar.png"
            alt=""
            className="h-12 w-12 rounded-full bg-white"
          />
          <div>
            <h2 className="text-sm font-semibold text-slate-100">
              Barry
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Usa el mismo endpoint que llamara el widget embebido en Shopify.
            </p>
          </div>
        </div>

        <div className="flex h-[520px] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message, index) => {
              const isUser = message.role === 'user';

              return (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/barry-avatar.png"
                      alt=""
                      className="mr-2 h-8 w-8 self-end rounded-full bg-white"
                    />
                  )}
                  <div
                    className={`max-w-[88%] rounded-xl border px-4 py-3 text-sm ${
                      isUser
                        ? 'border-blue-500 bg-blue-600 text-white'
                        : 'border-slate-800 bg-slate-950 text-slate-200'
                    }`}
                  >
                    <p>{message.text}</p>
                    {message.products?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {message.products.map((product) => (
                          <ProductResult key={product.id} product={product} />
                        ))}
                      </div>
                    )}
                    <HandoffCta handoff={message.handoff} />
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="text-xs text-slate-500">
                Consultando catalogo de Shopify...
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 transition-colors hover:border-blue-500 hover:text-blue-200"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ej. Busco algo disponible para entrega..."
                className="min-w-0 flex-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-100">
            Como se incrusta
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Al desplegar esta app, pega este script en el tema de Shopify o en
            un app embed propio.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
            {`<script src="https://TU-DOMINIO/shopify-assistant.js" defer></script>`}
          </pre>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <h2 className="text-sm font-semibold text-slate-100">
            Que hace este MVP
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-slate-400">
            <li>Lee productos activos desde Shopify.</li>
            <li>Busca por nombre, categoria, etiquetas y descripcion.</li>
            <li>Responde precio y disponibilidad cuando existen datos.</li>
            <li>Muestra links directos al producto en la tienda.</li>
          </ul>
        </div>
      </aside>
    </section>
  );
}
