import { StarterKit } from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Highlight } from '@tiptap/extension-highlight';
import { Typography } from '@tiptap/extension-typography';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Link as BaseLink } from '@tiptap/extension-link';
import { InputRule, markPasteRule, Extension } from '@tiptap/core';
import { Image as BaseImage } from '@tiptap/extension-image';
import { Heading as BaseHeading } from '@tiptap/extension-heading';
import { Blockquote as BaseBlockquote } from '@tiptap/extension-blockquote';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Mathematics } from '@tiptap/extension-mathematics';
import { Markdown } from 'tiptap-markdown';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { common, createLowlight } from 'lowlight';
import { ImageNodeView } from './image-node-view';
import { HeadingNodeView } from './heading-node-view';
import { BlockquoteNodeView } from './blockquote-node-view';
import { MermaidNodeView } from './mermaid-node-view';
import { CodeBlockNodeView } from './code-block-node-view';
import { LinkDoubleClickListener } from './link-double-click';
import { HtmlBlock } from './html-block';

const lowlight = createLowlight(common);

const Image = BaseImage.extend({
  inline: true,
  group: 'inline',

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

const Link = BaseLink.extend({
  addInputRules() {
    const inputRules = this.parent?.() ?? [];

    inputRules.push(
      new InputRule({
        find: /<([a-z][a-z0-9+.-]*:\/\/[^>]+)>$/i,
        handler: ({ state, range, match }) => {
          const url = match[1];
          if (!url) return;

          const { tr } = state;
          const attributes = { href: url };

          tr.replaceWith(range.from, range.to, state.schema.text(url).mark([this.type.create(attributes)]));
        },
      }),
    );

    return inputRules;
  },

  addPasteRules() {
    const pasteRules = this.parent?.() ?? [];

    pasteRules.push(
      markPasteRule({
        find: /<([a-z][a-z0-9+.-]*:\/\/[^>]+)>/gi,
        type: this.type,
        getAttributes: (match) => {
          const url = match[1];
          return { href: url };
        },
      }),
    );

    return pasteRules;
  },
});

const Heading = BaseHeading.extend({
  addNodeView() {
    return ReactNodeViewRenderer(HeadingNodeView);
  },
});

const Blockquote = BaseBlockquote.extend({
  addNodeView() {
    return ReactNodeViewRenderer(BlockquoteNodeView);
  },
});

const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return (props) => {
      const { node } = props;
      if (node.attrs.language === 'mermaid' || node.attrs.language === 'flow' || node.attrs.language === 'sequence' || node.attrs.language === 'seq' || node.attrs.language === 'sequenceDiagram' || node.attrs.language === 'flowchart' || node.attrs.language === 'graph') {
        return ReactNodeViewRenderer(MermaidNodeView)(props);
      }
      return ReactNodeViewRenderer(CodeBlockNodeView)(props);
    };
  },
}).configure({
  lowlight,
});

/**
 * Mathematics with markdown serialization specs.
 * Serializes KaTeX nodes to $...$ and $$...$$ syntax.
 */
const MathWithMarkdown = Mathematics.configure({
  katexOptions: {
    throwOnError: false,
  },
});

/**
 * Extension to bridge Mathematics with tiptap-markdown.
 * Registers markdown-it rules for $...$ and $$...$$ so they are
 * parsed to the correct HTML that Mathematics's parseHTML rules understand.
 * Uses a distinct name to avoid schema conflicts with the real inlineMath/blockMath nodes.
 */
const MathMarkdownBridge = Extension.create({
  name: 'mathMarkdownBridge',
  addStorage() {
    return {
      markdown: {
        parse: {
          setup(md: any) {
            // Inline math: $latex$
            const inlineMathRule = (state: any, silent: boolean) => {
              const src = state.src;
              const start = state.pos;
              if (src.charCodeAt(start) !== 0x24) return false;
              if (start > 0 && src.charCodeAt(start - 1) === 0x24) return false;

              const end = src.indexOf('$', start + 1);
              if (end === -1) return false;
              if (end === start + 1) return false;
              if (end + 1 < src.length && src.charCodeAt(end + 1) === 0x24) return false;

              const content = src.slice(start + 1, end).trim();
              if (!content) return false;

              if (!silent) {
                const token = state.push('inlineMath', '', 0);
                token.content = content;
                token.markup = '$';
                state.pos = end + 1;
              } else {
                state.pos = end + 1;
              }
              return true;
            };

            md.inline.ruler.before('escape', 'inlineMath', inlineMathRule);

            md.renderer.rules.inlineMath = (tokens: any, idx: number) => {
              const content = tokens[idx].content;
              const escaped = content.replace(/"/g, '&quot;');
              return `<span data-type="inline-math" data-latex="${escaped}"></span>`;
            };

            // Block math: $$latex$$ or $$\nlatex\n$$
            const blockMathRule = (state: any, startLine: number, endLine: number, silent: boolean) => {
              const startPos = state.bMarks[startLine] + state.tShift[startLine];
              const lineMax = state.eMarks[startLine];
              const firstLine = state.src.slice(startPos, lineMax);

              if (!firstLine.startsWith('$$')) return false;

              // Case 1: single-line $$content$$
              const singleLineMatch = firstLine.match(/^\$\$(.+?)\$\$/);
              if (singleLineMatch) {
                if (silent) return true;
                const token = state.push('blockMath', '', 0);
                token.content = singleLineMatch[1].trim();
                token.markup = '$$';
                token.map = [startLine, startLine + 1];
                state.line = startLine + 1;
                return true;
              }

              // Case 2: multi-line $$ content $$
              let nextLine = startLine + 1;
              while (nextLine < endLine) {
                const curLineStart = state.bMarks[nextLine] + state.tShift[nextLine];
                const curLineMax = state.eMarks[nextLine];
                const line = state.src.slice(curLineStart, curLineMax).trimEnd();

                if (line === '$$') {
                  if (silent) return true;
                  const contentLines = [];
                  for (let i = startLine + 1; i < nextLine; i++) {
                    const lStart = state.bMarks[i] + state.tShift[i];
                    const lMax = state.eMarks[i];
                    contentLines.push(state.src.slice(lStart, lMax));
                  }
                  const token = state.push('blockMath', '', 0);
                  token.content = contentLines.join('\n').trim();
                  token.markup = '$$';
                  token.map = [startLine, nextLine + 1];
                  state.line = nextLine + 1;
                  return true;
                }
                nextLine++;
              }

              return false;
            };

            md.block.ruler.before('fence', 'blockMath', blockMathRule, {
              alt: ['paragraph', 'reference', 'blockquote', 'list'],
            });

            md.renderer.rules.blockMath = (tokens: any, idx: number) => {
              const content = tokens[idx].content;
              const escaped = content.replace(/"/g, '&quot;');
              return `<div data-type="block-math" data-latex="${escaped}"></div>`;
            };
          },
        },
      },
    };
  },
});

export const defaultExtensions = [
  StarterKit.configure({
    heading: false,
    blockquote: false,
    link: false,
    codeBlock: false,
  }),
  Placeholder.configure({
    placeholder: '开始写作...\n支持 Markdown 语法',
  }),
  Highlight.configure({ multicolor: true }),
  Typography,
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  TextStyle,
  Color,
  MathWithMarkdown,
  MathMarkdownBridge,
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-blue-500 hover:underline cursor-pointer',
    },
  }),
  Image.configure({
    HTMLAttributes: {
      class: 'max-w-full h-auto rounded-lg',
    },
  }),
  Heading.configure({
    levels: [1, 2, 3, 4, 5, 6],
  }),
  Blockquote,
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableCell,
  TableHeader,
  CodeBlock,
  HtmlBlock,
  Subscript,
  Superscript,
  LinkDoubleClickListener,
  Markdown.configure({
    html: true,
    tightLists: true,
    bulletListMarker: '-',
    linkify: false,
    breaks: true,
  }),
];
