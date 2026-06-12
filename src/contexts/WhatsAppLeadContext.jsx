import React, { createContext, useContext, useCallback } from 'react';

const WhatsAppLeadContext = createContext({
  open: () => {},
  close: () => {},
});

const PROTOCOL_API = 'https://unmixovbnmnbnrxiocsu.supabase.co/functions/v1/utm-protocol';
const SLUG = 'jfhydraulic';
const STORE = 'gc_track';
const FALLBACK_WA =
  'https://wa.me/5519974194374?text=' +
  encodeURIComponent('Olá! Quero um orçamento.');

export const WhatsAppLeadProvider = ({ children }) => {
  // Clique vai DIRETO pro WhatsApp já com o protocolo Gera Cliente.
  // Sucesso: abre o wa_link retornado pela API (mensagem + protocolo prontos).
  // Falha/timeout: abre o fallback fixo. O lead nunca fica bloqueado por erro da API.
  const open = useCallback(() => {
    // Abre a aba SÍNCRONA no clique (evita popup blocker no Safari/iOS);
    // a URL é definida depois, quando a API responde (ou no fallback).
    const win = window.open('', '_blank');
    const go = (url) => {
      if (win && !win.closed) win.location.href = url;
      else window.location.href = url;
    };
    const fallback = () => go(FALLBACK_WA);

    let payload = {};
    try {
      payload = JSON.parse(sessionStorage.getItem(STORE) || '{}') || {};
    } catch {
      payload = {};
    }
    payload.slug = SLUG;
    if (!payload.landing_page) payload.landing_page = window.location.href;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);

    fetch(PROTOCOL_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((j) => {
        clearTimeout(timer);
        if (j && j.wa_link) go(j.wa_link);
        else fallback();
      })
      .catch(() => {
        clearTimeout(timer);
        fallback();
      });
  }, []);

  const close = useCallback(() => {}, []);

  return (
    <WhatsAppLeadContext.Provider value={{ open, close }}>
      {children}
    </WhatsAppLeadContext.Provider>
  );
};

export const useWhatsAppLead = () => useContext(WhatsAppLeadContext);
