import type { OptionRun } from "@/lib/content";

/**
 * The size run (or, for the padel tournament, the skill level) as a real radio
 * group: arrow-key navigable, announced as a group, and sold-out options actually
 * `disabled` rather than merely styled grey. Like the gallery it is script-free,
 * so a visitor with JavaScript off can still pick a size and read it back.
 *
 * Nothing here posts anywhere — ordering happens on the webshop — so the selection's
 * job is to tell the visitor which size to ask for, and which ones are gone.
 */
export default function ProductOptions({ run, id }: { run: OptionRun; id: string }) {
  const group = `opt-${id}`;
  const anyAvailable = run.options.some((o) => o.inStock);

  const rules = run.options
    .map(
      (_, i) => `
        .popt__r:nth-of-type(${i + 1}):checked ~ .popt__row .popt__o:nth-child(${i + 1}) label { background:var(--blue); border-color:var(--blue); color:#fff; }
        .popt__r:nth-of-type(${i + 1}):focus-visible ~ .popt__row .popt__o:nth-child(${i + 1}) label { outline:2px solid var(--blue); outline-offset:3px; }
        .popt__r:nth-of-type(${i + 1}):checked ~ .popt__echo .popt__e:nth-child(${i + 2}) { display:inline; }`,
    )
    .join("");

  return (
    <fieldset className="popt">
      <legend className="popt__legend">{run.label}</legend>

      {run.options.map((o, i) => (
        <input
          key={`r-${o.value}`}
          type="radio"
          className="popt__r"
          name={group}
          id={`${group}-${i}`}
          value={o.value}
          disabled={!o.inStock}
        />
      ))}

      <div className="popt__row">
        {run.options.map((o, i) => (
          <span className={`popt__o ${o.inStock ? "" : "is-out"}`} key={`o-${o.value}`}>
            <label htmlFor={`${group}-${i}`}>
              {o.value}
              {o.inStock ? null : <span className="popt__sr"> — {o.text ?? "Uitverkocht"}</span>}
            </label>
          </span>
        ))}
      </div>

      <p className="popt__echo">
        <span className="popt__hint">
          {anyAvailable ? `Kies je ${run.label.toLowerCase()}` : "Geen enkele optie is nog leverbaar"}
        </span>
        {run.options.map((o) => (
          <span className="popt__e" key={`e-${o.value}`}>
            Gekozen: <strong>{o.value}</strong>
          </span>
        ))}
      </p>

      <style>{`
        .popt { border:0; margin:0; padding:0; }
        .popt__legend { font-family:var(--font-jetbrains),monospace; font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:var(--ash); padding:0; margin-bottom:12px; }
        .popt__r { position:absolute; width:1px; height:1px; opacity:0; pointer-events:none; margin:0; }
        .popt__row { display:flex; flex-wrap:wrap; gap:8px; }
        .popt__o label { display:inline-flex; align-items:center; justify-content:center; min-width:58px; padding:12px 16px; border:1px solid var(--line-d); font-family:var(--font-jetbrains),monospace; font-size:13px; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; transition:.2s; }
        .popt__o label:hover { border-color:var(--blue); color:var(--blue); }
        .popt__o.is-out label { cursor:not-allowed; color:var(--ash); opacity:.5; text-decoration:line-through; text-decoration-color:var(--ash); }
        .popt__o.is-out label:hover { border-color:var(--line-d); color:var(--ash); }
        .popt__sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
        .popt__echo { margin-top:12px; font-size:14px; color:var(--text-dim); min-height:1.5em; }
        .popt__e { display:none; }
        .popt__e strong { color:var(--paper); font-family:var(--font-jetbrains),monospace; }
        .popt__r:checked ~ .popt__echo .popt__hint { display:none; }
        ${rules}
      `}</style>
    </fieldset>
  );
}
