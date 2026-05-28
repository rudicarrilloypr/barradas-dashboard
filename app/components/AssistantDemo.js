"use client";

import { useState } from 'react';

const FLOW_STEPS = {
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

const FIELD_LABELS = {
  need: 'Necesidad',
  category: 'Categoria',
  supportType: 'Tipo de soporte',
  useCase: 'Uso o contexto',
  urgency: 'Urgencia',
  budget: 'Presupuesto',
};

const RESET_FIELDS = {
  need: ['category', 'supportType', 'useCase', 'urgency', 'budget'],
  category: ['supportType', 'useCase', 'urgency', 'budget'],
  supportType: ['category', 'useCase', 'urgency', 'budget'],
  useCase: ['supportType', 'urgency', 'budget'],
  urgency: ['budget'],
};

function TicketSummary({ answers }) {
  const entries = Object.entries(FIELD_LABELS)
    .map(([key, label]) => ({ key, label, value: answers[key] }))
    .filter((entry) => entry.value);

  if (entries.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Si contactas directo, el asesor recibira un mensaje general de asesoria personalizada.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div
          key={entry.key}
          className="flex items-start justify-between gap-3 rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2 text-sm"
        >
          <span className="text-slate-500">{entry.label}</span>
          <span className="text-right text-slate-100">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AssistantDemo() {
  const [stepId, setStepId] = useState('need');
  const [history, setHistory] = useState(['need']);
  const [answers, setAnswers] = useState({});
  const [handoff, setHandoff] = useState(null);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const step = FLOW_STEPS[stepId];

  function selectOption(option) {
    const nextAnswers = { ...answers };

    if (option.field) {
      for (const field of RESET_FIELDS[option.field] || []) {
        delete nextAnswers[field];
      }

      nextAnswers[option.field] = option.value;
    }

    setAnswers(nextAnswers);
    setHandoff(null);
    setErrorMessage('');
    setStepId(option.next);
    setHistory((current) => [...current, option.next]);
  }

  function goBack() {
    if (history.length <= 1 || status === 'loading') return;

    const nextHistory = history.slice(0, -1);
    setHistory(nextHistory);
    setStepId(nextHistory[nextHistory.length - 1]);
    setHandoff(null);
    setErrorMessage('');
  }

  function resetFlow() {
    setStepId('need');
    setHistory(['need']);
    setAnswers({});
    setHandoff(null);
    setStatus('idle');
    setErrorMessage('');
  }

  async function createTicket() {
    if (status === 'loading') return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/shopify-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'guided-ticket',
          ticket: answers,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo crear el ticket.');
      }

      setHandoff(data.handoff);
      setStatus('ready');
    } catch (error) {
      setErrorMessage(
        error.message ||
          'No pude crear el ticket en este momento. Intenta de nuevo.'
      );
      setStatus('idle');
    }
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
              Flujo guiado para crear un ticket y contactar al asesor digital.
            </p>
          </div>
        </div>

        <div className="flex min-h-[520px] flex-col">
          <div className="flex-1 space-y-5 p-4">
            {stepId !== 'final' ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Paso {history.length}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-50">
                  {step.title}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {step.description}
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {step.options.map((option) => (
                    <button
                      key={`${option.field}-${option.value}`}
                      type="button"
                      onClick={() => selectOption(option)}
                      className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm text-slate-100 transition-colors hover:border-blue-500 hover:bg-slate-800"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  Ticket para asesor digital
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-50">
                  Listo para contactar
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Barry usara estas respuestas para crear el mensaje de WhatsApp.
                </p>
                <div className="mt-4">
                  <TicketSummary answers={answers} />
                </div>
                {errorMessage && (
                  <div className="mt-4 rounded-md border border-red-900/70 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                    {errorMessage}
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  {!handoff?.url ? (
                    <button
                      type="button"
                      onClick={createTicket}
                      disabled={status === 'loading'}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {status === 'loading'
                        ? 'Creando ticket...'
                        : 'Crear ticket por WhatsApp'}
                    </button>
                  ) : (
                    <a
                      href={handoff.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-500"
                    >
                      {handoff.label || 'Contactar asesor digital'}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={resetFlow}
                    className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100"
                  >
                    Reiniciar
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={goBack}
                disabled={history.length <= 1 || status === 'loading'}
                className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Regresar
              </button>
              <button
                type="button"
                onClick={resetFlow}
                className="rounded-md border border-slate-800 px-3 py-2 text-xs text-slate-500 transition-colors hover:border-slate-600 hover:text-slate-300"
              >
                Limpiar flujo
              </button>
            </div>
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
            Que hace este flujo
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-slate-400">
            <li>No usa conversacion abierta.</li>
            <li>Guia al cliente con opciones multiples.</li>
            <li>Genera un ticket segun las respuestas.</li>
            <li>Abre WhatsApp con el asesor digital de Barradas.</li>
          </ul>
        </div>
      </aside>
    </section>
  );
}
