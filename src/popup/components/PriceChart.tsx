import { type MouseEvent, useMemo, useRef, useState } from 'react';
import type { ChartDays, ChartPoint } from '@/core/coingecko';
import { formatClock, formatDate, formatDateTime, formatPrice, LOCALES } from '@/core/format';
import type { Currency } from '@/core/settings';
import type { Language } from '@/i18n';

const W = 380;
const H = 186;
const PAD = { left: 20, right: 20, top: 30, bottom: 40 };

interface Props {
  points: ChartPoint[];
  days: ChartDays;
  currency: Currency;
  lang: Language;
  label: string;
  highLabel: string;
  lowLabel: string;
}

function timeLabel(t: number, days: ChartDays, lang: Language): string {
  if (days === '1') return formatClock(t, lang);
  if (days === '365') return new Intl.DateTimeFormat(LOCALES[lang], { year: '2-digit', month: 'short' }).format(t);
  return formatDate(t, lang, false);
}

/** 详情页的价格图表：标出这段时间的最高和最低，鼠标移上去显示那个时间点的价格 */
export function PriceChart({ points, days, currency, lang, label, highLabel, lowLabel }: Props) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const geo = useMemo(() => {
    const prices = points.map((p) => p[1]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const x = (i: number) => PAD.left + (i / Math.max(1, points.length - 1)) * (W - PAD.left - PAD.right);
    const y = (v: number) => PAD.top + (1 - (v - min) / range) * (H - PAD.top - PAD.bottom);
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p[1]).toFixed(1)}`).join('');
    const area = `${line}L${x(points.length - 1).toFixed(1)} ${H - PAD.bottom}L${x(0)} ${H - PAD.bottom}Z`;
    return { min, max, x, y, line, area, iMax: prices.indexOf(max), iMin: prices.indexOf(min) };
  }, [points]);

  if (points.length < 2) return null;

  const onMove = (e: MouseEvent<SVGRectElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.left) / (W - PAD.left - PAD.right)) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };

  const extreme = (i: number, v: number, below: boolean, word: string) => {
    const cx = geo.x(i);
    const anchor = cx < W * 0.2 ? 'start' : cx > W * 0.8 ? 'end' : 'middle';
    return (
      <g>
        <circle className="ext-dot" cx={cx} cy={geo.y(v)} r={2.5} />
        <text className="axis" textAnchor={anchor} x={cx} y={geo.y(v) + (below ? 15 : -8)}>
          {word} {formatPrice(v, currency, lang)}
        </text>
      </g>
    );
  };

  const hovered = hover != null ? points[hover] : undefined;
  const hx = hover != null ? geo.x(hover) : 0;
  const ticks = [0, 0.5, 1].map((f) => Math.round(f * (points.length - 1)));

  return (
    <div className="c-chart">
      <svg ref={svgRef} className="chart-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="fill-top" />
            <stop offset="1" className="fill-bottom" />
          </linearGradient>
        </defs>
        {extreme(geo.iMax, geo.max, false, highLabel)}
        {extreme(geo.iMin, geo.min, true, lowLabel)}
        {ticks.map((i, n) => (
          <text
            key={i}
            className="axis"
            textAnchor={n === 0 ? 'start' : n === 2 ? 'end' : 'middle'}
            x={geo.x(i)}
            y={H - 4}
          >
            {timeLabel(points[i]?.[0] ?? 0, days, lang)}
          </text>
        ))}
        <path className="area" d={geo.area} fill="url(#chart-fill)" />
        <path className="line" d={geo.line} />
        {hovered && (
          <g>
            <line className="cross" x1={hx} x2={hx} y1={PAD.top} y2={H - PAD.bottom} />
            <circle className="dot" cx={hx} cy={geo.y(hovered[1])} r={4} />
          </g>
        )}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: 鼠标看价格的辅助层；键盘用户从最高、最低标注和区间涨跌幅读到同样的信息 */}
        <rect
          x={PAD.left}
          y={0}
          width={W - PAD.left - PAD.right}
          height={H}
          fill="transparent"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        />
      </svg>
      {hovered && (
        <div className="tip" style={{ left: Math.min(Math.max(hx, 78), W - 78) }}>
          <span>
            {days === '365' || days === '90' ? formatDate(hovered[0], lang) : formatDateTime(hovered[0], lang)}
          </span>
          <b>{formatPrice(hovered[1], currency, lang)}</b>
        </div>
      )}
    </div>
  );
}
