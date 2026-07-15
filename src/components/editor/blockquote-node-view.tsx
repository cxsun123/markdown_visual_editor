'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { createLongPressHandler } from '@/lib/touch-edit';

function serializeNodeToMarkdown(node: unknown): string {
  const n = node as Record<string, unknown>;
  if (!n) return '';
  if (n.type === 'text') {
    let text = (n.text as string) || '';
    if (n.marks) {
      for (const mark of n.marks as Array<Record<string, unknown>>) {
        const markName = typeof mark.type === 'string' ? mark.type : (mark.type as Record<string, unknown>)?.name;
        if (markName === 'bold') text = `**${text}**`;
        if (markName === 'italic') text = `*${text}*`;
        if (markName === 'strike') text = `~~${text}~~`;
        if (markName === 'code') text = `\`${text}\``;
        if (markName === 'link') {
          const markAttrs = mark.attrs as Record<string, string> | undefined;
          const href = markAttrs?.href || '';
          const title = markAttrs?.title;
          text = title ? `[${text}](${href} "${title}")` : `[${text}](${href})`;
        }
      }
    }
    return text;
  }
  const json = n.toJSON ? (n.toJSON as () => Record<string, unknown>)() : n;
  if (json && json.content && Array.isArray(json.content)) {
    return json.content.map((child: Record<string, unknown>) => serializeNodeToMarkdown(child)).join('');
  }
  return (n.textContent as string) || '';
}

export const BlockquoteNodeView: React.FC<NodeViewProps> = ({ node, editor }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);

  const textContent = node.textContent || '';

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing || !textareaRef.current) return;

    const textarea = textareaRef.current;

    const handleBlur = () => {
      setTimeout(() => {
        if (!isEditingRef.current) return;
        applyChanges(editValue);
        setIsEditing(false);
      }, 150);
    };

    textarea.addEventListener('blur', handleBlur);
    return () => textarea.removeEventListener('blur', handleBlur);
  }, [isEditing, editValue]);

  const handleEdit = useCallback(() => {
    if (isEditingRef.current) return;
    const content = serializeNodeToMarkdown(node);
    const lines = content.split('\n').map(line => `> ${line}`).join('\n');
    setEditValue(lines || '> ');
    setIsEditing(true);
  }, [node]);

  const editHandlers = createLongPressHandler(handleEdit);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      applyChanges(editValue);
      setIsEditing(false);
    }
  }, [editValue]);

  const applyChanges = (markdown: string) => {
    const lines = markdown.split('\n')
      .map(line => line.replace(/^>\s*/, ''))
      .filter(line => line.length > 0);
    const newText = lines.join('\n');
    console.log('Updating blockquote:', newText);

    // 删除当前节点并插入新内容
    const { state } = editor;
    const { from, to } = state.selection;
    const pos = from;

    editor.chain()
      .focus()
      .deleteRange({ from: pos - node.nodeSize, to: pos })
      .insertContentAt(pos - node.nodeSize, `<blockquote><p>${newText}</p></blockquote>`)
      .run();
  };

  if (isEditing) {
    return (
      <NodeViewWrapper as="div" className="blockquote-edit-wrapper" ref={wrapperRef}>
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="blockquote-edit-textarea"
          rows={3}
          spellCheck={false}
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="div" className="blockquote-view-wrapper">
      <blockquote
        {...editHandlers}
        className="border-l-4 border-blue-500 pl-4 italic text-gray-600 cursor-pointer rounded select-none"
      >
        <p>{textContent}</p>
      </blockquote>
    </NodeViewWrapper>
  );
};
