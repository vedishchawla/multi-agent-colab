import { useEffect } from 'react';

export function StudioAtmosphere() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'studio-cursor';
    document.body.appendChild(cursor);

    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 3;
    let cx = mx;
    let cy = my;
    let frame = 0;

    const onMove = (event: PointerEvent) => {
      mx = event.clientX;
      my = event.clientY;
      document.documentElement.style.setProperty('--mx', `${mx}px`);
      document.documentElement.style.setProperty('--my', `${my}px`);
    };

    const tick = () => {
      cx += (mx - cx) * 0.12;
      cy += (my - cy) * 0.12;
      cursor.style.transform = `translate(${cx}px, ${cy}px)`;
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(frame);
      cursor.remove();
    };
  }, []);

  return (
    <div className="studio-atmosphere" aria-hidden="true">
      <span className="orb orb-a" />
      <span className="orb orb-b" />
      <span className="orb orb-c" />
      <span className="grain" />
    </div>
  );
}
