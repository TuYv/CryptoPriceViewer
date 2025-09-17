// 导入配置
import { Config } from './config.js';
import { I18N } from './i18n.js';
import { notionService } from './services/NotionService.js';
import { coinDetailService } from './services/CoinDetailService.js';
import { http } from './lib/http.js';
import { storage } from './lib/storage.js';
import { PriceChart } from './lib/chart.js';

/**
 * 加密货币价格查看器应用
 */
class CryptoApp {
  constructor() {
    // 应用状态
    this.cryptoData = [];
    this.settings = { ...Config.DEFAULT_SETTINGS, pinnedCoin: null };

    this.isLoading = true;
    this.hasError = false;
    this.errorMessage = '';
    this.showSettings = false;
    this.showFeedback = false;
    this.refreshTimer = null;
    this.currentPage = 'main';
    this.currentCoin = null;
    this.priceChart = null;

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
      imageModalClose: document.getElementById('imageModalClose'),

      // 页面元素
      mainPage: document.getElementById('mainPage'),
      coinDetailPage: document.getElementById('coinDetailPage'),
      backButton: document.getElementById('backButton'),

      // 币种详情元素
      coinDetailIcon: document.getElementById('coinDetailIcon'),
      coinDetailName: document.getElementById('coinDetailName'),
      coinDetailSymbol: document.getElementById('coinDetailSymbol'),
      coinDetailPrice: document.getElementById('coinDetailPrice'),
      coinDetailChange24h: document.getElementById('coinDetailChange24h'),
      priceChart: document.getElementById('priceChart'),
      chartLoading: document.getElementById('chartLoading'),
      coinMarketCap: document.getElementById('coinMarketCap'),
      coinVolume24h: document.getElementById('coinVolume24h'),
      coinCirculatingSupply: document.getElementById('coinCirculatingSupply'),
      coinTotalSupply: document.getElementById('coinTotalSupply'),
      coinAllTimeHigh: document.getElementById('coinAllTimeHigh'),
      coinAllTimeLow: document.getElementById('coinAllTimeLow'),
      coinNews: document.getElementById('coinNews')
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
    try {
      const notionToken = await storage.get('notionToken');
      const notionDatabaseId = await storage.get('notionDatabaseId');
      if (notionToken && notionDatabaseId) {
        notionService.setConfig(notionToken, notionDatabaseId);
      }
    } catch (e) {
      console.warn('Failed to load Notion config:', e);
    }
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

    // 事件委托：点击列表中的 crypto-info / crypto-item 打开 CoinGecko 页面 [OPT-1]
    if (this.elements.cryptoList) {
      this.elements.cryptoList.addEventListener('click', (event) => {
        // 收藏按钮逻辑
        const pinBtn = event.target.closest('.pin-button');
        if (pinBtn) {
          const symbol = pinBtn.dataset.symbol;
          this.togglePinCoin(symbol);
          return;
        }

        // 排除删除按钮和收藏按钮
        const deleteBtn = event.target.closest('.crypto-delete-btn');
        if (deleteBtn) return;

        const infoEl = event.target.closest('.crypto-info');
        const itemEl = event.target.closest('.crypto-item');
        if (!infoEl || !itemEl) return;

        const symbol = (itemEl.dataset.symbol ||
                        infoEl.dataset.symbol ||
                        infoEl.querySelector('.crypto-symbol')?.textContent ||
                        '').trim().toUpperCase();

        console.log(`[CLICK] crypto-info clicked, symbol=${symbol}`);
        if (!symbol) {
          console.warn('[CLICK] No valid symbol found, skipping detail view');
          return;
        }

        const geckoId = itemEl.dataset.geckoId || this.getCoinGeckoId(symbol);
        if (!geckoId || geckoId === symbol.toLowerCase()) {
          console.warn(`[CLICK] Invalid geckoId for ${symbol}, falling back to CoinGecko external link`);
          this.openCoinOnCoinGecko(symbol, geckoId);
          return;
        }

        this.showCoinDetails(geckoId, symbol);
      });
    }

    // 返回按钮事件
    if (this.elements.backButton) {
      this.elements.backButton.addEventListener('click', () => this.showMainPage());
    }

    // 图表周期选择器事件
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('period-btn')) {
        const period = event.target.dataset.period;
        this.updateChartPeriod(period);
      }
    });

    // 调试模式快捷键 (Ctrl+Shift+D)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        this.toggleDebugMode();
      }
    });
  }

  /**
   * 加载保存的设置
   */
  async loadSettings() {
    try {
      const savedSettings = await storage.get(Config.STORAGE_KEY);
      if (savedSettings) {
        this.settings = { ...this.settings, ...savedSettings };
      } else {
        this.settings = { ...Config.DEFAULT_SETTINGS };
        await this.saveSettings();
      }
    } catch (error) {
      console.warn('Failed to load settings:', error);
      this.settings = { ...Config.DEFAULT_SETTINGS };
      await this.saveSettings();
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
  async getLastFeedbackTime() {
    try {
      const time = await storage.get('lastFeedbackTime');
      if (typeof time === 'number') return time;
      if (typeof time === 'string') return parseInt(time);
      return null;
    } catch (error) {
      console.error('获取反馈时间失败:', error);
      return null;
    }
  }

  /**
   * 设置上次反馈发送时间
   * @param {number} timestamp - 时间戳
   */
  async setLastFeedbackTime(timestamp) {
    try {
      await storage.set('lastFeedbackTime', timestamp);
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
   * 添加币种（类方法，保持与 removeCoin 对称）
   */
  async addCoin(coinId, coinName, coinSymbol) {
    const upperSymbol = String(coinSymbol || '').toUpperCase();
    if (!upperSymbol) return;

    if (!Array.isArray(this.settings.selectedCoins)) {
      this.settings.selectedCoins = [];
    }

    if (this.settings.selectedCoins.includes(upperSymbol)) {
      return; // 已存在则直接返回，避免重复保存
    }

    // 更新内存中的设置
    this.settings.selectedCoins.push(upperSymbol);
    if (!this.settings.coinNames) this.settings.coinNames = {};
    this.settings.coinNames[upperSymbol] = coinName;

    if (!this.settings.coinGeckoIds) this.settings.coinGeckoIds = {};
    this.settings.coinGeckoIds[upperSymbol] = coinId;

    // 持久化存储
    try {
      await storage.set(Config.STORAGE_KEY, this.settings);
    } catch (error) {
      console.warn('Failed to save settings:', error);
      throw error;
    }

    // 更新UI与数据
    this.updateSettingsUI();
    this.fetchCryptoData();
  }

  /**
   * 删除币种
   */
  async removeCoin(coinSymbol) {
    const index = this.settings.selectedCoins.indexOf(coinSymbol);
    if (index > -1) {
      this.settings.selectedCoins.splice(index, 1);
      
      // 保存设置
      try {
        await storage.set(Config.STORAGE_KEY, this.settings);
      } catch (error) {
        console.warn('Failed to save settings:', error);
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
  async onLanguageChange() {
    const selectedLanguage = this.elements.languageSelect.value;
    this.settings.language = selectedLanguage;
    
    // 立即保存语言设置
    try {
      await storage.set(Config.STORAGE_KEY, this.settings);
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
    
    // 更新详情页面文本
    this.updateCoinDetailPageLanguage(currentLang);
    
    // 更新详情页面文本
    this.updateCoinDetailPageLanguage(currentLang);
    
    // 更新详情页面文本
    this.updateCoinDetailPageLanguage(currentLang);
    
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
  async saveSettings() {
    // 获取刷新间隔
    this.settings.refreshInterval = this.elements.refreshInterval.value;
    
    // 获取货币
    this.settings.currency = this.elements.currencySelect.value;
    
    // 获取语言设置
    this.settings.language = this.elements.languageSelect.value;
    
    // 保存到存储（保持现有的selectedCoins和pinnedCoin不变）
    try {
      await storage.set(Config.STORAGE_KEY, this.settings);
    } catch (error) {
      console.warn('Failed to save settings:', error);
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
      // 使用 storage 抽象保存配置
      if (notionToken) {
        await storage.set('notionToken', notionToken);
      } else {
        await storage.remove('notionToken');
      }
      
      if (notionDatabaseId) {
        await storage.set('notionDatabaseId', notionDatabaseId);
      } else {
        await storage.remove('notionDatabaseId');
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
    const lastSendTime = await this.getLastFeedbackTime();
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
            await this.setLastFeedbackTime(now);
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
   * 使用 chrome.tabs 优先的方式打开外部链接，失败回退 window.open [OPT-1]
   */
  openUrlWithTabs(url) {
    try {
      console.log(`[NAV] openUrlWithTabs -> ${url}`);
      if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.create === 'function') {
        chrome.tabs.create({ url }, (tab) => {
          if (chrome.runtime && chrome.runtime.lastError) {
            console.error('[NAV] chrome.tabs.create 失败:', chrome.runtime.lastError.message);
            // 回退到 window.open
            const win = window.open(url, '_blank');
            if (!win) {
              alert('无法打开页面：弹窗可能被浏览器阻止');
            }
          } else {
            console.log('[NAV] chrome.tabs.create 成功:', tab?.id);
          }
        });
      } else {
        const win = window.open(url, '_blank');
        if (!win) {
          alert('无法打开页面：弹窗可能被浏览器阻止');
        }
      }
    } catch (error) {
      console.error('[NAV] 打开链接失败:', error);
      alert('打开链接失败，请稍后重试');
    }
  }

  /**
   * 打开指定币种在 CoinGecko 的详情页，带详细日志与语言路径 [OPT-5]
   */
  openCoinOnCoinGecko(symbol, geckoIdParam = null) {
    try {
      const upperSymbol = (symbol || '').toUpperCase();
      const geckoId = geckoIdParam || this.getCoinGeckoId(upperSymbol);
      const langPath = this.getCoinGeckoLangPath();
      const targetUrl = `https://www.coingecko.com/${langPath}/coins/${encodeURIComponent(geckoId)}`;
      console.log(`[NAV] 即将打开 CoinGecko: symbol=${upperSymbol}, geckoId=${geckoId}, url=${targetUrl}`);
      this.openUrlWithTabs(targetUrl);
    } catch (error) {
      console.error('[NAV] openCoinOnCoinGecko 出错:', error);
    }
  }

  /**
   * 将当前语言映射到 CoinGecko 的路径段 [OPT-5]
   */
  getCoinGeckoLangPath() {
    const lang = (this.settings?.language || 'en').toLowerCase();
    switch (lang) {
      case 'zh':
      case 'zh-cn':
      case 'zh_cn':
        return 'zh';
      case 'ja':
      case 'jp':
        return 'ja';
      case 'ko':
      case 'kr':
        return 'ko';
      case 'en':
      default:
        return 'en';
    }
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
      const ids = this.settings.selectedCoins.map(coin => this.getCoinGeckoId(coin)).join(',');
      const url = `${Config.API_BASE_URL}/coins/markets?vs_currency=${this.settings.currency.toLowerCase()}&ids=${ids}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`;
      
      const data = await http.getJson(url);
      
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
            image: coinData.image
          };
          console.log(`[DEBUG] 币种 ${coin} 处理结果:`, result);
          return result;
        }
        console.warn(`[DEBUG] 未找到币种数据: ${coin} (${geckoId})`);
        return null;
      }).filter(item => item !== null);
      
      console.log(`[DEBUG] 最终处理的币种数据:`, this.cryptoData);
      
      this.renderCryptoData();
      this.updateLastUpdated();

      // 更新徽章
      const pinnedData = this.cryptoData.find(c => c.symbol === this.settings.pinnedCoin);
      this.updateBadge(pinnedData);
    } catch (error) {
      console.error('[DEBUG] fetchCryptoData 错误:', error);
      this.hasError = true;
      this.errorMessage = '获取数据失败，请稍后再试';
      this.elements.errorMessage.textContent = this.errorMessage;
      this.elements.errorMessage.style.display = 'block';
    } finally {
      this.isLoading = false;
      this.elements.loadingIndicator.style.display = 'none';
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

    // 使用 DocumentFragment 批量插入，减少回流重绘 [OPT-2]
    const fragment = document.createDocumentFragment();
    
    // 添加新数据
    this.cryptoData.forEach(crypto => {
      const cryptoItem = document.createElement('div');
      cryptoItem.className = 'crypto-item';

      const upperSymbol = (crypto.symbol || '').toUpperCase();
      cryptoItem.dataset.symbol = upperSymbol; // 透传数据，便于事件委托 [OPT-4]
      cryptoItem.dataset.geckoId = this.getCoinGeckoId(upperSymbol);
      
      // 创建左侧信息容器
      const cryptoInfo = document.createElement('div');
      cryptoInfo.className = 'crypto-info';
      try {
        const tip = I18N.t('clickToOpenCoinGecko', this.settings.language || I18N.DEFAULT_LANGUAGE);
        if (tip) cryptoInfo.title = tip;
      } catch (_) {}
      
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

      // 创建收藏按钮
      const pinButton = document.createElement('button');
      pinButton.className = 'pin-button';
      pinButton.innerHTML = '★'; // 使用星星符号作为示例
      pinButton.title = '点击收藏，将价格固定到扩展图标上';
      pinButton.setAttribute('data-symbol', crypto.symbol);
      if (crypto.symbol === this.settings.pinnedCoin) {
        pinButton.classList.add('pinned');
      }
      priceContainer.appendChild(pinButton);
      
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
      
      fragment.appendChild(cryptoItem);
    });
    
    cryptoContainer.appendChild(fragment);
    this.elements.cryptoList.appendChild(cryptoContainer);
  }

  /**
   * 获取币种对应的CoinGecko ID
   * @param {string} coin - 币种代码
   * @returns {string} CoinGecko ID
   */
  getCoinGeckoId(coin) {
    if (!coin || typeof coin !== 'string') {
      console.warn('[getCoinGeckoId] Invalid coin parameter:', coin);
      return null;
    }

    const upperCoin = coin.toUpperCase();
    
    // 优先从localStorage中的动态映射读取
    if (this.settings.coinGeckoIds && this.settings.coinGeckoIds[upperCoin]) {
      const result = this.settings.coinGeckoIds[upperCoin];
      console.log(`[DEBUG] getCoinGeckoId (动态映射): ${upperCoin} -> ${result}`);
      return result;
    }
    
    // 回退到config.js中的静态映射
    if (Config.COIN_GECKO_IDS && Config.COIN_GECKO_IDS[upperCoin]) {
      const result = Config.COIN_GECKO_IDS[upperCoin];
      console.log(`[DEBUG] getCoinGeckoId (静态映射): ${upperCoin} -> ${result}`);
      return result;
    }

    // 最后回退：使用小写coin作为geckoId，但标记为不可靠
    const fallback = coin.toLowerCase();
    console.warn(`[DEBUG] getCoinGeckoId (fallback): ${upperCoin} -> ${fallback} (unreliable)`);
    return fallback;
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
    // 添加null和undefined检查
    if (price === null || price === undefined) {
      return `${Config.CURRENCY_SYMBOLS[this.settings.currency] || ''}-`;
    }
    
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
    if (change === undefined || change === null) return 'N/A';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  /**
   * 获取价格变化的CSS类
   * @param {number} change - 价格变化百分比
   * @returns {string} CSS类名
   */
  getChangeClass(change) {
    if (change === undefined || change === null) return '';
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

   /**
    * 显示主页面
    */
   showMainPage() {
     try {
       this.currentPage = 'main';
       this.currentCoin = null;
       
       // 切换到主页面
       if (this.elements.coinDetailPage && this.elements.mainPage) {
         this.elements.coinDetailPage.classList.remove('active');
         this.elements.mainPage.classList.add('active');
       }
       
       // 清理图表资源
       if (this.priceChart) {
         this.priceChart.destroy?.();
         this.priceChart = null;
       }
       
       console.log('[Navigation] Returned to main page');
     } catch (error) {
       console.error('[Navigation] Error showing main page:', error);
     }
   }

   /**
    * 显示币种详情页面
    */
   async showCoinDetails(coinId, symbol) {
     try {
       this.currentPage = 'detail';
       this.currentCoin = { id: coinId, symbol: symbol };
       
       // 切换到详情页面
       if (this.elements.mainPage && this.elements.coinDetailPage) {
         this.elements.mainPage.classList.remove('active');
         this.elements.coinDetailPage.classList.add('active');
       }
       
       // 显示基本信息
       if (this.elements.coinDetailSymbol) {
         this.elements.coinDetailSymbol.textContent = symbol;
       }
       if (this.elements.coinDetailName) {
         this.elements.coinDetailName.textContent = 'Loading...';
       }
       
       // 初始化图表
       if (this.elements.priceChart) {
         this.priceChart = new PriceChart(this.elements.priceChart);
         this.priceChart.showLoading();
       }
       
       // 加载详细数据
       await this.loadCoinDetails(coinId);
       
     } catch (error) {
       console.error('[CoinDetails] Error showing coin details:', error);
       this.showMainPage();
     }
   }

   /**
    * 加载币种详细信息
    */
   async loadCoinDetails(coinId) {
     if (!coinId) {
       console.error('[CoinDetails] Invalid coinId provided');
       this.showMessage(I18N.t('invalidCoinId'), 'error');
       this.showMainPage();
       return;
     }

     const currency = this.settings?.currency?.toLowerCase() || 'usd';
     
     try {
       // 并行加载详情和历史数据
       const [details, history] = await Promise.all([
         coinDetailService.getCoinDetails(coinId, currency),
         coinDetailService.getCoinHistory(coinId, currency, 7)
       ]);
       
       // 验证返回的数据
       if (!details || !details.symbol) {
         throw new Error('Invalid coin details received');
       }
       
       // 更新详情信息
       this.updateCoinDetailsUI(details);
       
       // 更新图表
       if (this.priceChart && history && history.length > 0) {
         this.priceChart.setData(history);
       } else if (this.priceChart) {
         this.priceChart.showError(I18N.t('noHistoricalData'));
       }
       
       // 加载新闻（安全调用）
       if (typeof this.showCoinNews === 'function') {
         // 这里应该先获取新闻数据，然后调用showCoinNews显示
         // 暂时显示空新闻状态，后续可以集成新闻API
         this.showCoinNews([]);
       } else {
         console.warn('[CoinDetails] showCoinNews method not found');
       }
       
     } catch (error) {
       console.error('[CoinDetails] Error loading coin details:', error);
       
       // 根据错误类型显示用户友好的错误信息
       let errorMessage = I18N.t('loadingCoinDetailsFailed');
       
       if (error.message.includes('404')) {
         errorMessage = I18N.t('coinNotFound');
       } else if (error.message.includes('timeout')) {
         errorMessage = I18N.t('networkRequestTimeout');
       } else if (error.message.includes('Network error')) {
         errorMessage = I18N.t('networkConnectionFailed');
       } else if (error.message.includes('Invalid coin data')) {
         errorMessage = I18N.t('invalidCoinData');
       } else if (error.message.includes('Failed to fetch')) {
         errorMessage = I18N.t('apiServiceUnavailable');
       }
       
       this.showMessage(errorMessage, 'error');
       
       // 清理图表状态
       if (this.priceChart) {
         this.priceChart.showError(I18N.t('chartDataLoadingFailed'));
       }
       
       // 3秒后自动返回主页面
       setTimeout(() => {
         this.showMainPage();
       }, 3000);
     }
   }

   /**
    * 更新币种详情UI
    */
   updateCoinDetailsUI(details) {
     // 基本信息
     if (this.elements.coinDetailName) {
       this.elements.coinDetailName.textContent = details.name;
     }
     if (this.elements.coinDetailSymbol) {
       this.elements.coinDetailSymbol.textContent = details.symbol;
     }
     
     if (details.image && this.elements.coinDetailIcon) {
       this.elements.coinDetailIcon.src = details.image;
       this.elements.coinDetailIcon.alt = details.name;
     }
     
     // 价格信息
     const currencySymbol = Config.CURRENCY_SYMBOLS[details.currency] || '';
     if (this.elements.coinDetailPrice) {
       this.elements.coinDetailPrice.textContent = `${currencySymbol}${this.formatPrice(details.currentPrice)}`;
     }
     
     // 24h变化
     const change24h = details.priceChange24h;
     if (this.elements.coinDetailChange24h) {
       const changeEl = this.elements.coinDetailChange24h;
       changeEl.textContent = `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%`;
       changeEl.className = 'change-value ' + (change24h > 0 ? 'positive' : 'negative');
     }
     
     // 统计数据
     if (this.elements.coinMarketCap) {
       this.elements.coinMarketCap.textContent = this.formatLargeNumber(details.marketCap, currencySymbol);
     }
     if (this.elements.coinVolume24h) {
       this.elements.coinVolume24h.textContent = this.formatLargeNumber(details.totalVolume, currencySymbol);
     }
     if (this.elements.coinCirculatingSupply) {
       this.elements.coinCirculatingSupply.textContent = this.formatLargeNumber(details.circulatingSupply);
     }
     if (this.elements.coinTotalSupply) {
       this.elements.coinTotalSupply.textContent = details.totalSupply ? this.formatLargeNumber(details.totalSupply) : 'N/A';
     }
     if (this.elements.coinAllTimeHigh) {
       this.elements.coinAllTimeHigh.textContent = `${currencySymbol}${this.formatPrice(details.allTimeHigh)}`;
     }
     if (this.elements.coinAllTimeLow) {
       this.elements.coinAllTimeLow.textContent = `${currencySymbol}${this.formatPrice(details.allTimeLow)}`;
     }
   }

   /**
    * 显示币种新闻
    */
   async showCoinNews(newsItems) {
     const newsContainer = this.elements.coinNews;
     if (!newsContainer) return;
     
     if (!newsItems || newsItems.length === 0) {
       newsContainer.innerHTML = `<div class="news-loading">${I18N.t('noNews', this.settings.language)}</div>`;
       return;
     }
     
     const newsHTML = newsItems.map(news => `
       <div class="news-item" onclick="window.open('${news.url}', '_blank')">
         <div class="news-title">${news.title}</div>
         <div class="news-meta">
           ${news.source}
           <span class="news-date">${this.formatNewsDate(news.publishedAt)}</span>
         </div>
       </div>
     `).join('');
     
     newsContainer.innerHTML = newsHTML;
   }

   /**
    * 更新价格图表数据
    */
   async updatePriceChart(period = 7) {
     if (!this.currentCoin || !this.priceChart) return;
     
     try {
       const chartLoading = document.getElementById('chartLoading');
       if (chartLoading) chartLoading.style.display = 'block';
       
       const currency = this.settings?.currency?.toLowerCase() || 'usd';
       const historyData = await coinDetailService.getCoinHistory(this.currentCoin.id, currency, period);
       
       if (historyData && historyData.length > 0) {
         this.priceChart.setData(historyData);
         if (chartLoading) chartLoading.style.display = 'none';
       }
     } catch (error) {
       console.error('[Chart] Error updating price chart:', error);
       if (this.priceChart) {
         this.priceChart.showError();
       }
     }
   }

   /**
    * 格式化大数字显示
    */
   formatLargeNumber(number, symbol = '') {
     if (!number || number === 0) return 'N/A';
     
     if (number >= 1e12) {
       return `${symbol}${(number / 1e12).toFixed(2)}T`;
     } else if (number >= 1e9) {
       return `${symbol}${(number / 1e9).toFixed(2)}B`;
     } else if (number >= 1e6) {
       return `${symbol}${(number / 1e6).toFixed(2)}M`;
     } else if (number >= 1e3) {
       return `${symbol}${(number / 1e3).toFixed(2)}K`;
     } else {
       return `${symbol}${number.toLocaleString()}`;
     }
   }

   /**
    * 格式化新闻日期
    */
   formatNewsDate(dateString) {
     if (!dateString) return '';
     
     const date = new Date(dateString);
     const now = new Date();
     const diffMs = now - date;
     const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
     const diffDays = Math.floor(diffHours / 24);
     
     if (diffHours < 24) {
       return `${diffHours}h ago`;
     } else if (diffDays < 30) {
       return `${diffDays}d ago`;
     } else {
       return date.toLocaleDateString();
     }
   }

   /**
    * 调试模式
    */
   toggleDebugMode() {
     console.log('[Debug] 启动网络调试模式');
     this.showMessage('调试模式已启动，检查控制台输出', 'info');
     this.runNetworkDiagnostics();
   }

   /**
    * 运行网络诊断
    */
   async runNetworkDiagnostics() {
     console.log('[Debug] === 开始网络诊断 ===');
     
     // 1. 环境检测
     console.log('[Debug] 1. 环境检测');
     console.log('[Debug] Chrome扩展ID:', chrome.runtime?.id);
     console.log('[Debug] Manifest:', chrome.runtime?.getManifest());
     console.log('[Debug] API_BASE_URL:', Config.API_BASE_URL);
     
     // 2. 权限检测
     console.log('[Debug] 2. 权限检测');
     const manifest = chrome.runtime.getManifest();
     console.log('[Debug] Host权限:', manifest.host_permissions);
     console.log('[Debug] 基础权限:', manifest.permissions);
     
     // 3. 网络连通性测试
     console.log('[Debug] 3. 网络连通性测试');
     try {
       const pingResponse = await fetch('https://api.coingecko.com/api/v3/ping');
       console.log('[Debug] Ping测试:', pingResponse.ok ? '成功' : '失败', pingResponse.status);
       
       if (pingResponse.ok) {
         const pingData = await pingResponse.json();
         console.log('[Debug] Ping数据:', pingData);
       }
     } catch (error) {
       console.error('[Debug] Ping测试失败:', error);
     }
     
     // 4. HTTP库测试
     console.log('[Debug] 4. HTTP库测试');
     try {
       const httpData = await http.getJson('https://api.coingecko.com/api/v3/ping');
       console.log('[Debug] HTTP库测试: 成功', httpData);
     } catch (error) {
       console.error('[Debug] HTTP库测试失败:', error);
     }
     
     // 5. CoinDetailService测试
     console.log('[Debug] 5. CoinDetailService测试');
     try {
       console.log('[Debug] 测试getCoinDetails...');
       const details = await coinDetailService.getCoinDetails('bitcoin', 'usd');
       console.log('[Debug] getCoinDetails成功:', details.name, details.currentPrice);
       
       console.log('[Debug] 测试getCoinHistory...');
       const history = await coinDetailService.getCoinHistory('bitcoin', 'usd', 1);
       console.log('[Debug] getCoinHistory成功:', history.length, '个数据点');
       
       this.showMessage('网络诊断完成，所有测试通过！', 'success');
     } catch (error) {
       console.error('[Debug] CoinDetailService测试失败:', error);
       console.error('[Debug] 错误堆栈:', error.stack);
       
       // 详细错误分析
       if (error.message.includes('timeout')) {
         console.error('[Debug] 错误类型: 网络超时');
         this.showMessage('网络超时错误，请检查网络连接', 'error');
       } else if (error.message.includes('Failed to fetch')) {
         console.error('[Debug] 错误类型: 网络请求失败');
         this.showMessage('网络请求失败，可能是CORS或权限问题', 'error');
       } else if (error.message.includes('Invalid')) {
         console.error('[Debug] 错误类型: 数据格式错误');
         this.showMessage('API返回数据格式异常', 'error');
       } else {
         console.error('[Debug] 错误类型: 未知错误');
         this.showMessage(`未知错误: ${error.message}`, 'error');
       }
     }
     
     console.log('[Debug] === 网络诊断完成 ===');
   }
  /**
   * 更新币种详情页面语言
   */
  updateCoinDetailPageLanguage(lang) {
    document.querySelectorAll('#coinDetailPage [data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      element.textContent = I18N.t(key, lang);
    });
  }
  /**
   * 切换币种的收藏状态
   */
  async togglePinCoin(symbol) {
    if (this.settings.pinnedCoin === symbol) {
      this.settings.pinnedCoin = null; // 取消收藏
    } else {
      this.settings.pinnedCoin = symbol; // 收藏新币种
    }

    await this.saveSettings(); // 保存设置
    this.renderCryptoData(); // 重新渲染UI
  }

  /**
   * 更新扩展图标的徽章
   */
  updateBadge(coinData) {
    if (coinData) {
      const price = coinData.price.toFixed(0);
      const color = coinData.change24h >= 0 ? '#38a169' : '#e53e3e';
      chrome.action.setBadgeText({ text: price });
      chrome.action.setBadgeBackgroundColor({ color: color });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  }

}

// 创建应用实例
const app = new CryptoApp();

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
  
  searchResults.innerHTML = `<div class="search-loading">${I18N.t('searchLoading', currentLang)}</div>`;
  searchResults.classList.remove('hidden');
  resultList.classList.remove('hidden');
  
  try {
    lastSearchTime = Date.now();
    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`;
    const data = await http.getJson(url);
    displaySearchResults((data && data.coins) || []);
  } catch (error) {
    console.error('搜索失败:', error);
    if (error.status === 429 || (error.message && String(error.message).includes('429'))) {
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
      addButton.addEventListener('click', async () => {
        const originalText = addButton.textContent;
        addButton.disabled = true;
        addButton.textContent = I18N.t('added', currentLang);
        try {
          await addCoin(coin.id, coin.name, coin.symbol);
          // 添加成功后可选择性隐藏结果
          const searchResultsEl = document.getElementById('searchResults');
          const resultListEl = document.getElementById('resultList');
          setTimeout(() => {
            if (searchResultsEl) searchResultsEl.classList.add('hidden');
            if (resultListEl) resultListEl.classList.add('hidden');
          }, 500);
        } catch (e) {
          // 失败则恢复按钮
          addButton.disabled = false;
          addButton.textContent = originalText;
          console.error('添加币种失败:', e);
        }
      });
    }
    
    resultItem.appendChild(resultIcon);
    resultItem.appendChild(resultInfo);
    resultItem.appendChild(addButton);
    searchResults.appendChild(resultItem);
  });
}

// 添加币种（全局函数，由搜索结果调用，委托到类方法）
async function addCoin(coinId, coinName, coinSymbol) {
  if (!window.cryptoApp) {
    throw new Error('App not initialized');
  }
  await window.cryptoApp.addCoin(coinId, coinName, coinSymbol);
}

// 同步获取选中的币种（用于搜索功能）
function getSelectedCoinsSync() {
  try {
    if (window.cryptoApp && window.cryptoApp.settings && Array.isArray(window.cryptoApp.settings.selectedCoins)) {
      return window.cryptoApp.settings.selectedCoins;
    }
  } catch (error) {
    console.warn('Failed to read in-memory settings:', error);
  }
  // 回退到默认配置，避免阻塞UI
  return (Config && Config.DEFAULT_SETTINGS && Array.isArray(Config.DEFAULT_SETTINGS.selectedCoins))
    ? Config.DEFAULT_SETTINGS.selectedCoins
    : ['BTC', 'ETH', 'BNB', 'SOL'];
}
