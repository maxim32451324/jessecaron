import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 24,
        padding: 28,
      }}
    >
      <span className="eyebrow">Fout 404</span>
      <h1 className="display" style={{ fontSize: "clamp(56px,14vw,160px)" }}>
        Verkeerde<br />
        afslag
      </h1>
      <p style={{ color: "var(--text-muted)", maxWidth: "42ch" }}>
        Deze pagina bestaat niet (meer). Don&apos;t confuse movement with progress — keer terug
        naar de juiste route.
      </p>
      <Link href="/" className="btn btn--blue">
        Naar home ↗
      </Link>
    </div>
  );
}
