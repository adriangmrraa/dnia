/**
 * Router mínimo client-side — sin dependencias (la demo debe correr offline:
 * nada de CDN ni paquetes extra). History API + popstate; vite dev server
 * resuelve el fallback a index.html para cualquier path (appType: 'spa').
 */
import {
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";

export function usePath(): string {
  const [path, setPath] = useState(() => window.location.pathname);
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  return path;
}

export function navigate(to: string) {
  window.history.pushState({}, "", to);
  // usePath escucha popstate — pushState no lo dispara solo.
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo(0, 0);
}

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  to: string;
  children: ReactNode;
}

/** Link interno: navega client-side; Ctrl/clic medio abren pestaña normal. */
export function Link({ to, children, onClick, ...rest }: LinkProps) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (
      e.defaultPrevented ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0
    )
      return;
    e.preventDefault();
    navigate(to);
  };
  return (
    <a href={to} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
