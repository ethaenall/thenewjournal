import { useEffect, useMemo, useRef, useState } from "react";
import { verseLine } from "../lib/verse";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { useJournal } from "../lib/useJournal";
import { matchesPublished } from "../data/publishedIssues";
import { PREVIEW_ID } from "../lib/preview";
import { issueName } from "../lib/issueLabel";
import type { Piece, Publication } from "../data/publications";
import Cassette from "../components/Cassette";
import { wallPreview } from "../lib/wallPreview";
import { medium, readerPath } from "../lib/publicPages";
import ShareButton from "../components/pieces/ShareButton";
import { rememberReadingPosition } from "../lib/readingPosition";
import "../components/gallerywall/gallerywall.css";

interface Work {
  piece: Piece;
  publication: Publication;
}

function WorkCard({ work, onOpen }: { work: Work; onOpen: (element: HTMLElement) => void }) {
  const { piece, publication } = work;
  return (
    <li className={`gw-item gw-${piece.type}`}>
      <Link
        to={readerPath(publication, piece)}
        className="gw-card"
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.button !== 0) return;
          event.preventDefault();
          onOpen(event.currentTarget);
        }}
        aria-label={`Open ${piece.title} by ${piece.author}, ${medium[piece.type]}`}
      >
        <span className={`gw-mount gw-mount-${piece.type}`} aria-hidden="true">
          {piece.type === "art" && piece.imageSrc && (
            <span className="gw-frame"><img src={wallPreview(piece.imageSrc) ?? piece.imageSrc} alt="" decoding="async" /></span>
          )}
          {piece.type === "poem" && (
            <span className="gw-sheet">{piece.lines.filter(line => line.trim()).slice(0, 4).map((line, index) => <span key={index}>{line}</span>)}</span>
          )}
          {piece.type === "film" && (
            <span className="gw-screen">
              {wallPreview(piece.videoSrc) && <img src={wallPreview(piece.videoSrc)} alt="" decoding="async" />}
              <span className="gw-play" />
            </span>
          )}
          {piece.type === "song" && <Cassette className="gw-cassette" label={piece.title.length < 23 ? piece.title : "Side A"} />}
        </span>
        <span className="gw-plate">
          <small>{medium[piece.type]}</small>
          <strong>{piece.title}</strong>
          <span>{piece.author}</span>
        </span>
      </Link>
    </li>
  );
}

const sourceVerb: Record<Piece["type"], string> = {
  poem: "Read",
  art: "See",
  film: "Watch",
  song: "Listen to",
};

// A work looked at closely. Every kind shares one column: its title and maker, then the work.
function Look({ piece }: { piece: Piece }) {
  const [audioFailed, setAudioFailed] = useState(false);
  return (
    <article className={`gw-look gw-look-${piece.type}`}>
      <header className="gw-look-head">
        <h2>{piece.title}</h2>
        <span>{piece.author}</span>
      </header>
      {piece.type === "art" &&
        (piece.imageSrc ? (
          <img className="gw-look-image" src={piece.imageSrc} alt={piece.imageAlt ?? `${piece.title} by ${piece.author}`} />
        ) : (
          <p className="gw-look-missing">Artwork not yet available.</p>
        ))}
      {piece.type === "poem" && (
        <div className="gw-look-lines">
          {piece.lines.map((line, index) => (
            <p key={index}>{verseLine(line)}</p>
          ))}
        </div>
      )}
      {piece.type === "film" && (
        <>
          {piece.videoSrc ? (
            <video className="gw-look-video" src={piece.videoSrc} controls preload="metadata" />
          ) : (
            <p className="gw-look-missing">Film not yet available.</p>
          )}
          {piece.logline && <p className="gw-look-note">{piece.logline}</p>}
        </>
      )}
      {piece.type === "song" && (
        <>
          {piece.audioSrc ? (
            <audio
              className="gw-look-audio"
              src={piece.audioSrc}
              controls
              preload="metadata"
              aria-label={`Play ${piece.title}`}
              onError={() => setAudioFailed(true)}
              onLoadedMetadata={() => setAudioFailed(false)}
            />
          ) : (
            <p className="gw-look-missing">Song not yet available.</p>
          )}
          {audioFailed && (
            <p role="alert" className="gw-look-note">
              This song could not play right now.
            </p>
          )}
          {piece.transcript.some((line) => line.trim()) && (
            <section className="gw-look-lines" aria-label={`Transcript of ${piece.title}`}>
              {piece.transcript.map((line, index) => (
                <p key={index}>{verseLine(line)}</p>
              ))}
            </section>
          )}
        </>
      )}
    </article>
  );
}

function WorkDialog({
  works,
  index,
  onClose,
  onStep,
}: {
  works: Work[];
  index: number;
  onClose: () => void;
  onStep: (offset: -1 | 1) => void;
}) {
  const reduced = useReducedMotion();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const { piece, publication } = works[index];
  useEffect(() => {
    rememberReadingPosition(publication.id, piece.id);
  }, [publication.id, piece.id]);
  function dismiss() {
    dialog.current?.close();
    onClose();
  }
  useEffect(() => {
    dialog.current?.showModal();
    close.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => {
    dialog.current?.scrollTo({ top: 0 });
  }, [index]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest("audio, video, input, textarea, select")) return;
      if (event.key === "ArrowRight") onStep(1);
      else if (event.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [onStep]);
  return (
    <motion.dialog
      ref={dialog}
      className="gw-dialog"
      role="dialog"
      aria-modal="true"
      aria-label={piece.title}
      initial={{ opacity: reduced ? 1 : 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.2 }}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => event.target === event.currentTarget && dismiss()}
    >
      <div className="gw-dialog-bar">
        <div>
          <span>
            {index + 1} of {works.length}
          </span>
          <ShareButton key={piece.id} publication={publication} piece={piece} />
          <button ref={close} type="button" onClick={dismiss}>
            Close
          </button>
        </div>
      </div>
      <div className="gw-dialog-body">
        <Look key={piece.id} piece={piece} />
        <Link
          className="gw-source"
          to={readerPath(publication, piece)}
        >
          {sourceVerb[piece.type]} it in {publication.caption}, {issueName(publication)}
        </Link>
      </div>
      {works.length > 1 && (
        <div className="gw-dialog-nav">
          <button type="button" onClick={() => onStep(-1)}>
            Previous work
          </button>
          <button type="button" onClick={() => onStep(1)}>
            Next work
          </button>
        </div>
      )}
    </motion.dialog>
  );
}

export default function Gallery() {
  const reduced = useReducedMotion();
  const journal = useJournal();
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const publications = useMemo(
    () => journal.publications.filter(publication => publication.pieces.length &&
      (publication.id !== PREVIEW_ID || !journal.draft || !matchesPublished(journal.draft))),
    [journal.publications, journal.draft],
  );
  const works = useMemo<Work[]>(
    () => publications.flatMap(publication => publication.pieces.map(piece => ({ piece, publication }))),
    [publications],
  );
  const indices = useMemo(() => new Map(works.map((work, index) => [work.piece, index])), [works]);

  function step(offset: -1 | 1) {
    setOpen((current) =>
      current === null ? null : (current + offset + works.length) % works.length,
    );
  }
  function close() {
    setOpen(null);
    opener.current?.focus();
  }
  return (
    <main className="gw-page mx-auto max-w-6xl px-6 pb-24 sm:px-10">
      <motion.header
        className="gw-heading"
        initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0 : 0.4 }}
      >
        <h1>Gallery</h1>
        <span>{works.length} {works.length === 1 ? "work" : "works"}</span>
      </motion.header>
      {works.length === 0 ? (
        <p className="gw-empty">The first works are on their way.</p>
      ) : (
        publications.map(publication => (
          <section className="gw-exhibition" key={publication.id} aria-label={publication.caption}>
            <header className="gw-exhibition-head">
              <h2>{publication.caption} <small>{issueName(publication)}</small></h2>
              <Link className="gw-walk" to={readerPath(publication) + "?view=gallery"}>Walk through the exhibition <span aria-hidden="true">→</span></Link>
            </header>
            <ul className="gw-wallgrid">
              {publication.pieces.map(piece => (
                <WorkCard key={piece.id} work={{ publication, piece }} onOpen={element => {
                  opener.current = element;
                  setOpen(indices.get(piece) ?? null);
                }} />
              ))}
            </ul>
          </section>
        ))
      )}
      {open !== null && works[open] && (
        <WorkDialog works={works} index={open} onClose={close} onStep={step} />
      )}
    </main>
  );
}
