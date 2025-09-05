/**
 * 数据格式化工具 - 统一数据格式化逻辑
 * [OPT-4] 解决数据格式化逻辑分散问题
 */

import { Config } from '../config.js';

export class DataFormatter {
  constructor() {
    this.subscriptMap = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
    };
    
    this.superscriptMap = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹'
    };
  }

  /**
   * 格式化价格显示
   * @param {number} price - 价格
   * @param {string} currency - 货币类型
   * @param {Object} options - 格式化选项
   */
  formatPrice(price, currency = 'USD', options = {}) {
    const {
      minimumFractionDigits = null,
      maximumFractionDigits = null,
      useScientificNotation = true,
      useSubscript = true
    } = options;

    // 处理空值
    if (price === null || price === undefined || isNaN(price)) {
      return `${this.getCurrencySymbol(currency)}-`;
    }

    const symbol = this.getCurrencySymbol(currency);
    
    // 根据价格大小选择格式化策略
    if (price >= 1000000) {
      // 百万以上使用简化表示
      return `${symbol}${(price / 1000000).toFixed(2)}M`;
    } else if (price >= 1000) {
      // 千位以上使用千分位分隔符
      return `${symbol}${price.toLocaleString()}`;
    } else if (price >= 1) {
      // 大于1的价格显示2位小数
      return `${symbol}${price.toFixed(maximumFractionDigits || 2)}`;
    } else if (price > 0) {
      // 小于1的价格特殊处理
      return this.formatSmallPrice(price, symbol, { useScientificNotation, useSubscript });
    } else {
      return `${symbol}0.00`;
    }
  }

  /**
   * 格式化小额价格 (< 1)
   * @param {number} price - 价格
   * @param {string} symbol - 货币符号
   * @param {Object} options - 选项
   */
  formatSmallPrice(price, symbol, options = {}) {
    const { useScientificNotation = true, useSubscript = true } = options;
    
    // 转为字符串分析
    const priceStr = price.toFixed(10);
    const match = priceStr.match(/^0\.0*([1-9]\d*)/);
    
    if (!match) return `${symbol}${price.toFixed(5)}`;
    
    const decimalPart = priceStr.split('.')[1];
    const zeroCount = decimalPart.search(/[1-9]/);
    
    if (zeroCount >= 4 && useScientificNotation) {
      if (useSubscript) {
        const firstNonZero = match[1].substring(0, 2);
        const subscriptZeros = this.toSubscript(zeroCount);
        return `${symbol}0.0${subscriptZeros}${firstNonZero}`;
      } else {
        return `${symbol}${price.toExponential(2)}`;
      }
    }
    
    return `${symbol}${price.toFixed(Math.min(8, zeroCount + 3))}`;
  }

  /**
   * 格式化价格变化百分比
   * @param {number} change - 变化百分比
   * @param {Object} options - 格式化选项
   */
  formatChange(change, options = {}) {
    const {
      showSign = true,
      decimals = 2,
      showPercent = true
    } = options;

    if (change === undefined || change === null || isNaN(change)) {
      return 'N/A';
    }

    const sign = showSign && change >= 0 ? '+' : '';
    const percent = showPercent ? '%' : '';
    
    return `${sign}${change.toFixed(decimals)}${percent}`;
  }

  /**
   * 格式化交易量
   * @param {number} volume - 交易量
   * @param {string} currency - 货币类型
   */
  formatVolume(volume, currency = 'USD') {
    if (volume === null || volume === undefined || isNaN(volume)) {
      return '-';
    }

    const symbol = this.getCurrencySymbol(currency);

    if (volume >= 1e12) {
      return `${symbol}${(volume / 1e12).toFixed(2)}T`;
    } else if (volume >= 1e9) {
      return `${symbol}${(volume / 1e9).toFixed(2)}B`;
    } else if (volume >= 1e6) {
      return `${symbol}${(volume / 1e6).toFixed(2)}M`;
    } else if (volume >= 1e3) {
      return `${symbol}${(volume / 1e3).toFixed(2)}K`;
    } else {
      return `${symbol}${volume.toFixed(2)}`;
    }
  }

  /**
   * 格式化市值
   * @param {number} marketCap - 市值
   * @param {string} currency - 货币类型
   */
  formatMarketCap(marketCap, currency = 'USD') {
    return this.formatVolume(marketCap, currency);
  }

  /**
   * 格式化数字（通用）
   * @param {number} number - 数字
   * @param {Object} options - 格式化选项
   */
  formatNumber(number, options = {}) {
    const {
      decimals = 2,
      useThousandSeparator = true,
      prefix = '',
      suffix = ''
    } = options;

    if (number === null || number === undefined || isNaN(number)) {
      return '-';
    }

    let formatted = number.toFixed(decimals);
    
    if (useThousandSeparator) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }

    return `${prefix}${formatted}${suffix}`;
  }

  /**
   * 格式化时间差
   * @param {Date|number} timestamp - 时间戳
   */
  formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return '刚刚';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分钟前`;
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return time.toLocaleDateString();
    }
  }

  /**
   * 将数字转换为下标格式
   * @param {number} num - 要转换的数字
   */
  toSubscript(num) {
    return num.toString().split('').map(digit => 
      this.subscriptMap[digit] || digit
    ).join('');
  }

  /**
   * 将数字转换为上标格式
   * @param {number} num - 要转换的数字
   */
  toSuperscript(num) {
    return num.toString().split('').map(digit => 
      this.superscriptMap[digit] || digit
    ).join('');
  }

  /**
   * 获取货币符号
   * @param {string} currency - 货币代码
   */
  getCurrencySymbol(currency) {
    return Config.CURRENCY_SYMBOLS[currency] || currency;
  }

  /**
   * 格式化百分比
   * @param {number} ratio - 比例值 (0-1)
   * @param {number} decimals - 小数位数
   */
  formatPercentage(ratio, decimals = 2) {
    if (ratio === null || ratio === undefined || isNaN(ratio)) {
      return '-';
    }
    return `${(ratio * 100).toFixed(decimals)}%`;
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @param {number} decimals - 小数位数
   */
  formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  }

  /**
   * 获取价格变化的CSS类名
   * @param {number} change - 价格变化
   */
  getChangeClass(change) {
    if (change === undefined || change === null || isNaN(change)) {
      return 'neutral';
    }
    return change >= 0 ? 'positive' : 'negative';
  }

  /**
   * 安全的数字解析
   * @param {*} value - 要解析的值
   * @param {number} defaultValue - 默认值
   */
  safeParseNumber(value, defaultValue = 0) {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    
    return defaultValue;
  }
}

// 创建全局格式化器实例
export const dataFormatter = new DataFormatter();

export default DataFormatter;