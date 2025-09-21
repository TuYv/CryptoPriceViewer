import { get, set } from '../lib/deep-storage.js';

const STATE_KEY = 'cryptoPriceViewerState';

class StorageService {
  constructor() {
    this._state = null;
    this._initPromise = this._initialize();
  }

  async _initialize() {
    try {
      let storedState = (await chrome.storage.local.get(STATE_KEY))[STATE_KEY];

      if (!storedState) {
        console.log('New storage state not found, attempting to migrate from old version...');
        const oldSettings = await chrome.storage.local.get('crypto_tracker_settings');
        const oldNotionToken = await chrome.storage.local.get('notionToken');
        const oldNotionDbId = await chrome.storage.local.get('notionDatabaseId');

        if (Object.keys(oldSettings).length > 0) {
          console.log('Old settings found, migrating...');
          const initialState = this.getInitialState();
          initialState.settings = oldSettings.crypto_tracker_settings;
          initialState.notionConfig.token = oldNotionToken.notionToken || null;
          initialState.notionConfig.databaseId = oldNotionDbId.notionDatabaseId || null;
          
          this._state = initialState;
          await this._persistState();

          // Clean up old keys
          await chrome.storage.local.remove(['crypto_tracker_settings', 'notionToken', 'notionDatabaseId', 'coinGeckoApiLockState']);
          console.log('Migration complete and old keys removed.');
        } else {
          console.log('No old settings found, using initial state.');
          this._state = this.getInitialState();
        }
      } else {
        this._state = storedState;
      }
    } catch (e) {
      console.error("Failed to initialize or migrate storage state:", e);
      this._state = this.getInitialState();
    }
  }

  async ready() {
    return this._initPromise;
  }

  getState() {
    return this._state;
  }

  get(path, defaultValue = undefined) {
    if (!path) {
      return this._state;
    }
    return get(this._state, path, defaultValue);
  }

  async set(path, value) {
    set(this._state, path, value);
    await this._persistState();
  }

  async _persistState() {
    try {
      await chrome.storage.local.set({ [STATE_KEY]: this._state });
    } catch (e) {
      console.error("Failed to persist state to storage:", e);
    }
  }

  getInitialState() {
    return {
      settings: {
        selectedCoins: ['BTC', 'ETH', 'BNB', 'SOL'],
        currency: 'USD',
        refreshInterval: 300,
        language: 'en',
        pinnedCoin: null,
        coinGeckoIds: {
          BTC: 'bitcoin',
          ETH: 'ethereum',
          BNB: 'binancecoin',
          SOL: 'solana'
        },
        coinNames: {
          BTC: 'Bitcoin',
          ETH: 'Ethereum',
          BNB: 'Binance Coin',
          SOL: 'Solana'
        }
      },
      appStatus: {
        coinGeckoApiLock: { unlockTime: 0 },
        apiCallStats: { count: 0, startTime: 0 },
        lastFeedbackTime: 0
      },
      cache: {
        marketData: []
      },
      notionConfig: {
        token: null,
        databaseId: null
      }
    };
  }
}

export const storageService = new StorageService();
