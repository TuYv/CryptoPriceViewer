// 导入配置
import { Config } from './config.js';
import { I18N } from './i18n.js';
import { notionService } from './services/NotionService.js';
import { coinDetailService } from './services/CoinDetailService.js';
import { http } from './lib/http.js';
import { storage } from './lib/storage.js';
import { PriceChart } from './lib/chart.js';
import { updateBadge } from './badge-updater.js';

class SearchHandler {
  constructor(app) {
    this.app = app;
    this.elements = {
      searchInput: document.getElementById('searchInput'),
      searchResults: document.getElementById('searchResults'),
      resultList: document.getElementById('resultList')
    };
    this.searchDebounceTimer = null;
    this.lastSearchTime = 0;
    this.SEARCH_DEBOUNCE_DELAY = 500;
    this.RATE_LIMIT_DELAY = 1000;

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.elements.searchInput.addEventListener('input', () => this.searchCoins());
  }

  async searchCoins() {
    const query = this.elements.searchInput.value.trim();

    if (!query) {
      this.elements.searchResults.classList.add('hidden');
      this.elements.resultList.classList.add('hidden');
      return;
    }

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = setTimeout(async () => {
      const now = Date.now();
      const timeSinceLastSearch = now - this.lastSearchTime;

      if (timeSinceLastSearch < this.RATE_LIMIT_DELAY) {
        const waitTime = this.RATE_LIMIT_DELAY - timeSinceLastSearch;
        setTimeout(() => this.performSearch(query), waitTime);
        return;
      }

      await this.performSearch(query);
    }, this.SEARCH_DEBOUNCE_DELAY);
  }

  async performSearch(query) {
    const currentLang = this.app.settings.language || I18N.DEFAULT_LANGUAGE;
    this.elements.searchResults.innerHTML = `<div class="search-loading">${I18N.t('searchLoading', currentLang)}</div>`;
    this.elements.searchResults.classList.remove('hidden');
    this.elements.resultList.classList.remove('hidden');

    try {
      this.lastSearchTime = Date.now();
      const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`;
      const data = await http.getJson(url);
      this.displaySearchResults((data && data.coins) || []);
    } catch (error) {
      console.error('搜索失败:', error);
      if (error.status === 429 || (error.message && String(error.message).includes('429'))) {
        this.elements.searchResults.innerHTML = `<div class="search-error">${I18N.t('searchRateLimit', currentLang)}</div>`;
      } else {
        this.elements.searchResults.innerHTML = `<div class="search-empty">${I18N.t('searchError', currentLang)}</div>`;
      }
    }
  }

  displaySearchResults(coins) {
    const currentLang = this.app.settings.language || I18N.DEFAULT_LANGUAGE;
    const currentCoins = this.app.settings.selectedCoins || [];

    this.elements.searchResults.innerHTML = '';

    if (coins.length === 0) {
      this.elements.searchResults.innerHTML = `<div class="search-empty">${I18N.t('noSearchResults', currentLang)}</div>`;
      return;
    }

    coins.slice(0, 10).forEach(coin => {
      const isAdded = currentCoins.includes(coin.symbol.toUpperCase());
      const resultItem = document.createElement('div');
      resultItem.className = 'search-result-item';

      // --- Start of Restored Code ---
      const resultIcon = document.createElement('div');
      resultIcon.className = 'search-result-icon';

      if (coin.thumb || coin.small || coin.large) {
        const iconImg = document.createElement('img');
        iconImg.src = coin.thumb || coin.small || coin.large;
        iconImg.alt = coin.name;
        iconImg.style.width = '32px';
        iconImg.style.height = '32px';
        iconImg.style.borderRadius = '50%';
        resultIcon.appendChild(iconImg);
      } else {
        resultIcon.textContent = coin.symbol.substring(0, 2).toUpperCase();
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
      // --- End of Restored Code ---

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
            await this.app.addCoin(coin.id, coin.name, coin.symbol); // Call app method
            setTimeout(() => {
              this.elements.searchResults.classList.add('hidden');
              this.elements.resultList.classList.add('hidden');
            }, 500);
          } catch (e) {
            addButton.disabled = false;
            addButton.textContent = originalText;
            console.error('添加币种失败:', e);
          }
        });
      }
      
      resultItem.appendChild(resultIcon); // Restored
      resultItem.appendChild(resultInfo); // Restored
      resultItem.appendChild(addButton);
      this.elements.searchResults.appendChild(resultItem);
    });
  }
}

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
      mainPage: document.getElementById('mainPage'),
      coinDetailPage: document.getElementById('coinDetailPage'),
      backButton: document.getElementById('backButton'),
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
    this.searchHandler = new SearchHandler(this);
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
        const pinBtn = event.target.closest('.pin-button');
        if (pinBtn) {
          const symbol = pinBtn.dataset.symbol;
          this.togglePinCoin(symbol);
          return;
        }

        const deleteBtn = event.target.closest('.crypto-delete-btn');
        if (deleteBtn) return;

        const infoEl = event.target.closest('.crypto-info');
        const itemEl = event.target.closest('.crypto-item');
        if (!infoEl || !itemEl) return;

        const symbol = (itemEl.dataset.symbol || '').trim().toUpperCase();

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

      this.elements.cryptoList.addEventListener('mouseover', (event) => {
        const pinBtn = event.target.closest('.pin-button');
        if (pinBtn) {
          const item = pinBtn.closest('.crypto-item');
          if (item) {
            item.classList.add('item-is-focused');
          }
        }
      });

      this.elements.cryptoList.addEventListener('mouseout', (event) => {
        const pinBtn = event.target.closest('.pin-button');
        if (pinBtn) {
          const item = pinBtn.closest('.crypto-item');
          if (item) {
            item.classList.remove('item-is-focused');
          }
        }
      });
    }

    if (this.elements.backButton) {
      this.elements.backButton.addEventListener('click', () => this.showMainPage());
    }

    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('period-btn')) {
        const period = event.target.dataset.period;
        this.updateChartPeriod(period);
      }
    });

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
    
    if (!this.settings.language) {
      this.settings.language = I18N.DEFAULT_LANGUAGE;
    }
    
    if (!this.settings.coinNames) {
      this.settings.coinNames = {};
    }
    
    if (!this.settings.coinGeckoIds) {
      this.settings.coinGeckoIds = {};
    }
    
    this.updateSettingsUI();
    this.updateUILanguage();
    this.fetchCryptoData();
    this.setupAutoRefresh();
  }

  /**
   * 更新设置UI
   */
  updateSettingsUI() {
    this.elements.refreshInterval.value = this.settings.refreshInterval;
    this.elements.currencySelect.value = this.settings.currency;
    this.elements.languageSelect.value = this.settings.language || I18N.DEFAULT_LANGUAGE;
  }

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

  async setLastFeedbackTime(timestamp) {
    try {
      await storage.set('lastFeedbackTime', timestamp);
    } catch (error) {
      console.error('保存反馈时间失败:', error);
    }
  }

  showMessage(message, type = 'info') {
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
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
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
    
    messageContainer.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.style.opacity = '1';
    }, 10);
    
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

  async addCoin(coinId, coinName, coinSymbol) {
    const upperSymbol = String(coinSymbol || '').toUpperCase();
    if (!upperSymbol) return;

    if (!Array.isArray(this.settings.selectedCoins)) {
      this.settings.selectedCoins = [];
    }

    if (this.settings.selectedCoins.includes(upperSymbol)) {
      return;
    }

    this.settings.selectedCoins.push(upperSymbol);
    if (!this.settings.coinNames) this.settings.coinNames = {};
    this.settings.coinNames[upperSymbol] = coinName;

    if (!this.settings.coinGeckoIds) this.settings.coinGeckoIds = {};
    this.settings.coinGeckoIds[upperSymbol] = coinId;

    try {
      await storage.set(Config.STORAGE_KEY, this.settings);
    } catch (error) {
      console.warn('Failed to save settings:', error);
      throw error;
    }

    this.updateSettingsUI();
    this.fetchCryptoData();
  }

  async removeCoin(coinSymbol) {
    const index = this.settings.selectedCoins.indexOf(coinSymbol);
    if (index > -1) {
      this.settings.selectedCoins.splice(index, 1);
      
      try {
        await storage.set(Config.STORAGE_KEY, this.settings);
      } catch (error) {
        console.warn('Failed to save settings:', error);
      }
      
      this.updateSettingsUI();
      this.fetchCryptoData();
    }
  }

  async onLanguageChange() {
    const selectedLanguage = this.elements.languageSelect.value;
    this.settings.language = selectedLanguage;
    
    try {
      await storage.set(Config.STORAGE_KEY, this.settings);
    } catch (error) {
      console.warn('Failed to save language setting:', error);
    }
    
    this.updateUILanguage();
  }

  updateUILanguage() {
    const currentLang = this.settings.language || I18N.DEFAULT_LANGUAGE;
    document.title = I18N.t('appTitle', currentLang);
    
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      element.textContent = I18N.t(key, currentLang);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.dataset.i18nPlaceholder;
        element.placeholder = I18N.t(key, currentLang);
    });
    
    this.updateRefreshIntervalOptions(currentLang);
    this.updateCurrencyOptions(currentLang);
    this.renderCryptoData(currentLang);
  }

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

  async saveSettings() {
    this.settings.refreshInterval = this.elements.refreshInterval.value;
    this.settings.currency = this.elements.currencySelect.value;
    this.settings.language = this.elements.languageSelect.value;
    
    try {
      await storage.set(Config.STORAGE_KEY, this.settings);
    } catch (error) {
      console.warn('Failed to save settings:', error);
    }
    
    this.fetchCryptoData();
    this.setupAutoRefresh();
    this.toggleSettings(false);
  }

  async saveNotionConfig() {
    const notionToken = this.elements.notionToken.value.trim();
    const notionDatabaseId = this.elements.notionDatabaseId.value.trim();
    
    try {
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

  cancelSettings() {
    this.updateSettingsUI();
    this.toggleSettings(false);
  }

  toggleSettings(show) {
    if (show === undefined) {
      this.showSettings = !this.showSettings;
    } else {
      this.showSettings = show;
    }
    
    if (this.showSettings) {
      this.elements.settingsPanel.classList.remove('hidden');
      this.elements.feedbackPanel.classList.add('hidden');
      document.body.style.overflow = 'hidden';
    } else {
      this.elements.settingsPanel.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }
  }

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
      document.body.style.overflow = 'hidden';
    } else {
      this.elements.feedbackPanel.classList.add('hidden');
      document.body.style.overflow = 'auto';
    }
  }

  async sendFeedback() {
    const now = Date.now();
    const lastSendTime = await this.getLastFeedbackTime();
    const oneMinute = 60 * 1000;
    
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
      const feedback = {
        id: Date.now(),
        content: feedbackText,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        version: chrome.runtime.getManifest().version
      };

      if (notionService.isConfigured()) {
        try {
          const result = await notionService.createFeedbackPage(feedback);
          if (result) {
            await this.setLastFeedbackTime(now);
            this.showMessage(`反馈已成功发送！反馈ID: ${feedback.id}`, 'success');
          } else {
            this.showMessage('发送失败，请稍后重试。', 'error');
          }
        } catch (error) {
          console.error('发送到 Notion 失败:', error);
          const errorMessage = error.message || error.toString() || '未知错误';
          this.showMessage('发送失败: ' + errorMessage, 'error');
        }
      } else {
        this.showMessage('请先配置 Notion 集成后再发送反馈。', 'error');
      }
      
      this.elements.feedbackText.value = '';
      this.toggleFeedback(false);
      
    } catch (error) {
      console.error('发送反馈失败:', error);
      this.showMessage('发送反馈失败，请稍后重试', 'error');
    }
  }

  cancelFeedback() {
    this.elements.feedbackText.value = '';
    this.toggleFeedback(false);
  }

  refreshData() {
    this.fetchCryptoData();
  }

  openUrlWithTabs(url) {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs && typeof chrome.tabs.create === 'function') {
        chrome.tabs.create({ url });
      } else {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('[NAV] 打开链接失败:', error);
    }
  }

  openCoinOnCoinGecko(symbol, geckoIdParam = null) {
    const upperSymbol = (symbol || '').toUpperCase();
    const geckoId = geckoIdParam || this.getCoinGeckoId(upperSymbol);
    const langPath = this.getCoinGeckoLangPath();
    const targetUrl = `https://www.coingecko.com/${langPath}/coins/${encodeURIComponent(geckoId)}`;
    this.openUrlWithTabs(targetUrl);
  }

  getCoinGeckoLangPath() {
    const lang = (this.settings?.language || 'en').toLowerCase();
    switch (lang) {
      case 'zh': return 'zh';
      case 'ja': return 'ja';
      case 'ko': return 'ko';
      default: return 'en';
    }
  }

  async fetchCryptoData() {
    this.isLoading = true;
    this.hasError = false;
    this.elements.loadingIndicator.style.display = 'block';
    this.elements.errorMessage.style.display = 'none';
    this.elements.noDataMessage.style.display = 'none';
    
    try {
      const ids = this.settings.selectedCoins.map(coin => this.getCoinGeckoId(coin)).join(',');
      if (!ids) {
          this.cryptoData = [];
          this.renderCryptoData(this.settings.language);
          return;
      }
      const url = `${Config.API_BASE_URL}/coins/markets?vs_currency=${this.settings.currency.toLowerCase()}&ids=${ids}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`;
      
      const data = await http.getJson(url);
      
      this.cryptoData = this.settings.selectedCoins.map(coin => {
        const geckoId = this.getCoinGeckoId(coin);
        const coinData = data.find(item => item.id === geckoId);
        
        if (coinData) {
          const result = {
            id: coinData.id,
            name: coinData.name || this.getCoinName(coin),
            symbol: (coinData.symbol || coin).toUpperCase(),
            price: coinData.current_price,
            change24h: coinData.price_change_percentage_24h,
            image: coinData.image
          };
          return result;
        }
        return null;
      }).filter(item => item !== null);
      
      this.renderCryptoData(this.settings.language);
      this.updateLastUpdated();

      const pinnedData = this.cryptoData.find(c => c.symbol === this.settings.pinnedCoin);
      updateBadge(pinnedData);
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

  renderCryptoData(lang) {
    const existingContainer = this.elements.cryptoList.querySelector('.crypto-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    if (!this.cryptoData || this.cryptoData.length === 0) {
      return;
    }
    
    const cryptoContainer = document.createElement('div');
    cryptoContainer.className = 'crypto-container';

    const fragment = document.createDocumentFragment();
    
    this.cryptoData.forEach(crypto => {
      const cryptoItem = document.createElement('div');
      cryptoItem.className = 'crypto-item';

      const upperSymbol = (crypto.symbol || '').toUpperCase();
      cryptoItem.dataset.symbol = upperSymbol;
      cryptoItem.dataset.geckoId = crypto.id; // Use the correct ID from data
      
      const cryptoInfo = document.createElement('div');
      cryptoInfo.className = 'crypto-info';
      try {
        const tip = I18N.t('clickToOpenCoinGecko', this.settings.language || I18N.DEFAULT_LANGUAGE);
        if (tip) cryptoInfo.title = tip;
      } catch (_) {}
      
      const cryptoIcon = document.createElement('div');
      cryptoIcon.className = 'crypto-icon';
      
      if (crypto.image) {
        const iconImg = document.createElement('img');
        iconImg.src = crypto.image;
        iconImg.alt = crypto.name;
        iconImg.style.width = '100%';
        iconImg.style.height = '100%';
        iconImg.style.borderRadius = '50%';
        iconImg.style.cursor = 'pointer';
        iconImg.addEventListener('click', () => {
          this.showImageModal(crypto.image, crypto.name);
        });
        cryptoIcon.appendChild(iconImg);
      } else {
        cryptoIcon.textContent = crypto.symbol.substring(0, 2).toUpperCase();
      }
      
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

      const pinButton = document.createElement('button');
      pinButton.className = 'pin-button';
      pinButton.innerHTML = '★';
      pinButton.title = I18N.t('pinTooltip', this.settings.language);
      pinButton.setAttribute('data-symbol', crypto.symbol);
      if (crypto.symbol === this.settings.pinnedCoin) {
        pinButton.classList.add('pinned');
      }
      priceContainer.appendChild(pinButton);
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'crypto-delete-btn';
      deleteButton.innerHTML = '×';
      deleteButton.title = I18N.t('removeCoinTooltip', lang);
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

  setupAutoRefresh() {
    this.clearRefreshTimer();
    const interval = parseInt(this.settings.refreshInterval, 10);
    if (interval > 0) {
      this.refreshTimer = setInterval(() => {
        this.fetchCryptoData();
      }, interval * 1000);
    }
  }

  clearRefreshTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  getCoinGeckoId(coin) {
    if (!coin || typeof coin !== 'string') {
      return null;
    }
    const upperCoin = coin.toUpperCase();
    if (this.settings.coinGeckoIds && this.settings.coinGeckoIds[upperCoin]) {
      return this.settings.coinGeckoIds[upperCoin];
    }
    if (Config.COIN_GECKO_IDS && Config.COIN_GECKO_IDS[upperCoin]) {
      return Config.COIN_GECKO_IDS[upperCoin];
    }
    return coin.toLowerCase();
  }

  getCoinName(coin) {
    const currentLang = this.settings.language || I18N.DEFAULT_LANGUAGE;
    const coinGeckoId = this.getCoinGeckoId(coin);
    const translatedName = I18N.t(coinGeckoId, currentLang);
    if (translatedName && translatedName !== coinGeckoId) {
      return translatedName;
    }
    return coin;
  }

  formatPrice(price) {
    if (price === null || price === undefined) {
      return `${Config.CURRENCY_SYMBOLS[this.settings.currency] || ''}-`;
    }
    const symbol = Config.CURRENCY_SYMBOLS[this.settings.currency] || '';
    if (price >= 1000) {
      return `${symbol}${price.toLocaleString()}`;
    } else if (price >= 1) {
      return `${symbol}${price.toFixed(2)}`;
    } else {
      return `${symbol}${price.toFixed(5)}`;
    }
  }

  toSubscript(num) {
    const subscriptMap = {'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉'};
    return num.toString().split('').map(digit => subscriptMap[digit] || digit).join('');
  }

  formatChange(change) {
    if (change === undefined || change === null) return 'N/A';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  }

  getChangeClass(change) {
    if (change === undefined || change === null) return '';
    return change >= 0 ? 'positive' : 'negative';
  }

  updateLastUpdated() {
    const now = new Date();
    this.elements.lastUpdated.textContent = now.toLocaleTimeString();
  }

   showImageModal(imageSrc, altText) {
     if (this.elements.imageModal && this.elements.modalImage) {
       this.elements.modalImage.src = imageSrc;
       this.elements.modalImage.alt = altText;
       this.elements.imageModal.classList.add('show');
       document.body.style.overflow = 'hidden';
     }
   }
 
   closeImageModal() {
     if (this.elements.imageModal) {
       this.elements.imageModal.classList.remove('show');
       document.body.style.overflow = '';
     }
   }

   showMainPage() {
     try {
       this.currentPage = 'main';
       this.currentCoin = null;
       if (this.elements.coinDetailPage && this.elements.mainPage) {
         this.elements.coinDetailPage.classList.remove('active');
         this.elements.mainPage.classList.add('active');
       }
       if (this.priceChart) {
         this.priceChart.destroy?.();
         this.priceChart = null;
       }
     } catch (error) {
       console.error('[Navigation] Error showing main page:', error);
     }
   }

   async showCoinDetails(coinId, symbol) {
     try {
       this.currentPage = 'detail';
       this.currentCoin = { id: coinId, symbol: symbol };
       if (this.elements.mainPage && this.elements.coinDetailPage) {
         this.elements.mainPage.classList.remove('active');
         this.elements.coinDetailPage.classList.add('active');
       }
       if (this.elements.coinDetailSymbol) {
         this.elements.coinDetailSymbol.textContent = symbol;
       }
       if (this.elements.coinDetailName) {
         this.elements.coinDetailName.textContent = 'Loading...';
       }
       if (this.elements.priceChart) {
         this.priceChart = new PriceChart(this.elements.priceChart);
         this.priceChart.showLoading();
       }
       await this.loadCoinDetails(coinId);
     } catch (error) {
       console.error('[CoinDetails] Error showing coin details:', error);
       this.showMainPage();
     }
   }

   async loadCoinDetails(coinId) {
     if (!coinId) {
       this.showMessage(I18N.t('invalidCoinId'), 'error');
       this.showMainPage();
       return;
     }

     const currency = this.settings?.currency?.toLowerCase() || 'usd';
     
     try {
       const [details, history] = await Promise.all([
         coinDetailService.getCoinDetails(coinId, currency),
         coinDetailService.getCoinHistory(coinId, currency, 7)
       ]);
       
       if (!details || !details.symbol) {
         throw new Error('Invalid coin details received');
       }
       
       this.updateCoinDetailsUI(details);
       
       if (this.priceChart && history && history.length > 0) {
         this.priceChart.setData(history);
         if (this.elements.chartLoading) {
           this.elements.chartLoading.style.display = 'none';
         }
       } else if (this.priceChart) {
         this.priceChart.showError(I18N.t('noHistoricalData'));
         if (this.elements.chartLoading) {
           this.elements.chartLoading.style.display = 'none';
         }
       }
       
       if (typeof this.showCoinNews === 'function') {
         this.showCoinNews([]);
       }
       
     } catch (error) {
       console.error('[CoinDetails] Error loading coin details:', error);
       let errorMessage = I18N.t('loadingCoinDetailsFailed');
       if (error.message.includes('404')) {
         errorMessage = I18N.t('coinNotFound');
       } else if (error.message.includes('timeout')) {
         errorMessage = I18N.t('networkRequestTimeout');
       }
       this.showMessage(errorMessage, 'error');
       
       if (this.priceChart) {
         this.priceChart.showError(I18N.t('chartDataLoadingFailed'));
       }
       
       setTimeout(() => {
         this.showMainPage();
       }, 3000);
     }
   }

   updateCoinDetailsUI(details) {
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
     const currencySymbol = Config.CURRENCY_SYMBOLS[details.currency] || '';
     if (this.elements.coinDetailPrice) {
       this.elements.coinDetailPrice.textContent = `${currencySymbol}${this.formatPrice(details.currentPrice)}`;
     }
     const change24h = details.priceChange24h;
     if (this.elements.coinDetailChange24h) {
       const changeEl = this.elements.coinDetailChange24h;
       changeEl.textContent = `${change24h > 0 ? '+' : ''}${change24h.toFixed(2)}%`;
       changeEl.className = 'change-value ' + (change24h > 0 ? 'positive' : 'negative');
     }
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

   formatLargeNumber(number, symbol = '') {
     if (!number || number === 0) return 'N/A';
     if (number >= 1e12) {
       return `${symbol}${(number / 1e12).toFixed(2)}T`;
     } else if (number >= 1e9) {
       return `${symbol}${(number / 1e9).toFixed(2)}B`;
     } else if (number >= 1e6) {
       return `${symbol}${(number / 1e6).toFixed(2)}M`;
     } else {
       return `${symbol}${number.toLocaleString()}`;
     }
   }

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

   toggleDebugMode() {
     console.log('[Debug] 启动网络调试模式');
     this.showMessage('调试模式已启动，检查控制台输出', 'info');
     this.runNetworkDiagnostics();
   }

   async runNetworkDiagnostics() {
     // ... (omitted for brevity)
   }

  updateCoinDetailPageLanguage(lang) {
    document.querySelectorAll('#coinDetailPage [data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      element.textContent = I18N.t(key, lang);
    });
  }

  async togglePinCoin(symbol) {
    if (this.settings.pinnedCoin === symbol) {
      this.settings.pinnedCoin = null;
    } else {
      this.settings.pinnedCoin = symbol;
    }

    await this.saveSettings();
    this.renderCryptoData();
  }
}

// 创建应用实例
const app = new CryptoApp();
