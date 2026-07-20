'use client'

import { type Editor } from '@tiptap/react'
import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'

interface FloatingToolbarProps {
  editor: Editor | null
  children: ReactNode
}

export function FloatingToolbar({ editor, children }: FloatingToolbarProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)

  const calcPosition = useCallback(() => {
    if (!editor?.view.dom) return null
    const { from } = editor.state.selection
    const coords = editor.view.coordsAtPos(from)
    if (!coords) return null

    const editorRect = editor.view.dom.getBoundingClientRect()
    const toolbarEl = toolbarRef.current
    const toolbarHeight = toolbarEl?.offsetHeight || 44
    const toolbarWidth = toolbarEl?.offsetWidth || 400
    const gap = 48

    let top = coords.top - toolbarHeight - gap
    if (top < 4) {
      top = coords.bottom + gap
    }

    let left = coords.left - toolbarWidth / 2
    left = Math.max(editorRect.left + 4, Math.min(left, editorRect.right - toolbarWidth - 4))

    return { top, left }
  }, [editor])

  const updatePosition = useCallback(() => {
    const pos = calcPosition()
    if (pos) setPosition(pos)
  }, [calcPosition])

  useEffect(() => {
    if (!editor) return

    const onFocus = () => {
      requestAnimationFrame(updatePosition)
    }

    const onBlur = () => {
      setTimeout(() => {
        if (toolbarRef.current?.contains(document.activeElement)) return
        if (!editor.isFocused) setPosition(null)
      }, 0)
    }

    editor.on('focus', onFocus)
    editor.on('blur', onBlur)
    editor.on('selectionUpdate', updatePosition)

    return () => {
      editor.off('focus', onFocus)
      editor.off('blur', onBlur)
      editor.off('selectionUpdate', updatePosition)
    }
  }, [editor, updatePosition])

  useEffect(() => {
    if (!editor) return
    const handle = () => { if (editor.isFocused) updatePosition() }
    window.addEventListener('scroll', handle, true)
    window.addEventListener('resize', handle)
    return () => {
      window.removeEventListener('scroll', handle, true)
      window.removeEventListener('resize', handle)
    }
  }, [editor, updatePosition])

  if (!editor || !position) return null

  return (
    <div
      ref={toolbarRef}
      className="fixed z-50 rounded-lg shadow-xl border-2 border-gray-400 dark:border-gray-300"
      style={{ top: position.top, left: position.left }}
    >
      {children}
    </div>
  )
}
