import { describe, expect, it } from 'vitest';
import { LANGUAGES, languageFromLocale, MESSAGES, t } from '.';

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('翻译表', () => {
  it.each(LANGUAGES)('%s 的每条文字都不是空的', (lang) => {
    for (const [key, text] of Object.entries(MESSAGES[lang])) {
      expect(text.trim(), `${lang} ${key}`).not.toBe('');
    }
  });

  it.each(LANGUAGES)('%s 的占位符和英文一致', (lang) => {
    for (const [key, text] of Object.entries(MESSAGES.en)) {
      expect(placeholders(MESSAGES[lang][key as keyof typeof MESSAGES.en]), `${lang} ${key}`).toEqual(
        placeholders(text),
      );
    }
  });
});

describe('t', () => {
  it('按语言取文字', () => {
    expect(t('zh', 'tab.market')).toBe('行情');
    expect(t('en', 'tab.market')).toBe('Markets');
  });
});

describe('languageFromLocale', () => {
  it.each([
    ['zh-CN', 'zh'],
    ['zh-TW', 'zh'],
    ['ja', 'ja'],
    ['ko-KR', 'ko'],
    ['en-GB', 'en'],
    ['fr', 'en'],
    ['', 'en'],
  ])('%s → %s', (locale, lang) => {
    expect(languageFromLocale(locale)).toBe(lang);
  });
});
