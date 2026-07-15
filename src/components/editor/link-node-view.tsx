'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';

export const LinkNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const isEditingRef = useRef(false);

  const { href, title } = node.attrs;
  const textContent = node.textContent || href || '';

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
        parseAndApply(editValue);
        setIsEditing(false);
      }, 150);
    };

    textarea.addEventListener('blur', handleBlur);
    return () => textarea.removeEventListener('blur', handleBlur);
  }, [isEditing, editValue]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const markdown = `[${textContent}](${href || ''}${title ? ` "${title}"` : ''})`;
    setEditValue(markdown);
    setIsEditing(true);
  }, [textContent, href, title]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      parseAndApply(editValue);
      setIsEditing(false);
    }
  }, [editValue]);

  const parseAndApply = (markdown: string) => {
    const match = markdown.match(/^\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    if (match) {
      const newAttrs = {
        href: match[2] || null,
        title: match[3] || null,
      };
      console.log('Updating link attributes:', newAttrs);
      updateAttributes(newAttrs);
    }
  };

  if (isEditing) {
    return (
      <NodeViewWrapper as="span" className="link-edit-wrapper" ref={wrapperRef}>
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="link-edit-textarea"
          rows={1}
          spellCheck={false}
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="span" className="link-view-wrapper">
      <a
        href={href || '#'}
        title={title || undefined}
        onDoubleClick={handleDoubleClick}
        className="text-blue-500 hover:underline cursor-pointer hover:ring-2 hover:ring-blue-400 rounded"
        onClick={(e) => e.preventDefault()}
      >
        {textContent || href}
      </a>
    </NodeViewWrapper>
  );
};
