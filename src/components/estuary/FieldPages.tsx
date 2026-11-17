import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import type { Publication } from "../../data/publications";
import type { MagazinePage } from "../../lib/magazine";
import { verseLine } from "../../lib/verse";

const numerals = ["I", "II", "III", "IV"];
const descriptions: Record<string, string> = {
  "salt-grass": "Arching seed heads catch the last light above a salt marsh.",
  "the-channel": "A silver channel winds between rust-colored tidal flats.",
  egret: "A white egret lifts one foot above its reflection.",
  "the-headland": "A low sun throws a copper reflection beneath a pine-covered headland.",
};

export function Jacket({ publication, open }: { publication: Publication; open: () => void }) {
  return (
    <section className="eb-jacket">
      <img className="eb-binding" src={publication.coverSrc} alt="" fetchPriority="high" draggable="false" />
      <div className="eb-jacket-type">
        <p>The New Journal</p>
        <h1>{publication.caption}</h1>
        <span>Issue {publication.issueNumber}</span>
      </div>
      <button type="button" className="eb-open" onClick={open}>Open the issue <span aria-hidden="true">→</span></button>
    </section>
  );
}

export function Plate({ page, index, src }: { page: MagazinePage; index: number; src: string }) {
  return (
    <figure className="eb-plate" data-piece={page.id}>
      <img src={src} alt={descriptions[page.id]} draggable="false" />
      <figcaption><span>Plate {numerals[index - 1]}</span><i>{page.piece!.title}</i></figcaption>
    </figure>
  );
}

export function Poem({ page, index, publication, restart }: {
  page: MagazinePage; index: number; publication: Publication; restart: () => void;
}) {
  const piece = page.piece!;
  if (piece.type !== "poem") return null;
  return (
    <article className="eb-poem-page" style={{ "--tail-position": (index - 1) * 100 / 3 + "%" } as CSSProperties}>
      <header className="eb-folio"><i>{publication.caption}</i><span>The New Journal</span></header>
      <div className="eb-verse-block">
        <h1>{piece.title}</h1>
        <div className="eb-verse">{piece.lines.map((line, i) => <p key={i}>{verseLine(line)}</p>)}</div>
        <p className="eb-credit">{piece.author}</p>
      </div>
      <div className="eb-tailpiece" aria-hidden="true" />
      {index === publication.pieces.length && <div className="eb-fin"><button onClick={restart}>Back to the cover</button><Link to="/">All issues</Link></div>}
      <footer className="eb-folio"><span>Issue {publication.issueNumber}</span><i>{numerals[index - 1]}</i></footer>
    </article>
  );
}

// Snapshot the live scroll position when making the inert turning copies.
export function Sheet({ children, live, startAt = 0, label }: { children: ReactNode; live: boolean; startAt?: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const start = useRef(startAt);
  useLayoutEffect(() => { if (ref.current) ref.current.scrollTop = start.current; }, []);
  return <div ref={ref} className="eb-sheet" role={live ? "region" : undefined} aria-label={live ? label : undefined} tabIndex={live ? 0 : undefined}>{children}</div>;
}
