import { motion, useSpring, useTransform, useVelocity, type MotionValue } from "framer-motion";
import type { ReaderScenery } from "../../data/publications";

// The two prints are aligned. The new water fills the channels first, then
// spreads across the exposed flats through a broad, feathered transition.
function floodMask(level: number) {
  const bank = 106 - level * 132;
  const shallows = Math.min(.65, level * .8);
  return `linear-gradient(106deg, rgb(0 0 0 / ${shallows}) ${bank - 36}%, #000 ${bank + 12}%)`;
}

const floodOpacity = (level: number) => Math.sqrt(level);

export default function PrintBackdrop({ scenery, index, reduced, tide: target }: {
  scenery: ReaderScenery;
  index: number;
  tide: MotionValue<number>;
  reduced: boolean;
}) {
  const level = scenery.tideLevels[Math.min(index, scenery.tideLevels.length - 1)] ?? 0;
  const tide = useSpring(target, { stiffness: 84, damping: 21, restDelta: .0005 });
  const velocity = useVelocity(tide);
  const maskImage = useTransform(tide, floodMask);
  const opacity = useTransform(tide, floodOpacity);
  const reflectionOpacity = useTransform(velocity, speed => Math.min(.3, Math.abs(speed) * .24));
  const reflectionOffset = useTransform(tide, amount => Math.sin(amount * Math.PI * 7) * 3.5);

  return (
    <div className="dreamscape sr-print-backdrop" aria-hidden="true" data-tide={level}>
      <img src={scenery.lowTide} alt="" />
      <div className="sr-print-water">
        {reduced ? (
          <div className="sr-print-tide" style={{ maskImage: floodMask(level), opacity: floodOpacity(level) }}>
            <img src={scenery.highTide} alt="" />
          </div>
        ) : (
          <motion.div className="sr-print-tide" style={{ maskImage, opacity }}>
            <img src={scenery.highTide} alt="" />
            <motion.div className="sr-print-reflection" style={{ opacity: reflectionOpacity }}>
              <motion.img src={scenery.highTide} alt="" style={{ x: reflectionOffset }} />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
