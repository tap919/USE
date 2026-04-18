import React from 'react';
import { motion } from 'motion/react';

interface NewsTickerProps {
  items: string[];
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex-1 overflow-hidden bg-zinc-950/20 border-x border-zinc-800 h-full flex items-center relative mx-4">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-zinc-950 to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-zinc-950 to-transparent z-10" />
      <motion.div
        animate={{ x: [0, -50 * items.length + "%"] }}
        transition={{
          repeat: Infinity,
          duration: items.length * 5,
          ease: "linear",
        }}
        className="flex whitespace-nowrap gap-16 px-12"
      >
        {items.concat(items).concat(items).map((item, i) => (
          <span key={i} className="text-[10px] font-mono font-bold text-emerald-400 uppercase flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
};
