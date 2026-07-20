import { marked } from 'marked';
import katex from 'katex';
import { migrateMarkdownSyntax } from './markdown-migrate';

// Match placeholder spans/divs emitted by migrateMarkdownSyntax.
// Handle both attribute orderings: data-type first (new) or data-latex first (legacy Editor.md).
const INLINE_MATH_RE =
  /<span\s+(?:data-type="inline-math"\s+data-latex="([^"]*)"|data-latex="([^"]*)"\s+data-type="inline-math")><\/span>/g;
const BLOCK_MATH_RE =
  /<div\s+(?:data-type="block-math"\s+data-latex="([^"]*)"|data-latex="([^"]*)"\s+data-type="block-math")>\s*<\/div>/g;

// Match fenced mermaid code blocks produced by marked. marked renders
// ```lang\ncode``` as <pre><code class="language-mermaid">...</code></pre>.
const MERMAID_FENCE_RE =
  /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;

// Match fenced latex/katex/math code blocks. Render as KaTeX instead of code.
const LATEX_CODE_BLOCK_RE =
  /<pre><code class="language-(?:latex|katex|math)">([\s\S]*?)<\/code><\/pre>/g;

function decodeAttr(value: string | undefined): string {
  if (!value) return '';
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#96;/g, '`')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

// Strip LaTeX delimiters that KaTeX doesn't understand as content.
// e.g., \(\sqrt{3x-1}\) → \sqrt{3x-1}, \[\int\] → \int
function stripLatexDelimiters(latex: string): string {
  let s = latex.trim();
  // Remove display math delimiters: \[ ... \]
  if (s.startsWith('\\[') && s.endsWith('\\]')) {
    s = s.slice(2, -2).trim();
  }
  // Remove inline math delimiters: \( ... \)
  if (s.startsWith('\\(') && s.endsWith('\\)')) {
    s = s.slice(2, -2).trim();
  }
  return s;
}

function renderInlineMath(latex: string): string {
  try {
    return katex.renderToString(stripLatexDelimiters(latex), {
      throwOnError: false,
      displayMode: false,
    });
  } catch {
    return `<code>${latex}</code>`;
  }
}

function renderBlockMath(latex: string): string {
  try {
    return katex.renderToString(stripLatexDelimiters(latex), {
      throwOnError: false,
      displayMode: true,
    });
  } catch {
    return `<pre><code>${latex}</code></pre>`;
  }
}

function renderMermaidPlaceholder(code: string): string {
  // Mermaid is rendered client-side. Encode the graph source so it survives
  // the HTML round-trip; the client component reads it back and calls
  // mermaid.run on a fresh <pre class="mermaid"> node.
  const encoded = encodeURIComponent(code);
  return `<div class="mermaid-block" data-mermaid="${encoded}"><pre class="mermaid">${escapeHtml(code)}</pre></div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function markdownToHtml(markdown: string): string {
  const migrated = migrateMarkdownSyntax(markdown);
  marked.setOptions({ breaks: false, gfm: true });
  let html = marked.parse(migrated) as string;

  // Replace math placeholders with KaTeX HTML (server-rendered).
  html = html.replace(INLINE_MATH_RE, (_, raw1, raw2) =>
    renderInlineMath(decodeAttr(raw1 ?? raw2)),
  );
  html = html.replace(BLOCK_MATH_RE, (_, raw1, raw2) =>
    renderBlockMath(decodeAttr(raw1 ?? raw2)),
  );

  // Replace mermaid code blocks with client-renderable placeholders.
  html = html.replace(MERMAID_FENCE_RE, (_, code) => {
    // marked HTML-encodes the code content; decode before passing on.
    return renderMermaidPlaceholder(decodeHtmlEntities(code));
  });

  // Replace latex/katex code blocks with rendered KaTeX.
  html = html.replace(LATEX_CODE_BLOCK_RE, (_, code) => {
    return renderBlockMath(decodeHtmlEntities(code).trim());
  });

  return html;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}