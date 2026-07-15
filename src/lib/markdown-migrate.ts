import { migrateMermaidSyntax } from './mermaid-migrate';
import { emojify } from 'node-emoji';

export function convertEmojiSyntax(markdown: string): string {
  return emojify(markdown);
}

const MATH_BLOCK_RE = /^```\s*(?:math|katex)\s*\n([\s\S]*?)```/gm;
const BLOCK_MATH_RE = /^\$\$\s*\n?([\s\S]*?)\n?\$\$$/gm;
const INLINE_MATH_RE = /\$\$(.+?)\$\$/g;

function convertKatexSyntax(markdown: string): string {
  let result = markdown.replace(MATH_BLOCK_RE, (_, latex) => {
    return `<div data-type="block-math" data-latex="${latex.trim()}"></div>`;
  });

  result = result.replace(BLOCK_MATH_RE, (_, latex) => {
    return `<div data-type="block-math" data-latex="${latex.trim()}"></div>`;
  });

  result = result.replace(INLINE_MATH_RE, (_, latex) => {
    return `<span data-type="inline-math" data-latex="${latex.trim()}"></span>`;
  });

  return result;
}

export function migrateMarkdownSyntax(markdown: string): string {
  let result = convertEmojiSyntax(markdown);
  result = migrateMermaidSyntax(result);
  result = convertKatexSyntax(result);
  return result;
}
