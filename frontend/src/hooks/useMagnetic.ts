import { useRef, type PointerEvent } from 'react';

export function useMagnetic<T extends HTMLElement>(strength = 0.22) {
  const ref = useRef<T>(null);

  function onPointerMove(event: PointerEvent<T>) {
    const el = ref.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    const x = event.clientX - box.left - box.width / 2;
    const y = event.clientY - box.top - box.height / 2;
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  }

  function onPointerLeave() {
    if (ref.current) ref.current.style.transform = '';
  }

  return { ref, onPointerMove, onPointerLeave };
}
