import { Node, mergeAttributes } from '@tiptap/core'

export const HtmlBlock = Node.create({
  name: 'htmlBlock',

  group: 'block',

  content: 'block+',

  defining: true,

  addAttributes() {
    return {
      tagName: { default: 'div' },
      htmlAttrs: {
        default: {},
        parseHTML: (el) => {
          const attrs: Record<string, string> = {}
          for (const attr of el.attributes) {
            attrs[attr.name] = attr.value
          }
          return attrs
        },
        renderHTML: (attrs) => {
          return attrs.htmlAttrs ?? {}
        },
      },
    }
  },

  parseHTML() {
    return [
      { tag: 'div' },
      { tag: 'center' },
    ]
  },

  renderHTML({ node }) {
    const { tagName, htmlAttrs } = node.attrs
    return [tagName || 'div', mergeAttributes(htmlAttrs, { class: 'html-block' }), 0]
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          const { tagName, htmlAttrs } = node.attrs
          const attrStr = Object.entries(htmlAttrs)
            .map(([k, v]) => ` ${k}="${v}"`)
            .join('')
          state.write(`<${tagName}${attrStr}>\n\n`)
          state.renderContent(node)
          state.write(`\n</${tagName}>`)
          state.closeBlock(node)
        },
      },
    }
  },
})
