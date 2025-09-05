/**
 * 设置管理器 - 统一设置操作和验证
 * [OPT-2] 解决设置管理分散问题
 */

import { Config } from '../config.js';
import { storage } from './storage.js';

export class SettingsManager {
  constructor() {
    this.settings = { ...Config.DEFAULT_SETTINGS };
    this.validators = new Map();
    this.transformers = new Map();
    this.listeners = new Set();
    
    this.setupValidators();
    this.setupTransformers();
  }

  /**
   * 设置验证器
   */
  setupValidators() {
    this.validators.set('refreshInterval', (value) => {
      const num = parseInt(value);
      return !isNaN(num) && num >= 0 && num <= 3600;
    });

    this.validators.set('currency', (value) => {
      return ['USD', 'CNY', 'EUR', 'JPY', 'KRW'].includes(value);
    });

    this.validators.set('language', (value) => {
      return ['en', 'zh', 'ja', 'ko'].includes(value);
    });

    this.validators.set('selectedCoins', (value) => {
      return Array.isArray(value) && value.length > 0;
    });
  }

  /**
   * 设置转换器
   */
  setupTransformers() {
    this.transformers.set('refreshInterval', (value) => parseInt(value));
    this.transformers.set('selectedCoins', (value) => 
      Array.isArray(value) ? value : [value]);
  }

  /**
   * 验证设置值
   * @param {string} key - 设置键名
   * @param {*} value - 设置值
   */
  validate(key, value) {
    const validator = this.validators.get(key);
    return validator ? validator(value) : true;
  }

  /**
   * 转换设置值
   * @param {string} key - 设置键名
   * @param {*} value - 设置值
   */
  transform(key, value) {
    const transformer = this.transformers.get(key);
    return transformer ? transformer(value) : value;
  }

  /**
   * 加载设置
   */
  async load() {
    try {
      const savedSettings = await storage.get(Config.STORAGE_KEY);
      if (savedSettings) {
        this.settings = { ...Config.DEFAULT_SETTINGS, ...savedSettings };
      }
      
      // 确保必要的默认值存在
      this.ensureDefaults();
      
      this.notifyListeners('loaded', this.settings);
      return this.settings;
    } catch (error) {
      console.warn('Failed to load settings:', error);
      this.settings = { ...Config.DEFAULT_SETTINGS };
      this.ensureDefaults();
      await this.save();
      return this.settings;
    }
  }

  /**
   * 保存设置
   */
  async save() {
    try {
      await storage.set(Config.STORAGE_KEY, this.settings);
      this.notifyListeners('saved', this.settings);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.notifyListeners('error', error);
      return false;
    }
  }

  /**
   * 获取设置值
   * @param {string} key - 设置键名
   * @param {*} defaultValue - 默认值
   */
  get(key, defaultValue = null) {
    return this.settings[key] !== undefined ? this.settings[key] : defaultValue;
  }

  /**
   * 设置值
   * @param {string} key - 设置键名
   * @param {*} value - 设置值
   * @param {boolean} autoSave - 是否自动保存
   */
  async set(key, value, autoSave = true) {
    // 转换值
    const transformedValue = this.transform(key, value);
    
    // 验证值
    if (!this.validate(key, transformedValue)) {
      throw new Error(`Invalid value for setting '${key}': ${value}`);
    }

    const oldValue = this.settings[key];
    this.settings[key] = transformedValue;

    this.notifyListeners('changed', { key, oldValue, newValue: transformedValue });

    if (autoSave) {
      await this.save();
    }

    return this;
  }

  /**
   * 批量设置
   * @param {Object} newSettings - 新设置对象
   * @param {boolean} autoSave - 是否自动保存
   */
  async setMultiple(newSettings, autoSave = true) {
    const changes = [];
    
    for (const [key, value] of Object.entries(newSettings)) {
      const transformedValue = this.transform(key, value);
      
      if (!this.validate(key, transformedValue)) {
        throw new Error(`Invalid value for setting '${key}': ${value}`);
      }

      const oldValue = this.settings[key];
      this.settings[key] = transformedValue;
      changes.push({ key, oldValue, newValue: transformedValue });
    }

    changes.forEach(change => this.notifyListeners('changed', change));

    if (autoSave) {
      await this.save();
    }

    return this;
  }

  /**
   * 重置设置到默认值
   */
  async reset() {
    const oldSettings = { ...this.settings };
    this.settings = { ...Config.DEFAULT_SETTINGS };
    this.ensureDefaults();
    
    this.notifyListeners('reset', { oldSettings, newSettings: this.settings });
    await this.save();
    return this;
  }

  /**
   * 确保默认值存在
   */
  ensureDefaults() {
    if (!this.settings.language) {
      this.settings.language = 'en';
    }
    if (!this.settings.coinNames) {
      this.settings.coinNames = {};
    }
    if (!this.settings.coinGeckoIds) {
      this.settings.coinGeckoIds = {};
    }
  }

  /**
   * 添加设置变更监听器
   * @param {Function} listener - 监听器函数
   */
  addListener(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知所有监听器
   * @param {string} event - 事件类型
   * @param {*} data - 事件数据
   */
  notifyListeners(event, data) {
    this.listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Settings listener error:', error);
      }
    });
  }

  /**
   * 获取所有设置的副本
   */
  getAll() {
    return { ...this.settings };
  }

  /**
   * 导出设置为JSON
   */
  export() {
    return JSON.stringify(this.settings, null, 2);
  }

  /**
   * 从JSON导入设置
   * @param {string} jsonString - JSON字符串
   */
  async import(jsonString) {
    try {
      const importedSettings = JSON.parse(jsonString);
      
      // 验证导入的设置
      for (const [key, value] of Object.entries(importedSettings)) {
        if (!this.validate(key, value)) {
          console.warn(`Skipping invalid setting '${key}': ${value}`);
          delete importedSettings[key];
        }
      }

      await this.setMultiple(importedSettings);
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }
}

export default SettingsManager;