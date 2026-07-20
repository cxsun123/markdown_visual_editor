'use client';

import React, { useEffect, useRef, useState } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import katex from 'katex';
import { createLongPressHandler } from '../../lib/touch-edit';
import { getEditorMessages } from './i18n';
import { useEditorLocale } from './locale-context';

export const KatexCodeBlockNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, editor }) => {
  const locale = useEditorLocale();
  const nv = getEditorMessages(locale).nodeViews;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.textContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const language = node.attrs.language || 'latex';
  const isDisplayMode = true; // Code blocks are always display mode

  const renderedKatex = (() => {
    try {
      return katex.renderToString(editValue, {
        throwOnError: false,
        displayMode: isDisplayMode,
      });
    } catch {
      return `<pre><code>${editValue}</code></pre>`;
    }
  })();

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setEditValue(node.textContent);
    setIsEditing(true);
  };

  const editHandlers = createLongPressHandler(handleEdit);

  const handleDblClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleEdit();
  };

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
    
    updateAttributes({ language });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(node.textContent);
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
      <NodeViewWrapper as="div" className="katex-code-block-edit-wrapper my-4">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-gray-500 flex items-center justify-between">
            <span>{nv.katexEditor}</span>
            <span className="text-gray-400">{nv.katexSaveHint}</span>
          </div>
          <div className="p-4 bg-white dark:bg-gray-900">
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full p-3 font-mono text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={Math.max(4, editValue.split('\n').length + 2)}
              spellCheck={false}
            />
            <div className="mt-3 p-3 border rounded bg-gray-50 dark:bg-gray-800">
              <div className="text-xs text-gray-500 mb-2">{nv.preview}</div>
              <div 
                className="katex-preview"
                dangerouslySetInnerHTML={{ __html: renderedKatex }}
              />
            </div>
          </div>
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
      className="katex-code-block-wrapper my-4"
    >
      <div className="relative group">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
            {language} | {nv.longPressEdit}
          </span>
        </div>
        <div
          ref={containerRef}
          {...editHandlers}
          onDoubleClick={handleDblClick}
          className="p-4 rounded-lg overflow-x-auto cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors select-none"
          dangerouslySetInnerHTML={{ __html: renderedKatex }}
        />
      </div>
    </NodeViewWrapper>
  );
};
