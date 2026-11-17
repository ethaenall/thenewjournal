import { Link } from "react-router-dom";
import type { Piece, Publication } from "../../data/publications";
import type { MagazinePage } from "../../lib/magazine";
import { PREVIEW_ID } from "../../lib/preview";
import IssueContents from "../pieces/IssueContents";
import ShareButton from "../pieces/ShareButton";
import ReadingControls from "./ReadingControls";

interface ChromeProps {
  publication: Publication;
  piece?: Piece;
}

export function ReaderHeader({ publication, piece, goToPiece, onCover }: ChromeProps & {
  goToPiece: (index: number) => void;
  onCover: () => void;
}) {
  return (
    <div className="sr-chrome sr-top">
      <Link to="/" className="sr-pill sr-back">
        <span aria-hidden="true">←</span> All issues
      </Link>
      <p className="sr-edition">
        <Link to="/" aria-label="The New Journal, back to the home page">
          The New Journal
        </Link>
      </p>
      <div className="sr-actions reader-actions">
        {import.meta.env.DEV && publication.id === PREVIEW_ID && (
          <Link className="contents-trigger micro-button sr-pill" to="/preview">
            Edit issue
          </Link>
        )}
        <ReadingControls />
        <IssueContents
          pieces={publication.pieces}
          currentIndex={publication.pieces.findIndex((p) => p.id === piece?.id)}
          onSelect={goToPiece}
          onCover={onCover}
        />
        <ShareButton key={piece?.id ?? publication.id} publication={publication} piece={piece} />
      </div>
    </div>
  );
}

export function ReaderFooter({ publication, piece, index, pages, step }: ChromeProps & {
  index: number;
  pages: MagazinePage[];
  step: (offset: number) => void;
}) {
  const last = pages.length - 1;
  return (
    <nav className="sr-chrome sr-bottom" aria-label="Pages">
      <button type="button" className="sr-round" aria-label="Previous page" disabled={index === 0} onClick={() => step(-1)}>
        ←
      </button>
      <div className="sr-progress">
        <span className="sr-position" aria-live="polite" aria-atomic="true">
          {index === 0 ? "Cover" : `${index} / ${last}`}
        </span>
        <span className="sr-stars" aria-hidden="true">
          {pages.length <= 24 &&
            pages.map((p, i) => (
              <i key={p.id} className={i === index ? "is-on" : i < index ? "is-past" : ""} />
            ))}
        </span>
        <span className="sr-now">{piece?.title ?? publication.caption}</span>
      </div>
      <button type="button" className="sr-round" aria-label="Next page" disabled={index === last} onClick={() => step(1)}>
        →
      </button>
    </nav>
  );
}
