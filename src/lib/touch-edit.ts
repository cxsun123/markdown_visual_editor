'use client';

export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function createLongPressHandler(
  onEdit: () => void,
  delay = 500
): {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let startX = 0;
  let startY = 0;
  let triggered = false;

  return {
    onTouchStart: (e: React.TouchEvent) => {
      triggered = false;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      timer = setTimeout(() => {
        triggered = true;
        onEdit();
      }, delay);
    },
    onTouchMove: (e: React.TouchEvent) => {
      if (!timer) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        clearTimeout(timer);
        timer = null;
      }
    },
    onTouchEnd: () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    },
    onDoubleClick: (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onEdit();
    },
  };
}
