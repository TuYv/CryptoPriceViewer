/**
 * 格式化价格以便在徽章中显示
 * @param {number} price
 * @returns {string}
 */
function formatPriceForBadge(price) {
  if (price >= 10000) {
    return (price / 1000).toFixed(1) + 'k';
  } else if (price >= 1000) {
    return (price / 1000).toFixed(1) + 'k';
  } else if (price >= 1) {
    return Math.floor(price).toString();
  } else {
    return price.toFixed(2);
  }
}

/**
 * 更新扩展图标的徽章
 * @param {object|null} coinData - 包含价格和变动信息的对象，或null以清除徽章
 * @param {boolean} isError - 是否是错误状态，错误时显示红色徽章
 */
export async function updateBadge(coinData, isError = false) {
  if (isError) {
    await chrome.action.setBadgeText({ text: '!' });
    await chrome.action.setBadgeBackgroundColor({ color: '#e53e3e' });
    return;
  }

  if (coinData && typeof coinData.price === 'number') {
    const priceText = formatPriceForBadge(coinData.price);
    const color = coinData.change24h >= 0 ? '#38a169' : '#e53e3e';
    
    await chrome.action.setBadgeText({ text: priceText });
    await chrome.action.setBadgeBackgroundColor({ color: color });
  } else {
    await chrome.action.setBadgeText({ text: '' });
  }
}
