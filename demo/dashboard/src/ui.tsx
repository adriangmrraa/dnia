/**
 * Componentes de presentación compartidos del sistema "capa de confianza"
 * (design §3.4): marca, glosario accesible, codeblock con chrome, resaltado
 * de tokens CSS-only, terminal con window-chrome y el helper fade-up.
 * Todo CSS + React — cero dependencias, cero HTML inyectado (INV-5).
 */
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

/* ── Marca: rombito gradient + check (SVG inline, sin asset) ─────────────── */
export function Brandmark({ size = 22 }: { size?: number }) {
  const gid = useId();
  return (
    <svg
      className="brandmark"
      viewBox="0 0 24 24"
      fill="none"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path
        d="M12 2l8.5 5v10L12 22l-8.5-5V7L12 2z"
        stroke={`url(#${gid})`}
        strokeWidth="1.8"
      />
      <path
        d="M8 12.5l2.6 2.6L16.5 9"
        stroke="#2dd4bf"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="24" y2="24">
          <stop stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#a78bfa" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Glosario accesible (.term-gloss) — copy en capas (design §5) ────────── */
export function Gloss({ tip, children }: { tip: string; children: ReactNode }) {
  return (
    <span
      className="term-gloss"
      tabIndex={0}
      aria-label={tip}
      data-tip={tip}
    >
      {children}
    </span>
  );
}

/* ── Botón copiar (navigator.clipboard, sin permisos extra) ─────────────── */
export function CopyBtn({ text, className = "" }: { text: string; className?: string }) {
  const [done, setDone] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setDone(true);
        setTimeout(() => setDone(false), 1400);
      },
      () => setDone(false)
    );
  };
  return (
    <button type="button" className={className || "copy"} onClick={copy}>
      {done ? "copiado ✓" : "copiar"}
    </button>
  );
}

/* ── Resaltado de tokens CSS-only — comentario / keyword / string / fn ───── */
const KEYWORDS = new Set(
  "abstract as async await break case catch class const continue declare default do else enum export extends false for from function if implements import in instanceof interface let new null of private protected public readonly return static switch this throw true try type typeof undefined var while".split(
    " "
  )
);
const TOK_RE =
  /("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\/[^\n]*|\/\*[\s\S]*?\*\/|[A-Za-z_$][\w$]*)/g;

export function Highlight({ code }: { code: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of code.matchAll(TOK_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(code.slice(last, idx));
    const t = m[0];
    let cls: string | null = null;
    if (t.startsWith("//") || t.startsWith("/*")) cls = "tok-c";
    else if (t[0] === '"' || t[0] === "'" || t[0] === "`") cls = "tok-s";
    else if (KEYWORDS.has(t)) cls = "tok-k";
    else if (/^\s*\(/.test(code.slice(idx + t.length))) cls = "tok-f";
    out.push(
      cls ? (
        <span key={i++} className={cls}>
          {t}
        </span>
      ) : (
        t
      )
    );
    last = idx + t.length;
  }
  out.push(code.slice(last));
  return <>{out}</>;
}

/* ── Codeblock con window-chrome (filename + copy) ───────────────────────── */
export function CodeBlock({
  file,
  code,
  highlight = false,
}: {
  file?: string;
  code: string;
  highlight?: boolean;
}) {
  return (
    <div className="codeblock">
      {file !== undefined && (
        <div className="codeblock-bar">
          <span>{file}</span>
          <CopyBtn text={code} />
        </div>
      )}
      <pre>
        <code>{highlight ? <Highlight code={code} /> : code}</code>
      </pre>
    </div>
  );
}

/* ── Terminal — líneas con color semántico (texto plano, INV-5) ──────────── */
export function TermLines({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((l, i) => {
        const cls = l.includes("✗")
          ? "err"
          : l.includes("──> ✓") || l.includes("══")
            ? l.includes("══")
              ? "hd"
              : "ok"
            : /^\s/.test(l)
              ? "dim"
              : undefined;
        return (
          <span key={i} className={cls}>
            {l}
            {"\n"}
          </span>
        );
      })}
    </>
  );
}

/* ── fade-up on scroll (IntersectionObserver, ~15 líneas — §3.5) ─────────── */
export function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = Array.from(root.querySelectorAll<HTMLElement>(".fade-up"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.08 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return ref;
}
