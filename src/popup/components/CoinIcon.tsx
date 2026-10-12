import { useState } from 'react';

/** 币种图标。图片加载失败（断网、图片服务器连不上）时显示代码的首字母 */
export function CoinIcon({ src, symbol, size }: { src?: string; symbol?: string; size: number }) {
  const [failedSrc, setFailedSrc] = useState<string>();
  if (!src || failedSrc === src) {
    return (
      <span className="c-icon-ph" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">
        {symbol?.[0] ?? ''}
      </span>
    );
  }
  return <img src={src} alt="" width={size} height={size} className="c-icon" onError={() => setFailedSrc(src)} />;
}
