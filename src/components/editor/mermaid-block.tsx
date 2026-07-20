'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getEditorMessages, type Locale } from './i18n';

interface MermaidBlockProps {
  /**
   * Optional className applied to the wrapper div. Place this component
   * anywhere inside the rendered article; it scans the nearest ancestor
   * (or document body) for `.mermaid-block` placeholders produced by
   * `markdownToHtml` and replaces them with rendered SVGs.
   */
  className?: string;
  locale?: Locale;
}

function useIsDark() {
  const [isDark, setIsDark] = useState(
    typeof document !== 'undefined' &&
      document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() =>
      setIsDark(el.classList.contains('dark')),
    );
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ className, locale = 'en' }) => {
  const nv = getEditorMessages(locale).nodeViews;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDark = useIsDark();

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const root = wrapperRef.current?.closest('article') ?? document.body;
      const blocks = Array.from(
        root.querySelectorAll<HTMLElement>('.mermaid-block:not([data-rendered])'),
      );
      if (blocks.length === 0) return;

      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        theme: isDark ? 'dark' : 'default',
        securityLevel: 'loose',
      });

      for (const block of blocks) {
        if (cancelled) return;
        const encoded = block.getAttribute('data-mermaid') ?? '';
        const code = decodeURIComponent(encoded);
        try {
          const id = `mermaid-${Math.random().toString(36).slice(2, 11)}`;
          const { svg } = await mermaid.render(id, code);
          block.innerHTML = svg;
          block.setAttribute('data-rendered', 'true');
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          block.innerHTML = `<div style="color:#dc2626;padding:1rem;font-size:0.875rem">${nv.mermaidRenderFailed}${msg}</div>`;
          block.setAttribute('data-rendered', 'error');
        }
      }
    };

    render();

    return () => {
      cancelled = true;
    };
  }, [isDark]);

  return <div ref={wrapperRef} className={className} aria-hidden="true" />;
};