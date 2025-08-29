/**
 * @file SettingsManager.js
 * @description 管理应用程序设置的存储和检索
 */

import { Config } from '../config.js';

/**
 * 设置管理器类
 * 负责处理应用程序设置的存储和检索
 * 支持Chrome扩展环境和普通网页环境的降级处理
 */
class SettingsManager {
  /**
   * 当前设置
   * @type {Object}
   * @private
   */
  static _currentSettings = {};

  /**
   * 存储类型标识
   * @type {string}
   * @private
   */
  static _storageType = null;

  /**
   * 获取当前设置
   * @returns {Object} 当前设置对象
   */
  static get currentSettings() {
    return this._currentSettings;
  }

  /**
   * 检测可用的存储方式
   * @returns {string} 存储类型: 'chrome-sync', 'chrome-local', 'localStorage'
   * @private
   */
  static _detectStorageType() {
    if (this._storageType) {
      return this._storageType;
    }

    try {
      // 检查是否在Chrome扩展环境中
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // 优先使用sync存储
        if (chrome.storage.sync) {
          this._storageType = 'chrome-sync';
        } else if (chrome.storage.local) {
          this._storageType = 'chrome-local';
        }
      }
    } catch (error) {
      console.warn('Chrome storage not available:', error);
    }

    // 降级到localStorage
    if (!this._storageType) {
      try {
        // 测试localStorage是否可用
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        this._storageType = 'localStorage';
      } catch (error) {
        console.error('No storage available:', error);
        this._storageType = 'none';
      }
    }

    return this._storageType;
  }

  /**
   * 加载设置
   * @returns {Promise<Object>} 设置对象
   */
  static async loadSettings() {
    const storageType = this._detectStorageType();

    try {
      switch (storageType) {
        case 'chrome-sync':
          return await this._loadFromChromeSync();
        case 'chrome-local':
          return await this._loadFromChromeLocal();
        case 'localStorage':
          return this._loadFromLocalStorage();
        default:
          console.warn('No storage available, using default settings');
          this._currentSettings = { ...Config.DEFAULT_SETTINGS };
          return this._currentSettings;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      // 降级处理
      return this._handleLoadError(storageType);
    }
  }

  /**
   * 从Chrome sync存储加载设置
   * @returns {Promise<Object>} 设置对象
   * @private
   */
  static async _loadFromChromeSync() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(Config.STORAGE_KEY, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (result[Config.STORAGE_KEY]) {
          this._currentSettings = { ...Config.DEFAULT_SETTINGS, ...result[Config.STORAGE_KEY] };
        } else {
          this._currentSettings = { ...Config.DEFAULT_SETTINGS };
          this.saveSettings(); // 保存默认设置
        }
        resolve(this._currentSettings);
      });
    });
  }

  /**
   * 从Chrome local存储加载设置
   * @returns {Promise<Object>} 设置对象
   * @private
   */
  static async _loadFromChromeLocal() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(Config.STORAGE_KEY, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        if (result[Config.STORAGE_KEY]) {
          this._currentSettings = { ...Config.DEFAULT_SETTINGS, ...result[Config.STORAGE_KEY] };
        } else {
          this._currentSettings = { ...Config.DEFAULT_SETTINGS };
          this.saveSettings();
        }
        resolve(this._currentSettings);
      });
    });
  }

  /**
   * 从localStorage加载设置
   * @returns {Object} 设置对象
   * @private
   */
  static _loadFromLocalStorage() {
    try {
      const savedSettings = localStorage.getItem(Config.STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        this._currentSettings = { ...Config.DEFAULT_SETTINGS, ...parsed };
      } else {
        this._currentSettings = { ...Config.DEFAULT_SETTINGS };
        this.saveSettings();
      }
    } catch (error) {
      console.error('Failed to parse settings from localStorage:', error);
      this._currentSettings = { ...Config.DEFAULT_SETTINGS };
    }
    return this._currentSettings;
  }

  /**
   * 处理加载错误的降级逻辑
   * @param {string} failedStorageType - 失败的存储类型
   * @returns {Promise<Object>} 设置对象
   * @private
   */
  static async _handleLoadError(failedStorageType) {
    console.warn(`Failed to load from ${failedStorageType}, trying fallback...`);

    // 尝试降级到localStorage
    if (failedStorageType !== 'localStorage') {
      try {
        this._storageType = 'localStorage';
        return this._loadFromLocalStorage();
      } catch (error) {
        console.error('Fallback to localStorage also failed:', error);
      }
    }

    // 最终降级：使用默认设置
    console.warn('Using default settings as final fallback');
    this._currentSettings = { ...Config.DEFAULT_SETTINGS };
    return this._currentSettings;
  }

  /**
   * 保存设置
   * @returns {Promise<void>}
   */
  static async saveSettings() {
    const storageType = this._detectStorageType();

    try {
      switch (storageType) {
        case 'chrome-sync':
          return await this._saveToChromeSync();
        case 'chrome-local':
          return await this._saveToChromeLocal();
        case 'localStorage':
          return this._saveToLocalStorage();
        default:
          console.warn('No storage available, settings not saved');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      // 尝试降级保存
      await this._handleSaveError(storageType);
    }
  }

  /**
   * 保存到Chrome sync存储
   * @returns {Promise<void>}
   * @private
   */
  static async _saveToChromeSync() {
    return new Promise((resolve, reject) => {
      const data = {};
      data[Config.STORAGE_KEY] = this._currentSettings;
      
      chrome.storage.sync.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    });
  }

  /**
   * 保存到Chrome local存储
   * @returns {Promise<void>}
   * @private
   */
  static async _saveToChromeLocal() {
    return new Promise((resolve, reject) => {
      const data = {};
      data[Config.STORAGE_KEY] = this._currentSettings;
      
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    });
  }

  /**
   * 保存到localStorage
   * @private
   */
  static _saveToLocalStorage() {
    try {
      localStorage.setItem(Config.STORAGE_KEY, JSON.stringify(this._currentSettings));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw error;
    }
  }

  /**
   * 处理保存错误的降级逻辑
   * @param {string} failedStorageType - 失败的存储类型
   * @returns {Promise<void>}
   * @private
   */
  static async _handleSaveError(failedStorageType) {
    console.warn(`Failed to save to ${failedStorageType}, trying fallback...`);

    // 尝试降级到localStorage
    if (failedStorageType !== 'localStorage') {
      try {
        this._storageType = 'localStorage';
        this._saveToLocalStorage();
        console.log('Successfully saved to localStorage as fallback');
      } catch (error) {
        console.error('Fallback save to localStorage also failed:', error);
      }
    }
  }

  /**
   * 更新设置
   * @param {Object} newSettings - 新的设置对象
   * @returns {Promise<void>}
   */
  static async updateSettings(newSettings) {
    this._currentSettings = { ...this._currentSettings, ...newSettings };
    await this.saveSettings();
  }

  /**
   * 重置设置为默认值
   * @returns {Promise<void>}
   */
  static async resetSettings() {
    this._currentSettings = { ...Config.DEFAULT_SETTINGS };
    await this.saveSettings();
  }

  /**
   * 获取存储类型信息（用于调试）
   * @returns {string} 当前使用的存储类型
   */
  static getStorageType() {
    return this._detectStorageType();
  }
}

// 导出设置管理器类
export default SettingsManager;