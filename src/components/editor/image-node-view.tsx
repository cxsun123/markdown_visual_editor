'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { createLongPressHandler } from '@/lib/touch-edit';

export const ImageNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, editor, getPos }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const isEditingRef = useRef(false);

  const { src, alt, title } = node.attrs;

  const parseAndApply = useCallback((markdown: string) => {
    let imgMatch = markdown.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
    let linkHref = '';
    let linkTitle = '';

    if (!imgMatch) {
      const wrappedMatch = markdown.match(/^\[(!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\))\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/);
      if (wrappedMatch) {
        imgMatch = ['', wrappedMatch[2] || '', wrappedMatch[3] || '', wrappedMatch[4] || ''];
        linkHref = wrappedMatch[5] || '';
        linkTitle = wrappedMatch[6] || '';
      }
    }

    if (imgMatch) {
      const newAttrs: Record<string, string | null> = {
        alt: imgMatch[1] || null,
        src: imgMatch[2] || null,
        title: imgMatch[3] || null,
      };
      updateAttributes(newAttrs);

      if (linkHref) {
        try {
          const pos = getPos();
          if (typeof pos === 'number') {
            const nodeAtPos = editor.state.doc.nodeAt(pos);
            if (nodeAtPos) {
              const linkMark = nodeAtPos.marks.find(m => m.type.name === 'link');
              if (linkMark) {
                const linkAttrs: { href: string; title?: string } = { href: linkHref };
                if (linkTitle) linkAttrs.title = linkTitle;
                editor.chain().focus().extendMarkRange('link').unsetLink().run();
                setTimeout(() => {
                  try {
                    const newPos = getPos();
                    if (typeof newPos === 'number') {
                      const newNode = editor.state.doc.nodeAt(newPos);
                      if (newNode) {
                        const to = newPos + newNode.nodeSize;
                        editor.chain().focus().setTextSelection({ from: newPos, to }).setLink(linkAttrs).run();
                      }
                    }
                  } catch {}
                }, 0);
              }
            }
          }
        } catch {}
      }
    }
  }, [updateAttributes, editor, getPos]);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // 使用原生事件监听 blur
  useEffect(() => {
    if (!isEditing || !textareaRef.current) return;

    const textarea = textareaRef.current;

    const handleBlur = () => {
      // 延迟执行，避免点击按钮时提前触发
      setTimeout(() => {
        if (!isEditingRef.current) return;
        parseAndApply(editValue);
        setIsEditing(false);
      }, 150);
    };

    textarea.addEventListener('blur', handleBlur);
    return () => textarea.removeEventListener('blur', handleBlur);
  }, [isEditing, editValue, parseAndApply]);

  const handleEdit = useCallback(() => {
    if (isEditingRef.current) return;

    let linkMd = '';
    try {
      const pos = getPos();
      if (typeof pos === 'number') {
        const nodeAtPos = editor.state.doc.nodeAt(pos);
        if (nodeAtPos) {
          const linkMark = nodeAtPos.marks.find(m => m.type.name === 'link');
          if (linkMark) {
            const href = linkMark.attrs.href || '';
            const linkTitle = linkMark.attrs.title || '';
            const inner = `![${alt || ''}](${src || ''}${title ? ` "${title}"` : ''})`;
            linkMd = linkTitle ? `[${inner}](${href} "${linkTitle}")` : `[${inner}](${href})`;
          }
        }
      }
    } catch {}

    const markdown = linkMd || `![${alt || ''}](${src || ''}${title ? ` "${title}"` : ''})`;
    setEditValue(markdown);
    setIsEditing(true);
  }, [src, alt, title, editor, getPos]);

  const editHandlers = createLongPressHandler(handleEdit);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      parseAndApply(editValue);
      setIsEditing(false);
    }
  }, [editValue, parseAndApply]);

  if (isEditing) {
    return (
      <NodeViewWrapper as="span" className="image-edit-wrapper" ref={wrapperRef}>
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="image-edit-textarea"
          rows={2}
          spellCheck={false}
        />
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper as="span" className="image-view-wrapper">
      <img
        src={src}
        alt={alt || ''}
        title={title || undefined}
        {...editHandlers}
        className="max-w-full h-auto rounded-lg cursor-pointer hover:ring-2 hover:ring-blue-400 select-none"
        draggable="true"
        contentEditable={false}
      />
    </NodeViewWrapper>
  );
};
