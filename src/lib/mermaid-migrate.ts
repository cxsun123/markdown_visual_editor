/**
 * 将旧版 mermaid 语法转换为 mermaid v11 兼容的现代语法
 */

// 匹配 ```flow ... ``` 代码块
const FLOW_BLOCK_RE = /```flow\n([\s\S]*?)```/g;

// 匹配旧语法节点定义: name=>type: label
const NODE_RE = /^(\w+)=>(\w+):\s*(.+)$/gm;

function convertFlowSyntax(code: string): string {
  const lines = code.trim().split('\n');
  const nodes: Record<string, { type: string; label: string; id: string }> = {};
  const edges: string[] = [];
  let firstNodeId = '';

  for (const line of lines) {
    const nodeMatch = line.match(/^(\w+)=>(\w+):\s*(.+)$/);
    if (nodeMatch) {
      const [, name, type, label] = nodeMatch;
      const id = name;
      nodes[name] = { type, label: label.trim(), id };
      if (!firstNodeId) firstNodeId = id;
      continue;
    }

    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      edges.push(trimmed);
    }
  }

  if (Object.keys(nodes).length === 0) return code;

  // 构建 mermaid flowchart
  const mermaidLines: string[] = ['flowchart TD'];

  for (const [, node] of Object.entries(nodes)) {
    let shape = '';
    switch (node.type) {
      case 'start':
        shape = `    ${node.id}([${node.label}])`;
        break;
      case 'end':
        shape = `    ${node.id}([${node.label}])`;
        break;
      case 'condition':
        shape = `    ${node.id}{${node.label}}`;
        break;
      case 'operation':
      default:
        shape = `    ${node.id}[${node.label}]`;
        break;
    }
    mermaidLines.push(shape);
  }

  // 转换旧的边语法
  for (const edge of edges) {
    // st->op->cond  =>  st --> op --> cond
    // cond(yes)->e  =>  cond -->|是| e
    // cond(no)->op  =>  cond -->|否| op
    const simpleEdge = edge.replace(/->/g, ' --> ');
    const labeledEdge = simpleEdge.replace(
      /(\w+)\((\w+)\)\s*-->\s*(\w+)/g,
      (_, from, label, to) => {
        const labelMap: Record<string, string> = {
          yes: '是',
          no: '否',
          Yes: '是',
          No: '否',
          YES: '是',
          NO: '否',
        };
        return `${from} -->|${labelMap[label] || label}| ${to}`;
      }
    );
    mermaidLines.push('    ' + labeledEdge.trim());
  }

  return mermaidLines.join('\n');
}

// 匹配 ```seq ... ``` 代码块
const SEQ_BLOCK_RE = /```seq\n([\s\S]*?)```/g;

function convertSeqSyntax(code: string): string {
  const lines = code.trim().split('\n');
  const mermaidLines: string[] = ['sequenceDiagram'];

  const participants = new Set<string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Note right of X: text
    const noteMatch = trimmed.match(/^Note\s+(right|left)\s+of\s+(\w+):\s*(.+)$/i);
    if (noteMatch) {
      mermaidLines.push(`    Note ${noteMatch[1]} of ${noteMatch[2]}: ${noteMatch[3]}`);
      continue;
    }

    // Andrew->China: text   (sync)
    // China-->Andrew: text  (async/dashed)
    // Andrew->>China: text  (strong)
    // China-->>Andrew: text (strong async)
    const msgMatch = trimmed.match(/^(\w+)\s*(--?>+|-+?>+)\s*(\w+):\s*(.+)$/);
    if (msgMatch) {
      const [, from, arrow, to, text] = msgMatch;
      participants.add(from);
      participants.add(to);

      const mermaidArrow = arrow.includes('--') ? '-->>' : '->>';

      mermaidLines.push(`    ${from}${mermaidArrow}${to}: ${text}`);
      continue;
    }

    // 其他行原样保留
    if (trimmed) {
      mermaidLines.push(`    ${trimmed}`);
    }
  }

  // 添加 participant 声明
  if (participants.size > 0) {
    const participantLines = Array.from(participants)
      .map((p) => `    participant ${p}`)
      .reverse();
    mermaidLines.splice(1, 0, ...participantLines);
  }

  return mermaidLines.join('\n');
}

/**
 * 转换 markdown 文本中的旧版 mermaid 语法为新版语法
 */
export function migrateMermaidSyntax(markdown: string): string {
  let result = markdown;

  // 转换 flow 代码块
  result = result.replace(FLOW_BLOCK_RE, (_, code) => {
    const converted = convertFlowSyntax(code);
    return '```mermaid\n' + converted + '\n```';
  });

  // 转换 seq 代码块
  result = result.replace(SEQ_BLOCK_RE, (_, code) => {
    const converted = convertSeqSyntax(code);
    return '```mermaid\n' + converted + '\n```';
  });

  return result;
}
