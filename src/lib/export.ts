/**
 * 导出功能模块
 * 支持导出为 Markdown、HTML、DOCX 格式
 */

/**
 * 清理文件名，移除特殊字符
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .trim();
}

/**
 * 触发文件下载
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 将 HTML 转换为 Markdown
 */
function htmlToMarkdown(html: string): string {
  // 简单的 HTML 到 Markdown 转换
  let markdown = html;

  // 标题
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
  markdown = markdown.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
  markdown = markdown.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
  markdown = markdown.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

  // 粗体和斜体
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
  markdown = markdown.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
  markdown = markdown.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

  // 删除线
  markdown = markdown.replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~');
  markdown = markdown.replace(/<del[^>]*>(.*?)<\/del>/gi, '~~$1~~');

  // 行内代码
  markdown = markdown.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

  // 代码块
  markdown = markdown.replace(
    /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
    '```\n$1\n```\n\n'
  );

  // 引用块
  markdown = markdown.replace(
    /<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi,
    (match, content) => {
      const lines = content.split('\n').filter((line: string) => line.trim());
      return lines.map((line: string) => `> ${line.trim()}`).join('\n') + '\n\n';
    }
  );

  // 无序列表
  markdown = markdown.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    if (!items) return '';
    return items
      .map((item: string) => {
        const text = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '$1').trim();
        return `- ${text}`;
      })
      .join('\n') + '\n\n';
  });

  // 有序列表
  markdown = markdown.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
    const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    if (!items) return '';
    return items
      .map((item: string, index: number) => {
        const text = item.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '$1').trim();
        return `${index + 1}. ${text}`;
      })
      .join('\n') + '\n\n';
  });

  // 链接
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');

  // 图片
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  markdown = markdown.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

  // 分割线
  markdown = markdown.replace(/<hr[^>]*\/?>/gi, '---\n\n');

  // 段落
  markdown = markdown.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');

  // 换行
  markdown = markdown.replace(/<br[^>]*\/?>/gi, '\n');

  // 移除其他 HTML 标签
  markdown = markdown.replace(/<[^>]+>/g, '');

  // 清理多余的空行
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  // 解码 HTML 实体
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  markdown = markdown.replace(/&quot;/g, '"');
  markdown = markdown.replace(/&#39;/g, "'");

  return markdown.trim();
}

/**
 * 导出为 Markdown 文件
 * content is already markdown — no conversion needed
 */
export function exportMarkdown(content: string, title: string): void {
  const filename = `${sanitizeFilename(title)}.md`;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  downloadFile(blob, filename);
}

/**
 * 导出为 HTML 文件
 * content is markdown — convert to HTML first
 */
export async function exportHTML(content: string, title: string): Promise<void> {
  const { marked } = await import('marked');
  const { migrateMarkdownSyntax } = await import('./markdown-migrate');
  const migrated = migrateMarkdownSyntax(content);
  marked.setOptions({ breaks: true, gfm: true });
  const bodyHtml = marked.parse(migrated) as string;
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      color: #333;
      background-color: #fff;
    }
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
      line-height: 1.25;
    }
    h1 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }
    p { margin: 1em 0; }
    strong { font-weight: 600; }
    em { font-style: italic; }
    s { text-decoration: line-through; }
    code {
      background-color: #f6f8fa;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      font-size: 85%;
    }
    pre {
      background-color: #f6f8fa;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
      line-height: 1.45;
    }
    pre code {
      background-color: transparent;
      padding: 0;
      font-size: 100%;
    }
    blockquote {
      border-left: 4px solid #dfe2e5;
      margin: 0;
      padding: 0 1em;
      color: #6a737d;
    }
    ul, ol {
      padding-left: 2em;
      margin: 1em 0;
    }
    li {
      margin: 0.25em 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    table th, table td {
      border: 1px solid #dfe2e5;
      padding: 6px 13px;
    }
    table th {
      background-color: #f6f8fa;
      font-weight: 600;
    }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }
    a {
      color: #0366d6;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    hr {
      border: none;
      border-top: 1px solid #e1e4e8;
      margin: 2em 0;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${bodyHtml}
</body>
</html>`;

  const filename = `${sanitizeFilename(title)}.html`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  downloadFile(blob, filename);
}


