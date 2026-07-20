'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { common, createLowlight } from 'lowlight';
import { toHtml } from 'hast-util-to-html';
import { getEditorMessages } from './i18n';
import { useEditorLocale } from './locale-context';

const lowlight = createLowlight(common);

interface SourcePanelProps {
  markdown: string;
  activeLine: number;
  onChange: (markdown: string) => void;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightMarkdown(text: string): string {
  if (!text) return '';
  try {
    const tree = lowlight.highlight('markdown', text);
    return toHtml(tree);
  } catch {
    return escapeHtml(text);
  }
}

export function SourcePanel({ markdown, activeLine, onChange }: SourcePanelProps) {
  const locale = useEditorLocale();
  const m = getEditorMessages(locale);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mdRef = useRef(markdown ?? '');
  const [localValue, setLocalValue] = useState(() => {
    mdRef.current = markdown ?? '';
    return mdRef.current;
  });
  const isExternalChange = useRef(false);

  useEffect(() => {
    const md = markdown ?? '';
    if (md !== mdRef.current && !isExternalChange.current) {
      mdRef.current = md;
      // Save cursor position before update, restore after
      const ta = textareaRef.current;
      let selStart = 0;
      let selEnd = 0;
      if (ta && ta === document.activeElement) {
        selStart = ta.selectionStart;
        selEnd = ta.selectionEnd;
      }
      setLocalValue(md);
      if (ta && ta === document.activeElement) {
        // Restore after React re-renders
        requestAnimationFrame(() => {
          ta.selectionStart = selStart;
          ta.selectionEnd = selEnd;
        });
      }
    }
    isExternalChange.current = false;
  }, [markdown]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    mdRef.current = newValue;
    setLocalValue(newValue);
    isExternalChange.current = true;
    onChange(newValue);
  }, [onChange]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, [localValue]);

  const highlightedHtml = highlightMarkdown(localValue);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-[#1e1e1e] text-sm font-mono transition-colors">
      <div className="flex-shrink-0 px-3 py-1.5 bg-gray-100 dark:bg-[#252526] border-b border-gray-200 dark:border-[#3c3c3c] text-gray-500 dark:text-[#cccccc] text-xs transition-colors">
        {m.toolbar.sourceEditor}
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 relative overflow-hidden">
        <div
          ref={highlightRef}
          className="absolute inset-0 pointer-events-none overflow-hidden p-2"
          aria-hidden="true"
        >
          <pre className="m-0 whitespace-pre-wrap break-words text-gray-900 dark:text-[#d4d4d4] leading-relaxed">
            <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
          </pre>
        </div>
        <textarea
          ref={textareaRef}
          value={localValue}
          onChange={handleChange}
          onScroll={handleScroll}
          className="absolute inset-0 w-full h-full resize-none bg-transparent text-transparent caret-black dark:caret-white p-2 outline-none leading-relaxed"
          style={{ WebkitTextFillColor: 'transparent' }}
          spellCheck={false}
          autoFocus={false}
        />
      </div>
    </div>
  );
}
