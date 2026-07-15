'use client';

import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
  onLongPress: (e: TouchEvent | MouseEvent) => void;
  delay?: number;
  onClick?: (e: TouchEvent | MouseEvent) => void;
}

export function useLongPress({ onLongPress, delay = 500, onClick }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const start = useCallback((e: TouchEvent | MouseEvent) => {
    isLongPress.current = false;

    if ('touches' in e) {
      startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress(e);
    }, delay);
  }, [onLongPress, delay]);

  const move = useCallback((e: TouchEvent) => {
    if (!timerRef.current) return;
    const dx = e.touches[0].clientX - startPos.current.x;
    const dy = e.touches[0].clientY - startPos.current.y;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      clear();
    }
  }, []);

  const end = useCallback((e: TouchEvent | MouseEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!isLongPress.current && onClick) {
      onClick(e);
    }
  }, [onClick]);

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: end,
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: clear,
  };
}
