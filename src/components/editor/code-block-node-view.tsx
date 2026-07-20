'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { common, createLowlight } from 'lowlight';
import { toHtml } from 'hast-util-to-html';
import { createLongPressHandler } from '../../lib/touch-edit';
import { getEditorMessages } from './i18n';
import { useEditorLocale } from './locale-context';

const lowlight = createLowlight(common);

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export const CodeBlockNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, editor }) => {
  const locale = useEditorLocale();
  const nv = getEditorMessages(locale).nodeViews;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.textContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const previewRef = useRef<HTMLPreElement>(null);

  const language = node.attrs.language || 'text';

  const highlightedHtml = useMemo(() => {
    if (!language || language === 'text') return escapeHtml(editValue);
    try {
      const tree = lowlight.highlight(language, editValue);
      return toHtml(tree);
    } catch {
      return escapeHtml(editValue);
    }
  }, [editValue, language]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing && preRef.current) {
      if (language && language !== 'text') {
        try {
          const tree = lowlight.highlight(language, node.textContent);
          preRef.current.innerHTML = toHtml(tree);
        } catch {
          preRef.current.textContent = node.textContent;
        }
      } else {
        preRef.current.textContent = node.textContent;
      }
    }
  }, [isEditing, node.textContent, language]);

  const handleEdit = () => {
    setEditValue(node.textContent);
    setIsEditing(true);
  };

  const editHandlers = createLongPressHandler(handleEdit);

  const handleSave = () => {
    // Update the node content by replacing the entire code block content
    const { state } = editor;
    const { doc } = state;
    
    // Find the position of this code block
    let nodePos = -1;
    doc.descendants((n, pos) => {
      if (n === node) {
        nodePos = pos;
        return false;
      }
    });
    
    if (nodePos >= 0) {
      const tr = state.tr;
      // Delete the existing content and insert new content
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
    // Allow Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = editValue.substring(0, start) + '  ' + editValue.substring(end);
        setEditValue(newValue);
        // Set cursor position after the inserted spaces
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  if (isEditing) {
    return (
      <NodeViewWrapper as="div" className="code-block-edit-wrapper my-4">
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs text-gray-500 flex items-center justify-between">
            <span>{nv.codeEditor} - {language}</span>
            <span className="text-gray-400">{nv.codeSaveHint}</span>
          </div>
          <div className="relative">
            <pre
              ref={previewRef}
              className="absolute inset-0 p-3 font-mono text-sm overflow-hidden whitespace-pre-wrap pointer-events-none select-none m-0 border-0 bg-white dark:bg-gray-900 rounded-none"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              aria-hidden="true"
            />
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onScroll={() => {
                if (previewRef.current && textareaRef.current) {
                  previewRef.current.scrollTop = textareaRef.current.scrollTop;
                  previewRef.current.scrollLeft = textareaRef.current.scrollLeft;
                }
              }}
              onKeyDown={handleKeyDown}
              className="relative w-full p-3 font-mono text-sm border-0 focus:outline-none resize-none bg-transparent text-transparent caret-gray-800 dark:caret-gray-200"
              rows={Math.max(8, editValue.split('\n').length + 2)}
              spellCheck={false}
            />
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
      className="code-block-wrapper my-4"
    >
      <div className="relative group">
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
            {language || 'text'} | {nv.longPressEdit}
          </span>
        </div>
        <pre
          ref={preRef}
          {...editHandlers}
          className="p-4 rounded-lg overflow-x-auto cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors select-none"
          style={{ margin: 0 }}
        >
          <code>{node.textContent}</code>
        </pre>
      </div>
    </NodeViewWrapper>
  );
};
