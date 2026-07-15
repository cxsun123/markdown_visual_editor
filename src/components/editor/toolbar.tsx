'use client';

import { type Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  CodeSquare,
  Link,
  Image,
  Minus,
  Undo,
  Redo,
  Table,
  Highlighter,
  Subscript,
  Superscript,
  ChevronDown,
  Palette,
  PaintBucket,
  Sigma,
  GitBranch,
} from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { ColorPickerPanel } from './color-picker-panel';

interface ToolbarProps {
  editor: Editor | null;
}

const FONT_COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
  '#FF0000', '#FF3366', '#FF6600', '#FF9933',
  '#FFFF00', '#FFFF66',
  '#00FF00', '#66FF66', '#009900',
  '#0066FF', '#6699FF', '#000099',
  '#9900FF', '#CC66FF', '#660099',
];

const BG_COLORS = [
  '#FFFFFF', '#FFFF00', '#00FF00', '#00FFFF',
  '#0000FF', '#FF00FF', '#FF0000', '#FF6600',
  '#FFFF66', '#66FF66', '#66FFFF', '#6666FF',
  '#FF66FF', '#FF9999', '#FFCC99', '#FFFFCC',
  '#CCFFCC', '#CCFFFF', '#CCCCFF', '#FFCCFF',
  '#999999', '#CCCCCC', '#666666', '#333333',
];

export function Toolbar({ editor }: ToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showHeadingMenu, setShowHeadingMenu] = useState(false);
  const [showFontColorPicker, setShowFontColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const headingMenuRef = useRef<HTMLDivElement>(null);
  const fontColorRef = useRef<HTMLDivElement>(null);
  const bgColorRef = useRef<HTMLDivElement>(null);
  const tableMenuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headingMenuRef.current && !headingMenuRef.current.contains(e.target as Node)) {
        setShowHeadingMenu(false);
      }
      if (fontColorRef.current && !fontColorRef.current.contains(e.target as Node)) {
        setShowFontColorPicker(false);
      }
      if (bgColorRef.current && !bgColorRef.current.contains(e.target as Node)) {
        setShowBgColorPicker(false);
      }
      if (tableMenuRef.current && !tableMenuRef.current.contains(e.target as Node)) {
        setShowTableMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setLink = useCallback(() => {
    if (!editor) return;

    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setShowLinkInput(false);
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: linkUrl })
      .run();
    setShowLinkInput(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    const url = prompt('请输入图片URL:');
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    }
  }, [editor]);

  const isInTable = editor?.isActive('table');

  const deleteTable = useCallback(() => {
    editor?.chain().focus().deleteTable().run();
    setShowTableMenu(false);
  }, [editor]);

  const addRowBefore = useCallback(() => {
    editor?.chain().focus().addRowBefore().run();
    setShowTableMenu(false);
  }, [editor]);

  const addRowAfter = useCallback(() => {
    editor?.chain().focus().addRowAfter().run();
    setShowTableMenu(false);
  }, [editor]);

  const deleteRow = useCallback(() => {
    editor?.chain().focus().deleteRow().run();
    setShowTableMenu(false);
  }, [editor]);

  const addColumnBefore = useCallback(() => {
    editor?.chain().focus().addColumnBefore().run();
    setShowTableMenu(false);
  }, [editor]);

  const addColumnAfter = useCallback(() => {
    editor?.chain().focus().addColumnAfter().run();
    setShowTableMenu(false);
  }, [editor]);

  const deleteColumn = useCallback(() => {
    editor?.chain().focus().deleteColumn().run();
    setShowTableMenu(false);
  }, [editor]);

  const mergeCells = useCallback(() => {
    editor?.chain().focus().mergeCells().run();
    setShowTableMenu(false);
  }, [editor]);

  const splitCell = useCallback(() => {
    editor?.chain().focus().splitCell().run();
    setShowTableMenu(false);
  }, [editor]);

  const toggleHeaderRow = useCallback(() => {
    editor?.chain().focus().toggleHeaderRow().run();
    setShowTableMenu(false);
  }, [editor]);

  // 获取当前标题级别
  const getCurrentHeadingLevel = (): number => {
    for (let i = 1; i <= 6; i++) {
      if (editor?.isActive('heading', { level: i })) {
        return i;
      }
    }
    return 0;
  };

  const currentHeadingLevel = getCurrentHeadingLevel();

  const headingOptions = [
    { level: 1, label: '标题 1', size: 'text-xl font-bold' },
    { level: 2, label: '标题 2', size: 'text-lg font-bold' },
    { level: 3, label: '标题 3', size: 'text-base font-bold' },
    { level: 4, label: '标题 4', size: 'text-sm font-bold' },
    { level: 5, label: '标题 5', size: 'text-xs font-bold' },
    { level: 6, label: '标题 6', size: 'text-xs font-bold text-gray-600' },
  ];

  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-800 flex-wrap">
      {/* 撤销/重做 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
        title="撤销 (Ctrl+Z)"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
        title="重做 (Ctrl+Shift+Z)"
      >
        <Redo className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* 标题下拉选择 */}
      <div className="relative" ref={headingMenuRef}>
        <button
          type="button"
          onClick={() => setShowHeadingMenu(!showHeadingMenu)}
          className={`flex items-center gap-1 p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            currentHeadingLevel > 0 ? 'bg-gray-200 dark:bg-gray-700' : ''
          }`}
          title="标题"
        >
          {currentHeadingLevel > 0 ? (
            <span className="text-sm font-bold">H{currentHeadingLevel}</span>
          ) : (
            <Heading1 className="h-4 w-4" />
          )}
          <ChevronDown className="h-3 w-3" />
        </button>
        {showHeadingMenu && (
          <div className="absolute top-full left-0 mt-1 py-1 bg-white dark:bg-gray-800 border rounded shadow-lg z-20 min-w-[120px]">
            {headingOptions.map((option) => (
              <button
                key={option.level}
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: option.level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
                  setShowHeadingMenu(false);
                }}
                className={`w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                  currentHeadingLevel === option.level ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                <span className={`${option.size}`}>H{option.level}</span>
                <span className="text-xs text-gray-500">{option.label}</span>
              </button>
            ))}
            <div className="border-t mt-1 pt-1">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setShowHeadingMenu(false);
                }}
                className={`w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  currentHeadingLevel === 0 && editor.isActive('paragraph') ? 'bg-gray-100 dark:bg-gray-700' : ''
                }`}
              >
                <span className="text-sm">正文</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* 字符格式 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="粗体 (Ctrl+B)"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="斜体 (Ctrl+I)"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('strike') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="删除线"
      >
        <Strikethrough className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('code') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="行内代码"
      >
        <Code className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('highlight') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="高亮"
      >
        <Highlighter className="h-4 w-4" />
      </button>

      {/* 字体颜色 */}
      <div className="relative" ref={fontColorRef}>
        <button
          type="button"
          onClick={() => setShowFontColorPicker(!showFontColorPicker)}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 relative"
          title="字体颜色"
        >
          <Palette className="h-4 w-4" />
          <div
            className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-3 h-1 rounded-sm"
            style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}
          />
        </button>
        {showFontColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border rounded shadow-lg z-20 p-2.5">
            <ColorPickerPanel
              colors={FONT_COLORS}
              currentColor={editor.getAttributes('textStyle').color || '#000000'}
              onSelectColor={(color) => {
                editor.chain().focus().setColor(color).run();
                setShowFontColorPicker(false);
              }}
              onReset={() => {
                editor.chain().focus().unsetColor().run();
                setShowFontColorPicker(false);
              }}
            />
          </div>
        )}
      </div>

      {/* 背景颜色 */}
      <div className="relative" ref={bgColorRef}>
        <button
          type="button"
          onClick={() => setShowBgColorPicker(!showBgColorPicker)}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 relative"
          title="背景颜色"
        >
          <PaintBucket className="h-4 w-4" />
          <div
            className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-3 h-1 rounded-sm"
            style={{ backgroundColor: editor.getAttributes('highlight').color || '#ffff00' }}
          />
        </button>
        {showBgColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border rounded shadow-lg z-20 p-2.5">
            <ColorPickerPanel
              colors={BG_COLORS}
              currentColor={editor.getAttributes('highlight').color || '#ffff00'}
              onSelectColor={(color) => {
                editor.chain().focus().toggleHighlight({ color }).run();
                setShowBgColorPicker(false);
              }}
              onReset={() => {
                editor.chain().focus().unsetHighlight().run();
                setShowBgColorPicker(false);
              }}
            />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('subscript') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="下标"
      >
        <Subscript className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('superscript')
            ? 'bg-gray-200 dark:bg-gray-700'
            : ''
        }`}
        title="上标"
      >
        <Superscript className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* 块级元素 */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="无序列表"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('orderedList')
            ? 'bg-gray-200 dark:bg-gray-700'
            : ''
        }`}
        title="有序列表"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('taskList') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="任务列表"
      >
        <ListChecks className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="引用块"
      >
        <Quote className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
          editor.isActive('codeBlock') ? 'bg-gray-200 dark:bg-gray-700' : ''
        }`}
        title="代码块"
      >
        <CodeSquare className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          const latex = prompt('输入 LaTeX 公式:', 'E = mc^2');
          if (latex) {
            editor.chain().focus().insertContent({
              type: 'inlineMath',
              attrs: { latex },
            }).run();
          }
        }}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="行内公式 (KaTeX)"
      >
        <Sigma className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => {
          const latex = prompt('输入 LaTeX 公式:', '\\int_a^b x^2 dx');
          if (latex) {
            editor.chain().focus().insertContent({
              type: 'blockMath',
              attrs: { latex },
            }).run();
          }
        }}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="块级公式 (KaTeX)"
      >
        <span className="text-xs font-bold">∑</span>
      </button>
      <button
        type="button"
        onClick={() => {
          const code = prompt('输入 Mermaid 图表代码:', 'graph TD\n  A[开始] --> B{判断}\n  B -->|是| C[执行]\n  B -->|否| D[结束]');
          if (code) {
            editor.chain().focus().insertContent({
              type: 'codeBlock',
              attrs: { language: 'mermaid' },
              content: [{ type: 'text', text: code }],
            }).run();
          }
        }}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="流程图/序列图 (Mermaid)"
      >
        <GitBranch className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() =>
          editor.chain().focus().setHorizontalRule().run()
        }
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="分割线"
      >
        <Minus className="h-4 w-4" />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />

      {/* 插入 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            editor.isActive('link') ? 'bg-gray-200 dark:bg-gray-700' : ''
          }`}
          title="插入链接"
        >
          <Link className="h-4 w-4" />
        </button>
        {showLinkInput && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-white dark:bg-gray-800 border rounded shadow-lg z-10">
            <input
              ref={linkInputRef}
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="px-2 py-1 border rounded text-sm w-48"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setLink();
                }
              }}
              autoFocus
            />
            <div className="flex gap-1 mt-1">
              <button
                type="button"
                onClick={setLink}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                确定
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLinkInput(false);
                  setLinkUrl('');
                }}
                className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={addImage}
        className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        title="插入图片"
      >
        <Image className="h-4 w-4" />
      </button>
      <div className="relative" ref={tableMenuRef}>
        <button
          type="button"
          onClick={() => {
            if (isInTable) {
              setShowTableMenu(!showTableMenu);
            } else {
              addTable();
            }
          }}
          className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${
            isInTable ? 'bg-gray-200 dark:bg-gray-700' : ''
          }`}
          title={isInTable ? '表格操作' : '插入表格'}
        >
          <Table className="h-4 w-4" />
        </button>
        {showTableMenu && isInTable && (
          <div className="absolute top-full left-0 mt-1 py-1 bg-white dark:bg-gray-800 border rounded shadow-lg z-20 min-w-[160px]">
            <button
              type="button"
              onClick={deleteTable}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              删除表格
            </button>
            <div className="border-t my-1 border-gray-200 dark:border-gray-700" />
            <button
              type="button"
              onClick={addRowBefore}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              上方插入行
            </button>
            <button
              type="button"
              onClick={addRowAfter}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              下方插入行
            </button>
            <button
              type="button"
              onClick={deleteRow}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              删除行
            </button>
            <div className="border-t my-1 border-gray-200 dark:border-gray-700" />
            <button
              type="button"
              onClick={addColumnBefore}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              左侧插入列
            </button>
            <button
              type="button"
              onClick={addColumnAfter}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              右侧插入列
            </button>
            <button
              type="button"
              onClick={deleteColumn}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              删除列
            </button>
            <div className="border-t my-1 border-gray-200 dark:border-gray-700" />
            <button
              type="button"
              onClick={mergeCells}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
              合并单元格
            </button>
            <button
              type="button"
              onClick={splitCell}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18"/></svg>
              拆分单元格
            </button>
            <div className="border-t my-1 border-gray-200 dark:border-gray-700" />
            <button
              type="button"
              onClick={toggleHeaderRow}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              表头行
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
