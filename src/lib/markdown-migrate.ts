import { migrateMermaidSyntax } from './mermaid-migrate';
import { emojify } from 'node-emoji';

export function convertEmojiSyntax(markdown: string): string {
  return emojify(markdown);
}

const MATH_BLOCK_RE = /^```\s*(?:math|katex)\s*\n([\s\S]*?)```/gm;
// Block math: $$...$$
// - Multi-line: starts at line start with $$, closing $$ on its own or end of line.
// - Single-line (inline block): $$content$$ anywhere on a line, must contain
//   non-trivial content and not be confused with two adjacent single-$ spans.
const BLOCK_MATH_MULTILINE_RE = /^\$\$\s*\n?([\s\S]*?)\n?\$\$(?=\s*$)/gm;
const BLOCK_MATH_INLINE_RE = /(?<=\S[^\n]*)\$\$(?!\$)((?:[^\n$]|\$[^$\n])(?:[^\n$]|\$[^$\n])*?(?:[^\n$]|\$[^$\n]))\$\$(?!\$)(?=[^\n]*\S)/g;
// Inline math: single $...$ (not $$, which is block math).
// Avoid matching escaped \$, currency amounts like $5, and empty $$.
const INLINE_MATH_RE = /(?<!\$)\$(?!\$)([^\n$][^\n$]*?[^\n$]|[^\n$])\$(?!\$)/g;

function escapeLatexAttr(latex: string): string {
  // Escape quotes and backticks for safe embedding in an HTML attribute.
  return latex.trim().replace(/"/g, '&quot;').replace(/`/g, '&#96;');
}

/** Strip LaTeX delimiters that KaTeX doesn't understand as content. */
function stripLatexDelimiters(latex: string): string {
  let s = latex.trim();
  if (s.startsWith('\\[') && s.endsWith('\\]')) {
    s = s.slice(2, -2).trim();
  }
  if (s.startsWith('\\(') && s.endsWith('\\)')) {
    s = s.slice(2, -2).trim();
  }
  return s;
}

export function convertKatexSyntax(markdown: string): string {
  let result = markdown.replace(MATH_BLOCK_RE, (_, latex: string) => {
    return `<div data-type="block-math" data-latex="${escapeLatexAttr(stripLatexDelimiters(latex))}"></div>`;
  });

  // Match multi-line $$...$$ first (anchored to line start), then inline-block
  // $$content$$ that appears anywhere on a line. Inline-block must run before
  // single-$ inline so that $$ is consumed before $ pairs are scanned.
  result = result.replace(BLOCK_MATH_MULTILINE_RE, (_, latex: string) => {
    return `<div data-type="block-math" data-latex="${escapeLatexAttr(stripLatexDelimiters(latex))}"></div>`;
  });
  result = result.replace(BLOCK_MATH_INLINE_RE, (_, latex: string) => {
    return `<span data-type="inline-math" data-latex="${escapeLatexAttr(stripLatexDelimiters(latex))}"></span>`;
  });

  result = result.replace(INLINE_MATH_RE, (_, latex: string) => {
    return `<span data-type="inline-math" data-latex="${escapeLatexAttr(stripLatexDelimiters(latex))}"></span>`;
  });

  return result;
}

export function migrateMarkdownSyntax(markdown: string): string {
  let result = markdown.replace(/\r\n?/g, '\n');
  result = result.replace(/\\\n/g, '\n');
  result = convertEmojiSyntax(result);
  result = migrateMermaidSyntax(result);
  result = convertKatexSyntax(result);
  return result;
}
