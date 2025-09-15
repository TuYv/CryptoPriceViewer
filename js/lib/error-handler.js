/**
 * 错误处理器 - 统一错误处理逻辑
 * [OPT-5] 解决错误处理不一致问题
 */

import { messageSystem } from './message-system.js';
import { I18N } from '../i18n.js';

export class ErrorHandler {
  constructor() {
    this.errorTypes = new Map();
    this.handlers = new Map();
    this.fallbackHandler = this.defaultFallbackHandler;
    this.logLevel = 'error'; // debug, info, warn, error
    
    this.setupDefaultErrorTypes();
    this.setupDefaultHandlers();
  }

  /**
   * 设置默认错误类型
   */
  setupDefaultErrorTypes() {
    this.errorTypes.set('NetworkError', {
      name: 'NetworkError',
      recoverable: true,
      userFriendly: '网络连接失败，请检查网络连接',
      userFriendlyKey: 'networkError',
      retryable: true
    });

    this.errorTypes.set('APIError', {
      name: 'APIError', 
      recoverable: true,
      userFriendly: 'API请求失败，请稍后重试',
      userFriendlyKey: 'apiErrorGeneric',
      retryable: true
    });

    this.errorTypes.set('StorageError', {
      name: 'StorageError',
      recoverable: true,
      userFriendly: '数据存储失败，请检查浏览器设置',
      userFriendlyKey: 'storageError',
      retryable: false
    });

    this.errorTypes.set('ValidationError', {
      name: 'ValidationError',
      recoverable: true,
      userFriendly: '输入的数据格式不正确',
      userFriendlyKey: 'validationError',
      retryable: false
    });

    this.errorTypes.set('AuthError', {
      name: 'AuthError',
      recoverable: false,
      userFriendly: '身份验证失败，请重新登录',
      userFriendlyKey: 'authError',
      retryable: false
    });

    this.errorTypes.set('RateLimitError', {
      name: 'RateLimitError',
      recoverable: true,
      userFriendly: '请求过于频繁，请稍后再试',
      userFriendlyKey: 'rateLimitError',
      retryable: true,
      retryDelay: 60000 // 1分钟后重试
    });

    this.errorTypes.set('UnknownError', {
      name: 'UnknownError',
      recoverable: false,
      userFriendly: '发生未知错误，请刷新页面重试',
      userFriendlyKey: 'unknownErrorFull',
      retryable: false
    });
  }

  /**
   * 设置默认错误处理器
   */
  setupDefaultHandlers() {
    // 网络错误处理器
    this.handlers.set('NetworkError', (error, context) => {
      this.log('error', 'Network error occurred:', error, context);
      const lang = I18N.getCurrentLanguage();
      messageSystem.error(I18N.t('networkError', lang));
      
      // 可以添加重试逻辑
      if (context.retry && typeof context.retry === 'function') {
        setTimeout(() => context.retry(), 5000);
      }
    });

    // API错误处理器
    this.handlers.set('APIError', (error, context) => {
      this.log('error', 'API error occurred:', error, context);
      const lang = I18N.getCurrentLanguage();
      
      if (error.status === 429) {
        // 速率限制
        this.handle(this.createError('RateLimitError', error.message, error), context);
        return;
      }
      
      const message = error.status ? 
        `${I18N.t('apiErrorPrefix', lang)} (${error.status}): ${error.message || I18N.t('unknownErrorShort', lang)}` :
        I18N.t('apiErrorGeneric', lang);
      
      messageSystem.error(message);
    });

    // 存储错误处理器
    this.handlers.set('StorageError', (error, context) => {
      this.log('error', 'Storage error occurred:', error, context);
      const lang = I18N.getCurrentLanguage();
      messageSystem.error(I18N.t('storageError', lang));
    });

    // 验证错误处理器
    this.handlers.set('ValidationError', (error, context) => {
      this.log('warn', 'Validation error occurred:', error, context);
      const lang = I18N.getCurrentLanguage();
      messageSystem.warning(error.message || I18N.t('validationError', lang));
    });

    // 速率限制错误处理器
    this.handlers.set('RateLimitError', (error, context) => {
      this.log('warn', 'Rate limit error occurred:', error, context);
      const lang = I18N.getCurrentLanguage();
      messageSystem.warning(I18N.t('rateLimitError', lang));
    });
  }

  /**
   * 处理错误
   * @param {Error|Object} error - 错误对象
   * @param {Object} context - 错误上下文
   */
  handle(error, context = {}) {
    try {
      const errorInfo = this.analyzeError(error);
      const handler = this.handlers.get(errorInfo.type) || this.fallbackHandler;
      
      // 记录错误
      this.logError(errorInfo, context);
      
      // 执行处理器
      handler.call(this, error, { ...context, errorInfo });
      
      // 如果需要上报错误
      if (context.report !== false) {
        this.reportError(errorInfo, context);
      }
      
    } catch (handlerError) {
      this.log('error', 'Error handler failed:', handlerError);
      this.fallbackHandler(error, context);
    }
  }

  /**
   * 分析错误类型
   * @param {Error|Object} error - 错误对象
   */
  analyzeError(error) {
    // 如果已经是格式化的错误对象
    if (error.errorType) {
      return {
        type: error.errorType,
        originalError: error,
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      };
    }

    // 根据错误特征判断类型
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.createErrorInfo('NetworkError', error);
    }
    
    if (error.name === 'HttpError' || error.status) {
      return this.createErrorInfo('APIError', error);
    }
    
    if (error.message && error.message.includes('storage')) {
      return this.createErrorInfo('StorageError', error);
    }
    
    if (error.name === 'ValidationError') {
      return this.createErrorInfo('ValidationError', error);
    }
    
    return this.createErrorInfo('UnknownError', error);
  }

  /**
   * 创建错误信息对象
   * @param {string} type - 错误类型
   * @param {Error} originalError - 原始错误
   */
  createErrorInfo(type, originalError) {
    return {
      type,
      originalError,
      message: originalError.message || originalError.toString(),
      stack: originalError.stack,
      timestamp: Date.now(),
      ...this.getErrorType(type)
    };
  }

  /**
   * 创建格式化错误对象
   * @param {string} type - 错误类型
   * @param {string} message - 错误信息
   * @param {Error} originalError - 原始错误
   */
  createError(type, message, originalError = null) {
    const error = new Error(message);
    error.errorType = type;
    error.originalError = originalError;
    error.timestamp = Date.now();
    return error;
  }

  /**
   * 记录错误
   * @param {Object} errorInfo - 错误信息
   * @param {Object} context - 上下文信息
   */
  logError(errorInfo, context) {
    const logData = {
      type: errorInfo.type,
      message: errorInfo.message,
      timestamp: errorInfo.timestamp,
      context: context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    this.log('error', 'Error handled:', logData);
  }

  /**
   * 上报错误（可扩展为发送到监控系统）
   * @param {Object} errorInfo - 错误信息
   * @param {Object} context - 上下文信息
   */
  reportError(errorInfo, context) {
    // 这里可以集成错误监控服务
    if (context.silent === true) return;
    
    // 暂时只在开发环境下输出详细信息
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Report: ${errorInfo.type}`);
      console.error('Error:', errorInfo.originalError);
      console.log('Context:', context);
      console.log('Timestamp:', new Date(errorInfo.timestamp).toISOString());
      console.groupEnd();
    }
  }

  /**
   * 默认备用处理器
   * @param {Error} error - 错误对象
   * @param {Object} context - 上下文
   */
  defaultFallbackHandler(error, context) {
    this.log('error', 'Fallback error handler:', error);
    const lang = I18N.getCurrentLanguage();
    messageSystem.error(I18N.t('unknownErrorFull', lang));
  }

  /**
   * 异步操作包装器
   * @param {Function} asyncFn - 异步函数
   * @param {Object} context - 错误上下文
   */
  async wrap(asyncFn, context = {}) {
    try {
      return await asyncFn();
    } catch (error) {
      this.handle(error, context);
      
      // 如果错误不可恢复，重新抛出
      const errorInfo = this.analyzeError(error);
      if (!errorInfo.recoverable) {
        throw error;
      }
      
      return null;
    }
  }

  /**
   * 同步操作包装器
   * @param {Function} syncFn - 同步函数
   * @param {Object} context - 错误上下文
   */
  wrapSync(syncFn, context = {}) {
    try {
      return syncFn();
    } catch (error) {
      this.handle(error, context);
      
      const errorInfo = this.analyzeError(error);
      if (!errorInfo.recoverable) {
        throw error;
      }
      
      return null;
    }
  }

  /**
   * 获取错误类型信息
   * @param {string} type - 错误类型
   */
  getErrorType(type) {
    return this.errorTypes.get(type) || this.errorTypes.get('UnknownError');
  }

  /**
   * 注册自定义错误类型
   * @param {string} type - 错误类型名称
   * @param {Object} config - 错误配置
   */
  registerErrorType(type, config) {
    this.errorTypes.set(type, config);
    return this;
  }

  /**
   * 注册自定义错误处理器
   * @param {string} type - 错误类型
   * @param {Function} handler - 处理函数
   */
  registerHandler(type, handler) {
    this.handlers.set(type, handler);
    return this;
  }

  /**
   * 设置日志级别
   * @param {string} level - 日志级别
   */
  setLogLevel(level) {
    this.logLevel = level;
    return this;
  }

  /**
   * 日志输出
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {...*} args - 其他参数
   */
  log(level, message, ...args) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.logLevel] || 3;
    const logLevel = levels[level] || 3;
    
    if (logLevel >= currentLevel) {
      console[level](message, ...args);
    }
  }

  /**
   * 清理资源
   */
  destroy() {
    this.errorTypes.clear();
    this.handlers.clear();
  }
}

// 创建全局错误处理器实例
export const errorHandler = new ErrorHandler();

// 全局错误监听
window.addEventListener('error', (event) => {
  errorHandler.handle(event.error, { 
    context: 'window.onerror',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  errorHandler.handle(event.reason, { 
    context: 'unhandledrejection'
  });
});

export default ErrorHandler;