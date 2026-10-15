import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { RiskBand } from '../types';
import { getRiskBandLabel } from '../utils/riskEngine';

interface Props {
  score: number; // 0 to 100
  riskBand: RiskBand;
  explanation: string;
  coveragePercent: number;
}

interface SegmentDef {
  name: string;
  shortLabel: string;
  band: RiskBand;
  color: string;
  bgLight: string;
  textLight: string;
  badgeClass: string;
  phiStart: number;
  phiEnd: number;
  phiMid: number;
}

export const RiskMeter: React.FC<Props> = ({
  score,
  riskBand,
  explanation,
  coveragePercent,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Smooth needle & score animation
  useEffect(() => {
    if (prefersReducedMotion) {
      setAnimatedScore(score);
      return;
    }

    const start = 0;
    const duration = 800;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing out cubic: 1 - pow(1 - progress, 3)
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (score - start) * ease);
      setAnimatedScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [score, prefersReducedMotion]);

  // Geometry constants
  const cx = 200;
  const cy = 170;
  const radiusMid = 118;
  const strokeWidth = 26;
  const labelRadius = 152;

  // 6 Segments definition from Left (Very High Risk) to Right (Lowest Risk)
  const segments: SegmentDef[] = [
    {
      name: 'Very High Risk',
      shortLabel: 'Very High',
      band: 'VERY_HIGH_RISK',
      color: '#DC2626', // Deep Red
      bgLight: 'bg-red-50 dark:bg-red-950/40',
      textLight: 'text-red-700 dark:text-red-400',
      badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
      phiStart: 0,
      phiEnd: 27.5,
      phiMid: 13.75,
    },
    {
      name: 'High Risk',
      shortLabel: 'High',
      band: 'HIGH_RISK',
      color: '#EA580C', // Red-Orange
      bgLight: 'bg-orange-50 dark:bg-orange-950/40',
      textLight: 'text-orange-700 dark:text-orange-400',
      badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
      phiStart: 30.5,
      phiEnd: 58.0,
      phiMid: 44.25,
    },
    {
      name: 'Elevated Risk',
      shortLabel: 'Elevated',
      band: 'ELEVATED_RISK',
      color: '#F97316', // Orange
      bgLight: 'bg-amber-50 dark:bg-amber-950/40',
      textLight: 'text-amber-700 dark:text-amber-400',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
      phiStart: 61.0,
      phiEnd: 88.5,
      phiMid: 74.75,
    },
    {
      name: 'Moderate Risk',
      shortLabel: 'Moderate',
      band: 'MODERATE_RISK',
      color: '#EAB308', // Amber/Yellow
      bgLight: 'bg-yellow-50 dark:bg-yellow-950/40',
      textLight: 'text-yellow-700 dark:text-yellow-400',
      badgeClass: 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800',
      phiStart: 91.5,
      phiEnd: 119.0,
      phiMid: 105.25,
    },
    {
      name: 'Lower Risk',
      shortLabel: 'Lower',
      band: 'LOWER_RISK',
      color: '#84CC16', // Light Green / Lime
      bgLight: 'bg-lime-50 dark:bg-lime-950/40',
      textLight: 'text-lime-700 dark:text-lime-400',
      badgeClass: 'bg-lime-50 text-lime-800 border-lime-200 dark:bg-lime-950/50 dark:text-lime-300 dark:border-lime-800',
      phiStart: 122.0,
      phiEnd: 149.5,
      phiMid: 135.75,
    },
    {
      name: 'Lowest Risk',
      shortLabel: 'Lowest',
      band: 'LOWEST_RISK',
      color: '#10B981', // Green
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
      textLight: 'text-emerald-700 dark:text-emerald-400',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
      phiStart: 152.5,
      phiEnd: 180.0,
      phiMid: 166.25,
    },
  ];

  // Helper to compute SVG arc coordinates
  const polarToCartesian = (centerX: number, centerY: number, radius: number, phiDeg: number) => {
    const phiRad = (phiDeg * Math.PI) / 180;
    return {
      x: centerX - radius * Math.cos(phiRad),
      y: centerY - radius * Math.sin(phiRad),
    };
  };

  // Helper to build an SVG path for an arc segment
  const describeArc = (
    centerX: number,
    centerY: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const start = polarToCartesian(centerX, centerY, radius, startAngle);
    const end = polarToCartesian(centerX, centerY, radius, endAngle);
    const arcSweep = endAngle - startAngle <= 180 ? '0' : '1';
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${arcSweep} 1 ${end.x} ${end.y}`;
  };

  // Compute needle rotation angle from animated score:
  // Score 0 (Lowest Risk) -> points to right (~166° / +76° rotation)
  // Score 100 (Very High Risk) -> points to left (~14° / -76° rotation)
  // Base formula: phi = 180 - (animatedScore / 100) * 180
  // Clamped slightly so needle stays inside the first and last segments cleanly
  const clampedScore = Math.min(Math.max(animatedScore, 0), 100);
  const rawPhi = 180 - (clampedScore / 100) * 180;
  // Needle points straight up when phi = 90.
  // Rotation angle relative to straight up (12 o'clock):
  const needleRotation = rawPhi - 90;

  // Active risk band metadata
  const currentSegment = segments.find((s) => s.band === riskBand) || segments[0];

  const getRiskIcon = () => {
    switch (riskBand) {
      case 'LOWEST_RISK':
      case 'LOWER_RISK':
        return <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'MODERATE_RISK':
        return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'ELEVATED_RISK':
        return <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'HIGH_RISK':
        return <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'VERY_HIGH_RISK':
      default:
        return <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
    }
  };

  return (
    <div className="p-5 md:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col items-center text-center space-y-3 transition-colors duration-200">
      {/* Semicircular Speedometer Gauge */}
      <div className="relative w-full max-w-[340px] aspect-[400/215] flex items-center justify-center">
        <svg
          viewBox="0 0 400 215"
          className="w-full h-full overflow-visible select-none"
          role="img"
          aria-label={`Risk meter displaying a score of ${animatedScore} out of 100, categorized as ${getRiskBandLabel(riskBand)}`}
        >
          {/* Subtle background track */}
          <path
            d={describeArc(cx, cy, radiusMid, 0, 180)}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth + 4}
            strokeLinecap="round"
            className="text-slate-100 dark:text-slate-800/80"
          />

          {/* 6 Clearly Separated Colored Segments */}
          {segments.map((seg, idx) => {
            const isTarget = seg.band === riskBand;
            return (
              <g key={idx} className="transition-opacity duration-300">
                <path
                  d={describeArc(cx, cy, radiusMid, seg.phiStart, seg.phiEnd)}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={isTarget ? strokeWidth + 2 : strokeWidth}
                  strokeLinecap="butt"
                  className={`transition-all duration-300 ${
                    isTarget ? 'opacity-100 filter drop-shadow-xs' : 'opacity-85 hover:opacity-100'
                  }`}
                />
              </g>
            );
          })}

          {/* Category Labels positioned radially above segments */}
          {segments.map((seg, idx) => {
            const pos = polarToCartesian(cx, cy, labelRadius, seg.phiMid);
            const isTarget = seg.band === riskBand;
            return (
              <text
                key={`lbl-${idx}`}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isTarget ? seg.color : 'currentColor'}
                className={`text-[10px] md:text-[11px] font-sans transition-colors duration-200 ${
                  isTarget
                    ? 'font-bold'
                    : 'font-medium text-slate-500 dark:text-slate-400'
                }`}
              >
                {seg.shortLabel}
              </text>
            );
          })}

          {/* Needle & Center Circular Hub */}
          <g
            style={{
              transform: `rotate(${needleRotation}deg)`,
              transformOrigin: `${cx}px ${cy}px`,
              transition: prefersReducedMotion ? 'none' : 'transform 0.8s cubic-bezier(0.34, 1.3, 0.64, 1)',
            }}
          >
            {/* Needle shape: Tapered sharp pointer from hub */}
            <path
              d={`M ${cx - 3.5} ${cy} L ${cx} ${cy - 92} L ${cx + 3.5} ${cy} L ${cx + 2} ${cy + 12} L ${cx - 2} ${cy + 12} Z`}
              className="fill-slate-800 dark:fill-slate-100 filter drop-shadow-sm"
            />
            {/* Center Hub circular accents */}
            <circle
              cx={cx}
              cy={cy}
              r="13"
              className="fill-slate-900 dark:fill-slate-200 stroke-white dark:stroke-slate-900 stroke-2"
            />
            <circle
              cx={cx}
              cy={cy}
              r="4.5"
              className="fill-white dark:fill-slate-900"
            />
          </g>
        </svg>
      </div>

      {/* Numerical Score Display & Metadata (Clearly separated below gauge without overlapping) */}
      <div className="flex flex-col items-center space-y-2 w-full pt-1">
        {/* Number / 100 */}
        <div className="flex items-baseline justify-center">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {animatedScore}
          </span>
          <span className="text-sm sm:text-base font-semibold text-slate-400 dark:text-slate-500 ml-1">
            /100
          </span>
        </div>

        {/* Risk Category Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border flex items-center gap-1.5 shadow-2xs ${currentSegment.badgeClass}`}
          >
            {getRiskIcon()}
            <span>{currentSegment.name}</span>
          </span>
        </div>

        {/* Plain-English Explanation */}
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md leading-relaxed px-2">
          {explanation}
        </p>

        {/* Evidence Coverage Indicator */}
        <div className="w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-2 mt-1">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Evidence coverage:</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {coveragePercent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
