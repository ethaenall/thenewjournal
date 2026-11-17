import { useEffect } from "react";
import { animate, motion, useMotionValue, useTransform, useVelocity } from "framer-motion";
import type { ReaderScenery } from "../../data/publications";

// A slanted, feathered boundary moves through the registered high-water print.
const bankPosition = (level: number) => 109 - level * 139;
const shoreHeight = (level: number) => 96 - level * 48;


function tideMask(level: number) {
  const bank = bankPosition(level);
  const advancingEdge = `linear-gradient(105deg, transparent ${bank - 27}%, black ${bank + 6}%)`;
  const floodedChannels = `linear-gradient(180deg, transparent 33%, rgba(0, 0, 0, ${level * .78}) 52% 78%, transparent 100%)`;
  // The near shore floods upward as well as sideways. This reads in the
  // exposed bottom margin when a single page covers most of the panorama.
  const shore = shoreHeight(level);
  const nearWater = `linear-gradient(180deg, transparent ${shore - 4}%, #000a ${shore + 3}%, #000 ${shore + 13}%)`;
  return [advancingEdge, floodedChannels, nearWater].join(", ");
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
  const wake = useTransform(velocity, speed => Math.min(.64, Math.abs(speed) * .6));
  const shore = useMotionValue(shoreHeight(level));
  const roll = useTransform(shore, height => `${height}%`);
  const crest = useTransform(velocity, speed => Math.min(.9, Math.abs(speed) * 1.75));

  useEffect(() => {
    if (reduced) {
      tide.jump(level);
      shore.jump(shoreHeight(level));
      return;
    }
    const startingLevel = tide.get();
    if (Math.abs(level - startingLevel) < .001) {
      tide.jump(level);
      return;
    }
    const rising = level > startingLevel;
    const water = animate(tide, level, { duration: 1.55, ease: [.18, .36, .22, 1] });

    // A fresh crest starts below the book, where the wash is visible on a phone
    // before it reaches the narrower side margins. Turning back reverses the path.
    const outerWater = 98;
    shore.jump(rising ? outerWater : shoreHeight(startingLevel));
    const wave = animate(shore, rising ? shoreHeight(level) : outerWater, {
      duration: 1.45,
      ease: [.43, .04, .27, 1],
    });
    return () => {
      water.stop();
      wave.stop();
    };
  }, [level, reduced, shore, tide]);

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
      {!reduced && (
        <motion.div className="sr-print-rolling-shore" style={{ y: roll, opacity: crest }}>
          <svg viewBox="0 0 720 56" preserveAspectRatio="none" fill="none">
            <path className="sr-print-crest" d="M-14 19C54 19 119 31 192 27s127-13 184-12 123 11 179 9 105-13 183-12" />
            <path className="sr-print-foam" d="M-12 20c33-1 58 1 85 5m79 5c37 2 79-3 112-7m90-5c54-1 92 3 131 7m56 1c63-2 113-10 192-11" />
            <path className="sr-print-afterwash" d="M-12 33c40 0 87 9 123 9m81 2c63-2 102-10 155-11m90 2c52 5 91 8 137 3m42-6c42-7 75-7 119-8" />
          </svg>
        </motion.div>
      )}
    </div>
  );
}
