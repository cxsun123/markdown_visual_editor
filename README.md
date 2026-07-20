# WYSIWYG Markdown Editor

A Microsoft Word-like WYSIWYG Markdown editor with full Markdown syntax support.

🌐 **Live demo**: [https://md.tech616.me](https://md.tech616.me)

📖 **中文文档**: [README.zh-CN.md](README.zh-CN.md)

## Screenshots

![Light mode](https://raw.githubusercontent.com/cxsun123/markdown_visual_editor/main/public/screenshot1.png)

*Light mode*

![Font color picker](https://raw.githubusercontent.com/cxsun123/markdown_visual_editor/main/public/screenshot2.png)

*Font color picker*

![Dark mode](https://raw.githubusercontent.com/cxsun123/markdown_visual_editor/main/public/screenshot3.png)

*Dark mode*

## Features

- ✅ **Live formatting preview**: type and see results instantly, no preview toggle needed
- ✅ **Full Markdown support**: headings, lists, tables, code blocks, blockquotes, and more
- ✅ **Toolbar shortcuts**: bold, italic, strikethrough, link, image, table, etc.
- ✅ **Context menu**: right-click inside a table for row/column operations
- ✅ **Color picker**: font color / background color picker with custom colors
- ✅ **Multi-format export**: Markdown, HTML, DOCX
- ✅ **Keyboard shortcuts**: Ctrl+B bold, Ctrl+I italic, Ctrl+K link, and more
- ✅ **Responsive design**: desktop and mobile
- ✅ **Dark mode**: light / dark theme switching
- ✅ **Emoji support**: GFM shortcodes like `:smiley:`
- ✅ **KaTeX formulas**: inline and block LaTeX
- ✅ **Mermaid diagrams**: flowcharts, sequence diagrams, etc.
- ✅ **Internationalization**: English (default) and 中文, via the `locale` prop

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Editor**: Tiptap (built on ProseMirror)
- **Styling**: Tailwind CSS v4
- **Export**: html-to-docx, file-saver
- **Syntax highlighting**: lowlight + highlight.js
- **Diagrams**: Mermaid
- **Formulas**: KaTeX
- **Emoji**: node-emoji

## Quick Start

### Local development

```bash
# Enter the project directory
cd markdown_visual_editor

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm run start
```

## Docker Deployment

The project root contains Docker and Docker Compose config.

```bash
# Recommended: Docker Compose
docker compose up -d
```

Visit [http://localhost:3003](http://localhost:3003).

Custom port via `.env`:

```bash
# .env
PORT=8080
docker compose up -d
```

Or build directly:

```bash
docker build -t markdown-editor markdown_visual_editor
docker run -p 3003:3000 markdown-editor
```

## Usage

### Editor operations

1. **Type content**: type directly in the editor
2. **Format**: use toolbar buttons or shortcuts
3. **Insert elements**: click the insert buttons in the toolbar
4. **Table operations**: when the cursor is in a table, the table button becomes a table menu, or right-click inside the table
5. **Export**: click the "Export" button in the top-right to choose a format

### Keyboard shortcuts

| Shortcut | Function |
|----------|----------|
| Ctrl+B | Bold |
| Ctrl+I | Italic |
| Ctrl+K | Insert link |
| Ctrl+Shift+X | Strikethrough |
| Ctrl+Shift+H | Highlight |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |

## Internationalization (i18n)

The editor UI (toolbar, node views, prompts) is internationalized. Pass a `locale` prop
to `<WysiwygEditor>` — supported values are `'en'` (default) and `'zh'`. The value is
provided to all internal node views via React context.

```tsx
import { WysiwygEditor } from '@chengxinsun26/editor';

<WysiwygEditor
  content={markdown}
  onChange={setMarkdown}
  showSource={showSource}
  onToggleSource={() => setShowSource(v => !v)}
  locale="zh"   // 'en' | 'zh'
/>
```

The demo page (`src/app/page.tsx`) includes a language switcher to try both locales live.
Messages live in `src/components/editor/i18n.ts`; add a new entry to `SUPPORTED_LOCALES`
and a translation object to extend to more languages.

## Project Structure

```
markdown_visual_editor/
├── docker-compose.yml           # Docker Compose config
├── .env.example                 # Env var example
├── article_example.md           # Sample article
├── Dockerfile                   # Docker build file
├── public/                      # Screenshots & assets
├── src/
│   ├── app/
│   │   ├── page.tsx             # Main page (demo + locale switcher)
│   │   ├── layout.tsx           # Layout
│   │   └── globals.css          # Global styles
│   ├── components/editor/
│   │   ├── i18n.ts              # Translation dictionaries (en/zh)
│   │   ├── locale-context.ts    # React context for locale
│   │   ├── extensions.ts        # Tiptap extension config
│   │   ├── toolbar.tsx          # Toolbar
│   │   ├── wysiwyg-editor.tsx   # Editor root component
│   │   ├── color-picker-panel.tsx
│   │   ├── code-block-node-view.tsx
│   │   ├── mermaid-node-view.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── export.ts            # Export logic
│   │   └── markdown-migrate.ts  # Markdown migration
│   └── styles/
│       └── editor.css           # Editor styles
├── package.json
└── README.md
```

## Development

- Add features: add a Tiptap extension in `extensions.ts`, a toolbar button in `toolbar.tsx`
- Custom styles: edit `src/styles/editor.css`
- New export format: add a function in `src/lib/export.ts`

## License

MIT License
