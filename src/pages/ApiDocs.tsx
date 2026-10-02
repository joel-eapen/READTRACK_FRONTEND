import { Link } from "react-router-dom";
import { Badge } from "../components/ui";
import "./ApiDocs.css";

/** HTTP method → badge tone, matching the brutalist palette. */
const METHOD_TONE: Record<string, "primary" | "success" | "secondary" | "danger"> = {
  GET: "primary",
};

interface Param {
  name: string;
  required: boolean;
  type: string;
  desc: string;
}

interface Endpoint {
  method: "GET";
  path: string;
  summary: string;
  params?: Param[];
  notes?: string;
}

/**
 * Public developer API reference. Documents only the public, unauthenticated
 * endpoint (GET /api/public/books). This documentation page is itself public —
 * no sign-in required to read it.
 */
const ENDPOINTS: Endpoint[] = [
  {
    method: "GET",
    path: "/api/public/books",
    summary: "List books from the public catalogue (paginated). No authentication required.",
    params: [
      { name: "page", required: false, type: "integer", desc: "Page number (positive integer). Defaults to 1." },
      { name: "limit", required: false, type: "integer", desc: "Results per page (positive integer). Defaults to 20." },
    ],
  },
];

function slugify(method: string, path: string): string {
  return `${method}-${path}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ParamTable({ title, rows }: { title: string; rows: Param[] }) {
  return (
    <div className="docs__params">
      <h4 className="docs__params-title label-caps">{title}</h4>
      <table className="docs__table">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Type</th>
            <th scope="col">Required</th>
            <th scope="col">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.name}>
              <td><code>{p.name}</code></td>
              <td>{p.type}</td>
              <td>
                <Badge tone={p.required ? "danger" : "secondary"}>
                  {p.required ? "Required" : "Optional"}
                </Badge>
              </td>
              <td>{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ApiDocs() {
  const base = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

  return (
    <div className="docs">
      <header className="docs__topbar">
        <Link to="/" className="docs__brand">
          READ<span>TRACK</span>
        </Link>
        <span className="docs__topbar-tag label-caps">Developer API</span>
      </header>

      <main className="docs__main">
        <section className="docs__hero">
          <h1>Developer API</h1>
          <p className="docs__lead">
            A single public endpoint for browsing the READTRACK book catalogue.
            This reference is public and the endpoint requires no authentication
            — just make a request.
          </p>
        </section>

        {/* -------- Table of contents -------- */}
        <nav className="docs__toc" aria-label="On this page">
          <a href="#overview" className="docs__toc-link label-caps">1. Overview</a>
          <a href="#endpoints" className="docs__toc-link label-caps">2. Endpoint</a>
          <a href="#responses" className="docs__toc-link label-caps">3. Response</a>
        </nav>

        {/* -------- Overview -------- */}
        <section id="overview" className="docs__card" aria-labelledby="overview-title">
          <h2 id="overview-title">1. Overview</h2>
          <p className="docs__note-text">
            The public API exposes the book catalogue over HTTP. No account, API
            key, or <code>Authorization</code> header is required. All paths are
            relative to the base URL for this environment:
          </p>
          <pre className="docs__code"><code>{base}</code></pre>
        </section>

        {/* -------- Endpoint -------- */}
        <section id="endpoints" className="docs__card" aria-labelledby="endpoints-title">
          <h2 id="endpoints-title">2. Endpoint</h2>

          <ul className="docs__endpoints">
            {ENDPOINTS.map((ep) => {
              const id = slugify(ep.method, ep.path);
              return (
                <li key={id} id={id} className="docs__endpoint">
                  <div className="docs__endpoint-head">
                    <Badge tone={METHOD_TONE[ep.method]}>{ep.method}</Badge>
                    <code className="docs__endpoint-path">{ep.path}</code>
                  </div>
                  <p className="docs__endpoint-summary">{ep.summary}</p>

                  {ep.params ? <ParamTable title="Query parameters" rows={ep.params} /> : null}

                  {ep.notes ? (
                    <p className="docs__endpoint-note label-caps" role="note">
                      {ep.notes}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <p className="docs__note-text">Example request with curl:</p>
          <pre className="docs__code">
            <code>{`curl "${base}/api/public/books?page=1&limit=20"`}</code>
          </pre>
        </section>

        {/* -------- Responses -------- */}
        <section id="responses" className="docs__card" aria-labelledby="responses-title">
          <h2 id="responses-title">3. Response format</h2>
          <p className="docs__note-text">
            Successful responses are wrapped in a consistent envelope:
          </p>
          <pre className="docs__code">
            <code>{`{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": {
    "books": [ /* book objects */ ],
    "pagination": {
      "pageNumber": 1,
      "limitNumber": 20,
      "totalDocuments": 0,
      "totalPages": 1
    }
  }
}`}</code>
          </pre>
          <p className="docs__note-text">
            Errors return <code>success: false</code> with a non-2xx status code
            and a human-readable <code>message</code>.
          </p>
        </section>
      </main>

      <footer className="docs__footer label-caps">
        READTRACK — Developer API Reference
      </footer>
    </div>
  );
}
