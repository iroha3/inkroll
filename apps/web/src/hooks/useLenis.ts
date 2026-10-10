import { useEffect, type RefObject } from 'react';
import Lenis from 'lenis';

interface UseLenisOptions {
  /** Interpolation factor – lower = smoother/slower feel */
  lerp?: number;
  /** Wheel sensitivity multiplier */
  wheelMultiplier?: number;
}

/**
 * Attach Lenis smooth scrolling to an internal scroll container (wrapper is the
 * scrolling element, content is its single direct child).
 *
 * - Falls back to native scrolling when the user prefers reduced motion.
 * - Cleans up its own rAF loop and destroys Lenis on unmount.
 */
export function useLenis(
  ref: RefObject<HTMLElement | null>,
  options: UseLenisOptions = {}
) {
  useEffect(() => {
    const wrapper = ref.current;
    if (!wrapper) return;

    // Respect reduced motion: keep native scrolling.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      wrapper,
      content: wrapper.firstElementChild as HTMLElement,
      lerp: options.lerp ?? 0.12,
      wheelMultiplier: options.wheelMultiplier ?? 1.2,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
