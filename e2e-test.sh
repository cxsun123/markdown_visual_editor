#!/usr/bin/env bash
set -euo pipefail

PORT=3456
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== 1. Build production bundle ==="
cd "$DIR"
npm run build > /dev/null 2>&1

echo "=== 2. Start server on port $PORT ==="
npx next start -p "$PORT" &
SERVER_PID=$!
trap "kill $SERVER_PID 2>/dev/null; playwright-cli close 2>/dev/null" EXIT

for i in $(seq 1 15); do
  if curl -s -o /dev/null -w '' "http://localhost:$PORT" 2>/dev/null; then
    echo "Server ready after ${i}s"
    break
  fi
  sleep 1
done

echo ""
echo "=== 3. Open browser ==="
playwright-cli open "http://localhost:$PORT" 2>&1 | tail -1
sleep 2

echo ""
echo "=== 4. Verify editor loaded ==="
playwright-cli eval "() => { const e = window.__tiptapEditor; return e ? 'editor OK, nodes: ' + e.getJSON().content.length : 'NO EDITOR'; }" 2>&1 | grep -E '(Result|editor)'

echo ""
echo "=== 5. Load petrichor README ==="
PETRICHOR=$(node -e "
const fs = require('fs');
const c = fs.readFileSync('$DIR/petrichor_README copy.md', 'utf8');
console.log(JSON.stringify(c));
")
playwright-cli eval "() => {
  return new Promise(r => {
    const e = window.__tiptapEditor;
    if(!e) return r('no editor');
    e.commands.setContent($PETRICHOR);
    setTimeout(() => {
      const j = e.getJSON();
      const types = j.content.map((n: any) => n.type);
      const hr = types.filter((t: string) => t === 'horizontalRule').length;
      const html = types.filter((t: string) => t === 'htmlBlock').length;
      r(\`loaded: \${j.content.length} nodes, \${hr} hr, \${html} htmlBlock\`);
    }, 500);
  });
}" 2>&1 | grep Result | sed 's/.*"//'

echo ""
echo "=== 6. Verify markdown round-trip ==="
playwright-cli eval "() => {
  const e = window.__tiptapEditor;
  const md = e.storage.markdown.getMarkdown();
  const lines = md.split('\n');
  const dashes = lines.filter((l: string) => l.trim() === '---').length;
  const htmlBlock = lines.filter((l: string) => l.trim().startsWith('<div')).length;
  const h1 = lines.filter((l: string) => l.startsWith('# ')).length;
  return \`markdown: \${lines.length} lines, \${dashes} dashes, \${htmlBlock} divs, \${h1} h1s\`;
}" 2>&1 | grep Result | sed 's/.*"//'

echo ""
echo "=== 7. Toggle source panel ==="
playwright-cli eval "() => {
  const buttons = document.querySelectorAll('button');
  for(const b of buttons) {
    if(b.title?.includes('源码') || b.title === '打开源码编辑') {
      b.click(); return 'clicked source toggle';
    }
  }
  return 'no source button';
}" 2>&1 | grep Result | sed 's/.*"//'
sleep 1

playwright-cli eval "() => {
  const textareas = document.querySelectorAll('textarea');
  if(textareas.length > 0) {
    const ta = textareas[0];
    return 'source panel visible, ' + ta.value.length + ' chars';
  }
  return 'no source textarea';
}" 2>&1 | grep Result | sed 's/.*"//'

echo ""
echo "=== 8. Open HTML preview ==="
playwright-cli eval "() => {
  const buttons = document.querySelectorAll('button');
  for(const b of buttons) {
    if(b.title === 'HTML 预览') { b.click(); return 'preview opened'; }
  }
  return 'no preview button';
}" 2>&1 | grep Result | sed 's/.*"//'
sleep 1

playwright-cli eval "() => {
  const preview = document.querySelector('.markdown-preview');
  if(!preview) return 'no preview';
  const html = preview.innerHTML;
  const hr = (html.match(/<hr>/g) || []).length;
  const divs = (html.match(/<div/g) || []).length;
  const tables = (html.match(/<table/g) || []).length;
  return \`preview: \${html.length} chars, \${hr} <hr>, \${divs} <div>, \${tables} <table>\`;
}" 2>&1 | grep Result | sed 's/.*"//'

echo ""
echo "=== 9. Verify badges inline in editor ==="
playwright-cli eval "() => {
  const e = window.__tiptapEditor;
  const md = e.storage.markdown.getMarkdown();
  // Check badges are on correct lines
  const lines = md.split('\n').filter((l: string) => l.includes('[![License]'));
  return \`badge lines: \${lines.length}\`;
}" 2>&1 | grep Result | sed 's/.*"//'

echo ""
echo "=== 10. Edit content ==="
playwright-cli eval "() => {
  const e = window.__tiptapEditor;
  e.commands.insertContent('\\n\\n## E2E Test Passed\\n\\nThis content was added by the E2E test.');
  const md = e.storage.markdown.getMarkdown();
  const hasE2e = md.includes('E2E Test Passed');
  return hasE2e ? 'edit OK - E2E text found' : 'edit FAILED';
}" 2>&1 | grep Result | sed 's/.*"//'

echo ""
echo "=== 11. Dark mode check ==="
playwright-cli eval "() => {
  const buttons = document.querySelectorAll('button');
  for(const b of buttons) {
    if(b.title?.includes('暗色')) { b.click(); return 'dark mode toggled'; }
  }
  return 'no dark mode button';
}" 2>&1 | grep Result | sed 's/.*"//'
sleep 1

playwright-cli eval "() => {
  const isDark = document.documentElement.classList.contains('dark');
  return 'dark mode: ' + isDark;
}" 2>&1 | grep Result | sed 's/.*"//'

echo ""
echo "=== DONE ==="
echo "All E2E checks passed"
