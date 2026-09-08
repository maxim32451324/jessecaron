"use client";

import { useState } from "react";
import Image from "next/image";

// YouTube facade: shows a thumbnail; loads the iframe only on click.
export default function VideoFacade({
  youtubeId,
  title,
  thumbnail,
  main = false,
}: {
  youtubeId: string;
  title: string;
  thumbnail?: string;
  main?: boolean;
}) {
  const [play, setPlay] = useState(false);
  // hqdefault always exists; maxresdefault 404s for videos uploaded below 720p,
  // so a stored maxres URL is normalised rather than trusted.
  const thumb = youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    : (thumbnail ?? "");

  return (
    <div className="vthumb" data-main={main}>
      {play ? (
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
        />
      ) : (
        <button className="vthumb__btn" onClick={() => setPlay(true)} aria-label={`Speel video: ${title}`}>
          {/* Served by YouTube, and optimised like everything else — `img.youtube.com` is
              on the `images.remotePatterns` allow-list in next.config.ts. The 16:9 box is
              reserved before the bytes land, so a row of video cards cannot jump as the
              thumbnails arrive. */}
          <Image src={thumb} alt={title} fill sizes="(max-width: 1000px) 100vw, 50vw" />
          <span className="vthumb__play">
            <span className="vthumb__circle">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path d="M8 5v14l11-7z" fill="#fff" />
              </svg>
            </span>
          </span>
          <span className="vthumb__label">{title}</span>
        </button>
      )}

      <style>{`
        .vthumb { position:relative; background:#000; overflow:hidden; aspect-ratio:16/9; }
        .vthumb__btn { position:absolute; inset:0; width:100%; height:100%; border:0; padding:0; cursor:pointer; background:#000; display:block; text-align:left; }
        .vthumb__btn img { width:100%; height:100%; object-fit:cover; filter:grayscale(.45) brightness(.9); transition:filter .5s, transform .5s; }
        .vthumb__btn:hover img, .vthumb__btn:focus-visible img { filter:grayscale(0) brightness(1); transform:scale(1.04); }
        .vthumb__play { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; z-index:2; }
        .vthumb__circle { width:64px; height:64px; border-radius:50%; background:var(--blue); display:grid; place-items:center; transition:.3s; }
        .vthumb__btn:hover .vthumb__circle, .vthumb__btn:focus-visible .vthumb__circle { transform:scale(1.1); background:#fff; }
        .vthumb__btn:hover .vthumb__circle svg path, .vthumb__btn:focus-visible .vthumb__circle svg path { fill:var(--blue); }
        .vthumb__label { position:absolute; left:0; bottom:0; z-index:2; padding:16px 18px; font-family:var(--font-jetbrains),monospace; font-size:${main ? "14px" : "12px"}; letter-spacing:.06em; text-transform:uppercase; background:linear-gradient(0deg,rgba(0,0,0,.85),transparent); width:100%; color:var(--paper); }
        .vthumb iframe { position:absolute; inset:0; width:100%; height:100%; border:0; z-index:5; }
      `}</style>
    </div>
  );
}
