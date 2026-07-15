import { Extension } from '@tiptap/core';

let lastClickTime = 0;
let lastClickHref: string | null = null;
let activeLinkEditor: HTMLTextAreaElement | null = null;
let activeLinkContainer: HTMLDivElement | null = null;

function removeEditor() {
  if (activeLinkContainer) {
    activeLinkContainer.remove();
    activeLinkContainer = null;
    activeLinkEditor = null;
  }
}

import type { EditorState } from 'prosemirror-state';

function isAutolink(text: string, href: string): boolean {
  return text === href;
}

function hasLinkMarkAtPos(state: EditorState, pos: number): boolean {
  const $pos = state.doc.resolve(pos);
  const marks = $pos.marks();
  if (marks.some((m) => m.type.name === 'link')) return true;

  const nodeAfter = state.doc.nodeAt(pos);
  if (nodeAfter && nodeAfter.isText && nodeAfter.marks.some((m) => m.type.name === 'link')) {
    return true;
  }

  return false;
}

function serializeRangeToMarkdown(state: EditorState, from: number, to: number): string {
  const slice = state.doc.slice(from, to);
  let result = '';
  for (let i = 0; i < slice.content.childCount; i++) {
    const node = slice.content.child(i);
    if (node.isText) {
      result += node.text || '';
    } else if (node.type.name === 'image') {
      const src = node.attrs.src || '';
      const alt = node.attrs.alt || '';
      result += src ? `![${alt}](${src})` : `![${alt}]()`;
    } else if (node.type.name === 'hardBreak') {
      result += '\n';
    } else {
      result += node.textContent || '';
    }
  }
  return result;
}

function findLinkAtCursor(state: EditorState, from: number) {
  const $pos = state.doc.resolve(from);
  const marks = $pos.marks();
  let linkMark = marks.find((m) => m.type.name === 'link');

  if (!linkMark) {
    const nodeAfter = state.doc.nodeAt(from);
    if (nodeAfter && nodeAfter.isText) {
      linkMark = nodeAfter.marks.find((m) => m.type.name === 'link');
    }
  }
  if (!linkMark) return null;

  const linkType = state.schema.marks.link as any;

  let startPos = from;
  let endPos = from;

  while (startPos > 0) {
    if (!hasLinkMarkAtPos(state, startPos - 1)) break;
    startPos--;
  }

  const docSize = state.doc.content.size;
  while (endPos < docSize) {
    if (!hasLinkMarkAtPos(state, endPos)) break;
    endPos++;
  }

  const text = serializeRangeToMarkdown(state, startPos, endPos);

  return {
    linkMark,
    linkType,
    startPos,
    endPos,
    text,
    href: (linkMark as any).attrs.href || '',
    title: (linkMark as any).attrs.title || '',
  };
}

export const LinkDoubleClickListener = Extension.create({
  name: 'linkDoubleClickListener',

  onCreate() {
    const editor = this.editor;
    const container = editor.view.dom;
    if (!container) return;

    container.addEventListener('mousedown', (e: MouseEvent) => {
      const now = Date.now();
      const target = e.target as HTMLElement;
      const linkEl = target.closest('a');
      const href = linkEl?.getAttribute('href') || null;

      if (target.tagName === 'IMG') {
        lastClickTime = 0;
        lastClickHref = null;
        return;
      }

      if (
        linkEl &&
        lastClickHref === href &&
        now - lastClickTime < 500
      ) {
        const headingEditor = document.querySelector('.heading-edit-wrapper');
        if (headingEditor) {
          lastClickTime = 0;
          lastClickHref = null;
          return;
        }

        lastClickTime = 0;
        lastClickHref = null;

        e.preventDefault();
        e.stopPropagation();

        removeEditor();

        const { state } = editor.view;
        const { from } = state.selection;

        const linkInfo = findLinkAtCursor(state, from);
        if (!linkInfo) return;

        const { linkMark, linkType, startPos, endPos, text, href: markHref, title } = linkInfo;
        const autolink = isAutolink(text, markHref);

        let mdLink: string;
        if (autolink) {
          mdLink = `<${markHref}>`;
        } else {
          mdLink = title ? `[${text}](${markHref} "${title}")` : `[${text}](${markHref})`;
        }

        const rect = linkEl.getBoundingClientRect();

        const textarea = document.createElement('textarea');
        textarea.value = mdLink;
        textarea.rows = 1;
        textarea.className = 'link-edit-textarea';

        const measure = document.createElement('span');
        measure.style.cssText = 'font: 14px monospace; position: absolute; visibility: hidden; white-space: pre;';
        measure.textContent = mdLink;
        document.body.appendChild(measure);
        const textWidth = measure.getBoundingClientRect().width;
        measure.remove();

        const maxW = window.innerWidth - rect.left - 60;
        const taW = Math.min(textWidth + 30, maxW);
        const needsScrollX = textWidth + 30 > maxW;

        textarea.style.cssText = `
          width: ${taW}px;
          height: ${needsScrollX ? 56 : 36}px;
          font-size: 14px;
          font-family: monospace;
          padding: 6px 12px;
          border: none;
          border-radius: 0;
          background: #fff;
          color: #171717;
          outline: none;
          resize: horizontal;
          white-space: pre;
          overflow-x: auto;
          overflow-y: hidden;
          box-sizing: border-box;
          flex: 1;
          min-width: 0;
        `;

        const openBtn = document.createElement('button');
        openBtn.textContent = '🔗';
        openBtn.title = '在新标签页打开链接';
        openBtn.style.cssText = `
          height: ${needsScrollX ? 56 : 36}px;
          padding: 0 10px;
          border: none;
          border-left: 1px solid #e5e7eb;
          border-radius: 0;
          background: #f9fafb;
          color: #6b7280;
          font-size: 16px;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
        `;
        openBtn.addEventListener('mousedown', (ev: MouseEvent) => {
          ev.preventDefault();
          ev.stopPropagation();
        });
        openBtn.addEventListener('click', (ev: MouseEvent) => {
          ev.preventDefault();
          ev.stopPropagation();
          const val = textarea.value.trim();
          let url = '';
          const standardMatch = val.match(/\]\((\S+?)(?:\s+"[^"]*")?\)/);
          if (standardMatch && standardMatch[1]) {
            url = standardMatch[1];
          } else {
            const autoMatch = val.match(/^<(\S+)>$/);
            if (autoMatch && autoMatch[1]) {
              url = autoMatch[1];
            }
          }
          if (url) {
            window.open(url, '_blank');
          }
        });

        const editContainer = document.createElement('div');
        editContainer.style.cssText = `
          position: fixed;
          left: ${rect.left}px;
          top: ${rect.top - (needsScrollX ? 56 : 40)}px;
          display: flex;
          align-items: stretch;
          z-index: 99999;
          border: 2px solid #3b82f6;
          border-radius: 6px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          overflow: hidden;
        `;
        editContainer.appendChild(textarea);
        editContainer.appendChild(openBtn);

        document.body.appendChild(editContainer);
        activeLinkContainer = editContainer;
        activeLinkEditor = textarea;

        const applyEdit = () => {
          if (!activeLinkEditor) return;
          const val = activeLinkEditor.value.trim();
          removeEditor();

          const { state: currentState } = editor.view;
          const currentLinkInfo = findLinkAtCursor(currentState, currentState.selection.from);
          if (!currentLinkInfo) return;

          const { startPos: curStart, endPos: curEnd } = currentLinkInfo;

          let newHref = '';
          let newTitle: string | null = null;
          let newLinkText = '';
          let isAuto = false;

          const stdMatch = val.match(/^\[(.+?)\]\((\S+?)(?:\s+"(.+?)")?\)$/);
          const autoMatch = val.match(/^<(\S+)>$/);

          if (stdMatch) {
            newLinkText = stdMatch[1];
            newHref = stdMatch[2];
            newTitle = stdMatch[3] || null;
          } else if (autoMatch) {
            newHref = autoMatch[1];
            newLinkText = newHref;
            isAuto = true;
          } else {
            return;
          }

          if (!newHref) return;

          const tr = currentState.tr;
          const attrs: Record<string, string> = { href: newHref };
          if (newTitle) attrs.title = newTitle;

          if (newLinkText !== currentLinkInfo.text || isAuto !== isAutolink(currentLinkInfo.text, currentLinkInfo.href)) {
            tr.delete(curStart, curEnd);
            tr.insertText(newLinkText, curStart);
            tr.addMark(curStart, curStart + newLinkText.length, currentLinkInfo.linkType.create(attrs));
          } else {
            tr.removeMark(curStart, curEnd, currentLinkInfo.linkMark);
            tr.addMark(curStart, curEnd, currentLinkInfo.linkType.create(attrs));
          }

          editor.view.dispatch(tr);
        };

        const onDocMouseDown = (ev: MouseEvent) => {
          if (!activeLinkEditor || !activeLinkContainer) {
            document.removeEventListener('mousedown', onDocMouseDown, true);
            return;
          }
          if (activeLinkContainer.contains(ev.target as Node)) return;
          document.removeEventListener('mousedown', onDocMouseDown, true);
          applyEdit();
        };
        setTimeout(() => {
          document.addEventListener('mousedown', onDocMouseDown, true);
        }, 0);
        textarea.addEventListener('keydown', (ke: KeyboardEvent) => {
          if (ke.key === 'Enter') {
            ke.preventDefault();
            applyEdit();
          }
          if (ke.key === 'Escape') {
            removeEditor();
          }
          ke.stopPropagation();
        });

        requestAnimationFrame(() => {
          textarea.focus();
          textarea.setSelectionRange(0, 0);
          textarea.scrollLeft = 0;
        });

        return;
      }

      if (linkEl) {
        lastClickTime = now;
        lastClickHref = href;
      } else {
        lastClickTime = 0;
        lastClickHref = null;
      }
    }, true);
  },
});
