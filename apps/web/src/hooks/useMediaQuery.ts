import { useState, useEffect } from 'react';

/**
 * 监听媒体查询匹配状态的 React Hook
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);
    const updateMatches = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    setMatches(mediaQueryList.matches);

    // Modern browsers support addEventListener on MediaQueryList
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', updateMatches);
      return () => mediaQueryList.removeEventListener('change', updateMatches);
    } else {
      // Fallback for older browsers
      (mediaQueryList as any).addListener(updateMatches);
      return () => (mediaQueryList as any).removeListener(updateMatches);
    }
  }, [query]);

  return matches;
}

/**
 * 判断当前是否处于移动端视口（屏幕宽度 < 1024px，涵盖手机与竖屏平板）
 */
export function useIsMobile(breakpoint = 1024): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}
