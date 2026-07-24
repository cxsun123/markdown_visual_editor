'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { createLongPressHandler } from '../../lib/touch-edit';

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

function parseInlineMarkdown(text: string, schema: any): any[] {
  const nodes: any[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const linkMatch = remaining.match(/^\[(.+?)\]\((\S+?)(?:\s+"([^"]*)")?\)/);
    if (linkMatch) {
      const linkText = linkMatch[1];
      const href = linkMatch[2];
      const title = linkMatch[3];
      const attrs: Record<string, string> = { href };
      if (title) attrs.title = title;
      nodes.push(schema.text(linkText, [schema.marks.link.create(attrs)]));
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    if (boldMatch) {
      nodes.push(schema.text(boldMatch[1], [schema.marks.bold.create()]));
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    const italicMatch = remaining.match(/^\*(.+?)\*(?!\*)/);
    if (italicMatch) {
      nodes.push(schema.text(italicMatch[1], [schema.marks.italic.create()]));
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    const strikeMatch = remaining.match(/^~~(.+?)~~/);
    if (strikeMatch) {
      nodes.push(schema.text(strikeMatch[1], [schema.marks.strike.create()]));
      remaining = remaining.slice(strikeMatch[0].length);
      continue;
    }

    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      nodes.push(schema.text(codeMatch[1], [schema.marks.code.create()]));
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    const nextSpecial = remaining.search(/[[*`~_<$]/);
    if (nextSpecial === 0) {
      nodes.push(schema.text(remaining[0]));
      remaining = remaining.slice(1);
    } else if (nextSpecial === -1) {
      nodes.push(schema.text(remaining));
      remaining = '';
    } else {
      nodes.push(schema.text(remaining.slice(0, nextSpecial)));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return nodes;
}

export const HeadingNodeView: React.FC<NodeViewProps> = ({ node, updateAttributes, editor, getPos }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);
  const editorRef = useRef(editor);
  const getPosRef = useRef(getPos);

  const { level } = node.attrs;

  useEffect(() => {
    editorRef.current = editor;
    getPosRef.current = getPos;
  });

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

  const handleEdit = useCallback(() => {
    if (isEditingRef.current) return;
    const hashes = '#'.repeat(level || 1);
    const content = serializeNodeToMarkdown(node);
    setEditValue(`${hashes} ${content}`);
    setIsEditing(true);
  }, [node, level]);

  const editHandlers = createLongPressHandler(handleEdit);

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
    const match = markdown.match(/^(#{1,6})\s+([\s\S]+)$/);
    if (!match) return;

    const newLevel = match[1].length;
    const contentText = match[2];

    const ed = editorRef.current;
    const posFn = getPosRef.current;
    if (!ed || !posFn) return;

    const pos = posFn();
    if (typeof pos !== 'number') return;

    const headingNode = ed.state.doc.nodeAt(pos);
    if (!headingNode) return;

    const textNodes = parseInlineMarkdown(contentText, ed.state.schema);

    const tr = ed.state.tr;
    tr.replaceWith(pos + 1, pos + headingNode.nodeSize, textNodes);
    tr.setNodeMarkup(pos, null, { level: newLevel });
    ed.view.dispatch(tr);
  };

  if (isEditing) {
    return (
      <NodeViewWrapper as="div" className="heading-edit-wrapper" ref={wrapperRef}>
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="heading-edit-textarea"
          rows={1}
          spellCheck={false}
        />
      </NodeViewWrapper>
    );
  }

  const Tag = `h${level || 1}` as keyof React.JSX.IntrinsicElements;
  const sizeClasses: Record<number, string> = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-bold',
    3: 'text-xl font-bold',
    4: 'text-lg font-bold',
    5: 'text-base font-bold',
    6: 'text-sm font-bold text-gray-600',
  };

  return (
    <NodeViewWrapper as="div" className="heading-view-wrapper">
      <Tag
        {...editHandlers}
        className={`${sizeClasses[level || 1]} cursor-pointer rounded px-1 -mx-1 select-none`}
      >
        <NodeViewContent />
      </Tag>
    </NodeViewWrapper>
  );
};
