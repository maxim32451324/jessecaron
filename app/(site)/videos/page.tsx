import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import VideoFacade from "@/components/VideoFacade";
import { getVideos } from "@/lib/content";

export const metadata: Metadata = {
  title: "Videos",
  alternates: { canonical: `${SITE_URL}/videos` },
  description: "Impressie van de trainingsmethode in beweging — voetbal, hockey, tennis en meer.",
};

export default function VideosPage() {
  const videos = getVideos();
  const featured = videos.find((v) => v.youtube_id === "R8R4p_4564U") ?? videos[0];
  const rest = videos.filter((v) => v !== featured);

  return (
    <>
      <PageHero
        eyebrow="Impressie"
        title="De methode in beweging"
        sub={`${videos.length} videos — van handelingssnelheid en reactievermogen tot kracht en wendbaarheid.`}
        image="Handelingssnelheid-Trainen-Voetbal-Smartgoals-Oefeningen.jpg"
      />
      <section className="pad">
        <div className="wrap">
          <Reveal style={{ marginBottom: 1 }}>
            <div className="vfeat">
              <VideoFacade
                youtubeId={featured.youtube_id}
                title="RTL4 — De beste personal trainer van NL"
                main
              />
            </div>
          </Reveal>
          <Reveal className="vgrid">
            {rest.map((v) => (
              <VideoFacade key={v.youtube_id} youtubeId={v.youtube_id} title={v.title} thumbnail={v.thumbnail} />
            ))}
          </Reveal>
        </div>
      </section>
      <style>{`
        .vfeat { border:1px solid var(--line-d); }
        .vgrid { display:grid; grid-template-columns:repeat(3,1fr); gap:1px; background:var(--line-d); border:1px solid var(--line-d); border-top:0; }
        @media(max-width:1000px){ .vgrid{ grid-template-columns:repeat(2,1fr);} }
        @media(max-width:640px){ .vgrid{ grid-template-columns:1fr;} }
      `}</style>
    </>
  );
}
