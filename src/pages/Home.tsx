import { useGridSense } from '@/contexts/GridSenseContext';
import RoomCard from '@/components/RoomCard';
import { motion } from 'framer-motion';

export default function Home() {
  const { rooms, holidayMode } = useGridSense();
  const onCount = rooms.filter(r => r.status === 'on').length;
  const offCount = rooms.filter(r => r.status === 'off').length;

  return (
    <div className="h-screen flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-mono text-foreground">Live Power Grid</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {onCount} active · {offCount} standby
            {holidayMode && <span className="ml-2 text-gs-amber">🏖 Holiday Mode Active</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <div className="glass-panel rounded-lg px-4 py-2 text-center">
            <div className="text-xs text-muted-foreground mb-0.5">Rooms ON</div>
            <div className="font-mono text-xl font-bold text-gs-green">{onCount}</div>
          </div>
          <div className="glass-panel rounded-lg px-4 py-2 text-center">
            <div className="text-xs text-muted-foreground mb-0.5">Rooms OFF</div>
            <div className="font-mono text-xl font-bold text-foreground">{offCount}</div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 flex-1"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {rooms.map(room => (
          <motion.div
            key={room.id}
            variants={{
              hidden: { scale: 0.8, opacity: 0 },
              visible: { scale: 1, opacity: 1 },
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <RoomCard room={room} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
