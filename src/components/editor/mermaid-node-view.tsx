'use client';

import React, { useEffect, useRef, useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { createLongPressHandler } from '../../lib/touch-edit';
import { getEditorMessages } from './i18n';
import { useEditorLocale } from './locale-context';

function useIsDark() {
  const [isDark, setIsDark] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  useEffect(() => {
    const el = document.documentElement;
    const obs = new MutationObserver(() => setIsDark(el.classList.contains('dark')));
    obs.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

export const MermaidNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, editor }) => {
  const locale = useEditorLocale();
  const nv = getEditorMessages(locale).nodeViews;
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.textContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDark = useIsDark();

  const code = node.textContent;

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!code || isEditing) return;

    const renderMermaid = async () => {
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          securityLevel: 'loose',
        });

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: renderedSvg } = await mermaid.render(id, code);
        setSvg(renderedSvg);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to render mermaid diagram');
        setSvg('');
      }
    };

    renderMermaid();
  }, [code, isEditing, isDark]);

  const handleEdit = () => {
    setEditValue(code);
    setIsEditing(true);
  };

  const editHandlers = createLongPressHandler(handleEdit);

  const handleSave = () => {
    const { state } = editor;
    const { doc } = state;
    let nodePos = -1;
    doc.descendants((n, pos) => {
      if (n === node) {
        nodePos = pos;
        return false;
      }
    });
    if (nodePos >= 0) {
      const tr = state.tr;
      const textNode = state.schema.text(editValue);
      tr.replaceWith(nodePos + 1, nodePos + 1 + node.textContent.length, textNode);
      editor.view.dispatch(tr);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(code);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  if (isEditing) {
    return (
      <NodeViewWrapper as="div" className="mermaid-edit-wrapper my-4">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-gray-500 flex items-center justify-between">
            <span>{nv.mermaidEditor}</span>
            <span className="text-gray-400">{nv.mermaidSaveHint}</span>
          </div>
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full p-3 font-mono text-sm border-0 focus:outline-none resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            rows={8}
            spellCheck={false}
          />
          <div className="flex gap-2 p-2 bg-gray-50 dark:bg-gray-800 border-t">
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {nv.save}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {nv.cancel}
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      as="div"
      className="mermaid-wrapper my-4 cursor-pointer hover:opacity-80 transition-opacity select-none"
      {...editHandlers}
    >
      {error ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
          <p className="font-medium">{nv.renderError}</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-xs text-red-500">{nv.longPressSource}</p>
        </div>
      ) : svg ? (
        <div
          className="mermaid-content flex justify-center"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-center text-gray-500">
          {nv.loading}
        </div>
      )}
    </NodeViewWrapper>
  );
};
