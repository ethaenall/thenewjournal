import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform, useVelocity } from "framer-motion";
import type { ReaderScenery } from "../../data/publications";

// A slanted, feathered boundary moves through the registered high-water print.
const bankPosition = (level: number) => 109 - level * 139;

function tideMask(level: number) {
  const bank = bankPosition(level);
  const advancingEdge = `linear-gradient(105deg, transparent ${bank - 27}%, black ${bank + 6}%)`;
  const floodedChannels = `linear-gradient(180deg, transparent 33%, rgba(0, 0, 0, ${level * .78}) 52% 78%, transparent 100%)`;
  return advancingEdge + ", " + floodedChannels;
}

function bankMask(level: number) {
  const bank = bankPosition(level);
  const edge = `linear-gradient(105deg, transparent ${bank - 24}%, black ${bank - 7}%, transparent ${bank + 11}%)`;
  const shore = "linear-gradient(90deg, #0009, transparent 24% 76%, #0009)";
  return edge + ", " + shore;
}

const tideOpacity = (level: number) => Math.min(1, Math.sqrt(level));

export default function PrintBackdrop({ scenery, index, turning, reduced }: {
  scenery: ReaderScenery;
  index: number;
  turning: boolean;
  reduced: boolean;
}) {
  const level = scenery.tideLevels[Math.min(index, scenery.tideLevels.length - 1)] ?? 0;
  const tide = useMotionValue(level);
  const maskImage = useTransform(tide, tideMask);
  const opacity = useTransform(tide, tideOpacity);
  const advancingBank = useTransform(tide, bankMask);
  const velocity = useVelocity(tide);
  const wake = useTransform(velocity, speed => Math.min(0.72, Math.abs(speed) * 0.66));

  useEffect(() => {
    if (reduced) {
      tide.jump(level);
      return;
    }
    const incoming = animate(tide, level, { duration: 1.7, ease: [.18, .36, .22, 1] });
    return () => incoming.stop();
  }, [level, reduced, tide]);

  return (
    <div className="dreamscape sr-print-backdrop" aria-hidden="true" data-paused={turning} data-tide={level}>
      <div className="sr-print-world">
        <img src={scenery.lowTide} alt="" />
        <motion.div className="sr-print-tide" style={{
          maskImage: reduced ? tideMask(level) : maskImage,
          opacity: reduced ? tideOpacity(level) : opacity,
        }}>
          <img src={scenery.highTide} alt="" />
          {!reduced && (
            <div className="sr-print-water">
              <div className="sr-print-reflections">
                <img src={scenery.highTide} alt="" />
              </div>
              <motion.div className="sr-print-bank" style={{ maskImage: advancingBank, opacity: wake }}>
                <svg className="sr-print-ripples" viewBox="0 0 1400 860" preserveAspectRatio="none" fill="none">
                  <path d="M-35 368c75-5 144 1 222 0s133-7 205-6m69-1c93 2 182 9 280 6s199-8 281-5m84 1c109 3 226 2 329-4" />
                  <path d="M-15 469c129-6 243 4 343 1s174-11 266-6m111-1c116 8 239 11 361 5s225 2 360-9" />
                  <path d="M-38 602c79-11 174-15 258-7s153 17 239 12m85-2c111-9 210-10 335-3s246 9 361-2m64-5c48-4 88-5 134-3" />
                  <path d="M-26 739c97-5 185 7 288 11s198-14 312-13m105 3c161 13 314-2 448-3s182 7 299 1" />
                  <path d="M-43 805c108-14 204 4 321 2m523 16c195 8 299-13 409-13s145 9 241 5" />
                </svg>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
