import Image from "next/image";

/**
 * Main image + thumbnail strip, built out of a radio group rather than script.
 *
 * The shop is the one place on this site where a picture *is* the product, so the
 * gallery has to work before anything hydrates — and it does: the radios carry a
 * `checked` attribute in the server-rendered HTML, the CSS below picks the matching
 * slide off `:checked`, and the labels are the thumbnails. That buys the keyboard
 * behaviour for free too (a radio group is arrow-key navigable and announces
 * "1 of 3" without us writing a single handler), and it means the page is complete
 * with JavaScript disabled instead of merely legible.
 */
export default function ProductGallery({
  images,
  name,
  id,
}: {
  images: string[];
  name: string;
  id: string;
}) {
  if (!images.length) return null;
  const multi = images.length > 1;
  const group = `gal-${id}`;

  // One :checked rule per image — cheaper than shipping a click handler.
  const rules = images
    .map(
      (_, i) => `
        .pgal__r:nth-of-type(${i + 1}):checked ~ .pgal__stage .pgal__slide:nth-child(${i + 1}) { opacity:1; visibility:visible; }
        .pgal__r:nth-of-type(${i + 1}):checked ~ .pgal__thumbs .pgal__thumb:nth-child(${i + 1}) label { border-color:var(--blue); opacity:1; }
        .pgal__r:nth-of-type(${i + 1}):focus-visible ~ .pgal__thumbs .pgal__thumb:nth-child(${i + 1}) label { outline:2px solid var(--blue); outline-offset:3px; }`,
    )
    .join("");

  return (
    <div className="pgal">
      {multi
        ? images.map((src, i) => (
            <input
              key={`r-${src}-${i}`}
              type="radio"
              className="pgal__r"
              name={group}
              id={`${group}-${i}`}
              defaultChecked={i === 0}
            />
          ))
        : null}

      <div className="pgal__stage">
        {images.map((src, i) => (
          <figure className="pgal__slide" key={`s-${src}-${i}`}>
            <Image
              src={src}
              alt={i === 0 ? name : `${name} — afbeelding ${i + 1} van ${images.length}`}
              fill
              sizes="(max-width:960px) 100vw, 640px"
              priority={i === 0}
              className="pgal__img"
            />
          </figure>
        ))}
      </div>

      {multi ? (
        <ul className="pgal__thumbs" role="list">
          {images.map((src, i) => (
            <li className="pgal__thumb" key={`t-${src}-${i}`}>
              <label htmlFor={`${group}-${i}`}>
                <Image src={src} alt="" fill sizes="(max-width:960px) 20vw, 130px" className="pgal__timg" />
                <span className="pgal__sr">
                  Afbeelding {i + 1} van {images.length}
                </span>
              </label>
            </li>
          ))}
        </ul>
      ) : null}

      <style>{`
        .pgal { position:relative; }
        /* Kept in the tab order and reachable by arrow keys — never display:none. */
        .pgal__r { position:absolute; width:1px; height:1px; opacity:0; pointer-events:none; margin:0; }
        /* 3:2 is the ratio 68 of the 93 harvested photographs already are, so most of
           them fill the stage exactly and the handful of portrait shots letterbox on
           white rather than being cropped through the product. */
        .pgal__stage { position:relative; aspect-ratio:3/2; background:#fff; border:1px solid var(--line-d); overflow:hidden; }
        .pgal__slide { position:absolute; inset:0; margin:0; opacity:0; visibility:hidden; transition:opacity .3s; }
        ${multi ? "" : ".pgal__slide { opacity:1; visibility:visible; }"}
        .pgal__img { object-fit:contain; }
        .pgal__thumbs { list-style:none; display:grid; grid-template-columns:repeat(5,1fr); gap:8px; margin:8px 0 0; padding:0; }
        .pgal__thumb label { position:relative; display:block; aspect-ratio:3/2; background:#fff; border:1px solid var(--line-d); cursor:pointer; opacity:.62; transition:opacity .2s, border-color .2s; }
        .pgal__thumb label:hover { opacity:1; border-color:var(--blue); }
        .pgal__timg { object-fit:cover; }
        .pgal__sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
        ${rules}
        /* Four across on a phone keeps every thumbnail above a 44px touch target. */
        @media(max-width:640px){ .pgal__thumbs { grid-template-columns:repeat(4,1fr); } }
        @media(prefers-reduced-motion:reduce){ .pgal__slide { transition:none; } }
      `}</style>
    </div>
  );
}
