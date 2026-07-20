'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { exportMarkdown, exportHTML } from '@/lib/export';
import { markdownToHtml } from '@/lib/markdown-to-html';
import { migrateMarkdownSyntax } from '@/lib/markdown-migrate';
import { MermaidBlock } from '@/components/editor/mermaid-block';
import { getDemoMessages, SUPPORTED_LOCALES, type Locale } from '@/components/editor/i18n';

// 动态导入编辑器，避免 SSR 问题
const WysiwygEditor = dynamic(
  () =>
    import('@/components/editor/wysiwyg-editor').then((mod) => mod.WysiwygEditor),
  { ssr: false }
);

const INITIAL_CONTENT = `# Editor.md

![](https://pandao.github.io/editor.md/images/logos/editormd-logo-180x180.png)

![](https://img.shields.io/github/stars/pandao/editor.md.svg) ![](https://img.shields.io/github/forks/pandao/editor.md.svg) ![](https://img.shields.io/github/tag/pandao/editor.md.svg) ![](https://img.shields.io/github/release/pandao/editor.md.svg) ![](https://img.shields.io/github/issues/pandao/editor.md.svg) ![](https://img.shields.io/bower/v/editor.md.svg)

# Heading 1

## Heading 2

### Heading 3

#### Heading 4

##### Heading 5

###### Heading 6

# Heading 1 link [Heading link](https://github.com/pandao/editor.md "Heading link")

## Heading 2 link [Heading link](https://github.com/pandao/editor.md "Heading link")

### Heading 3 link [Heading link](https://github.com/pandao/editor.md "Heading link")

#### Heading 4 link [Heading link](https://github.com/pandao/editor.md "Heading link") Heading link [Heading link](https://github.com/pandao/editor.md "Heading link")

##### Heading 5 link [Heading link](https://github.com/pandao/editor.md "Heading link")

###### Heading 6 link [Heading link](https://github.com/pandao/editor.md "Heading link")

#### 字符效果和横线等

* * *

~~删除线~~ <s>删除线（开启识别HTML标签时）</s>

*斜体字*      _斜体字_

**粗体**  __粗体__

***粗斜体*** ___粗斜体___

上标：X<sub>2</sub>，下标：O<sup>2</sup>

**缩写(同HTML的abbr标签)**

> 即更长的单词或短语的缩写形式，前提是开启识别HTML标签时，已默认开启

### 引用 Blockquotes

> 引用文本 Blockquotes

引用的行内混合 Blockquotes

> 引用：如果想要插入空白换行\`即<br />标签\`，在插入处先键入两个以上的空格然后回车即可，[普通链接](http://localhost/)。

### 锚点与链接 Links

[普通链接](http://localhost/)

[普通链接带标题](http://localhost/ "普通链接带标题")

直接链接：<https://github.com>

[mailto:test.test@gmail.com](mailto:test.test@gmail.com)

GFM a-tail link @pandao 邮箱地址自动链接 test.test@gmail.com www@vip.qq.com

### 多语言代码高亮 Codes

#### 行内代码 Inline code

执行命令：\`npm install marked\`

#### JS代码

\`\`\`javascript
function test() {
	console.log("Hello world!");
}

(function(){
    var box = function() {
        return box.fn.init();
    };

    box.prototype = box.fn = {
        init : function(){
            console.log('box.init()');
            return this;
        },
        add : function(str) {
            alert("add", str);
            return this;
        },
        remove : function(str) {
            alert("remove", str);
            return this;
        }
    };

    box.fn.init.prototype = box.fn;
    window.box = box;
})();

var testBox = box();
testBox.add("jQuery").remove("jQuery");
\`\`\`

### 图片 Images

![](https://pandao.github.io/editor.md/examples/images/4.jpg)

> Follow your heart.

![](https://pandao.github.io/editor.md/examples/images/8.jpg)

> 图为：厦门白城沙滩

### 列表 Lists

#### 无序列表（减号）Unordered Lists (-)

- 列表一
- 列表二
- 列表三

#### 无序列表（星号）Unordered Lists (*)

* 列表一
* 列表二
* 列表三

#### 无序列表（加号和嵌套）Unordered Lists (+)

+ 列表一
+ 列表二
    + 列表二-1
    + 列表二-2
    + 列表二-3
+ 列表三

#### 有序列表 Ordered Lists

1. 第一行
2. 第二行
3. 第三行

#### GFM task list

- [x] GFM task list 1
- [x] GFM task list 2
- [ ] GFM task list 3
    - [ ] GFM task list 3-1
    - [ ] GFM task list 3-2
    - [ ] GFM task list 3-3
- [ ] GFM task list 4
    - [ ] GFM task list 4-1
    - [ ] GFM task list 4-2

### 绘制表格 Tables

| 项目        | 价格   |  数量  |
| --------   | -----:  | :----:  |
| 计算机      | $1600   |   5     |
| 手机        |   $12   |   12   |
| 管线        |    $1    |  234  |

| Function name | Description                    |
| ------------- | ------------------------------ |
| \`help()\`      | Display the help window.       |
| \`destroy()\`   | **Destroy your computer!**     |

| Left-Aligned  | Center Aligned  | Right Aligned |
| :------------ |:---------------:| -----:|
| col 3 is      | some wordy text | $1600 |
| col 2 is      | centered        |   $12 |
| zebra stripes | are neat        |    $1 |

### Emoji表情 :smiley:

> Blockquotes :star:

#### GFM task lists & Emoji

- :smiley: @mentions, :smiley: #refs, [links](), **formatting**, and <del>tags</del> supported
- list syntax required (any unordered or ordered list supported)
- :smiley: this is a complete item :smiley:
- this is an incomplete item [test link](#)

#### 反斜杠 Escape

\\*literal asterisks\\*

### 科学公式 TeX(KaTeX)

$E=mc^2$

行内的公式$E=mc^2$行内的公式，行内的$E=mc^2$公式。

$$x > y$$

$$\\sqrt{3x-1}+(1+x)^2$$

$$\\sin(\\alpha)^{\\theta}=\\sum_{i=0}^{n}(x^i + \\cos(f))$$

### 绘制流程图 Flowchart

\`\`\`mermaid
flowchart TD
    A[用户登陆] --> B[登陆操作]
    B --> C{登陆成功?}
    C -->|是| D[进入后台]
    C -->|否| B
\`\`\`

### 绘制序列图 Sequence Diagram

\`\`\`mermaid
sequenceDiagram
    participant Andrew
    participant China
    Andrew->>China: Says Hello
    Note right of China: China thinks about it
    China-->>Andrew: How are you?
    Andrew->>China: I am good thanks!
\`\`\`

### End`;

export default function Home() {
  const [content, setContent] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showHtmlPreview, setShowHtmlPreview] = useState(false);
  const [showSource, setShowSource] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [locale, setLocale] = useState<Locale>('en');
  const d = getDemoMessages(locale);

  useEffect(() => {
    fetch('/article_example.md')
      .then(r => r.text())
      .then(md => setContent(migrateMarkdownSyntax(md)))
      .catch(() => setContent(migrateMarkdownSyntax(INITIAL_CONTENT)));
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initial = saved || 'light';
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const htmlPreview = useMemo(() => {
    return markdownToHtml(content);
  }, [content]);

  // 虚拟键盘检测
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleResize = () => {
      // 键盘弹出时 viewport 高度会明显减小
      setKeyboardOpen(vv.height < window.innerHeight * 0.75);
    };
    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    localStorage.setItem('theme', next);
  };

  const handleExportMarkdown = () => {
    exportMarkdown(content, 'untitled');
    setShowExportMenu(false);
  };

  const handleExportHTML = () => {
    exportHTML(content, 'untitled');
    setShowExportMenu(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* 头部 */}
      <header className="bg-white dark:bg-gray-800 border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <h1 className="text-sm sm:text-xl font-bold text-gray-900 dark:text-white truncate">
              WYSIWYG Markdown Editor
            </h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
              title={theme === 'light' ? d.toggleDark : d.toggleLight}
            >
              {theme === 'light' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowSource(!showSource)}
              className={`p-2 rounded-lg transition-colors ${
                showSource
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              title={showSource ? d.closeSource : d.openSource}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setShowHtmlPreview(true)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
              title={d.htmlPreview}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
            </button>
            <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {d.export}
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-20">
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg flex items-center gap-2"
                >
                  <span className="text-gray-600 dark:text-gray-400">📄</span>
                  {d.exportMarkdown}
                </button>
                <button
                  type="button"
                  onClick={handleExportHTML}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg flex items-center gap-2"
                >
                  <span className="text-gray-600 dark:text-gray-400">🌐</span>
                  {d.exportHtml}
                </button>
              </div>
            )}
          </div>
          <select
            aria-label={d.language}
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            className="px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm"
          >
            {SUPPORTED_LOCALES.map((l) => (
              <option key={l} value={l}>{l === 'en' ? 'English' : '中文'}</option>
            ))}
          </select>
          </div>
        </div>
      </header>

      {/* 主内容 */}
      <main
        className="px-2 sm:px-4 py-2 sm:py-6 flex flex-col overflow-hidden"
        style={{
          height: keyboardOpen
            ? 'calc(100dvh - 64px)'
            : 'calc(100dvh - 64px)',
        }}
      >
        <div className="flex-1 min-h-0">
          <WysiwygEditor content={content} onChange={setContent} showSource={showSource} onToggleSource={() => setShowSource(!showSource)} locale={locale} />
        </div>
      </main>

      {/* HTML 预览弹窗 */}
      {showHtmlPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col mx-4">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                HTML 预览
              </h2>
              <button
                type="button"
                onClick={() => setShowHtmlPreview(false)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div
                className="markdown-preview"
                dangerouslySetInnerHTML={{ __html: htmlPreview }}
              />
              <MermaidBlock locale={locale} />
            </div>
          </div>
        </div>
      )}

      {/* 页脚 */}
      <footer className="bg-white dark:bg-gray-800 border-t mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {d.footer}
        </div>
      </footer>
    </div>
  );
}
