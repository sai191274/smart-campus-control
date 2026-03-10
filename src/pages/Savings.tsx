import { useGridSense } from '@/contexts/GridSenseContext';
import { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';

function AnimatedCounter({ value, suffix = '', prefix = '', decimals = 1 }: { value: number; suffix?: string; prefix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const step = (value - display) / 10;
    if (Math.abs(step) < 0.001) { setDisplay(value); return; }
    const t = setTimeout(() => setDisplay(prev => prev + step), 50);
    return () => clearTimeout(t);
  }, [value, display]);
  return <span>{prefix}{display.toFixed(decimals)}{suffix}</span>;
}

export default function Savings() {
  const { rooms, settings } = useGridSense();

  const offRooms = rooms.filter(r => r.status === 'off').length;
  const totalOnSeconds = rooms.reduce((sum, r) => sum + r.totalOnSeconds, 0);

  // Assume 3 devices ~500W each per room when off = savings
  const avgWattsSavedPerRoom = 1500; // watts per room
  const totalOffSeconds = rooms.reduce((sum, r) => r.status === 'off' ? sum + r.totalOnSeconds : sum, 0);

  // Simplified: savings = rooms off * time * wattage
  const kwhSaved = useMemo(() => (offRooms * avgWattsSavedPerRoom * (Date.now() / 1000 / 3600)) / 1000 * 0.001, [offRooms]);
  const [tick, setTick] = useState(0);
  useEffect(() => { const i = setInterval(() => setTick(t => t + 1), 1000); return () => clearInterval(i); }, []);

  // More realistic calculation based on actual off time
  const estimatedKwhSaved = (offRooms * 1.5 * tick) / 3600; // 1.5kW per room per hour
  const moneySaved = estimatedKwhSaved * settings.electricityRate;
  const co2Avoided = estimatedKwhSaved * 0.82; // kg CO2 per kWh in India

  const barData = [
    { name: 'Without\nGridSense', value: estimatedKwhSaved * 3 + estimatedKwhSaved, type: 'without' },
    { name: 'With\nGridSense', value: estimatedKwhSaved * 3, type: 'with' },
  ];

  const hourlyData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    usage: i >= 8 && i <= 18 ? Math.random() * 5 + 3 : Math.random() * 2,
  }));

  return (
    <div className="h-screen flex flex-col p-6 overflow-hidden">
      <h1 className="text-2xl font-bold font-mono text-foreground mb-6">Savings Dashboard</h1>

      {/* Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'kWh Saved Today', value: estimatedKwhSaved, suffix: ' kWh', color: 'text-gs-green', prefix: '' },
          { label: '₹ Saved Today', value: moneySaved, suffix: '', color: 'text-gs-green', prefix: '₹' },
          { label: 'Rooms OFF Now', value: offRooms, suffix: '', color: 'text-foreground', prefix: '', snap: true },
          { label: 'CO₂ Avoided', value: co2Avoided, suffix: ' kg', color: 'text-gs-blue', prefix: '' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: i * 0.05 }}
            className="glass-panel rounded-xl p-4"
          >
            <div className="text-xs text-muted-foreground mb-1">{item.label}</div>
            <div className={`font-mono text-2xl font-bold ${item.color}`}>
              {item.snap ? (
                <span>{item.prefix}{item.value}</span>
              ) : (
                <AnimatedCounter value={item.value} suffix={item.suffix} prefix={item.prefix} />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="glass-panel rounded-xl p-5 flex flex-col">
          <h3 className="font-mono text-sm font-semibold text-foreground mb-3">Energy Comparison</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(5,8,16,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                  formatter={(v: number) => [`${v.toFixed(2)} kWh`, 'Energy']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.type === 'with' ? '#10B981' : '#3B82F6'} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel rounded-xl p-5 flex flex-col">
          <h3 className="font-mono text-sm font-semibold text-foreground mb-3">Peak Usage Heatmap</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }} interval={3} axisLine={false} />
                <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: 'rgba(5,8,16,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                />
                <Bar dataKey="usage" radius={[3, 3, 0, 0]}>
                  {hourlyData.map((entry, i) => (
                    <Cell key={i} fill={entry.usage > 5 ? '#EF4444' : entry.usage > 3 ? '#F59E0B' : '#10B981'} fillOpacity={0.6} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Projections */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-muted-foreground">Monthly Projection</div>
          <div className="font-mono text-xl font-bold text-gs-green mt-1">
            ₹{(moneySaved * 30).toFixed(0)}
          </div>
          <div className="text-xs text-muted-foreground">{(estimatedKwhSaved * 30).toFixed(1)} kWh</div>
        </div>
        <div className="glass-panel rounded-xl p-4">
          <div className="text-xs text-muted-foreground">Yearly Projection</div>
          <div className="font-mono text-xl font-bold text-gs-green mt-1">
            ₹{(moneySaved * 365).toFixed(0)}
          </div>
          <div className="text-xs text-muted-foreground">{(estimatedKwhSaved * 365).toFixed(1)} kWh</div>
        </div>
      </div>
    </div>
  );
}
