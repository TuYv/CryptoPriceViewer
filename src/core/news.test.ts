import { describe, expect, it } from 'vitest';
import {
  decodeEntities,
  feedsFor,
  isSameStory,
  mergeNews,
  type NewsItem,
  parseOdaily,
  parseRss,
  safeUrl,
} from './news';

// 结构照着真实的 RSS 和接口返回，标题是编的
const PANEWS_RSS = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>PANews</title>
<item><title><![CDATA[某交易平台将上线多个永续合约]]></title><description><![CDATA[PANews 10月12日消息，<b>正文</b>]]></description><link>https://www.panewslab.com/zh/articles/aaa</link><pubDate>Mon, 12 Oct 2026 06:30:00 GMT</pubDate></item>
<item><title><![CDATA[没有链接的条目]]></title><pubDate>Mon, 12 Oct 2026 06:00:00 GMT</pubDate></item>
<item><title><![CDATA[危险链接]]></title><link>javascript:alert(1)</link><pubDate>Mon, 12 Oct 2026 06:00:00 GMT</pubDate></item>
</channel></rss>`;

const DECRYPT_RSS = `<rss><channel><description>What&amp;#039;s new</description>
<item>
  <title>Tokenized Stocks &amp; ETFs: What&#8217;s Next</title>
  <link>https://decrypt.co/1/tokenized-stocks</link>
  <pubDate>Sun, 11 Oct 2026 17:11:03 +0000</pubDate>
  <dc:creator>Staff</dc:creator>
</item></channel></rss>`;

const ODAILY_JSON = JSON.stringify({
  code: 0,
  data: {
    list: [
      {
        id: 1,
        title: '某国拟扩大证券代币化范围',
        publishTimestamp: 1791796142000,
        link: 'https://www.odaily.news/zh-CN/newsflash/1',
      },
      { id: 2, title: '', publishTimestamp: 1791796142000, link: 'https://www.odaily.news/zh-CN/newsflash/2' },
    ],
  },
});

describe('解析', () => {
  it('RSS：读出标题、链接、时间，去掉 CDATA，跳过没链接或链接不安全的条目', () => {
    expect(parseRss(PANEWS_RSS, 'panews')).toEqual([
      {
        id: 'https://www.panewslab.com/zh/articles/aaa',
        title: '某交易平台将上线多个永续合约',
        url: 'https://www.panewslab.com/zh/articles/aaa',
        source: 'panews',
        publishedAt: Date.parse('2026-10-12T06:30:00Z'),
      },
    ]);
  });

  it('RSS：解码 HTML 实体', () => {
    const [item] = parseRss(DECRYPT_RSS, 'decrypt');
    expect(item?.title).toBe('Tokenized Stocks & ETFs: What’s Next');
    expect(item?.publishedAt).toBe(Date.parse('2026-10-11T17:11:03Z'));
  });

  it('Odaily：按语言把链接换成对应语言的页面，跳过空标题', () => {
    const items = parseOdaily(ODAILY_JSON, 'ja');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      url: 'https://www.odaily.news/ja/newsflash/1',
      source: 'odaily',
      publishedAt: 1791796142000,
    });
    expect(parseOdaily('不是 JSON', 'zh')).toEqual([]);
  });

  it('转义两次的实体也能解开', () => {
    expect(decodeEntities('What&amp;#039;s new')).toBe("What's new");
    expect(decodeEntities('a &lt;b&gt; &#x4E2D;')).toBe('a <b> 中');
  });

  it('只接受 http 和 https 链接', () => {
    expect(safeUrl('https://decrypt.co/x')).toBe('https://decrypt.co/x');
    expect(safeUrl('javascript:alert(1)')).toBeNull();
    expect(safeUrl('不是链接')).toBeNull();
  });
});

describe('feedsFor', () => {
  it('中文：PANews、Odaily 用中文，Decrypt 是英文', () => {
    expect(feedsFor('zh', ['panews', 'odaily', 'decrypt']).map((f) => [f.source.id, f.lang])).toEqual([
      ['panews', 'zh'],
      ['odaily', 'zh'],
      ['decrypt', 'en'],
    ]);
  });

  it('英文：只有 Decrypt', () => {
    expect(feedsFor('en', ['panews', 'odaily', 'decrypt']).map((f) => f.source.id)).toEqual(['decrypt']);
  });

  it('关掉的来源不抓', () => {
    expect(feedsFor('ko', ['odaily']).map((f) => f.source.id)).toEqual(['odaily']);
  });
});

const item = (title: string, minutes: number, source: NewsItem['source'] = 'panews'): NewsItem => ({
  id: `${source}-${title}`,
  url: `https://example.com/${source}/${minutes}`,
  title,
  source,
  publishedAt: Date.UTC(2026, 9, 12, 6, 0) + minutes * 60_000,
});

describe('isSameStory', () => {
  it('两家用不同说法报道同一件事', () => {
    expect(
      isSameStory(
        item('矿池联创张三向Binance存入价值552万美元的ETH', 0),
        item('价值552万美元，矿池联创张三向币安存入2160枚ETH', 4, 'odaily'),
      ),
    ).toBe(true);
    expect(
      isSameStory(
        item('某地址时隔一个月再次向Bybit充值1164万枚ENA，价值约285万美元', 0),
        item('某地址时隔一个月再次向Bybit充值285万美元ENA', 3, 'odaily'),
      ),
    ).toBe(true);
  });

  it('句式相同但数字不同，是两件事', () => {
    expect(
      isSameStory(item('HYPE现货ETF上周净流出942.69万美元', 0), item('XRP现货ETF上周净流入1130.68万美元', 1)),
    ).toBe(false);
  });

  it('相隔太久不算同一件事', () => {
    expect(isSameStory(item('比特币突破9万美元', 0), item('比特币突破9万美元', 5 * 60))).toBe(false);
  });

  it('内容不相关', () => {
    expect(isSameStory(item('某国拟扩大证券代币化范围', 0), item('某交易平台将上线多个永续合约', 1))).toBe(false);
  });
});

describe('mergeNews', () => {
  it('重复的只留最早的那条，结果从新到旧', () => {
    const merged = mergeNews([
      [item('矿池联创张三向Binance存入价值552万美元的ETH', 5), item('某国拟扩大证券代币化范围', 30)],
      [item('价值552万美元，矿池联创张三向币安存入2160枚ETH', 2, 'odaily')],
    ]);
    expect(merged.map((n) => n.title)).toEqual([
      '某国拟扩大证券代币化范围',
      '价值552万美元，矿池联创张三向币安存入2160枚ETH',
    ]);
  });

  it('最多保留指定条数', () => {
    expect(
      mergeNews([Array.from({ length: 10 }, (_, i) => item(`第${i}条不同的新闻标题${i * 7}`, i * 200))], 3),
    ).toHaveLength(3);
  });
});
