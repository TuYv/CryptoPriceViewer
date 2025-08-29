/**
 * @file CryptoApp.js
 * @description 应用程序主类，协调各个组件的工作
 */

import ApiService from '../services/ApiService.js';
import SettingsManager from '../services/SettingsManager.js';
import UIManager from '../ui/UIManager.js';

/**
 * 加密货币应用类
 * 应用程序的主类，负责协调各个组件的工作
 */
class CryptoApp {
  /**
   * 自动刷新计时器
   * @type {number|null}
   * @private
   */
  static _refreshTimer = null;

  /**
   * 初始化应用程序
   */
  static async init() {
    // 初始化UI元素
    UIManager.initElements();
    
    // 加载设置
    await SettingsManager.loadSettings();
    
    // 更新UI以匹配设置
    UIManager.updateSettingsUI();
    
    // 初始加载数据
    await this.fetchCryptoData();
    
    // 设置事件监听器
    this.setupEventListeners();
    
    // 设置自动刷新
    this.setupAutoRefresh();
  }

  /**
   * 设置事件监听器
   */
  static setupEventListeners() {
    // 刷新按钮
    UIManager.refreshBtn.addEventListener('click', () => this.fetchCryptoData());
    
    // 设置按钮
    UIManager.settingsBtn.addEventListener('click', () => {
      UIManager.settingsPanel.classList.remove('hidden');
    });
    
    // 保存设置按钮
    UIManager.saveSettingsBtn.addEventListener('click', () => {
      // 获取选中的币种
      const selectedCoins = [];
      const checkboxes = document.querySelectorAll('.coin-options input[type="checkbox"]:checked');
      checkboxes.forEach(checkbox => {
        selectedCoins.push(checkbox.value);
      });
      
      // 更新设置
      SettingsManager.updateSettings({
        coins: selectedCoins,
        refreshInterval: parseInt(UIManager.refreshIntervalSelect.value),
        currency: UIManager.currencySelect.value
      });
      
      // 关闭设置面板
      UIManager.settingsPanel.classList.add('hidden');
      
      // 重新加载数据
      this.fetchCryptoData();
      
      // 重置自动刷新
      this.setupAutoRefresh();
    });
    
    // 取消设置按钮
    UIManager.cancelSettingsBtn.addEventListener('click', () => {
      // 恢复UI到当前设置
      UIManager.updateSettingsUI();
      
      // 关闭设置面板
      UIManager.settingsPanel.classList.add('hidden');
    });
  }

  /**
   * 设置自动刷新
   */
  static setupAutoRefresh() {
    // 清除现有计时器
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
    
    // 如果设置了自动刷新，则创建新计时器
    const interval = SettingsManager.currentSettings.refreshInterval;
    if (interval > 0) {
      this._refreshTimer = setInterval(() => this.fetchCryptoData(), interval * 1000);
    }
  }

  /**
   * 获取加密货币数据
   */
  static async fetchCryptoData() {
    // 显示加载状态
    UIManager.showLoading();
    
    try {
      // 获取数据
      const data = await ApiService.fetchCryptoData(
        SettingsManager.currentSettings.coins,
        SettingsManager.currentSettings.currency
      );
      
      // 更新UI
      UIManager.updateCryptoList(data);
      
      // 更新最后更新时间
      UIManager.updateLastUpdated();
    } catch (error) {
      // 显示错误信息
      UIManager.showError(error.message);
    }
  }
}

// 导出加密货币应用类
export default CryptoApp;