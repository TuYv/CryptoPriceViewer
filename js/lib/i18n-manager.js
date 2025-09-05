/**
 * 国际化管理器 - 统一多语言管理
 * [OPT-6] 解决国际化调用分散问题
 */

import { I18N } from '../i18n.js';

export class I18nManager {
  constructor() {
    this.currentLanguage = I18N.DEFAULT_LANGUAGE;
    this.elements = new Map();
    this.listeners = new Set();
    this.autoUpdateElements = true;
    
    this.loadCurrentLanguage();
  }

  /**
   * 加载当前语言设置
   */
  async loadCurrentLanguage() {
    try {
      this.currentLanguage = I18N.getCurrentLanguage();
    } catch (error) {
      console.warn('Failed to load current language:', error);
      this.currentLanguage = I18N.DEFAULT_LANGUAGE;
    }
  }

  /**
   * 获取翻译文本
   * @param {string} key - 翻译键
   * @param {string} lang - 语言代码
   * @param {Object} variables - 变量替换
   */
  t(key, lang = null, variables = {}) {
    const language = lang || this.currentLanguage;
    let text = I18N.t(key, language);
    
    // 支持变量替换
    if (Object.keys(variables).length > 0) {
      text = this.interpolate(text, variables);
    }
    
    return text;
  }

  /**
   * 变量插值
   * @param {string} text - 原文本
   * @param {Object} variables - 变量对象
   */
  interpolate(text, variables) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * 设置当前语言
   * @param {string} language - 语言代码
   */
  async setLanguage(language) {
    if (this.currentLanguage === language) return;
    
    const oldLanguage = this.currentLanguage;
    this.currentLanguage = language;
    
    // 保存语言设置
    try {
      I18N.setCurrentLanguage(language);
    } catch (error) {
      console.warn('Failed to save language setting:', error);
    }
    
    // 通知监听器
    this.notifyLanguageChange(oldLanguage, language);
    
    // 自动更新已注册的元素
    if (this.autoUpdateElements) {
      this.updateAllElements();
    }
  }

  /**
   * 注册需要自动更新的DOM元素
   * @param {string|Element} element - 元素或选择器
   * @param {string} key - 翻译键
   * @param {string} attribute - 要更新的属性 (textContent, placeholder, title等)
   * @param {Object} options - 选项
   */
  registerElement(element, key, attribute = 'textContent', options = {}) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) {
      console.warn(`Element not found: ${element}`);
      return this;
    }

    const id = this.generateElementId(el, key, attribute);
    this.elements.set(id, {
      element: el,
      key,
      attribute,
      variables: options.variables || {},
      transform: options.transform || null
    });

    // 立即更新元素
    this.updateElement(id);
    return this;
  }

  /**
   * 批量注册元素
   * @param {Array} elementConfigs - 元素配置数组
   */
  registerElements(elementConfigs) {
    elementConfigs.forEach(config => {
      this.registerElement(config.element, config.key, config.attribute, config.options);
    });
    return this;
  }

  /**
   * 通过data属性自动注册元素
   */
  autoRegisterElements() {
    // 注册带有 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      this.registerElement(el, key, 'textContent');
    });

    // 注册带有 data-i18n-placeholder 属性的元素
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      this.registerElement(el, key, 'placeholder');
    });

    // 注册带有 data-i18n-title 属性的元素
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      this.registerElement(el, key, 'title');
    });

    return this;
  }

  /**
   * 更新单个元素
   * @param {string} id - 元素ID
   */
  updateElement(id) {
    const config = this.elements.get(id);
    if (!config) return;

    const { element, key, attribute, variables, transform } = config;
    let text = this.t(key, this.currentLanguage, variables);
    
    // 应用转换函数
    if (transform && typeof transform === 'function') {
      text = transform(text, this.currentLanguage);
    }

    // 更新元素
    if (attribute === 'textContent') {
      element.textContent = text;
    } else if (attribute === 'innerHTML') {
      element.innerHTML = text;
    } else {
      element.setAttribute(attribute, text);
    }
  }

  /**
   * 更新所有已注册的元素
   */
  updateAllElements() {
    this.elements.forEach((_, id) => {
      this.updateElement(id);
    });
  }

  /**
   * 移除已注册的元素
   * @param {string|Element} element - 元素或选择器
   * @param {string} key - 翻译键
   * @param {string} attribute - 属性名
   */
  unregisterElement(element, key, attribute = 'textContent') {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return this;

    const id = this.generateElementId(el, key, attribute);
    this.elements.delete(id);
    return this;
  }

  /**
   * 生成元素唯一ID
   * @param {Element} element - DOM元素
   * @param {string} key - 翻译键
   * @param {string} attribute - 属性名
   */
  generateElementId(element, key, attribute) {
    const elementId = element.id || element.className || element.tagName;
    return `${elementId}-${key}-${attribute}`;
  }

  /**
   * 添加语言变更监听器
   * @param {Function} listener - 监听函数
   */
  addLanguageChangeListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知语言变更
   * @param {string} oldLanguage - 旧语言
   * @param {string} newLanguage - 新语言
   */
  notifyLanguageChange(oldLanguage, newLanguage) {
    this.listeners.forEach(listener => {
      try {
        listener(newLanguage, oldLanguage);
      } catch (error) {
        console.error('Language change listener error:', error);
      }
    });
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages() {
    return I18N.getSupportedLanguages();
  }

  /**
   * 检查是否支持指定语言
   * @param {string} language - 语言代码
   */
  isLanguageSupported(language) {
    return I18N.getSupportedLanguages().some(lang => lang.code === language);
  }

  /**
   * 获取语言的本地化名称
   * @param {string} language - 语言代码
   */
  getLanguageName(language) {
    const lang = I18N.getSupportedLanguages().find(l => l.code === language);
    return lang ? lang.nativeName : language;
  }

  /**
   * 创建语言选择器
   * @param {string} containerId - 容器ID
   * @param {Object} options - 选项
   */
  createLanguageSelector(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container not found: ${containerId}`);
      return null;
    }

    const select = document.createElement('select');
    select.className = options.className || 'language-selector';
    
    I18N.getSupportedLanguages().forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.code;
      option.textContent = lang.nativeName;
      option.selected = lang.code === this.currentLanguage;
      select.appendChild(option);
    });

    select.addEventListener('change', (e) => {
      this.setLanguage(e.target.value);
    });

    container.appendChild(select);
    return select;
  }

  /**
   * 格式化时间/日期（考虑本地化）
   * @param {Date|number} date - 日期
   * @param {Object} options - 格式化选项
   */
  formatDate(date, options = {}) {
    const dateObj = date instanceof Date ? date : new Date(date);
    const locale = this.getDateLocale(this.currentLanguage);
    
    try {
      return dateObj.toLocaleDateString(locale, options);
    } catch (error) {
      return dateObj.toLocaleDateString('en-US', options);
    }
  }

  /**
   * 格式化时间（考虑本地化）
   * @param {Date|number} date - 日期
   * @param {Object} options - 格式化选项
   */
  formatTime(date, options = {}) {
    const dateObj = date instanceof Date ? date : new Date(date);
    const locale = this.getDateLocale(this.currentLanguage);
    
    try {
      return dateObj.toLocaleTimeString(locale, options);
    } catch (error) {
      return dateObj.toLocaleTimeString('en-US', options);
    }
  }

  /**
   * 获取日期本地化标识
   * @param {string} language - 语言代码
   */
  getDateLocale(language) {
    const localeMap = {
      'zh': 'zh-CN',
      'en': 'en-US', 
      'ja': 'ja-JP',
      'ko': 'ko-KR'
    };
    return localeMap[language] || 'en-US';
  }

  /**
   * 设置自动更新元素开关
   * @param {boolean} enabled - 是否启用
   */
  setAutoUpdateElements(enabled) {
    this.autoUpdateElements = enabled;
    return this;
  }

  /**
   * 清理所有资源
   */
  destroy() {
    this.elements.clear();
    this.listeners.clear();
  }
}

// 创建全局国际化管理器实例
export const i18nManager = new I18nManager();

// 自动注册页面中的国际化元素
document.addEventListener('DOMContentLoaded', () => {
  i18nManager.autoRegisterElements();
});

export default I18nManager;