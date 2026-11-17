import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export default function LiquidNavbar({ items, open, onNavigate, children }) {
  const [active, setActive] = useState(0);
  const [blob, setBlob] = useState({ left: 6, width: 0 });
  const navRef = useRef(null);
  const itemRefs = useRef([]);

  const measure = useCallback(() => {
    const nav = navRef.current;
    const item = itemRefs.current[active];
    if (!nav || !item || !nav.offsetWidth) return;
    const navBox = nav.getBoundingClientRect();
    const itemBox = item.getBoundingClientRect();
    setBlob({ left: itemBox.left - navBox.left, width: itemBox.width });
  }, [active]);

  useLayoutEffect(() => {
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    if (navRef.current) observer?.observe(navRef.current);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure, open]);

  const select = (event, index, id) => {
    event.preventDefault();
    setActive(index);
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
    onNavigate?.();
  };

  return (
    <nav ref={navRef} className={`nav-links liquid-navbar ${open ? 'is-open' : ''}`} aria-label="Main navigation">
      <span className="liquid-navbar-glass" aria-hidden="true" />
      <span
        className="liquid-navbar-drop"
        style={{ '--liquid-left': `${blob.left}px`, '--liquid-width': `${blob.width}px` }}
        aria-hidden="true"
      />
      {items.map(({ label, id }, index) => (
        <a
          ref={(node) => { itemRefs.current[index] = node; }}
          className="liquid-navbar-item"
          key={id}
          href={`#${id}`}
          aria-current={active === index ? 'page' : undefined}
          onClick={(event) => select(event, index, id)}
        >
          {label}
        </a>
      ))}
      {children}
    </nav>
  );
}
