/**
 * Shell del sitio — nav superior, router client-side y footer.
 * Rutas:
 *   /           landing (pitch visual, evidencia devnet, por-qué-ahora)
 *   /dashboard  auditoría + adopción en vivo (read-only on-chain)
 *   /docs       la historia de adopción (integración real, niveles, fricción)
 *   /demo       cómo reproducir (comandos, guion, estado de servicios)
 *   /colaborar  cómo contribuir (repo, issues/PRs, roadmap, licencia)
 */
import { Link, usePath } from "./router";
import { PROGRAM_ID, explorerAddr, short } from "./site";
import { Brandmark } from "./ui";
import Landing from "./Landing";
import Dashboard from "./Dashboard";
import Docs from "./Docs";
import DemoPage from "./DemoPage";
import Colaborar from "./Colaborar";

const NAV: { to: string; label: string }[] = [
  { to: "/dashboard", label: "Auditoría" },
  { to: "/docs", label: "Adopción" },
  { to: "/demo", label: "Demo" },
  { to: "/colaborar", label: "Colaborar" },
];

function NotFound() {
  return (
    <main className="wrap">
      <article className="card wide">
        <h1>404</h1>
        <p className="plain">
          Esa ruta no existe. Volvé al <Link to="/">inicio</Link>.
        </p>
      </article>
    </main>
  );
}

export default function App() {
  const path = usePath().replace(/\/+$/, "") || "/";

  let page;
  switch (path) {
    case "/":
      page = <Landing />;
      break;
    case "/dashboard":
      page = <Dashboard />;
      break;
    case "/docs":
    case "/adopcion":
      page = <Docs />;
      break;
    case "/demo":
      page = <DemoPage />;
      break;
    case "/colaborar":
      page = <Colaborar />;
      break;
    default:
      page = <NotFound />;
  }

  return (
    <div className="site">
      <nav className="topnav">
        <div className="topnav-inner">
          <Link to="/" className="brand">
            <Brandmark />
            <b>dnia</b>
          </Link>
          <div className="topnav-links">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={path === n.to ? "sel" : ""}
              >
                {n.label}
              </Link>
            ))}
          </div>
          <a
            className="chip nav-chip"
            href={explorerAddr(PROGRAM_ID)}
            target="_blank"
            rel="noreferrer"
            title={`programa ${PROGRAM_ID} — devnet`}
          >
            <i className="dot ok"></i>devnet · {short(PROGRAM_ID)}
          </a>
        </div>
      </nav>
      <div className="page">{page}</div>
      <footer className="foot">
        <div className="wrap foot-inner">
          <span className="brand">
            <Brandmark size={16} />
            <b>dnia</b> — la capa de confianza · <b>Apache-2.0</b>
          </span>
          <span className="muted">
            programa{" "}
            <a href={explorerAddr(PROGRAM_ID)} target="_blank" rel="noreferrer">
              {short(PROGRAM_ID)}
            </a>{" "}
            · solana devnet · sin PII on-chain
          </span>
        </div>
      </footer>
    </div>
  );
}
