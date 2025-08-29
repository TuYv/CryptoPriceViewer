/**
 * @file UIManager.js
 * @description 管理应用程序的UI交互
 */

import { Config } from '../config.js';
import SettingsManager from '../services/SettingsManager.js';

/**
 * UI管理器类
 * 负责处理所有UI相关的操作和更新
 */
class UIManager {
  // 静态属性用于防抖和批量更新
  static debounceTimers = new Map();
  static updateQueue = new Set();
  static isUpdating = false;

  /**
   * 初始化UI元素引用
   */
  static initElements() {
    this.cryptoListEl = document.getElementById('cryptoList');
    this.refreshBtn = document.getElementById('refreshBtn');
    this.settingsBtn = document.getElementById('settingsBtn');
    this.settingsPanel = document.getElementById('settingsPanel');
    this.saveSettingsBtn = document.getElementById('saveSettings');
    this.cancelSettingsBtn = document.getElementById('cancelSettings');
    this.lastUpdatedEl = document.getElementById('lastUpdated');
    this.refreshIntervalSelect = document.getElementById('refreshInterval');
    this.currencySelect = document.getElementById('currency');
  }

  /**
   * 更新设置UI以匹配当前设置
   */
  static updateSettingsUI() {
    // 更新币种选择
    const checkboxes = document.querySelectorAll('.coin-options input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
      checkbox.checked = SettingsManager.currentSettings.coins.includes(checkbox.value);
    });
    
    // 更新刷新间隔
    this.refreshIntervalSelect.value = SettingsManager.currentSettings.refreshInterval;
    
    // 更新货币选择
    this.currencySelect.value = SettingsManager.currentSettings.currency;
  }

  /**
   * 显示加载状态（带防抖优化）
   */
  static showLoading() {
    this.debounce('showLoading', () => {
      this.cryptoListEl.innerHTML = '<div class="loading">加载中...</div>';
    }, 50);
  }

  /**
   * 显示错误信息（带防抖优化）
   * @param {string} message - 错误信息
   */
  static showError(message) {
    this.debounce('showError', () => {
      this.cryptoListEl.innerHTML = `<div class="error-message">获取数据失败: ${message}</div>`;
    }, 50);
  }

  /**
   * 显示无数据信息（带防抖优化）
   */
  static showNoData() {
    this.debounce('showNoData', () => {
      this.cryptoListEl.innerHTML = '<div class="error-message">没有可用数据</div>';
    }, 50);
  }

  /**
   * 更新加密货币列表（带防抖和批量更新优化）
   * @param {Array} data - 加密货币数据数组
   */
  static updateCryptoList(data) {
    this.debounce('updateCryptoList', () => {
      this._updateCryptoListImmediate(data);
    }, 100);
  }

  /**
   * 立即更新加密货币列表
   * @param {Array} data - 加密货币数据数组
   * @private
   */
  static _updateCryptoListImmediate(data) {
    // 如果没有数据
    if (!data || data.length === 0) {
      this.showNoData();
      return;
    }
    
    // 使用DocumentFragment批量更新DOM
    const fragment = document.createDocumentFragment();
    
    // 添加每个币种
    data.forEach(coin => {
      const priceChangeClass = coin.price_change_percentage_24h >= 0 ? 'price-up' : 'price-down';
      const priceChangeSymbol = coin.price_change_percentage_24h >= 0 ? '↑' : '↓';
      const priceChangeAbs = Math.abs(coin.price_change_percentage_24h).toFixed(2);
      
      const coinElement = document.createElement('div');
      coinElement.className = 'crypto-item';
      coinElement.innerHTML = `
        <div class="crypto-info">
          <img src="${coin.image}" alt="${coin.name}" class="crypto-icon">
          <span class="crypto-name">${coin.name}</span>
          <span class="crypto-symbol">(${coin.symbol.toUpperCase()})</span>
        </div>
        <div class="crypto-price-info">
          <span class="crypto-price">${this.formatPrice(coin.current_price, SettingsManager.currentSettings.currency)}</span>
          <span class="price-change ${priceChangeClass}">${priceChangeSymbol}${priceChangeAbs}%</span>
        </div>
      `;
      
      fragment.appendChild(coinElement);
    });
    
    // 一次性更新DOM
    requestAnimationFrame(() => {
      this.cryptoListEl.innerHTML = '';
      this.cryptoListEl.appendChild(fragment);
    });
  }

  /**
   * 格式化价格
   * @param {number} price - 价格
   * @param {string} currency - 货币单位
   * @returns {string} 格式化后的价格字符串
   */
  static formatPrice(price, currency) {
    const symbol = Config.CURRENCY_SYMBOLS[currency] || '';
    
    // 根据价格大小格式化
    if (price >= 1000) {
      return `${symbol}${price.toLocaleString()}`;
    } else if (price >= 1) {
      return `${symbol}${price.toFixed(2)}`;
    } else {
      // 价格低于1时，显示5位小数
      let formattedPrice = price.toFixed(5);
      
      // 检查是否有超过3个连续的0
      const match = formattedPrice.match(/\.0{4,}/);
      if (match) {
        // 计算连续0的数量
        const zeroCount = match[0].length - 1; // 减去小数点
        // 找到第一个非0数字
        const nonZeroMatch = formattedPrice.match(/\.0*([1-9])/);
        if (nonZeroMatch) {
          const firstNonZero = nonZeroMatch[1];
          // 使用科学计数法格式：0₀ₙ + 第一个非0数字
          const subscriptZeros = this.toSubscript(zeroCount);
          return `${symbol}0.0${subscriptZeros}${firstNonZero}`;
        }
      }
      
      return `${symbol}${formattedPrice}`;
    }
  }
  
  /**
   * 将数字转换为下标格式
   * @param {number} num - 要转换的数字
   * @returns {string} 下标格式的数字
   */
  static toSubscript(num) {
    const subscriptMap = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
    };
    return num.toString().split('').map(digit => subscriptMap[digit] || digit).join('');
  }

  /**
   * 更新最后更新时间（带防抖优化）
   */
  static updateLastUpdated() {
    this.debounce('updateLastUpdated', () => {
      const now = new Date();
      this.lastUpdatedEl.textContent = now.toLocaleTimeString();
    }, 100);
  }

  /**
   * 防抖函数
   * @param {string} key - 防抖键
   * @param {Function} func - 要执行的函数
   * @param {number} delay - 延迟时间（毫秒）
   */
  static debounce(key, func, delay) {
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      func();
      this.debounceTimers.delete(key);
    }, delay);
    
    this.debounceTimers.set(key, timer);
  }

  /**
   * 批量更新DOM元素
   * @param {Object} updates - 更新配置对象
   */
  static batchUpdateElements(updates) {
    // 使用requestAnimationFrame确保在下一个重绘周期执行
    requestAnimationFrame(() => {
      Object.entries(updates).forEach(([elementKey, properties]) => {
        const element = this[elementKey];
        if (!element) return;
        
        Object.entries(properties).forEach(([prop, value]) => {
          if (prop === 'display') {
            element.style.display = value;
          } else if (prop === 'textContent') {
            element.textContent = value;
          } else {
            element[prop] = value;
          }
        });
      });
    });
  }
}

// 导出UI管理器类
export default UIManager;