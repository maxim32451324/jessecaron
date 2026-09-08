import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { localDims, localImg } from "@/lib/content";

/**
 * `.prose` is capped at `max-width: 72ch`, which at the body's 17px Inter is about
 * 640px — so a body image is never asked to paint wider than that on a desktop, and
 * fills the viewport below roughly 700px. Telling the optimiser so is the whole
 * point of the exercise: before this, a 400px-wide blog card was downloading the
 * 1 MB original.
 */
const PROSE_SIZES = "(max-width: 700px) 100vw, 640px";

export default function Markdown({
  children,
  className = "prose",
  sizes = PROSE_SIZES,
}: {
  children: string;
  className?: string;
  /** Override when the body is set in a column narrower than `.prose`'s 72ch. */
  sizes?: string;
}) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            const external = href?.startsWith("http");
            return (
              <a
                href={href}
                {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                {...props}
              >
                {children}
              </a>
            );
          },
          img: ({ src, alt }) => {
            const raw = typeof src === "string" ? src : "";
            const dims = localDims(raw);

            /**
             * No dimensions means the file is not in `lib/image-manifest.json`, which for
             * anything on the old WordPress host cannot happen — `scripts/check-images.mjs`
             * fails the build first. What is left is an image on some third-party host, so
             * it is passed through unoptimised (the optimiser would need a `remotePatterns`
             * entry we cannot know in advance) and sized by CSS alone. It reserves no box,
             * so it can shift the page — which is exactly why the guard exists.
             */
            if (!dims) {
              return (
                <Image
                  src={localImg(raw)}
                  alt={alt ?? ""}
                  width={0}
                  height={0}
                  sizes={sizes}
                  unoptimized
                  style={{ width: "100%", height: "auto" }}
                />
              );
            }

            return (
              <Image
                src={dims.path}
                alt={alt ?? ""}
                width={dims.w as number}
                height={dims.h as number}
                sizes={sizes}
              />
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
