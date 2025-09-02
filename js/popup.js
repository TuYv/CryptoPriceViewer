// 导入配置
import { Config } from './config.js';
import { I18N } from './i18n.js';
import { notionService } from './services/NotionService.js';

/**
 * 加密货币价格查看器应用
 */
class CryptoApp {
  constructor() {
    // 应用状态
    this.cryptoData = [];
    this.settings = { ...Config.DEFAULT_SETTINGS };

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.showSettings = false;
    this.showFeedback = false;
    this.refreshTimer = null;

    // DOM元素
    this.elements = {
      cryptoList: document.getElementById('cryptoList'),
      loadingIndicator: document.getElementById('loadingIndicator'),
      errorMessage: document.getElementById('errorMessage'),
      noDataMessage: document.getElementById('noDataMessage'),
      refreshButton: document.getElementById('refreshButton'),
      settingsButton: document.getElementById('settingsButton'),
      settingsPanel: document.getElementById('settingsPanel'),
      feedbackButton: document.getElementById('feedbackButton'),
      feedbackPanel: document.getElementById('feedbackPanel'),
      feedbackText: document.getElementById('feedbackText'),
      sendFeedbackButton: document.getElementById('sendFeedbackButton'),
      cancelFeedbackButton: document.getElementById('cancelFeedbackButton'),

      refreshInterval: document.getElementById('refreshInterval'),
      currencySelect: document.getElementById('currencySelect'),
      languageSelect: document.getElementById('languageSelect'),
      saveSettingsButton: document.getElementById('saveSettingsButton'),
      cancelSettingsButton: document.getElementById('cancelSettingsButton'),
      lastUpdated: document.getElementById('lastUpdated'),
      imageModal: document.getElementById('imageModal'),
      modalImage: document.getElementById('modalImage'),
      imageModalClose: document.getElementById('imageModalClose')
    };

    // 初始化
    this.init();
  }

  /**
   * 初始化应用
   */
  async init() {
    await this.loadSettings();
    await this.loadNotionConfig();
    this.setupEventListeners();
  }

  /**
   * 加载 Notion 配置
   */
  async loadNotionConfig() {
    // Notion配置现在使用硬编码，无需从存储加载
  }

  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    this.elements.refreshButton.addEventListener('click', () => this.refreshData());
    this.elements.settingsButton.addEventListener('click', () => this.toggleSettings());
    this.elements.feedbackButton.addEventListener('click', () => this.toggleFeedback());
    this.elements.saveSettingsButton.addEventListener('click', () => this.saveSettings());
    this.elements.cancelSettingsButton.addEventListener('click', () => this.cancelSettings());
    this.elements.sendFeedbackButton.addEventListener('click', () => this.sendFeedback());
    this.elements.cancelFeedbackButton.addEventListener('click', () => this.cancelFeedback());
    this.elements.languageSelect.addEventListener('change', () => this.onLanguageChange());
    

    
    // 为二维码图片添加点击事件
    const qrImages = document.querySelectorAll('.qr-code-image');
    qrImages.forEach(img => {
        img.addEventListener('click', () => {
            this.showImageModal(img.src, img.alt);
        });
    });
    
    // 图片模态框事件监听器
    if (this.elements.imageModalClose) {
      this.elements.imageModalClose.addEventListener('click', () => this.closeImageModal());
    }
    if (this.elements.imageModal) {
      this.elements.imageModal.addEventListener('click', (e) => {
        if (e.target === this.elements.imageModal) {
          this.closeImageModal();
        }
      });
    }
  }

  /**
   * 加载保存的设置
   */
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem(Config.STORAGE_KEY);
      if (savedSettings) {
        this.settings = { ...Config.DEFAULT_SETTINGS, ...JSON.parse(savedSettings) };
      } else {
        this.settings = { ...Config.DEFAULT_SETTINGS };
        this.saveSettings();
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
      this.settings = { ...Config.DEFAULT_SETTINGS };
      this.saveSettings();
    }
    
    // 初始化语言设置
    if (!this.settings.language) {
      this.settings.language = I18N.DEFAULT_LANGUAGE;
    }
    
    // 初始化币种名称存储
    if (!this.settings.coinNames) {
      this.settings.coinNames = {};
    }
    
    // 初始化CoinGecko ID映射存储
    if (!this.settings.coinGeckoIds) {
      this.settings.coinGeckoIds = {};
    }
    
    // 更新UI以反映设置
    this.updateSettingsUI();
    
    // 初始化界面语言
    this.updateUILanguage();
    
    // 获取数据并设置自动刷新
    this.fetchCryptoData();
    this.setupAutoRefresh();
  }

  /**
   * 更新设置UI
   */
  updateSettingsUI() {
    // 更新刷新间隔选择
    this.elements.refreshInterval.value = this.settings.refreshInterval;
    
    // 更新货币选择
    this.elements.currencySelect.value = this.settings.currency;
    
    // 更新语言选择
    this.elements.languageSelect.value = this.settings.language || I18N.DEFAULT_LANGUAGE;
    

  }

  /**
   * 获取上次反馈发送时间
   * @returns {number|null} 时间戳或null
   */
  getLastFeedbackTime() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Chrome扩展环境 - 使用同步方式获取
        return localStorage.getItem('lastFeedbackTime') ? parseInt(localStorage.getItem('lastFeedbackTime')) : null;
      } else {
        // 普通网页环境
        const time = localStorage.getItem('lastFeedbackTime');
        return time ? parseInt(time) : null;
      }
    } catch (error) {
      console.error('获取反馈时间失败:', error);
      return null;
    }
  }

  /**
   * 设置上次反馈发送时间
   * @param {number} timestamp - 时间戳
   */
  setLastFeedbackTime(timestamp) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Chrome扩展环境
        localStorage.setItem('lastFeedbackTime', timestamp.toString());
        chrome.storage.local.set({ lastFeedbackTime: timestamp });
      } else {
        // 普通网页环境
        localStorage.setItem('lastFeedbackTime', timestamp.toString());
      }
    } catch (error) {
      console.error('保存反馈时间失败:', error);
    }
  }

  /**
   * 显示提示信息
   * @param {string} message - 提示信息
   * @param {string} type - 提示类型 (success, error, info)
   */
  showMessage(message, type = 'info') {
    // 查找或创建消息容器
    let messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
      messageContainer = document.createElement('div');
      messageContainer.id = 'message-container';
      messageContainer.style.cssText = `
        position: fixed;
        top: 10px;
        left: 10px;
        right: 10px;
        z-index: 10000;
        pointer-events: none;
      `;
      document.body.appendChild(messageContainer);
    }
    
    // 创建提示元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // 添加样式
    messageDiv.style.cssText = `
      padding: 8px 12px;
      margin-bottom: 5px;
      border-radius: 4px;
      color: white;
      font-size: 12px;
      word-wrap: break-word;
      pointer-events: auto;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    // 根据类型设置背景色
    switch(type) {
      case 'success':
        messageDiv.style.backgroundColor = '#4CAF50';
        break;
      case 'error':
        messageDiv.style.backgroundColor = '#f44336';
        break;
      default:
        messageDiv.style.backgroundColor = '#2196F3';
    }
    
    // 添加到容器
    messageContainer.appendChild(messageDiv);
    
    // 显示动画
    setTimeout(() => {
      messageDiv.style.opacity = '1';
    }, 10);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.style.opacity = '0';
        setTimeout(() => {
          if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
          }
        }, 300);
      }
    }, 3000);
  }





  /**
   * 删除币种
   */
  removeCoin(coinSymbol) {
    const index = this.settings.selectedCoins.indexOf(coinSymbol);
    if (index > -1) {
      this.settings.selectedCoins.splice(index, 1);
      
      // 保存设置
      try {
        localStorage.setItem(Config.STORAGE_KEY, JSON.stringify(this.settings));
      } catch (error) {
        console.warn('Failed to save settings to localStorage:', error);
      }
      
      // 更新UI
      this.updateSettingsUI();
      
      // 重新获取数据
      this.fetchCryptoData();
    }
  }

  /**
   * 语言切换事件处理
   */
  onLanguageChange() {
    const selectedLanguage = this.elements.languageSelect.value;
    this.settings.language = selectedLanguage;
    
    // 立即保存语言设置
    try {
      localStorage.setItem(Config.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save language setting:', error);
    }
    
    // 更新界面语言
    this.updateUILanguage();
  }

  /**
   * 更新界面语言
   */
  updateUILanguage() {
    const currentLang = this.settings.language || I18N.DEFAULT_LANGUAGE;
    
    // 更新页面标题
    document.title = I18N.t('appTitle', currentLang);
    
    // 更新主界面标题
    const appTitle = document.querySelector('h1[data-i18n="appTitle"]');
    if (appTitle) appTitle.textContent = I18N.t('appTitle', currentLang);
    
    // 更新加载状态文本
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) loadingIndicator.textContent = I18N.t('loading', currentLang);
    
    // 更新无数据提示文本
    const noDataMessage = document.getElementById('noDataMessage');
    if (noDataMessage) noDataMessage.textContent = I18N.t('noData', currentLang);
    
    // 更新主界面按钮文本
    const refreshBtn = document.getElementById('refreshButton');
    if (refreshBtn) refreshBtn.textContent = I18N.t('refresh', currentLang);
    
    const settingsBtn = document.getElementById('settingsButton');
    if (settingsBtn) settingsBtn.textContent = I18N.t('settings', currentLang);
    
    const feedbackBtn = document.getElementById('feedbackButton');
    if (feedbackBtn) feedbackBtn.textContent = I18N.t('feedback', currentLang);
    
    // 更新搜索界面文本
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.placeholder = I18N.t('searchPlaceholder', currentLang);
    
    // 更新打赏提示文本
    const donationTip = document.querySelector('.donation-tip[data-i18n="donationTip"]');
    if (donationTip) donationTip.textContent = I18N.t('donationTip', currentLang);
    
    const searchBtn = document.getElementById('searchButton');
    if (searchBtn) searchBtn.textContent = I18N.t('searchButton', currentLang);
    
    // 更新设置面板文本
    const settingsTitle = document.querySelector('#settingsPanel h2');
    if (settingsTitle) settingsTitle.textContent = I18N.t('settingsTitle', currentLang);
    
    // 更新反馈面板文本
    const feedbackTitle = document.querySelector('#feedbackPanel h2');
    if (feedbackTitle) feedbackTitle.textContent = I18N.t('feedbackTitle', currentLang);
    
    const feedbackText = document.getElementById('feedbackText');
    if (feedbackText) feedbackText.placeholder = I18N.t('feedbackPlaceholder', currentLang);
    
    const sendFeedbackButton = document.getElementById('sendFeedbackButton');
    if (sendFeedbackButton) sendFeedbackButton.textContent = I18N.t('sendFeedback', currentLang);
    
    const cancelFeedbackButton = document.getElementById('cancelFeedbackButton');
    if (cancelFeedbackButton) cancelFeedbackButton.textContent = I18N.t('cancel', currentLang);
    
    const refreshIntervalTitle = document.querySelector('h3[data-i18n="refreshInterval"]');
    if (refreshIntervalTitle) refreshIntervalTitle.textContent = I18N.t('refreshInterval', currentLang);
    
    const currencyTitle = document.querySelector('h3[data-i18n="currency"]');
    if (currencyTitle) currencyTitle.textContent = I18N.t('currency', currentLang);
    
    const languageTitle = document.querySelector('h3[data-i18n="language"]');
    if (languageTitle) languageTitle.textContent = I18N.t('language', currentLang);
    

    
    const saveBtn = document.getElementById('saveSettingsButton');
    if (saveBtn) saveBtn.textContent = I18N.t('save', currentLang);
    
    const cancelBtn = document.getElementById('cancelSettingsButton');
    if (cancelBtn) cancelBtn.textContent = I18N.t('cancel', currentLang);
    
    // 更新刷新间隔选项
    this.updateRefreshIntervalOptions(currentLang);
    
    // 更新货币选项
    this.updateCurrencyOptions(currentLang);
    
    // 更新footer文本
    const dataSourceElement = document.querySelector('[data-i18n="dataSource"]');
    if (dataSourceElement) dataSourceElement.textContent = I18N.t('dataSource', currentLang);
    
    const lastUpdatedLabel = document.querySelector('[data-i18n="lastUpdated"]');
    if (lastUpdatedLabel) lastUpdatedLabel.textContent = I18N.t('lastUpdated', currentLang);
    
    // 重新渲染数据以更新币种名称
    this.renderCryptoData();
  }

  /**
   * 更新刷新间隔选项文本
   */
  updateRefreshIntervalOptions(lang) {
    const refreshInterval = document.getElementById('refreshInterval');
    if (refreshInterval) {
      const options = refreshInterval.querySelectorAll('option');
      options.forEach(option => {
        switch(option.value) {
          case '0':
            option.textContent = I18N.t('refreshOff', lang);
            break;
          case '30':
            option.textContent = I18N.t('interval30s', lang);
            break;
          case '60':
            option.textContent = I18N.t('interval1m', lang);
            break;
          case '300':
            option.textContent = I18N.t('interval5m', lang);
            break;
          case '600':
            option.textContent = I18N.t('interval10m', lang);
            break;
        }
      });
    }
  }

  /**
   * 更新货币选项文本
   */
  updateCurrencyOptions(lang) {
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
      const options = currencySelect.querySelectorAll('option');
      options.forEach(option => {
        switch(option.value) {
          case 'USD':
            option.textContent = I18N.t('currencyUSD', lang);
            break;
          case 'CNY':
            option.textContent = I18N.t('currencyCNY', lang);
            break;
          case 'EUR':
            option.textContent = I18N.t('currencyEUR', lang);
            break;
          case 'JPY':
            option.textContent = I18N.t('currencyJPY', lang);
            break;
          case 'KRW':
            option.textContent = I18N.t('currencyKRW', lang);
            break;
        }
      });
    }
  }

  /**
   * 保存设置
   */
  saveSettings() {
    // 获取刷新间隔
    this.settings.refreshInterval = this.elements.refreshInterval.value;
    
    // 获取货币
    this.settings.currency = this.elements.currencySelect.value;
    
    // 获取语言设置
    this.settings.language = this.elements.languageSelect.value;
    
    // 保存到存储（保持现有的selectedCoins不变）
    try {
      localStorage.setItem(Config.STORAGE_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error);
    }
    
    // 重新获取数据并设置自动刷新
    this.fetchCryptoData();
    this.setupAutoRefresh();
    
    // 隐藏设置面板
    this.toggleSettings(false);
  }

  /**
   * 保存Notion配置
   */
  async saveNotionConfig() {
    const notionToken = this.elements.notionToken.value.trim();
    const notionDatabaseId = this.elements.notionDatabaseId.value.trim();
    
    try {
      // 检查是否在Chrome扩展环境中
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await new Promise(resolve => {
          chrome.storage.local.set({
            notionToken: notionToken,
            notionDatabaseId: notionDatabaseId
          }, resolve);
        });
      } else {
        // 在普通网页环境中使用localStorage
        if (notionToken) {
          localStorage.setItem('notionToken', notionToken);
        } else {
          localStorage.removeItem('notionToken');
        }
        
        if (notionDatabaseId) {
          localStorage.setItem('notionDatabaseId', notionDatabaseId);
        } else {
          localStorage.removeItem('notionDatabaseId');
        }
      }
      
      // 更新NotionService配置
      if (notionToken && notionDatabaseId) {
        notionService.setConfig(notionToken, notionDatabaseId);
        this.showMessage('Notion 配置已保存', 'success');
      } else if (!notionToken && !notionDatabaseId) {
        this.showMessage('Notion 配置已清除', 'info');
      } else {
        this.showMessage('请填写完整的 Notion 配置信息', 'warning');
      }
    } catch (error) {
      console.error('保存 Notion 配置失败:', error);
      this.showMessage('保存 Notion 配置失败', 'error');
    }
  }

  /**
   * 取消设置更改
   */
  cancelSettings() {
    this.updateSettingsUI();
    this.toggleSettings(false);
  }

  /**
   * 切换设置面板显示
   * @param {boolean} [show] - 是否显示设置面板
   */
  toggleSettings(show) {
    if (show === undefined) {
      this.showSettings = !this.showSettings;
    } else {
      this.showSettings = show;
    }
    
    if (this.showSettings) {
      this.elements.settingsPanel.classList.remove('hidden');
      this.elements.feedbackPanel.classList.add('hidden');
      // 隐藏主页面滚动条
      document.body.style.overflow = 'hidden';
    } else {
      this.elements.settingsPanel.classList.add('hidden');
      // 恢复主页面滚动条
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * 切换反馈面板显示状态
   * @param {boolean} show - 是否显示
   */
  toggleFeedback(show) {
    if (show === undefined) {
      this.showFeedback = !this.showFeedback;
    } else {
      this.showFeedback = show;
    }

    if (this.showFeedback) {
      this.elements.feedbackPanel.classList.remove('hidden');
      this.elements.settingsPanel.classList.add('hidden');
      this.elements.feedbackText.focus();
      // 隐藏主页面滚动条
      document.body.style.overflow = 'hidden';
    } else {
      this.elements.feedbackPanel.classList.add('hidden');
      // 恢复主页面滚动条
      document.body.style.overflow = 'auto';
    }
  }

  /**
   * 发送反馈
   */
  async sendFeedback() {
    // 检查发送频率限制（每分钟只能发送一条）
    const now = Date.now();
    const lastSendTime = this.getLastFeedbackTime();
    const oneMinute = 60 * 1000; // 1分钟 = 60000毫秒
    
    if (lastSendTime && (now - lastSendTime) < oneMinute) {
      const remainingTime = Math.ceil((oneMinute - (now - lastSendTime)) / 1000);
      this.showMessage(`发送过于频繁，请等待 ${remainingTime} 秒后再试`, 'error');
      return;
    }
    
    const feedbackText = this.elements.feedbackText.value.trim();
    const currentLang = this.settings.language || 'zh';
    
    if (!feedbackText) {
      this.showMessage(I18N.t('feedbackEmpty', currentLang), 'error');
      return;
    }

    try {
      // 创建反馈对象
      const feedback = {
        id: Date.now(),
        content: feedbackText,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        version: chrome.runtime.getManifest().version
      };

      // 发送到 Notion
      if (notionService.isConfigured()) {
        try {
          const result = await notionService.createFeedbackPage(feedback);
          if (result) {
            // 记录发送时间
            this.setLastFeedbackTime(now);
            this.showMessage(`反馈已成功发送！反馈ID: ${feedback.id}`, 'success');
          } else {
            this.showMessage('发送失败，请稍后重试。', 'error');
          }
        } catch (error) {
          console.error('发送到 Notion 失败:', error);
          const errorMessage = error.message || error.toString() || '未知错误';
          console.error('详细错误信息:', errorMessage);
          this.showMessage('发送失败: ' + errorMessage, 'error');
        }
      } else {
        this.showMessage('请先配置 Notion 集成后再发送反馈。', 'error');
      }
      
      // 清空输入框并关闭面板
      this.elements.feedbackText.value = '';
      this.toggleFeedback(false);
      
    } catch (error) {
      console.error('发送反馈失败:', error);
      this.showMessage('发送反馈失败，请稍后重试', 'error');
    }
  }

  /**
   * 取消反馈
   */
  cancelFeedback() {
    this.elements.feedbackText.value = '';
    this.toggleFeedback(false);
  }



  /**
   * 设置自动刷新
   */
  setupAutoRefresh() {
    this.clearRefreshTimer();
    
    const interval = parseInt(this.settings.refreshInterval);
    if (interval > 0) {
      this.refreshTimer = setInterval(() => {
        this.fetchCryptoData();
      }, interval * 1000);
    }
  }

  /**
   * 清除刷新计时器
   */
  clearRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * 手动刷新数据
   */
  refreshData() {
    this.fetchCryptoData();
  }

  /**
   * 获取加密货币数据
   */
  async fetchCryptoData() {
    this.isLoading = true;
    this.hasError = false;
    
    // 更新UI状态
    this.elements.loadingIndicator.style.display = 'block';
    this.elements.errorMessage.style.display = 'none';
    this.elements.noDataMessage.style.display = 'none';
    
    try {
      // 构建API URL - 使用coins/markets获取包含图像的完整数据
      const ids = this.settings.selectedCoins.map(coin => {
        const id = this.getCoinGeckoId(coin);
        return id;
      }).join(',');
      const url = `${Config.API_BASE_URL}/coins/markets?vs_currency=${this.settings.currency.toLowerCase()}&ids=${ids}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`;
      
      // 获取数据
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      // 处理数据 - 新的API返回数组格式
      this.cryptoData = this.settings.selectedCoins.map(coin => {
        const geckoId = this.getCoinGeckoId(coin);
        const coinData = data.find(item => item.id === geckoId);
        console.log(`[DEBUG] 处理币种 ${coin} (ID: ${geckoId}):`, coinData);
        
        if (coinData) {
          const result = {
            id: coin,
            name: coinData.name || this.getCoinName(coin),
            symbol: coin,
            price: coinData.current_price,
            change24h: coinData.price_change_percentage_24h,
            image: coinData.image // 添加图像URL
          };
          console.log(`[DEBUG] 币种 ${coin} 处理结果:`, result);
          return result;
        }
        console.warn(`[DEBUG] 未找到币种数据: ${coin} (${geckoId})`);
        return null;
      }).filter(item => item !== null);
      
      console.log(`[DEBUG] 最终处理的币种数据:`, this.cryptoData);
      
      // 更新UI
      this.renderCryptoData();
      
      // 更新最后更新时间
      this.updateLastUpdated();
    } catch (error) {
      console.error('[DEBUG] fetchCryptoData 错误:', error);
      this.hasError = true;
      this.errorMessage = '获取数据失败，请稍后再试';
      
      // 显示错误信息
      this.elements.errorMessage.textContent = this.errorMessage;
      this.elements.errorMessage.style.display = 'block';
    } finally {
      this.isLoading = false;
      this.elements.loadingIndicator.style.display = 'none';
      
      // 如果没有数据，显示无数据消息
      if (!this.hasError && this.cryptoData.length === 0) {
        this.elements.noDataMessage.style.display = 'block';
      }
    }
  }

  /**
   * 渲染加密货币数据
   */
  renderCryptoData() {
    // 清除现有数据
    const existingContainer = this.elements.cryptoList.querySelector('.crypto-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // 如果没有数据，直接返回
    if (!this.cryptoData || this.cryptoData.length === 0) {
      return;
    }
    
    // 创建统一的容器
    const cryptoContainer = document.createElement('div');
    cryptoContainer.className = 'crypto-container';
    
    // 添加新数据
    this.cryptoData.forEach(crypto => {
      const cryptoItem = document.createElement('div');
      cryptoItem.className = 'crypto-item';
      
      // 创建左侧信息容器
      const cryptoInfo = document.createElement('div');
      cryptoInfo.className = 'crypto-info';
      
      // 创建图标
      const cryptoIcon = document.createElement('div');
      cryptoIcon.className = 'crypto-icon';
      
      if (crypto.image) {
        // 使用真实的币种图标
        const iconImg = document.createElement('img');
        iconImg.src = crypto.image;
        iconImg.alt = crypto.name;
        iconImg.style.width = '100%';
        iconImg.style.height = '100%';
        iconImg.style.borderRadius = '50%';
        iconImg.style.cursor = 'pointer';
        iconImg.onerror = function() {
          // 如果图片加载失败，回退到文字图标
          this.style.display = 'none';
          cryptoIcon.textContent = crypto.symbol.substring(0, 2).toUpperCase();
        };
        // 添加点击事件以显示放大图片
        iconImg.addEventListener('click', () => {
          this.showImageModal(crypto.image, crypto.name);
        });
        cryptoIcon.appendChild(iconImg);
      } else {
        // 回退到文字图标
        cryptoIcon.textContent = crypto.symbol.substring(0, 2).toUpperCase();
      }
      
      // 创建名称容器
      const nameContainer = document.createElement('div');
      
      const nameElement = document.createElement('div');
      nameElement.className = 'crypto-name';
      nameElement.textContent = crypto.name;
      
      const symbolElement = document.createElement('div');
      symbolElement.className = 'crypto-symbol';
      symbolElement.textContent = crypto.symbol;
      
      nameContainer.appendChild(nameElement);
      nameContainer.appendChild(symbolElement);
      
      cryptoInfo.appendChild(cryptoIcon);
      cryptoInfo.appendChild(nameContainer);
      
      // 创建右侧价格容器
      const priceContainer = document.createElement('div');
      priceContainer.className = 'crypto-price';
      
      const priceElement = document.createElement('div');
      priceElement.className = `price ${this.getChangeClass(crypto.change24h)}`;
      priceElement.textContent = this.formatPrice(crypto.price);
      
      const changeElement = document.createElement('div');
      changeElement.className = `price-change ${this.getChangeClass(crypto.change24h)}`;
      changeElement.textContent = this.formatChange(crypto.change24h);
      
      priceContainer.appendChild(priceElement);
      priceContainer.appendChild(changeElement);
      
      // 创建删除按钮
      const deleteButton = document.createElement('button');
      deleteButton.className = 'crypto-delete-btn';
      deleteButton.innerHTML = '×';
      deleteButton.title = '删除币种';
      deleteButton.setAttribute('data-symbol', crypto.symbol);
      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeCoin(crypto.symbol);
      });
      
      cryptoItem.appendChild(cryptoInfo);
      cryptoItem.appendChild(priceContainer);
      cryptoItem.appendChild(deleteButton);
      
      cryptoContainer.appendChild(cryptoItem);
    });
    
    this.elements.cryptoList.appendChild(cryptoContainer);
  }

  /**
   * 获取币种对应的CoinGecko ID
   * @param {string} coin - 币种代码
   * @returns {string} CoinGecko ID
   */
  getCoinGeckoId(coin) {
    // 优先从localStorage中的动态映射读取
    if (this.settings.coinGeckoIds && this.settings.coinGeckoIds[coin]) {
      const result = this.settings.coinGeckoIds[coin];
      console.log(`[DEBUG] getCoinGeckoId (动态映射): ${coin} -> ${result}`);
      return result;
    }
    
    // 回退到config.js中的静态映射
    const result = Config.COIN_GECKO_IDS[coin] || coin.toLowerCase();
    console.log(`[DEBUG] getCoinGeckoId (静态映射): ${coin} -> ${result}`);
    return result;
  }

  /**
   * 获取币种名称（支持多语言）
   * @param {string} coin - 币种代码
   * @returns {string} 币种名称
   */
  getCoinName(coin) {
    const currentLang = this.settings.language || I18N.DEFAULT_LANGUAGE;
    
    // 尝试获取CoinGecko ID对应的翻译
    const coinGeckoId = this.getCoinGeckoId(coin);
    const translatedName = I18N.t(coinGeckoId, currentLang);
    
    // 如果翻译存在且不等于key本身，返回翻译
    if (translatedName && translatedName !== coinGeckoId) {
      return translatedName;
    }
    
    // 如果没有翻译，返回币种代码本身
    return coin;
  }

  /**
   * 格式化价格显示
   * @param {number} price - 价格
   * @returns {string} 格式化后的价格
   */
  formatPrice(price) {
    const symbol = Config.CURRENCY_SYMBOLS[this.settings.currency] || '';
    
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
  toSubscript(num) {
    const subscriptMap = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
    };
    return num.toString().split('').map(digit => subscriptMap[digit] || digit).join('');
  }

  /**
   * 格式化价格变化显示
   * @param {number} change - 价格变化百分比
   * @returns {string} 格式化后的价格变化
   */
  formatChange(change) {
    if (change === undefined) return 'N/A';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  /**
   * 获取价格变化的CSS类
   * @param {number} change - 价格变化百分比
   * @returns {string} CSS类名
   */
  getChangeClass(change) {
    if (change === undefined) return '';
    return change >= 0 ? 'positive' : 'negative';
  }

  /**
   * 更新最后更新时间
   */
  updateLastUpdated() {
    const now = new Date();
    this.elements.lastUpdated.textContent = now.toLocaleTimeString();
  }

  /**
    * 显示图片模态框
    * @param {string} imageSrc - 图片源地址
    * @param {string} altText - 图片替代文本
    */
   showImageModal(imageSrc, altText) {
     if (this.elements.imageModal && this.elements.modalImage) {
       this.elements.modalImage.src = imageSrc;
       this.elements.modalImage.alt = altText;
       this.elements.imageModal.classList.add('show');
       document.body.style.overflow = 'hidden'; // 防止背景滚动
     }
   }
 
   /**
    * 关闭图片模态框
    */
   closeImageModal() {
     if (this.elements.imageModal) {
       this.elements.imageModal.classList.remove('show');
       document.body.style.overflow = ''; // 恢复滚动
     }
   }
}

// 搜索防抖定时器
let searchDebounceTimer = null;
let lastSearchTime = 0;
const SEARCH_DEBOUNCE_DELAY = 500; // 500ms防抖
const RATE_LIMIT_DELAY = 1000; // 1秒速率限制

// 搜索币种
async function searchCoins() {
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');
  const resultList = document.getElementById('resultList');
  const query = searchInput.value.trim();
  
  if (!query) {
    searchResults.classList.add('hidden');
    resultList.classList.add('hidden');
    return;
  }
  
  // 清除之前的防抖定时器
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer);
  }
  
  // 防抖处理
  searchDebounceTimer = setTimeout(async () => {
    // 速率限制检查
    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchTime;
    
    if (timeSinceLastSearch < RATE_LIMIT_DELAY) {
      const waitTime = RATE_LIMIT_DELAY - timeSinceLastSearch;
      setTimeout(() => performSearch(query), waitTime);
      return;
    }
    
    await performSearch(query);
  }, SEARCH_DEBOUNCE_DELAY);
}

// 执行搜索
async function performSearch(query) {
  const searchResults = document.getElementById('searchResults');
  const resultList = document.getElementById('resultList');
  const currentLang = window.cryptoApp ? window.cryptoApp.settings.language : I18N.DEFAULT_LANGUAGE;
  
  // 显示加载状态
  searchResults.innerHTML = `<div class="search-loading">${I18N.t('searchLoading', currentLang)}</div>`;
  searchResults.classList.remove('hidden');
  resultList.classList.remove('hidden');
  
  try {
    lastSearchTime = Date.now();
    const response = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`);
    
    if (response.status === 429) {
      // 处理速率限制错误
      searchResults.innerHTML = `<div class="search-error">${I18N.t('searchRateLimit', currentLang)}</div>`;
      return;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    displaySearchResults(data.coins || []);
  } catch (error) {
    console.error('搜索失败:', error);
    if (error.message.includes('429')) {
      searchResults.innerHTML = `<div class="search-error">${I18N.t('searchRateLimit', currentLang)}</div>`;
    } else {
      searchResults.innerHTML = `<div class="search-empty">${I18N.t('searchError', currentLang)}</div>`;
    }
  }
}

// 显示搜索结果
function displaySearchResults(coins) {
  const searchResults = document.getElementById('searchResults');
  
  // 获取当前语言
  const currentLang = window.cryptoApp ? window.cryptoApp.settings.language : I18N.DEFAULT_LANGUAGE;
  
  if (coins.length === 0) {
    searchResults.innerHTML = `<div class="search-empty">${I18N.t('noSearchResults', currentLang)}</div>`;
    return;
  }
  
  // 获取当前已添加的币种
  const currentCoins = getSelectedCoinsSync();
  
  searchResults.innerHTML = '';
  
  coins.slice(0, 10).forEach(coin => {
    const isAdded = currentCoins.includes(coin.symbol.toUpperCase());
    
    const resultItem = document.createElement('div');
    resultItem.className = 'search-result-item';
    
    // 创建图标
    const resultIcon = document.createElement('div');
    resultIcon.className = 'search-result-icon';
    
    if (coin.thumb || coin.small || coin.large) {
      // 使用真实的币种图标
      const iconImg = document.createElement('img');
      iconImg.src = coin.thumb || coin.small || coin.large;
      iconImg.alt = coin.name;
      iconImg.style.width = '32px';
      iconImg.style.height = '32px';
      iconImg.style.borderRadius = '50%';
      iconImg.onerror = function() {
        // 如果图片加载失败，回退到文字图标
        this.style.display = 'none';
        resultIcon.textContent = coin.symbol.substring(0, 2).toUpperCase();
        resultIcon.style.display = 'flex';
        resultIcon.style.alignItems = 'center';
        resultIcon.style.justifyContent = 'center';
        resultIcon.style.backgroundColor = '#4a5568';
        resultIcon.style.color = 'white';
        resultIcon.style.fontSize = '12px';
        resultIcon.style.fontWeight = 'bold';
      };
      resultIcon.appendChild(iconImg);
    } else {
      // 回退到文字图标
      resultIcon.textContent = coin.symbol.substring(0, 2).toUpperCase();
      resultIcon.style.display = 'flex';
      resultIcon.style.alignItems = 'center';
      resultIcon.style.justifyContent = 'center';
      resultIcon.style.backgroundColor = '#4a5568';
      resultIcon.style.color = 'white';
      resultIcon.style.fontSize = '12px';
      resultIcon.style.fontWeight = 'bold';
    }
    
    const resultInfo = document.createElement('div');
    resultInfo.className = 'search-result-info';
    
    const resultName = document.createElement('div');
    resultName.className = 'search-result-name';
    resultName.textContent = coin.name;
    
    const resultSymbol = document.createElement('div');
    resultSymbol.className = 'search-result-symbol';
    resultSymbol.textContent = coin.symbol;
    
    resultInfo.appendChild(resultName);
    resultInfo.appendChild(resultSymbol);
    
    const addButton = document.createElement('button');
    addButton.className = 'add-coin-button';
    addButton.textContent = isAdded ? I18N.t('added', currentLang) : I18N.t('add', currentLang);
    addButton.disabled = isAdded;
    
    if (!isAdded) {
      addButton.addEventListener('click', () => {
        addCoin(coin.id, coin.name, coin.symbol);
      });
    }
    
    resultItem.appendChild(resultIcon);
    resultItem.appendChild(resultInfo);
    resultItem.appendChild(addButton);
    searchResults.appendChild(resultItem);
  });
}

// 添加币种
function addCoin(coinId, coinName, coinSymbol) {
  try {
    console.log(`[DEBUG] 开始添加币种: ID=${coinId}, Name=${coinName}, Symbol=${coinSymbol}`);
    
    // 获取当前设置
    const savedSettings = localStorage.getItem(Config.STORAGE_KEY);
    const settings = savedSettings ? JSON.parse(savedSettings) : Config.DEFAULT_SETTINGS;
    console.log(`[DEBUG] 当前设置:`, settings);
    console.log(`[DEBUG] 当前已选币种:`, settings.selectedCoins);
    
    // 检查是否已存在
    const upperSymbol = coinSymbol.toUpperCase();
    console.log(`[DEBUG] 检查币种是否已存在: ${upperSymbol}`);
    if (settings.selectedCoins.includes(upperSymbol)) {
      console.log(`[DEBUG] 币种 ${upperSymbol} 已存在，跳过添加`);
      return;
    }
    
    // 添加新币种（使用symbol而不是id，因为现有系统使用symbol）
    settings.selectedCoins.push(upperSymbol);
    console.log(`[DEBUG] 添加币种到数组: ${upperSymbol}`);
    console.log(`[DEBUG] 更新后的币种数组:`, settings.selectedCoins);
    
    // 保存币种名称信息
    if (!settings.coinNames) {
      settings.coinNames = {};
    }
    settings.coinNames[upperSymbol] = coinName;
    console.log(`[DEBUG] 保存币种名称: ${upperSymbol} -> ${coinName}`);
    
    // 动态保存CoinGecko ID映射
    if (!settings.coinGeckoIds) {
      settings.coinGeckoIds = {};
    }
    settings.coinGeckoIds[upperSymbol] = coinId;
    console.log(`[DEBUG] 保存CoinGecko ID映射: ${upperSymbol} -> ${coinId}`);
    
    // 保存设置
    localStorage.setItem(Config.STORAGE_KEY, JSON.stringify(settings));
    console.log(`[DEBUG] 设置已保存到localStorage`);
    console.log(`已添加币种: ${coinName} (${coinSymbol})`);
    
    // 重新初始化应用以刷新数据
    if (window.cryptoApp) {
      console.log(`[DEBUG] 更新应用设置并刷新数据`);
      window.cryptoApp.settings.selectedCoins = settings.selectedCoins;
      console.log(`[DEBUG] 应用中的币种列表:`, window.cryptoApp.settings.selectedCoins);
      window.cryptoApp.fetchCryptoData();
    } else {
      console.log(`[DEBUG] window.cryptoApp 不存在`);
    }
    
    // 更新搜索结果中的按钮状态
    const searchResults = document.getElementById('searchResults');
    const resultList = document.getElementById('resultList');
    const buttons = searchResults.querySelectorAll('.add-coin-button');
    const currentLang = window.cryptoApp ? window.cryptoApp.settings.language : I18N.DEFAULT_LANGUAGE;
    buttons.forEach(button => {
      if (button.onclick && button.onclick.toString().includes(coinId)) {
        button.disabled = true;
        button.textContent = I18N.t('added', currentLang);
      }
    });
    
    // 清空搜索框
    document.getElementById('searchInput').value = '';
    searchResults.classList.add('hidden');
    resultList.classList.add('hidden');
  } catch (error) {
    console.error('添加币种失败:', error);
  }
}

// 同步获取选中的币种（用于搜索功能）
function getSelectedCoinsSync() {
  try {
    const savedSettings = localStorage.getItem(Config.STORAGE_KEY);
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      return settings.selectedCoins || ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
    }
  } catch (error) {
    console.warn('Failed to load settings:', error);
  }
  return ['BTC', 'ETH', 'BNB', 'SOL', 'XRP'];
}

// 当DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
  const app = new CryptoApp();
  window.cryptoApp = app; // 保存到全局变量以便搜索功能使用
  
  // 搜索功能事件
  const searchButton = document.getElementById('searchButton');
  const searchInput = document.getElementById('searchInput');
  
  if (searchButton) {
    searchButton.addEventListener('click', searchCoins);
  }
  
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchCoins();
      }
    });
  }
});