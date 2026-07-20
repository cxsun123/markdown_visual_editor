export type Locale = 'en' | 'zh';

export const DEFAULT_LOCALE: Locale = 'en';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'zh'];

export type EditorMessages = {
  toolbar: {
    undo: string;
    redo: string;
    heading: string;
    paragraph: string;
    bold: string;
    italic: string;
    strike: string;
    inlineCode: string;
    highlight: string;
    fontColor: string;
    bgColor: string;
    subscript: string;
    superscript: string;
    bulletList: string;
    orderedList: string;
    taskList: string;
    blockquote: string;
    codeBlock: string;
    inlineMath: string;
    blockMath: string;
    mermaid: string;
    horizontalRule: string;
    insertLink: string;
    insertImage: string;
    table: string;
    tableInsert: string;
    tableDelete: string;
    rowInsertBefore: string;
    rowInsertAfter: string;
    rowDelete: string;
    colInsertBefore: string;
    colInsertAfter: string;
    colDelete: string;
    mergeCells: string;
    splitCell: string;
    headerRow: string;
    confirm: string;
    cancel: string;
  };
  prompts: {
    imageUrl: string;
    inlineMath: string;
    blockMath: string;
    mermaid: string;
    linkUrl: string;
    linkPlaceholder: string;
  };
  drop: {
    importHint: string;
    onlyMarkdown: string;
    onlyMd: string;
    replaceConfirm: string;
    parseFailed: string;
  };
  nodeViews: {
    codeEditor: string;
    codeSaveHint: string;
    save: string;
    cancel: string;
    longPressEdit: string;
    katexEditor: string;
    katexSaveHint: string;
    preview: string;
    mermaidEditor: string;
    mermaidSaveHint: string;
    renderError: string;
    longPressSource: string;
    loading: string;
    mermaidRenderFailed: string;
  };
  headings: { label: string }[];
};

export type DemoMessages = {
  toggleDark: string;
  toggleLight: string;
  openSource: string;
  closeSource: string;
  htmlPreview: string;
  export: string;
  exportMarkdown: string;
  exportHtml: string;
  footer: string;
  language: string;
};

const enDemo: DemoMessages = {
  toggleDark: 'Switch to dark mode',
  toggleLight: 'Switch to light mode',
  openSource: 'Open source editor',
  closeSource: 'Close source editor',
  htmlPreview: 'HTML preview',
  export: 'Export',
  exportMarkdown: 'Export Markdown (.md)',
  exportHtml: 'Export HTML (.html)',
  footer: 'WYSIWYG Markdown Editor - a What-You-See-Is-What-You-Get editor with Markdown support',
  language: 'Language',
};

const zhDemo: DemoMessages = {
  toggleDark: '切换到暗色模式',
  toggleLight: '切换到亮色模式',
  openSource: '打开源码编辑',
  closeSource: '关闭源码编辑',
  htmlPreview: 'HTML 预览',
  export: '导出',
  exportMarkdown: '导出 Markdown (.md)',
  exportHtml: '导出 HTML (.html)',
  footer: 'WYSIWYG Markdown Editor - 支持 Markdown 语法的所见即所得编辑器',
  language: '语言',
};

export const demoMessages: Record<Locale, DemoMessages> = { en: enDemo, zh: zhDemo };

export function getDemoMessages(locale: Locale = DEFAULT_LOCALE): DemoMessages {
  return demoMessages[locale] ?? demoMessages[DEFAULT_LOCALE];
}

const enNodeViews = {
  codeEditor: 'Code editor',
  codeSaveHint: 'Ctrl+Enter save | Esc cancel | Tab indent',
  save: 'Save',
  cancel: 'Cancel',
  longPressEdit: 'Long press to edit',
  katexEditor: 'LaTeX editor',
  katexSaveHint: 'Ctrl+Enter save | Esc cancel',
  preview: 'Preview:',
  mermaidEditor: 'Mermaid diagram editor',
  mermaidSaveHint: 'Ctrl+Enter save | Esc cancel',
  renderError: 'Render error',
  longPressSource: 'Long press to edit source',
  loading: 'Loading...',
  mermaidRenderFailed: 'Mermaid render failed: ',
};

const zhNodeViews = {
  codeEditor: '代码编辑器',
  codeSaveHint: 'Ctrl+Enter 保存 | Esc 取消 | Tab 缩进',
  save: '保存',
  cancel: '取消',
  longPressEdit: '长按编辑',
  katexEditor: 'LaTeX 编辑器',
  katexSaveHint: 'Ctrl+Enter 保存 | Esc 取消',
  preview: '预览：',
  mermaidEditor: 'Mermaid 图表编辑器',
  mermaidSaveHint: 'Ctrl+Enter 保存 | Esc 取消',
  renderError: '渲染错误',
  longPressSource: '长按编辑源码',
  loading: '加载中...',
  mermaidRenderFailed: 'Mermaid 渲染失败: ',
};

const en: EditorMessages = {
  toolbar: {
    undo: 'Undo (Ctrl+Z)',
    redo: 'Redo (Ctrl+Shift+Z)',
    heading: 'Heading',
    paragraph: 'Paragraph',
    bold: 'Bold (Ctrl+B)',
    italic: 'Italic (Ctrl+I)',
    strike: 'Strikethrough',
    inlineCode: 'Inline code',
    highlight: 'Highlight',
    fontColor: 'Font color',
    bgColor: 'Background color',
    subscript: 'Subscript',
    superscript: 'Superscript',
    bulletList: 'Bullet list',
    orderedList: 'Ordered list',
    taskList: 'Task list',
    blockquote: 'Blockquote',
    codeBlock: 'Code block',
    inlineMath: 'Inline formula (KaTeX)',
    blockMath: 'Block formula (KaTeX)',
    mermaid: 'Diagram (Mermaid)',
    horizontalRule: 'Horizontal rule',
    insertLink: 'Insert link',
    insertImage: 'Insert image',
    table: 'Table',
    tableInsert: 'Insert table',
    tableDelete: 'Delete table',
    rowInsertBefore: 'Insert row above',
    rowInsertAfter: 'Insert row below',
    rowDelete: 'Delete row',
    colInsertBefore: 'Insert column left',
    colInsertAfter: 'Insert column right',
    colDelete: 'Delete column',
    mergeCells: 'Merge cells',
    splitCell: 'Split cell',
    headerRow: 'Header row',
    confirm: 'OK',
    cancel: 'Cancel',
  },
  prompts: {
    imageUrl: 'Enter image URL:',
    inlineMath: 'Enter LaTeX formula:',
    blockMath: 'Enter LaTeX formula:',
    mermaid: 'Enter Mermaid diagram code:',
    linkUrl: 'Enter link URL:',
    linkPlaceholder: 'https://...',
  },
  drop: {
    importHint: 'Drop to import .md file',
    onlyMarkdown: 'Only Markdown files are accepted',
    onlyMd: 'Only .md files are accepted',
    replaceConfirm: 'Current content will be replaced. Continue?',
    parseFailed: 'Failed to parse file',
  },
  nodeViews: enNodeViews,
  headings: [
    { label: 'Heading 1' },
    { label: 'Heading 2' },
    { label: 'Heading 3' },
    { label: 'Heading 4' },
    { label: 'Heading 5' },
    { label: 'Heading 6' },
  ],
};

const zh: EditorMessages = {
  toolbar: {
    undo: '撤销 (Ctrl+Z)',
    redo: '重做 (Ctrl+Shift+Z)',
    heading: '标题',
    paragraph: '正文',
    bold: '粗体 (Ctrl+B)',
    italic: '斜体 (Ctrl+I)',
    strike: '删除线',
    inlineCode: '行内代码',
    highlight: '高亮',
    fontColor: '字体颜色',
    bgColor: '背景颜色',
    subscript: '下标',
    superscript: '上标',
    bulletList: '无序列表',
    orderedList: '有序列表',
    taskList: '任务列表',
    blockquote: '引用块',
    codeBlock: '代码块',
    inlineMath: '行内公式 (KaTeX)',
    blockMath: '块级公式 (KaTeX)',
    mermaid: '流程图/序列图 (Mermaid)',
    horizontalRule: '分割线',
    insertLink: '插入链接',
    insertImage: '插入图片',
    table: '表格',
    tableInsert: '插入表格',
    tableDelete: '删除表格',
    rowInsertBefore: '上方插入行',
    rowInsertAfter: '下方插入行',
    rowDelete: '删除行',
    colInsertBefore: '左侧插入列',
    colInsertAfter: '右侧插入列',
    colDelete: '删除列',
    mergeCells: '合并单元格',
    splitCell: '拆分单元格',
    headerRow: '表头行',
    confirm: '确定',
    cancel: '取消',
  },
  prompts: {
    imageUrl: '请输入图片URL:',
    inlineMath: '输入 LaTeX 公式:',
    blockMath: '输入 LaTeX 公式:',
    mermaid: '输入 Mermaid 图表代码:',
    linkUrl: '请输入链接URL:',
    linkPlaceholder: 'https://...',
  },
  drop: {
    importHint: '放开以导入 .md 文件',
    onlyMarkdown: '仅接受 Markdown 文件',
    onlyMd: '只接受 .md 文件',
    replaceConfirm: '当前内容会被替换，是否继续？',
    parseFailed: '文件解析失败',
  },
  nodeViews: zhNodeViews,
  headings: [
    { label: '标题 1' },
    { label: '标题 2' },
    { label: '标题 3' },
    { label: '标题 4' },
    { label: '标题 5' },
    { label: '标题 6' },
  ],
};

export const editorMessages: Record<Locale, EditorMessages> = { en, zh };

export function getEditorMessages(locale: Locale = DEFAULT_LOCALE): EditorMessages {
  return editorMessages[locale] ?? editorMessages[DEFAULT_LOCALE];
}
