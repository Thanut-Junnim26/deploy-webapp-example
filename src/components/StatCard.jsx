import React, { useEffect, useRef, useState } from 'react';

const AnimatedNumber = ({ value, prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value, 10) || 0;
    const duration = 800;
    const start = performance.now();
    const startVal = display;

    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (num - startVal) * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
};

const StatCard = ({ title, value, numericValue, icon: Icon, gradient, subtitle }) => (
  <div className="stat-card group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg shadow-${gradient.split('-')[2]}/20 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="text-white" size={22} />
      </div>
      <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{title}</span>
    </div>
    <div>
      <h3 className="text-2xl font-extrabold text-slate-800">
        {numericValue !== undefined ? (
          <AnimatedNumber
            value={numericValue}
            prefix={typeof value === 'string' && value.startsWith('฿') ? '฿' : ''}
            suffix={typeof value === 'string' && value.includes('Units') ? ' Units' : ''}
          />
        ) : value}
      </h3>
      <p className="text-xs text-slate-400 mt-1.5 font-medium">{subtitle}</p>
    </div>
  </div>
);

export default StatCard;
