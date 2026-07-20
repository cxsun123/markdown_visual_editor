'use client'

import { useRef, useEffect, type ReactNode } from 'react'

export function TooltipProvider({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const container = containerRef.current
    const tooltip = tooltipRef.current
    if (!container || !tooltip) return

    let activeTarget: HTMLElement | null = null

    const show = (el: HTMLElement) => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      const text = el.title
      if (!text) return
      activeTarget = el
      tooltip.textContent = text
      tooltip.style.display = 'block'
      const rect = el.getBoundingClientRect()
      tooltip.style.left = `${rect.left + rect.width / 2}px`
      tooltip.style.top = `${rect.top - 6}px`
    }

    const hide = () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      hideTimerRef.current = setTimeout(() => {
        tooltip.style.display = 'none'
        activeTarget = null
      }, 80)
    }

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[title]')
      if (el && el !== activeTarget) show(el)
    }

    const onOut = (e: MouseEvent) => {
      const related = e.relatedTarget as Node | null
      if (related && container.contains(related)) return
      hide()
    }

    container.addEventListener('mouseover', onOver)
    container.addEventListener('mouseout', onOut)

    return () => {
      container.removeEventListener('mouseover', onOver)
      container.removeEventListener('mouseout', onOut)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {children}
      <div
        ref={tooltipRef}
        role="tooltip"
        style={{ display: 'none' }}
        className="fixed z-[100] px-2 py-1 text-xs rounded-md bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 whitespace-nowrap pointer-events-none shadow-md"
      />
    </div>
  )
}
