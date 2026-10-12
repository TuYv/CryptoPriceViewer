import { useEffect, useState } from 'react';
import type { WxtStorageItem } from '#imports';

/** 读取一个存储项，存储变化时（比如后台刷新了行情）自动更新。还没读到时是 undefined */
export function useStorageItem<T>(item: WxtStorageItem<T, Record<string, unknown>>): T | undefined {
  const [value, setValue] = useState<T>();
  useEffect(() => {
    let alive = true;
    void item.getValue().then((v) => {
      if (alive) setValue(v);
    });
    const unwatch = item.watch((v) => setValue(v));
    return () => {
      alive = false;
      unwatch();
    };
  }, [item]);
  return value;
}

/** 当前时间，每隔 intervalMs 更新一次，用来显示“32 秒前更新” */
export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}
