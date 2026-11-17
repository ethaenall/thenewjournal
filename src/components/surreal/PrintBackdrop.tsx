import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import type { ReaderScenery } from "../../data/publications";

// The channel enters from the right. The wide feather gives the wet bank a soft edge.
function tideMask(level: number) {
  const bank = 112 - level * 134;
  return `linear-gradient(101deg, transparent ${bank - 33}%, black ${bank + 8}%)`;
}

const tideOpacity = (level: number) => Math.min(1, level * 4);

export default function PrintBackdrop({ scenery, index, paused, reduced }: {
  scenery: ReaderScenery;
  index: number;
  paused: boolean;
  reduced: boolean;
}) {
  const level = scenery.tideLevels[Math.min(index, scenery.tideLevels.length - 1)] ?? 0;
  const tide = useMotionValue(level);

  const maskImage = useTransform(tide, tideMask);
  const opacity = useTransform(tide, tideOpacity);
  const visibleOpacity = reduced ? tideOpacity(level) : opacity;

  useEffect(() => {
    if (reduced) {
      tide.jump(level);
      return;
    }
    if (paused) return;
    const incoming = animate(tide, level, { duration: 1.85, ease: [.33, 0, .25, 1] });
    return () => incoming.stop();
  }, [level, paused, reduced, tide]);

  return (
    <div className="dreamscape sr-print-backdrop" aria-hidden="true" data-paused={paused} data-tide={level}>
      <div className="sr-print-world">
        <img src={scenery.lowTide} alt="" />
        <motion.div className="sr-print-tide" style={{ maskImage: reduced ? tideMask(level) : maskImage, opacity: visibleOpacity }}>
          <img src={scenery.highTide} alt="" />
        </motion.div>
        <motion.div className="sr-print-glint" style={{ opacity: visibleOpacity }} />
      </div>
    </div>
  );
}
