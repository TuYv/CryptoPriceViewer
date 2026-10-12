import { useId } from 'react';

/**
 * 7 天小走势图：铺满宽度，下面带一层浅色填充。
 * fade 为 true 时填充从上往下渐渐变淡，用在文字会压在上面的地方（列表的行）
 */
export function Sparkline({ values, height, fade = false }: { values: number[]; height: number; fade?: boolean }) {
  // useId 生成的 id 带符号，放进 url(#...) 之前只留字母和数字
  const gradient = `spark-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  if (values.length < 2) return null;
  const width = 200;
  const pad = 3;
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const points = values.map(
    (v, i) =>
      `${((i / (values.length - 1)) * width).toFixed(1)} ${(pad + (1 - (v - min) / range) * (height - pad * 2)).toFixed(1)}`,
  );
  const line = `M${points.join('L')}`;
  return (
    <svg
      className="c-spark"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ height }}
    >
      {fade && (
        <defs>
          <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="c-spark-fade-top" />
            <stop offset="1" className="c-spark-fade-bottom" />
          </linearGradient>
        </defs>
      )}
      <path
        className={`c-spark-area${fade ? ' c-spark-area--fade' : ''}`}
        d={`${line}L${width} ${height}L0 ${height}Z`}
        style={fade ? { fill: `url(#${gradient})` } : undefined}
      />
      <path className="c-spark-line" d={line} />
    </svg>
  );
}
