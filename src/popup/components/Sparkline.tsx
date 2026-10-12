/** 色块底部的 7 天小走势图：铺满宽度，下面带一层浅色填充 */
export function Sparkline({ values, height }: { values: number[]; height: number }) {
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
      <path className="c-spark-area" d={`${line}L${width} ${height}L0 ${height}Z`} />
      <path className="c-spark-line" d={line} />
    </svg>
  );
}
