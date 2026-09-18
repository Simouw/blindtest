import React from 'react';

const bars = [10, 19, 28, 17, 24, 13];

export default function BrandMark({ className = '' }) {
  return <svg className={'brand-mark ' + className} viewBox="0 0 46 32" role="img" aria-label="Blindtest sound mark">
    {bars.map((height, index) => {
      const x = 3 + index * 7.4;
      const y = (32 - height) / 2;
      return <g className="brand-mark-bar" style={{ '--bar-delay': `${index * -0.11}s` }} key={x}>
        <rect x={x} y={y} width="4" height={height} rx="2" />
      </g>;
    })}
  </svg>;
}
