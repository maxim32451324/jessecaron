import dimensions from "@/lib/image-dimensions.json";

/**
 * Splitting a harvested page body into prose and image galleries.
 *
 * WHY
 *
 * The old pages were built in WPBakery, and several of them put a column of images
 * beside a column of text. The export flattened that into document order, so a page
 * like `/loopscholing/` now reads as intro → seven technique diagrams in a row →
 * eight headed paragraphs. That order is faithful (it is also how the old page
 * stacked on a phone), but seven full-width pictures one under the other is not a
 * layout, it is a scroll.
 *
 * So a run of consecutive images becomes one figure. This is a deliberate design
 * decision, not a reconstruction: pairing diagram k with heading k would be a guess
 * about a CSS alignment the markup never states — there are seven diagrams and eight
 * headings on `/loopscholing/`, and nothing anywhere says which belongs to which.
 * Shown as a set, they claim nothing they cannot support.
 *
 * The column count comes from the images' own pixel width, because the two runs on
 * this site want opposite things: `/loopscholing/`'s diagrams are 600 px pictograms
 * that tile happily three across, while `/data/`'s result charts are 1920 px tables
 * of sprint times that are illegible at anything less than the full content column.
 */

type Dim = { path: string; w: number; h: number };
const DIMS = dimensions as unknown as Record<string, Dim>;

/** Widest image that still reads as a tile rather than as a document. */
const WIDE_PX = 1400;
/** Fewer than this many in a row is not a gallery, it is an illustration. */
const MIN_RUN = 3;

export type GalleryImage = { src: string; alt: string };
export type Segment =
  | { kind: "prose"; text: string }
  | { kind: "gallery"; wide: boolean; images: GalleryImage[] };

/** A markdown line that is nothing but one image. */
const IMAGE_ONLY = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;

/** Same basename lookup `localImg()` performs, including the WordPress `-WxH` retry. */
function pixelWidth(src: string): number | undefined {
  const base = decodeURIComponent(src.split("?")[0].split("#")[0].split("/").pop() ?? "");
  const hit = DIMS[base] ?? DIMS[base.replace(/-\d+x\d+(?=\.[a-z0-9]+$)/i, "")];
  return hit?.w;
}

export function splitImageRuns(body: string): Segment[] {
  const out: Segment[] = [];
  let prose: string[] = [];
  let run: GalleryImage[] = [];
  let runLines: string[] = [];

  const flushProse = () => {
    const text = prose.join("\n").trim();
    if (text) out.push({ kind: "prose", text });
    prose = [];
  };

  const flushRun = () => {
    if (run.length >= MIN_RUN) {
      flushProse();
      // One wide image in the run sets the whole figure's format: mixing a 1920 px
      // chart with 600 px pictograms in the same tiled row would shrink the chart.
      out.push({
        kind: "gallery",
        wide: run.some((i) => (pixelWidth(i.src) ?? 0) >= WIDE_PX),
        images: run,
      });
    } else {
      // Too short to be a gallery — put the lines back exactly where they were.
      prose.push(...runLines);
    }
    run = [];
    runLines = [];
  };

  for (const line of body.split("\n")) {
    const m = IMAGE_ONLY.exec(line.trim());
    if (m) {
      run.push({ alt: m[1], src: m[2] });
      runLines.push(line);
      continue;
    }
    // A blank line between two images does not end the run.
    if (!line.trim() && run.length) {
      runLines.push(line);
      continue;
    }
    flushRun();
    prose.push(line);
  }
  flushRun();
  flushProse();

  return out;
}
