import { Config } from '../config.js';
import { storageService } from '../services/StorageService.js';

/**
 * A client for interacting with the CoinGecko API.
 * Handles all HTTP requests and centralizes API logic.
 */
class CoinGeckoClient {
  constructor() {
    this.baseUrl = Config.API_BASE_URL;
  }

  /**
   * Private helper to perform fetch requests and handle common errors.
   * @param {string} url The full URL to fetch.
   * @returns {Promise<any|null>} The JSON response or null if an error occurred.
   */
  async _fetch(url) {
    // Wait for storage to be ready
    await storageService.ready();

    const lockState = storageService.get('appStatus.coinGeckoApiLock');

    if (lockState && Date.now() < lockState.unlockTime) {
      console.warn('[Circuit Breaker] API is locked. Request blocked.');
      return { error: 'API_LOCKED' };
    }

    const now = Date.now();
    let stats = storageService.get('appStatus.apiCallStats', { count: 0, startTime: now });

    if (now - stats.startTime > 60000) {
      stats = { count: 1, startTime: now };
    } else {
      stats.count++;
    }
    await storageService.set('appStatus.apiCallStats', stats);
    console.log(`[API Counter] CoinGecko API calls in the current minute: ${stats.count}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 429) {
          const unlockTime = Date.now() + 60000; // Lock for 1 minute
          await storageService.set('appStatus.coinGeckoApiLock', { unlockTime });
          console.error(`[Circuit Breaker] Rate limit hit. Locking API until ${new Date(unlockTime).toLocaleTimeString()}`);
        }
        console.error(`HTTP error! status: ${response.status}`, await response.text());
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("CoinGeckoClient: API request failed.", error);
      return null;
    }
  }

  /**
   * Searches for cryptocurrencies.
   * @param {string} query The search query.
   * @returns {Promise<any|null>}
   */
  async search(query) {
    const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}`;
    return this._fetch(url);
  }

  /**
   * Gets market data for a list of coins.
   * @param {string[]} ids Array of coin IDs (e.g., ['bitcoin', 'ethereum']).
   * @param {string} currency The target currency (e.g., 'usd').
   * @returns {Promise<any[]|null>}
   */
  async getMarkets(ids, currency = 'usd') {
    if (!ids || ids.length === 0) {
      return [];
    }
    const idString = ids.join(',');
    const url = `${this.baseUrl}/coins/markets?vs_currency=${currency.toLowerCase()}&ids=${idString}&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h`;
    return this._fetch(url);
  }

  /**
   * Gets detailed data for a single coin.
   * @param {string} coinId The coin ID.
   * @returns {Promise<any|null>}
   */
  async getCoin(coinId) {
    const url = `${this.baseUrl}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    return this._fetch(url);
  }

  /**
   * Gets market chart data for a coin.
   * @param {string} coinId The coin ID.
   * @param {string} currency The target currency.
   * @param {string|number} days The number of days of data.
   * @returns {Promise<any|null>}
   */
  async getMarketChart(coinId, currency = 'usd', days = '1') {
    const interval = this.getInterval(days);
    const url = `${this.baseUrl}/coins/${coinId}/market_chart?vs_currency=${currency.toLowerCase()}&days=${days}&interval=${interval}`;
    return this._fetch(url);
  }

  /**
   * Helper to determine the correct interval for the market chart.
   * @param {string|number} days The number of days.
   * @returns {string} 'hourly' or 'daily'.
   */
  getInterval(days) {
    const d = Number(days);
    if (d <= 1) return 'hourly';
    return 'daily';
  }
}

export default new CoinGeckoClient();
