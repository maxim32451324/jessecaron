import { lexicon } from "@/lib/content";

// Signature brand device: the dictionary/lexicon entries scrolling as a marquee.
export default function LexiconMarquee() {
  const items = [...lexicon, ...lexicon]; // duplicate for a seamless loop
  return (
    <div className="lex" aria-hidden="true">
      <div className="lex__track">
        {items.map((l, i) => (
          <span className="lex__item" key={i}>
            <span className="w">{l.word}</span>
            <span className="p">/{l.phonetic}/</span>
            <span className="d">{l.meaning.split(".")[0]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
