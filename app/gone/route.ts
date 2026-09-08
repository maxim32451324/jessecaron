/**
 * HTTP 410 Gone.
 *
 * The old WordPress sitemap advertised, and Google indexed, 62 pages of Malmö
 * theme-demo content on the client's own domain: `/elements/pie-charts/`,
 * `/shop-lists/shop-four-columns/`, `/standard-portfolio-lists/three-columns/` — lorem
 * ipsum and dummy grids that were never his and never meant to be public.
 *
 * They could be 301'd to the home page. They should not be. A soft redirect tells a
 * search engine "this page moved here", which is a claim about the home page and is
 * false; the index keeps the old URL around for months, and reports keep showing it.
 * 410 says the thing that is actually true — it existed, it is gone, stop asking — and
 * it is the fastest way for those URLs to leave the index for good.
 *
 * `next.config.ts` REWRITES the gone patterns here rather than redirecting, so the
 * client's URL stays what the visitor typed and the status describes that URL, not
 * this one. A person who lands here gets a sentence and a way back; a crawler gets
 * the 410 and `x-robots-tag: noindex`.
 *
 * `/gone` is not in the sitemap and not linked from anywhere.
 */

const BODY = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Deze pagina bestaat niet meer — Jesse Caron</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:#0d0d0f; color:#f4f4f5;
         font:16px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Inter,sans-serif; padding:2rem; }
  main { max-width:34rem; text-align:center; }
  p.code { font:12px/1 ui-monospace,SFMono-Regular,"JetBrains Mono",monospace; letter-spacing:.14em;
           text-transform:uppercase; color:#8b8b93; margin:0 0 1.25rem; }
  h1 { font-size:clamp(1.6rem,4vw,2.4rem); line-height:1.15; margin:0 0 1rem; }
  p.lead { color:#b6b6bd; margin:0 0 2rem; }
  a { display:inline-block; padding:.7rem 1.4rem; border:1px solid #3b3b42; border-radius:2px; color:#f4f4f5;
      text-decoration:none; font-size:.9rem; letter-spacing:.04em; }
  a:hover, a:focus-visible { background:#f4f4f5; color:#0d0d0f; }
</style>
</head>
<body>
<main>
  <p class="code">410 — Gone</p>
  <h1>Deze pagina bestaat niet meer</h1>
  <p class="lead">Dit was een voorbeeldpagina van het oude website-thema. Hij is definitief verwijderd en komt niet terug.</p>
  <a href="/">Naar de homepage</a>
</main>
</body>
</html>
`;

function gone(): Response {
  return new Response(BODY, {
    status: 410,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}

export function GET(): Response {
  return gone();
}

export function HEAD(): Response {
  return new Response(null, {
    status: 410,
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex" },
  });
}

// WordPress plumbing gets POSTed at by bots (`/xmlrpc.php`, `/wp-login.php`). Same answer.
export const POST = GET;
