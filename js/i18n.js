/**
 * 多语言配置文件
 * 支持中文、英文、日文、韩文
 */

export const I18N = {
  // 支持的语言列表
  SUPPORTED_LANGUAGES: [
    { code: 'zh', name: '中文', nativeName: '中文' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' }
  ],

  // 默认语言
  DEFAULT_LANGUAGE: 'en',

  // 翻译资源
  TRANSLATIONS: {
    zh: {
      // 应用标题
      appTitle: '加密货币价格查看器',
      
      // 主界面
      refresh: '刷新',
      settings: '设置',
      lastUpdated: '最后更新',
      loading: '加载中...',
      noData: '暂无数据',
      error: '加载失败，请稍后重试',
      apiErrorPrefix: 'API错误',
      unknownErrorShort: '未知错误',
      unknownErrorFull: '发生未知错误，请刷新页面重试',
      networkError: '网络连接失败，请检查网络连接',
      apiErrorGeneric: 'API请求失败，请稍后重试',
      storageError: '数据存储失败，请检查浏览器设置',
      validationError: '输入的数据格式不正确',
      authError: '身份验证失败，请重新登录',
      rateLimitError: '请求过于频繁，请稍后再试',
      clickToOpenCoinGecko: '点击查看该币种在 CoinGecko 上的详细信息',
      
      // 搜索功能
      searchPlaceholder: '搜索币种...',
      searchButton: '搜索',
      search: '搜索',
      searchResults: '搜索结果',
      addCoin: '添加',
      add: '添加',
      coinAdded: '已添加',
      added: '已添加',
      searchLoading: '搜索中...',
      noSearchResults: '未找到相关币种',
      searchError: '搜索失败，请重试',
      searchRateLimit: '搜索请求过于频繁，请稍后再试...',
      
      // 反馈功能
      feedback: '反馈',
      feedbackTitle: '用户反馈',
      donationTip: '如果这个工具对您有帮助，欢迎给我打赏支持一下！',
      feedbackPlaceholder: '请输入您的反馈意见...(记得带上您的联系方式 这样我才能找得到你',
      sendFeedback: '发送反馈',
      feedbackSuccess: '反馈发送成功！感谢您的宝贵意见。',
      feedbackError: '反馈发送失败，请稍后重试。',
      feedbackEmpty: '请输入反馈内容',
      feedbackRateLimitPrefix: '发送过于频繁，请等待 ',
      secondsSuffixRetry: ' 秒后再试',
      feedbackSentWithIdPrefix: '反馈已成功发送！反馈ID: ',
      feedbackSendFailedPrefix: '发送失败: ',
      notionNotConfigured: '请先配置 Notion 集成后再发送反馈。',
      notionConfigSaved: 'Notion 配置已保存',
      notionConfigCleared: 'Notion 配置已清除',
      notionConfigIncomplete: '请填写完整的 Notion 配置信息',
      notionConfigSaveFailed: '保存 Notion 配置失败',
      justNow: '刚刚',
      minutesAgoSuffix: '分钟前',
      hoursAgoSuffix: '小时前',
      daysAgoSuffix: '天前',
      coinSelection: '币种选择',
      refreshInterval: '刷新间隔',
      currency: '显示货币',
      language: '语言',
      coinManagement: '币种管理',
      addedCoins: '已添加的币种',
      noCoinsAdded: '暂无添加的币种',
      removeCoin: '删除币种',
      save: '保存',
      cancel: '取消',
      
      // 刷新间隔选项
      interval30s: '30秒',
      interval1m: '1分钟',
      interval5m: '5分钟',
      interval10m: '10分钟',
      interval30m: '30分钟',
      refreshOff: '关闭自动刷新',
      
      // 货币选项
      currencyUSD: '美元 (USD)',
      currencyCNY: '人民币 (CNY)',
      currencyEUR: '欧元 (EUR)',
      currencyJPY: '日元 (JPY)',
      currencyKRW: '韩元 (KRW)',
      
      // 币种详情页面
      pinTooltip: '点击收藏，将价格固定到扩展图标上',
      removeCoinTooltip: '删除币种',
      back: '返回',
      currentPrice: '当前价格',
      change24h: '24h变化',
      marketCap: '市值',
      volume24h: '24h交易量',
      circulatingSupply: '流通供应量',
      totalSupply: '总供应量',
      allTimeHigh: '历史最高',
      allTimeLow: '历史最低',
      relatedNews: '相关新闻',
      priceChart: '价格图表',
      marketStats: '市场统计',
      noNews: '暂无新闻',
      invalidCoinId: '无效的币种ID',
      loadingCoinDetailsFailed: '加载币种详情失败，请稍后重试',
      coinNotFound: '币种信息未找到，请检查币种ID是否正确',
      networkRequestTimeout: '网络请求超时，请检查网络连接',
      networkConnectionFailed: '网络连接失败，请检查网络设置',
      invalidCoinData: '币种数据格式异常，请稍后重试',
      apiServiceUnavailable: 'API服务暂时不可用，请稍后重试',
      chartDataLoadingFailed: '图表数据加载失败',
      noHistoricalData: '暂无历史数据',
      loading: '加载中...',

      // 币种名称
      bitcoin: '比特币',
      ethereum: '以太坊',
      binancecoin: '币安币',
      solana: '索拉纳',
      ripple: '瑞波币',
      cardano: '艾达币',
      dogecoin: '狗狗币',
      polkadot: '波卡',
      
      // Footer文本
      dataSource: '数据来源: CoinGecko API'
    },
    
    en: {
      // App title
      appTitle: 'Crypto Price Viewer',
      
      // Main interface
      refresh: 'Refresh',
      settings: 'Settings',
      lastUpdated: 'Last Updated',
      loading: 'Loading...',
      noData: 'No data available',
      error: 'Failed to load, please try again later',
      apiErrorPrefix: 'API error',
      unknownErrorShort: 'Unknown error',
      unknownErrorFull: 'An unknown error occurred. Please refresh and try again.',
      networkError: 'Network connection failed. Please check your network.',
      apiErrorGeneric: 'API request failed, please try again later.',
      storageError: 'Data storage failed, please check your browser settings.',
      validationError: 'Invalid input format.',
      authError: 'Authentication failed, please sign in again.',
      rateLimitError: 'Too many requests, please try again later.',
      clickToOpenCoinGecko: 'Click to view detailed information on CoinGecko',
      
      // Search functionality
      searchPlaceholder: 'Search coins...',
      searchButton: 'Search',
      search: 'Search',
      searchResults: 'Search Results',
      addCoin: 'Add',
      add: 'Add',
      coinAdded: 'Added',
      added: 'Added',
      searchLoading: 'Searching...',
      noSearchResults: 'No coins found',
      searchError: 'Search failed, please try again',
      searchRateLimit: 'Too many search requests, please try again later...',
      
      // 反馈功能
      feedback: 'Feedback',
      feedbackTitle: 'User Feedback',
      donationTip: 'If this tool has helped you, buying me a coffee would be greatly appreciated!',
      feedbackPlaceholder: 'Please enter your feedback... (Please include your contact information so I can reach you)',
      sendFeedback: 'Send Feedback',
      feedbackSuccess: 'Feedback sent successfully! Thank you for your valuable input.',
      feedbackError: 'Failed to send feedback, please try again later.',
      feedbackEmpty: 'Please enter your feedback',
      feedbackRateLimitPrefix: 'Too frequent. Please wait ',
      secondsSuffixRetry: ' seconds before retrying',
      feedbackSentWithIdPrefix: 'Feedback sent successfully! ID: ',
      feedbackSendFailedPrefix: 'Send failed: ',
      notionNotConfigured: 'Please configure Notion integration before sending feedback.',
      notionConfigSaved: 'Notion configuration saved',
      notionConfigCleared: 'Notion configuration cleared',
      notionConfigIncomplete: 'Please complete the Notion configuration information',
      notionConfigSaveFailed: 'Failed to save Notion configuration',
      justNow: 'just now',
      minutesAgoSuffix: ' minutes ago',
      hoursAgoSuffix: ' hours ago',
      daysAgoSuffix: ' days ago',
      coinSelection: 'Coin Selection',
      refreshInterval: 'Refresh Interval',
      currency: 'Display Currency',
      language: 'Language',
      coinManagement: 'Coin Management',
      addedCoins: 'Added Coins',
      noCoinsAdded: 'No coins added yet',
      removeCoin: 'Remove Coin',
      save: 'Save',
      cancel: 'Cancel',
      
      // Refresh interval options
      interval30s: '30 seconds',
      interval1m: '1 minute',
      interval5m: '5 minutes',
      interval10m: '10 minutes',
      interval30m: '30 minutes',
      refreshOff: 'Auto refresh off',
      
      // Currency options
      currencyUSD: 'US Dollar (USD)',
      currencyCNY: 'Chinese Yuan (CNY)',
      currencyEUR: 'Euro (EUR)',
      currencyJPY: 'Japanese Yen (JPY)',
      currencyKRW: 'Korean Won (KRW)',
      
      // Coin Detail Page
      pinTooltip: 'Click to pin the price to the extension icon',
      removeCoinTooltip: 'Remove Coin',
      back: 'Back',
      currentPrice: 'Current Price',
      change24h: '24h Change',
      marketCap: 'Market Cap',
      volume24h: '24h Volume',
      circulatingSupply: 'Circulating Supply',
      totalSupply: 'Total Supply',
      allTimeHigh: 'All Time High',
      allTimeLow: 'All Time Low',
      relatedNews: 'Related News',
      priceChart: 'Price Chart',
      marketStats: 'Market Stats',
      noNews: 'No news available',
      invalidCoinId: 'Invalid coin ID',
      loadingCoinDetailsFailed: 'Failed to load coin details, please try again later',
      coinNotFound: 'Coin information not found, please check the coin ID',
      networkRequestTimeout: 'Network request timed out, please check your network connection',
      networkConnectionFailed: 'Network connection failed, please check your network settings',
      invalidCoinData: 'Invalid coin data format, please try again later',
      apiServiceUnavailable: 'API service is temporarily unavailable, please try again later',
      chartDataLoadingFailed: 'Chart data loading failed',
      noHistoricalData: 'No historical data available',
      loading: 'Loading...',

      // 币种名称
      bitcoin: 'Bitcoin',
      ethereum: 'Ethereum',
      binancecoin: 'Binance Coin',
      solana: 'Solana',
      ripple: 'XRP',
      cardano: 'Cardano',
      dogecoin: 'Dogecoin',
      polkadot: 'Polkadot',
      
      // Footer文本
      dataSource: 'Data Source: CoinGecko API'
    },
    
    ja: {
      // アプリタイトル
      appTitle: '暗号通貨価格ビューア',
      
      // メインインターフェース
      refresh: '更新',
      settings: '設定',
      lastUpdated: '最終更新',
      loading: '読み込み中...',
      noData: 'データがありません',
      error: '読み込みに失敗しました。後でもう一度お試しください',
      apiErrorPrefix: 'APIエラー',
      unknownErrorShort: '不明なエラー',
      unknownErrorFull: '不明なエラーが発生しました。ページを更新して再試行してください。',
      networkError: 'ネットワーク接続に失敗しました。ネットワークを確認してください。',
      apiErrorGeneric: 'APIリクエストに失敗しました。後でもう一度お試しください。',
      storageError: 'データの保存に失敗しました。ブラウザ設定を確認してください。',
      validationError: '入力データの形式が正しくありません。',
      authError: '認証に失敗しました。再度ログインしてください。',
      rateLimitError: 'リクエストが多すぎます。しばらくしてから再試行してください。',
      clickToOpenCoinGecko: 'CoinGeckoで詳細情報を見るにはクリックしてください',
      
      // 検索機能
      searchPlaceholder: 'コインを検索...',
      searchButton: '検索',
      search: '検索',
      searchResults: '検索結果',
      addCoin: '追加',
      add: '追加',
      coinAdded: '追加済み',
      added: '追加済み',
      searchLoading: '検索中...',
      noSearchResults: 'コインが見つかりません',
      searchError: '検索に失敗しました。もう一度お試しください',
      searchRateLimit: '検索リクエストが多すぎます。しばらくしてからもう一度お試しください...',
      
      // フィードバック機能
      feedback: 'フィードバック',
      feedbackTitle: 'ユーザーフィードバック',
      donationTip: 'このツールがお役に立ちましたら、ぜひ寄付でサポートしてください！',
      feedbackPlaceholder: 'フィードバックを入力してください...(連絡先情報も含めてください)',
      sendFeedback: 'フィードバック送信',
      feedbackSuccess: 'フィードバックが正常に送信されました！貴重なご意見をありがとうございます。',
      feedbackError: 'フィードバックの送信に失敗しました。後でもう一度お試しください。',
      feedbackEmpty: 'フィードバック内容を入力してください',
      feedbackRateLimitPrefix: '送信頻度が高すぎます。 ',
      secondsSuffixRetry: ' 秒後に再試行してください',
      feedbackSentWithIdPrefix: 'フィードバックが正常に送信されました！ID: ',
      feedbackSendFailedPrefix: '送信に失敗しました: ',
      notionNotConfigured: 'フィードバックの送信前に Notion 連携を設定してください。',
      notionConfigSaved: 'Notion 設定を保存しました',
      notionConfigCleared: 'Notion 設定をクリアしました',
      notionConfigIncomplete: 'Notion の設定情報を完全に入力してください',
      notionConfigSaveFailed: 'Notion 設定の保存に失敗しました',
      
      // 設定パネル
      // 设置面板（韩文）
      settingsTitle: '설정',
      coinSelection: '코인 선택',
      refreshInterval: '새로고침 간격',
      currency: '표시 통화',
      language: '언어',
      coinManagement: '코인 관리',
      addedCoins: '추가된 코인',
      noCoinsAdded: '아직 추가된 코인이 없습니다',
      removeCoin: '코인 삭제',
      save: '저장',
      cancel: '취소',
      
      // 새로고침 간격 옵션（韩文）
      interval30s: '30초',
      interval1m: '1분',
      interval5m: '5분',
      interval10m: '10분',
      interval30m: '30분',
      refreshOff: '자동 새로고침 끄기',
      
      // 통화 옵션（韩文）
      currencyUSD: '미국 달러 (USD)',
      currencyCNY: '중국 위안 (CNY)',
      currencyEUR: '유로 (EUR)',
      currencyJPY: '일본 엔 (JPY)',
      currencyKRW: '한국 원 (KRW)',
      
      // 코인 상세 페이지
      pinTooltip: '클릭하여 가격을 확장 아이콘에 고정',
      removeCoinTooltip: '코인 삭제',
      back: '뒤로',
      currentPrice: '현재 가격',
      change24h: '24h 변동',
      marketCap: '시가총액',
      volume24h: '24h 거래량',
      circulatingSupply: '유통 공급량',
      totalSupply: '총 공급량',
      allTimeHigh: '사상 최고가',
      allTimeLow: '사상 최저가',
      relatedNews: '관련 뉴스',
      loading: '로딩 중...',

      // 코인 이름（韩文）
      bitcoin: '비트코인',
      ethereum: '이더리움',
      binancecoin: '바이낸스 코인',
      solana: '솔라나',
      ripple: '리플',
      cardano: '카르다노',
      dogecoin: '도지코인',
      polkadot: '폴카닷',
      
      // Footer 텍스트（韩文）
      dataSource: '데이터 소스: CoinGecko API'
    },
    
    ko: {
      // 앱 제목
      appTitle: '암호화폐 가격 뷰어',
      
      // 메인 인터페이스
      refresh: '새로고침',
      settings: '설정',
      lastUpdated: '마지막 업데이트',
      loading: '로딩 중...',
      noData: '데이터가 없습니다',
      error: '로드에 실패했습니다. 나중에 다시 시도해주세요',
      apiErrorPrefix: 'API 오류',
      unknownErrorShort: '알 수 없는 오류',
      unknownErrorFull: '알 수 없는 오류가 발생했습니다. 새로고침 후 다시 시도하세요.',
      networkError: '네트워크 연결에 실패했습니다. 네트워크를 확인하세요.',
      apiErrorGeneric: 'API 요청에 실패했습니다. 나중에 다시 시도하세요.',
      storageError: '데이터 저장에 실패했습니다. 브라우저 설정을 확인하세요.',
      validationError: '입력 데이터 형식이 올바르지 않습니다.',
      authError: '인증에 실패했습니다. 다시 로그인하세요.',
      rateLimitError: '요청이 너무 많습니다. 잠시 후 다시 시도하세요.',
      clickToOpenCoinGecko: '클릭하여 CoinGecko에서 자세한 정보를 확인하세요',
      
      // 검색 기능
      searchPlaceholder: '코인 검색...',
      searchButton: '검색',
      search: '검색',
      searchResults: '검색 결과',
      addCoin: '추가',
      add: '추가',
      coinAdded: '추가됨',
      added: '추가됨',
      searchLoading: '검색 중...',
      noSearchResults: '코인을 찾을 수 없습니다',
      searchError: '검색에 실패했습니다. 다시 시도해주세요',
      searchRateLimit: '검색 요청이 너무 많습니다. 잠시 후 다시 시도해주세요...',
      
      // 피드백 기능
      feedback: '피드백',
      feedbackTitle: '사용자 피드백',
      donationTip: '이 도구가 도움이 되셨다면 후원으로 응원해주세요!',
      feedbackPlaceholder: '피드백을 입력해주세요... (연락처 정보도 포함해주세요)',
      sendFeedback: '피드백 전송',
      feedbackSuccess: '피드백이 성공적으로 전송되었습니다! 소중한 의견 감사합니다.',
      feedbackError: '피드백 전송에 실패했습니다. 나중에 다시 시도해주세요.',
      feedbackEmpty: '피드백 내용을 입력해주세요',
      feedbackRateLimitPrefix: '너무 빈번합니다. ',
      secondsSuffixRetry: ' 초 후에 다시 시도하세요',
      feedbackSentWithIdPrefix: '피드백이 성공적으로 전송되었습니다! ID: ',
      feedbackSendFailedPrefix: '전송 실패: ',
      notionNotConfigured: '피드백을 보내기 전에 Notion 연동을 설정해주세요.',
      notionConfigSaved: 'Notion 설정이 저장되었습니다',
      notionConfigCleared: 'Notion 설정이 삭제되었습니다',
      notionConfigIncomplete: 'Notion 설정 정보를 완전히 입력해주세요',
      notionConfigSaveFailed: 'Notion 설정 저장에 실패했습니다',
      
      // 設定パネル
      settingsTitle: '設定',
      coinSelection: 'コイン選択',
      refreshInterval: '更新間隔',
      currency: '表示通貨',
      language: '言語',
      coinManagement: 'コイン管理',
      addedCoins: '追加されたコイン',
      noCoinsAdded: 'まだコインが追加されていません',
      removeCoin: 'コインを削除',
      save: '保存',
      cancel: 'キャンセル',
      
      // 更新間隔オプション
      interval30s: '30秒',
      interval1m: '1分',
      interval5m: '5分',
      interval10m: '10分',
      interval30m: '30分',
      refreshOff: '自動更新オフ',
      
      // 通貨オプション
      currencyUSD: '米ドル (USD)',
      currencyCNY: '中国元 (CNY)',
      currencyEUR: 'ユーロ (EUR)',
      currencyJPY: '日本円 (JPY)',
      currencyKRW: '韓国ウォン (KRW)',
      
      // コイン詳細ページ
      pinTooltip: 'クリックして価格を拡張機能アイコンに固定します',
      removeCoinTooltip: 'コインを削除',
      back: '戻る',
      currentPrice: '現在価格',
      change24h: '24h変動',
      marketCap: '時価総額',
      volume24h: '24h取引量',
      circulatingSupply: '流通供給量',
      totalSupply: '総供給量',
      allTimeHigh: '過去最高値',
      allTimeLow: '過去最安値',
      relatedNews: '関連ニュース',
      loading: '読み込み中...',

      // 币种名称
      bitcoin: 'ビットコイン',
      ethereum: 'イーサリアム',
      binancecoin: 'バイナンスコイン',
      solana: 'ソラナ',
      ripple: 'リップル',
      cardano: 'カルダノ',
      dogecoin: 'ドージコイン',
      polkadot: 'ポルカドット',
      
      // Footer文本
      dataSource: 'データソース: CoinGecko API'
    }
  },

  /**
   * 获取当前语言
   */
  getCurrentLanguage() {
    try {
      // 1) 内存优先：应用的单一事实来源
      if (window.cryptoApp && window.cryptoApp.settings && window.cryptoApp.settings.language) {
        return window.cryptoApp.settings.language;
      }
      // 2) 回退到存储
      const settings = storage.getSync(Config.STORAGE_KEY, {}) || {};
      return settings.language || this.DEFAULT_LANGUAGE;
    } catch (error) {
      return this.DEFAULT_LANGUAGE;
    }
  },

  /**
   * 设置当前语言
   */
  setCurrentLanguage(languageCode) {
    try {
      // 1) 先更新内存，驱动 UI 立即一致
      if (window.cryptoApp && window.cryptoApp.settings) {
        window.cryptoApp.settings.language = languageCode;
      }
      // 2) 再持久化存储（异步，不阻塞）
      const settings = storage.getSync(Config.STORAGE_KEY, {}) || {};
      settings.language = languageCode;
      storage.set(Config.STORAGE_KEY, settings);
    } catch (error) {
      console.warn('Failed to save language setting:', error);
    }
  },

  /**
   * 获取翻译文本
   */
  t(key, languageCode = null) {
    const lang = languageCode || this.getCurrentLanguage();
    const translations = this.TRANSLATIONS[lang] || this.TRANSLATIONS[this.DEFAULT_LANGUAGE];
    return translations[key] || key;
  },

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages() {
    return this.SUPPORTED_LANGUAGES;
  }
};

// 全局翻译函数
window.t = (key, languageCode = null) => I18N.t(key, languageCode);

export default I18N;