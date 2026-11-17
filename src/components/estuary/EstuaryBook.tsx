import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import type { Publication } from "../../data/publications";
import { CONTROLS, useIssueNav, useMediaQuery } from "../../lib/useIssueNav";
import { useFinishEnterOnMount } from "../../lib/enterTransition";
import { ReaderHeader, ReaderFooter } from "../surreal/ReaderChrome";
import PrintBackdrop from "./PrintBackdrop";
import PaperCurl from "./PaperCurl";
import { Jacket, Plate, Poem, Sheet } from "./FieldPages";
import { studyArt } from "./preview";
import "../surreal/surreal.css";
import "./estuary.css";

type Phase = "automatic" | "held" | "finish" | "return";
interface Turn { from: number; to: number; phase: Phase; grip: number; scroll: number }
interface Contact {
  id: number; x: number; y: number; width: number; grip: number; edge: number;
  at: number; held: boolean; from: number;
}
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export default function EstuaryBook({ publication }: { publication: Publication }) {
  useFinishEnterOnMount();
  const { pages, index, page, goTo, step, goToPiece } = useIssueNav(publication);
  const spread = useMediaQuery("(min-width: 900px) and (min-height: 521px)");
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const scenery = publication.readerScenery!;
  const last = pages.length - 1;
  const book = useRef<HTMLDivElement>(null);
  const contact = useRef<Contact | null>(null);
  const ignoreClick = useRef(false);
  const liveScroll = useRef(0);
  const progress = useMotionValue(0);
  const tide = useMotionValue(scenery.tideLevels[index]);
  const [view, setView] = useState<{ shown: number; turn: Turn | null; scroll?: number }>({ shown: index, turn: null });
  const { shown, turn } = view;
  const forward = !turn || turn.to > turn.from;

  // Reconcile the latest route before painting. A held sheet belongs to its
  // pointer, while completed turns may have a newer keyboard request queued.
  if ((reduced || (turn?.phase === "held" && index !== turn.from)) && (turn || shown !== index)) {
    setView({ shown: index, turn: null });
  } else if (!turn && shown !== index) {
    setView({ shown, turn: { from: shown, to: index, grip: .67, phase: "automatic", scroll: liveScroll.current } });
  }

  useLayoutEffect(() => {
    if (!turn) {
      contact.current = null;
      liveScroll.current = view.scroll ?? 0;
      progress.jump(0);
      tide.set(scenery.tideLevels[shown]);
      return;
    }
    const { from, to, phase } = turn;
    if (phase === "automatic") progress.jump(0);
    const low = scenery.tideLevels[from], high = scenery.tideLevels[to];
    const updateTide = (p: number) => tide.set(low + (high - low) * p);
    updateTide(progress.get());
    const unsubscribe = progress.on("change", updateTide);
    if (phase === "held") return unsubscribe;
    const goal = phase === "return" ? 0 : 1;
    const animation = animate(progress, goal, {
      duration: (.16 + Math.abs(goal - progress.get()) * (spread ? .62 : .46)),
      ease: phase === "automatic" ? [.32, .06, .22, 1] : [.18, .58, .28, 1],
      onComplete: () => setView({ shown: goal ? to : from, turn: null, scroll: goal ? 0 : turn.scroll }),
    });
    return () => { unsubscribe(); animation.stop(); };
  }, [progress, scenery.tideLevels, shown, spread, tide, turn, view.scroll]);

  useLayoutEffect(() => {
    const resize = () => { contact.current = null; setView({ shown: index, turn: null }); };
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [index]);

  useEffect(() => {
    for (const src of [...Object.values(scenery.plates), studyArt("frieze.webp")]) {
      const img = new Image(); img.src = src;
      void img.decode().catch(() => {});
    }
  }, [scenery]);

  const bookX = useTransform(progress, p => {
    const closedFraction = turn?.from === 0 ? 1 - p : turn?.to === 0 ? p : 0;
    return `${-25 * closedFraction}%`;
  });
  const contactShade = useTransform(progress, p => Math.sin(p * Math.PI) * .24);

  function down(e: PointerEvent<HTMLDivElement>) {
    if (!e.isPrimary) { cancel(); return; }
    if (e.button !== 0 || turn || (e.target as Element).closest(CONTROLS)) return;
    ignoreClick.current = false;
    const box = e.currentTarget.getBoundingClientRect();
    const width = box.width / (spread ? 2 : 1);
    const left = box.left + (spread && shown === 0 ? width : 0);
    const edgeSize = Math.min(56, width * .16);
    const edge = box.right - e.clientX <= edgeSize ? 1 : e.clientX >= left && e.clientX - left <= edgeSize ? -1 : 0;
    contact.current = { id: e.pointerId, x: e.clientX, y: e.clientY, width, grip: clamp((e.clientY - box.top) / box.height), at: e.timeStamp, edge, from: shown, held: false };
  }
  function move(e: PointerEvent<HTMLDivElement>) {
    if (!e.buttons && e.pointerType === "mouse") {
      contact.current = null;
      const box = e.currentTarget.getBoundingClientRect();
      const edge = Math.min(56, box.width * (spread ? .08 : .16));
      const canGrab = !turn && !reduced && !(e.target as Element).closest(CONTROLS) && (
        (shown < last && box.right - e.clientX <= edge) || (shown > 0 && e.clientX - box.left <= edge)
      );
      e.currentTarget.toggleAttribute("data-edge", canGrab);
      return;
    }
    const c = contact.current;
    if (!c || c.id !== e.pointerId || !c.edge || reduced || c.from + c.edge < 0 || c.from + c.edge > last) return;
    const dx = (c.x - e.clientX) * c.edge;
    const dy = Math.abs(e.clientY - c.y);
    if (!c.held) {
      if (dy > 9 && dy > Math.abs(dx)) { contact.current = null; return; }
      if (dx < 6 || dx <= dy * 1.25) return;
      c.held = true;
      ignoreClick.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      setView({ shown: c.from, turn: { from: c.from, to: c.from + c.edge, grip: c.grip, phase: "held", scroll: liveScroll.current } });
    }
    progress.set(clamp(dx / (c.width * (spread ? 1.55 : .92))));
  }
  function release(e: PointerEvent<HTMLDivElement>) {
    const c = contact.current;
    if (!c || e.pointerId !== c.id) return;
    contact.current = null;
    const dx = c.x - e.clientX;
    const dy = Math.abs(e.clientY - c.y);
    if (c.held) {
      const distance = dx * c.edge;
      const commit = progress.get() > .22 || (distance > 22 && distance / Math.max(1, e.timeStamp - c.at) > .42);
      if (commit) goTo(c.from + c.edge);
      setView(v => v.turn ? { ...v, turn: { ...v.turn, phase: commit ? "finish" : "return" } } : v);
    } else if (e.pointerType === "touch" && Math.abs(dx) > Math.min(70, c.width * .18) && Math.abs(dx) > dy * 1.5 && e.timeStamp - c.at < 1200) {
      ignoreClick.current = true;
      step(dx > 0 ? 1 : -1);
    }
  }
  function cancel() {
    if (contact.current?.held) setView(v => v.turn ? { ...v, turn: { ...v.turn, phase: "return" } } : v);
    contact.current = null;
  }
  function click(e: React.MouseEvent<HTMLDivElement>) {
    if (ignoreClick.current) { ignoreClick.current = false; return; }
    if (turn || (e.target as Element).closest(CONTROLS) || window.getSelection()?.toString()) return;
    if (!shown) {
      if ((e.target as Element).closest(".eb-jacket")) goTo(1);
    } else if (spread && !(e.target as Element).closest(".eb-verse-block")) {
      const b = e.currentTarget.getBoundingClientRect();
      step(e.clientX < b.left + b.width / 2 ? -1 : 1);
    }
  }

  type Face = "plate" | "poem" | "single";
  function face(i: number, kind: Face, live = false) {
    const p = pages[i];
    if (!p.piece) return kind === "plate" ? null : <Jacket publication={publication} open={() => goTo(1)} />;
    const plate = <Plate page={p} index={i} src={scenery.plates[p.id]} />;
    if (kind === "plate") return plate;
    return (
      <Sheet key={p.id} live={live} startAt={turn?.from === i ? turn.scroll : !turn ? view.scroll : 0} label={p.piece.title}>
        {kind === "single" && plate}
        <Poem page={p} index={i} publication={publication} restart={() => goTo(0)} />
      </Sheet>
    );
  }
  const restingLeft = turn ? (forward ? turn.from : turn.to) : shown;
  const restingRight = turn ? (forward ? turn.to : turn.from) : shown;
  const backPaper = <div className="eb-endpaper" />;
  const isCover = turn ? turn.from === 0 || turn.to === 0 : shown === 0;
  return (
    <div className="sr-reader eb-reader" style={{ "--frieze": `url("${studyArt("frieze.webp")}")` } as CSSProperties}>
      <PrintBackdrop scenery={scenery} tide={tide} index={index} reduced={reduced} />
      <ReaderHeader publication={publication} piece={page.piece} goToPiece={goToPiece} onCover={() => goTo(0)} />
      <main className="sr-stage eb-stage" aria-busy={!!turn}>
        <motion.div ref={book} className={`eb-book ${spread ? "spread" : "single"}`}
          style={{ x: spread ? turn ? bookX : shown === 0 ? "-25%" : "0%" : 0 }}
          onPointerDown={down} onPointerMove={move} onPointerUp={release} onPointerCancel={cancel}
          data-held={turn?.phase === "held" || undefined}
          onLostPointerCapture={e => { if (e.target === e.currentTarget && contact.current?.id === e.pointerId) cancel(); }}
          onClick={click}
          onScrollCapture={e => { if (!turn && (e.target as Element).matches(".eb-sheet")) liveScroll.current = (e.target as Element).scrollTop; }}>
          {spread && restingLeft > 0 && <div className="eb-slot eb-left" inert={!!turn}>{face(restingLeft, "plate", !turn)}</div>}
          <div className="eb-slot eb-right" inert={!!turn}>{face(restingRight, spread ? "poem" : "single", !turn)}</div>
          {turn && <>
            <motion.div className={`eb-cast ${!forward && spread ? "left" : ""}`} aria-hidden="true" style={{ opacity: contactShade }} />
            <PaperCurl progress={progress} grip={turn.grip} board={isCover} left={!forward && spread} rewind={!spread && !forward}
              front={spread ? face(turn.from, forward ? "poem" : "plate") : face(forward ? turn.from : turn.to, "single")}
              back={spread ? face(turn.to, forward ? "plate" : "poem") : backPaper} />
          </>}
        </motion.div>
      </main>
      <ReaderFooter publication={publication} piece={page.piece} index={index} pages={pages} step={step} />
    </div>
  );
}
