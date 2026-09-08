import { getPageBody } from "@/lib/content.server";

/**
 * The old `/records/` page, folded into `/training/snelheidsmetingen`.
 *
 * PARITY-PLAN §1.3 harvests it "as a block" rather than as a route, because 386
 * characters of sprint times is not a page and `/training/snelheidsmetingen` is
 * already the page that lists personal bests. `records` is therefore in
 * `content.json.pages` (so `getPageBody` finds it) but not in `TRAINING_SLUGS`, so
 * `/training/records` is a 404 by design.
 *
 * ── THE NAMES ──────────────────────────────────────────────────────────────────
 *
 * `content/pages/records.md` names eight children who set these times in 2013 as
 * U12 and U14 athletes. They were 11 and 13 then; they are adults now, and none of
 * them agreed to anything on our watch. Publishing a minor's full name next to a
 * measured performance is the client's call to make, not ours, and PARITY-PLAN §11
 * Q6 puts that question to him explicitly.
 *
 * So the block ships with the times and without the names. The flag below is the
 * whole switch: when Jesse says yes in writing, flip it to `true` and the names
 * appear, linked to nothing (their old `/portfolio_item/…` URLs have no route here).
 * If he says no, delete the flag and the `holder` field with it.
 */
const SHOW_RECORD_HOLDERS = false;

type RecordRow = { distance: string; holder: string; time: string };
type RecordGroup = { title: string; rows: RecordRow[] };

/** `60 Meter – [Guyon Balsemhof](…) – 9,8 seconds`, with an en dash on both sides. */
const ROW = /^(.+?)\s+–\s+(\[[^\]]*\]\([^)]*\)|[^–]+?)\s+–\s+(.+)$/;

function parseRecords(body: string): RecordGroup[] {
  const groups: RecordGroup[] = [];
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    const heading = /^#{2,3}\s+(.+)$/.exec(line);
    if (heading) {
      groups.push({ title: heading[1].trim(), rows: [] });
      continue;
    }

    const m = ROW.exec(line);
    if (!m || !groups.length) continue;
    const link = /^\[([^\]]*)\]/.exec(m[2]);
    groups[groups.length - 1].rows.push({
      distance: m[1].trim(),
      holder: (link ? link[1] : m[2]).trim(),
      time: m[3].trim(),
    });
  }
  return groups.filter((g) => g.rows.length);
}

export default function RecordsBlock() {
  const groups = parseRecords(getPageBody("records"));
  if (!groups.length) return null;

  return (
    <section className="recs">
      <span className="eyebrow">All Time Records</span>
      <div className="recs__grid">
        {groups.map((g) => (
          <div className="recs__g" key={g.title}>
            <h2 className="recs__t">{g.title}</h2>
            <dl className="recs__rows">
              {g.rows.map((r) => (
                <div className="recs__row" key={r.distance}>
                  <dt>{r.distance}</dt>
                  {SHOW_RECORD_HOLDERS ? <span className="recs__who">{r.holder}</span> : null}
                  <dd>{r.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      <style>{`
        .recs { margin-top:64px; border-top:1px solid var(--line-d); padding-top:40px; }
        /* min-width:0 on every grid child — the default min-width:auto lets one long
           row push the whole track wider than the column it sits in. */
        .recs__grid > * { min-width:0; }
        .recs__grid { display:grid; grid-template-columns:repeat(2,1fr); gap:1px; background:var(--line-d); border:1px solid var(--line-d); margin-top:26px; }
        .recs__g { background:var(--ink); padding:28px 26px 30px; }
        .recs__t { font-family:var(--font-anton),sans-serif; text-transform:uppercase; font-size:clamp(20px,2.4vw,28px); line-height:1; margin-bottom:20px; overflow-wrap:anywhere; }
        .recs__rows { display:grid; gap:1px; }
        .recs__row { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,auto); align-items:baseline; gap:14px; padding:11px 0; border-bottom:1px solid var(--line-d); }
        .recs__row:last-child { border-bottom:0; }
        .recs__row dt { font-family:var(--font-jetbrains),monospace; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--ash); min-width:0; }
        .recs__row dd { font-family:var(--font-anton),sans-serif; font-size:20px; line-height:1; color:var(--paper); text-align:right; min-width:0; }
        .recs__who { grid-column:1 / -1; font-size:14px; color:var(--blue); min-width:0; }
        @media(max-width:760px){ .recs__grid{ grid-template-columns:1fr; } }
      `}</style>
    </section>
  );
}
