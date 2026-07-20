'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { Placeholder } from '@tiptap/extension-placeholder';
import { defaultExtensions } from './extensions';
import { Toolbar, type ToolbarCustomTool } from './toolbar';
import { FloatingToolbar } from './floating-toolbar';
import { SourcePanel } from './source-panel';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { generateJSON } from '@tiptap/core';
import { marked } from 'marked';
import { migrateMarkdownSyntax } from '../../lib/markdown-migrate';
import { getEditorMessages, type Locale } from './i18n';
import { EditorLocaleProvider } from './locale-context';

export interface WysiwygEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  showSource: boolean;
  onToggleSource: () => void;
  customTools?: ToolbarCustomTool[];
  floatingToolbar?: boolean;
  locale?: Locale;
}

function isMarkdownContent(text: string): boolean {
  const markdownPatterns = [
    /^#{1,6}\s+/m,
    /^\s*[-*+]\s+/m,
    /^\s*\d+\.\s+/m,
    /\*\*[^*]+\*\*/,
    /\*[^*]+\*/,
    /`[^`]+`/,
    /```[\s\S]*?```/,
    /^\s*>/m,
    /\[.+\]\(.+\)/,
    /!\[.*\]\(.+\)/,
    /^\s*[-*_]{3,}\s*$/m,
    /\|.+\|/,
    /<[a-z][a-z0-9+.-]*:\/\/[^>]+>/i,
  ];

  let markdownScore = 0;
  for (const pattern of markdownPatterns) {
    if (pattern.test(text)) {
      markdownScore++;
    }
  }
  return markdownScore >= 1;
}

function cursorToMarkdownLine(editor: any, markdown: string): number {
  if (!editor) return 1;
  const { from } = editor.state.selection;
  const doc = editor.state.doc;

  let charOffset = 0;
  const lines = markdown.split('\n');

  for (let nodeIndex = 0; nodeIndex < doc.content.content.length; nodeIndex++) {
    const node = doc.content.content[nodeIndex];
    const nodeSize = node.nodeSize;

    if (from <= charOffset + nodeSize) {
      const nodeText = node.textContent;
      const lineInNode = findLineInNode(nodeText, from - charOffset, lines);
      return lineInNode;
    }
    charOffset += nodeSize;
  }

  return lines.length;
}

function findLineInNode(nodeText: string, offset: number, allLines: string[]): number {
  if (!nodeText) return 1;
  for (let i = 0; i < allLines.length; i++) {
    if (allLines[i].includes(nodeText) || nodeText.includes(allLines[i].substring(0, 30))) {
      return i + 1;
    }
  }
  return 1;
}

export function WysiwygEditor({
  content,
  onChange,
  showSource,
  onToggleSource,
  customTools,
  floatingToolbar = true,
  locale = 'en',
  placeholder,
}: WysiwygEditorProps) {
  const m = getEditorMessages(locale);
  const editorRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const [activeLine, setActiveLine] = useState(1);
  const [sourceWidth, setSourceWidth] = useState(40); // percentage
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const extensions = useMemo(() => {
    const text = placeholder ?? 'Start writing...\nMarkdown supported';
    return defaultExtensions.map((ext) => {
      if (ext.name === 'placeholder') {
        return Placeholder.configure({ placeholder: text });
      }
      return ext;
    });
  }, [placeholder]);

  // Single source of truth: markdown content
  const [markdownContent, setMarkdownContent] = useState(content);
  const markdownContentRef = useRef(content);
  const editorContentRef = useRef(content);

  // Flag to prevent circular updates
  const isUpdatingFromSource = useRef(false);
  const isUpdatingFromWysiwyg = useRef(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // When external content prop changes, update markdownContent
  useEffect(() => {
    if (content !== markdownContentRef.current && !isUpdatingFromWysiwyg.current) {
      markdownContentRef.current = content;
      setMarkdownContent(content);
    }
  }, [content]);

  const handleSourceChange = useCallback((md: string) => {
    isUpdatingFromSource.current = true;
    markdownContentRef.current = md;
    setMarkdownContent(md);
    onChangeRef.current(md);

    // Parse markdown and update WYSIWYG editor (no .focus() to avoid stealing focus from source panel)
    const migrated = migrateMarkdownSyntax(md);
    marked.setOptions({ breaks: true, gfm: true });
    const html = marked.parse(migrated) as string;
    const fullJson = generateJSON(html, defaultExtensions);
    const contentNodes = fullJson.content || [];

    const ed = editorRef.current;
    if (ed) {
      ed.chain().clearContent().insertContent(contentNodes).run();
    }

    // Reset flag after a tick to allow onUpdate to fire
    setTimeout(() => {
      isUpdatingFromSource.current = false;
    }, 0);
  }, []);

  const handleFileDrop = useCallback(async (file: File) => {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      alert(m.drop.onlyMd);
      return;
    }

    if (!confirm(m.drop.replaceConfirm)) return;

    try {
      const text = await file.text();
      markdownContentRef.current = text;
      setMarkdownContent(text);
      onChangeRef.current(text);

      const migrated = migrateMarkdownSyntax(text);
      marked.setOptions({ breaks: true, gfm: true });
      const html = marked.parse(migrated) as string;
      const fullJson = generateJSON(html, defaultExtensions);
      const contentNodes = fullJson.content || [];

      const ed = editorRef.current;
      if (ed) {
        ed.chain().focus().clearContent().insertContent(contentNodes).run();
      }
    } catch (error) {
      console.error('Failed to parse markdown file:', error);
      alert(m.drop.parseFailed);
    }
  }, [m]);

  const editor = useEditor({
    extensions,
    content,
    onCreate: ({ editor }) => {
      // Get initial markdown from editor state
      const md = (editor.storage as any).markdown.getMarkdown();
      markdownContentRef.current = md;
      setMarkdownContent(md);
    },
    onUpdate: ({ editor }) => {
      if (isUpdatingFromSource.current) return;

      isUpdatingFromWysiwyg.current = true;
      const md = (editor.storage as any).markdown.getMarkdown();
      markdownContentRef.current = md;
      setMarkdownContent(md);
      onChangeRef.current(md);

      setTimeout(() => {
        isUpdatingFromWysiwyg.current = false;
      }, 0);
    },
    onSelectionUpdate: ({ editor }) => {
      if (showSource) {
        const md = markdownContentRef.current;
        const line = cursorToMarkdownLine(editor, md);
        setActiveLine(line);
      }
    },
    editorProps: {
      attributes: {
        class:
          'focus:outline-none focus:outline-none min-h-[400px] p-4',
      },
      handleDOMEvents: {
        dblclick: (view, event) => {
          const pos = (view as any).posAtCoords({ left: event.clientX, top: event.clientY });
          if (!pos) return false;
          const $pos = view.state.doc.resolve(pos.pos);
          const node = $pos.nodeAfter;
          if (node && (node.type.name === 'blockMath' || node.type.name === 'inlineMath')) {
            const latex = node.attrs.latex || '';
            const tr = view.state.tr;
            const codeBlock = view.state.schema.node('codeBlock', { language: 'latex' }, [view.state.schema.text(latex)]);
            tr.replaceWith(pos.pos, pos.pos + node.nodeSize, codeBlock);
            view.dispatch(tr);
            return true;
          }
          return false;
        },
      },
      handlePaste: (_view, event) => {
        const text = event.clipboardData?.getData('text/plain') || '';
        if (!isMarkdownContent(text)) return false;

        event.preventDefault();

        const ed = editorRef.current;
        if (!ed) return false;

        try {
          const migrated = migrateMarkdownSyntax(text);
          marked.setOptions({ breaks: true, gfm: true });
          const html = marked.parse(migrated) as string;
          const fullJson = generateJSON(html, defaultExtensions);
          const contentNodes = fullJson.content || [];

          isUpdatingFromWysiwyg.current = true;
          ed.chain().focus().insertContent(contentNodes).run();

          // Update markdownContent after paste
          setTimeout(() => {
            const md = (ed.storage as any).markdown.getMarkdown();
            markdownContentRef.current = md;
            setMarkdownContent(md);
            onChangeRef.current(md);
            isUpdatingFromWysiwyg.current = false;
          }, 0);
        } catch (error) {
          console.error('Failed to parse markdown:', error);
        }

        return true;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
    if (editor) {
      (window as any).__tiptapEditor = editor;

      // Patch serializer: tiptap-markdown maps serialize specs by extension.name,
      // but Mathematics extension is named "mathematics", not "blockMath"/"inlineMath".
      // Override the nodes getter to inject math serialize functions.
      const serializer = (editor.storage as any).markdown?.serializer;
      if (serializer) {
        const origNodesDesc = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(serializer), 'nodes');
        if (origNodesDesc?.get) {
          const origGet = origNodesDesc.get;
          Object.defineProperty(serializer, 'nodes', {
            get() {
              const map = origGet.call(serializer);
              map.blockMath = (state: any, node: any) => {
                const latex = node.attrs.latex || '';
                state.write('$$\n' + latex + '\n$$\n');
              };
              map.inlineMath = (state: any, node: any) => {
                const latex = node.attrs.latex || '';
                state.write('$' + latex + '$');
              };
              return map;
            },
            configurable: true,
          });
        }
      }
    }
  }, [editor]);

  // Drag handler for resizable panels
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const buttonWidth = 32; // w-8 = 32px for the toggle button
      const dividerWidth = 6; // divider width
      const availableWidth = rect.width - buttonWidth - dividerWidth;
      const pct = ((offsetX - buttonWidth) / availableWidth) * 100;
      setSourceWidth(Math.min(Math.max(pct, 15), 75));
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Drag and drop file handling
  useEffect(() => {
    const container = document.querySelector('.tiptap');
    if (!container) return;

    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current++;
      if (e.dataTransfer?.types.includes('Files')) {
        setIsDragOver(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragOver(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFileDrop(files[0]);
      }
    };

    container.addEventListener('dragenter', handleDragEnter as EventListener);
    container.addEventListener('dragover', handleDragOver as EventListener);
    container.addEventListener('dragleave', handleDragLeave as EventListener);
    container.addEventListener('drop', handleDrop as EventListener);

    return () => {
      container.removeEventListener('dragenter', handleDragEnter as EventListener);
      container.removeEventListener('dragover', handleDragOver as EventListener);
      container.removeEventListener('dragleave', handleDragLeave as EventListener);
      container.removeEventListener('drop', handleDrop as EventListener);
    };
  }, [editor, handleFileDrop]);

  // Sync external content changes (only when not from internal update)
  useEffect(() => {
    if (!editor || isUpdatingFromWysiwyg.current || content === editorContentRef.current) return;
    editorContentRef.current = content;

    const migrated = migrateMarkdownSyntax(content);
    marked.setOptions({ breaks: true, gfm: true });
    const html = marked.parse(migrated) as string;
    const fullJson = generateJSON(html, defaultExtensions);
    const contentNodes = fullJson.content || [];
    editor.chain().clearContent().insertContent(contentNodes).run();
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const url = prompt(m.prompts.linkUrl);
        if (url) {
          editor.chain().focus().setLink({ href: url }).run();
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'x') {
        e.preventDefault();
        editor.chain().focus().toggleStrike().run();
      }

      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'h') {
        e.preventDefault();
        editor.chain().focus().toggleHighlight().run();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const [tableCtx, setTableCtx] = useState<{ x: number; y: number } | null>(null);
  const tableCtxRef = useRef<HTMLDivElement>(null);

  const execTableCmd = useCallback((cmd: string) => {
    if (!editor) return;
    (editor.chain().focus() as any)[cmd]().run();
    setTableCtx(null);
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onContext = (e: MouseEvent) => {
      if (editor.isActive('table')) {
        e.preventDefault();
        e.stopPropagation();
        setTableCtx({ x: e.clientX, y: e.clientY });
      }
    };
    dom.addEventListener('contextmenu', onContext);
    return () => dom.removeEventListener('contextmenu', onContext);
  }, [editor]);

  useEffect(() => {
    if (!tableCtx) return;
    const close = (e: MouseEvent) => {
      if (tableCtxRef.current && !tableCtxRef.current.contains(e.target as Node)) {
        setTableCtx(null);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setTableCtx(null);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onEsc);
    };
  }, [tableCtx]);

  return (
    <EditorLocaleProvider value={locale}>
    <div className="border rounded-lg bg-white dark:bg-gray-900 flex flex-col h-full relative">
      {floatingToolbar ? (
        <FloatingToolbar editor={editor}>
          <Toolbar editor={editor} customTools={customTools} locale={locale} />
        </FloatingToolbar>
      ) : (
        <div className="flex-shrink-0">
          <Toolbar editor={editor} customTools={customTools} locale={locale} />
        </div>
      )}
      <div className="flex-1 min-h-0 flex overflow-hidden" ref={containerRef}>
        {showSource && (
          <>
            <div
              className="flex-shrink-0 overflow-hidden border-r border-gray-200 dark:border-gray-700"
              style={{ width: `${sourceWidth}%` }}
            >
              <SourcePanel
                markdown={markdownContent}
                activeLine={activeLine}
                onChange={handleSourceChange}
              />
            </div>
            <div
              className="flex-shrink-0 w-1.5 cursor-col-resize hover:bg-blue-400 dark:hover:bg-blue-500 active:bg-blue-500 dark:active:bg-blue-600 transition-colors group"
              onMouseDown={(e) => {
                e.preventDefault();
                isDragging.current = true;
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
              }}
            >
              <div className="w-px h-full bg-gray-300 dark:bg-gray-600 mx-auto group-hover:bg-white/50 group-active:bg-white/50" />
            </div>
          </>
        )}
        <div
          className="min-h-0 overflow-y-auto transition-none"
          style={{ width: showSource ? `${100 - sourceWidth}%` : '100%' }}
        >
          <EditorContent editor={editor} className="min-h-[400px]" />
        </div>
      </div>
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-blue-50/90 dark:bg-blue-900/80 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mt-2 text-lg font-medium text-blue-700 dark:text-blue-200">
              {m.drop.importHint}
            </p>
            <p className="mt-1 text-sm text-blue-500 dark:text-blue-300">
              {m.drop.onlyMarkdown}
            </p>
          </div>
        </div>
      )}
      {tableCtx && (
        <div
          ref={tableCtxRef}
          className="fixed z-[100] py-1 bg-white dark:bg-gray-800 border rounded-lg shadow-xl min-w-[160px]"
          style={{ left: tableCtx.x, top: tableCtx.y }}
        >
          <button type="button" onClick={() => execTableCmd('deleteTable')}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            {m.toolbar.tableDelete}
          </button>
          <div className="border-t my-1 border-gray-200 dark:border-gray-700" />
          <button type="button" onClick={() => execTableCmd('addRowBefore')}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {m.toolbar.rowInsertBefore}
          </button>
          <button type="button" onClick={() => execTableCmd('addRowAfter')}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {m.toolbar.rowInsertAfter}
          </button>
          <button type="button" onClick={() => execTableCmd('deleteRow')}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            {m.toolbar.rowDelete}
          </button>
          <div className="border-t my-1 border-gray-200 dark:border-gray-700" />
          <button type="button" onClick={() => execTableCmd('addColumnBefore')}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {m.toolbar.colInsertBefore}
          </button>
          <button type="button" onClick={() => execTableCmd('addColumnAfter')}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {m.toolbar.colInsertAfter}
          </button>
          <button type="button" onClick={() => execTableCmd('deleteColumn')}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            {m.toolbar.colDelete}
          </button>
          <div className="border-t my-1 border-gray-200 dark:border-gray-700" />
          <button type="button" onClick={() => execTableCmd('mergeCells')}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
            {m.toolbar.mergeCells}
          </button>
          <button type="button" onClick={() => execTableCmd('splitCell')}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/></svg>
            {m.toolbar.splitCell}
          </button>
          <div className="border-t my-1 border-gray-200 dark:border-gray-700" />
          <button type="button" onClick={() => execTableCmd('toggleHeaderRow')}
            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {m.toolbar.headerRow}
          </button>
        </div>
      )}
    </div>
    </EditorLocaleProvider>
  );
}
