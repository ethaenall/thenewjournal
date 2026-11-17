import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { MotionValue } from "framer-motion";

const BANDS = 8;
const bands = Array.from({ length: BANDS }, (_, i) => i);

interface Props {
  front: ReactNode;
  back: ReactNode;
  progress: MotionValue<number>;
  left: boolean;
  rewind: boolean;
  grip: number;
  board: boolean;
}

// Integrate the tangents from the sewn edge outwards. Each strip starts at
// the previous strip's tip, so the sheet can bow without detaching at the spine.
export default function PaperCurl({ front, back, progress, left, rewind, grip, board }: Props) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = root.current!;
    const slices = Array.from(el.children) as HTMLElement[];
    const width = el.getBoundingClientRect().width / BANDS;
    const hand = left ? -1 : 1;
    function draw(value: number) {
      const phase = rewind ? 1 - value : value;
      const angle = phase * Math.PI;
      const lift = Math.sin(angle);
      el.style.setProperty("--bend-light", String(lift));
      let x = 0, y = 0, z = 0;
      for (const [i, slice] of slices.entries()) {
        const distance = (i + .5) / BANDS;
        const tangent = angle + (distance - .46) * lift * (board ? .24 : 1.46);
        const slope = (grip - .5) * lift * distance * .14;
        slice.style.transform = `translate3d(${x}px,${y}px,${z}px) rotateY(${-hand * tangent}rad) skewY(${hand * Math.atan(slope)}rad)`;
        x += hand * width * Math.cos(tangent);
        y += width * slope;
        z += width * Math.sin(tangent);
      }
    }
    draw(progress.get());
    return progress.on("change", draw);
  }, [progress, left, rewind, grip, board]);

  return (
    <div ref={root} className={`eb-curl ${left ? "from-left" : "from-right"}`} aria-hidden="true" inert>
      {bands.map(i => {
        const start = left ? BANDS - 1 - i : i;
        const offset = (slot: number) => ({ left: `calc(var(--pw) * ${-slot / BANDS})` });
        const ink = (n: number) => `rgb(24 41 37 / ${.05 + .22 * Math.sin(n / BANDS * Math.PI)})`;
        const lighting = {
          "--shade-a": ink(left ? i + 1 : i),
          "--shade-b": ink(left ? i : i + 1),
          width: `calc(${100 / BANDS}% + .55px)`,
        } as CSSProperties;
        return (
          <div key={i} className="eb-band" style={lighting}>
            <div className="eb-fragment"><div className="eb-sample" style={offset(start)}>{front}</div></div>
            <div className="eb-fragment reverse"><div className="eb-sample" style={offset(BANDS - 1 - start)}>{back}</div></div>
          </div>
        );
      })}
    </div>
  );
}
