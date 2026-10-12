import { createContext, useContext } from 'react';
import type { Settings } from '@/core/settings';
import type { Language, MessageKey } from '@/i18n';

/** 弹窗里打开的是哪一页 */
export type View =
  | { name: 'market' }
  | { name: 'detail'; id: string }
  | { name: 'news' }
  | { name: 'settings' }
  | { name: 'sources' }
  | { name: 'donate' };

export interface PopupContext {
  lang: Language;
  settings: Settings;
  t: (key: MessageKey, params?: Record<string, string | number>) => string;
  update: (change: (current: Settings) => Settings) => Promise<void>;
  go: (view: View) => void;
}

export const Ctx = createContext<PopupContext | null>(null);

export function usePopup(): PopupContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePopup 只能在 <Ctx.Provider> 里面用');
  return ctx;
}
