/**
 * 消息系统 - 统一消息提示管理
 * [OPT-3] 解决消息提示重复实现问题
 */

export class MessageSystem {
  constructor() {
    this.container = null;
    this.messages = new Map();
    this.defaultDuration = 3000;
    this.maxMessages = 5;
    
    this.initContainer();
  }

  /**
   * 初始化消息容器
   */
  initContainer() {
    if (document.getElementById('message-system-container')) {
      this.container = document.getElementById('message-system-container');
      return;
    }

    this.container = document.createElement('div');
    this.container.id = 'message-system-container';
    this.container.className = 'message-system-container';
    this.container.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      z-index: 10000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 5px;
    `;
    document.body.appendChild(this.container);
  }

  /**
   * 显示消息
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型 (success, error, warning, info)
   * @param {number} duration - 显示时长 (毫秒)
   * @param {Object} options - 额外选项
   */
  show(message, type = 'info', duration = this.defaultDuration, options = {}) {
    const messageId = Date.now() + Math.random();
    const messageElement = this.createMessageElement(message, type, messageId, options);
    
    // 如果消息过多，移除最旧的消息
    if (this.messages.size >= this.maxMessages) {
      const oldestMessage = this.messages.keys().next().value;
      this.remove(oldestMessage);
    }

    this.container.appendChild(messageElement);
    this.messages.set(messageId, {
      element: messageElement,
      type,
      message,
      timestamp: Date.now(),
      duration
    });

    // 显示动画
    requestAnimationFrame(() => {
      messageElement.style.opacity = '1';
      messageElement.style.transform = 'translateX(0)';
    });

    // 自动移除
    if (duration > 0) {
      setTimeout(() => this.remove(messageId), duration);
    }

    return messageId;
  }

  /**
   * 创建消息元素
   * @param {string} message - 消息内容
   * @param {string} type - 消息类型
   * @param {number} messageId - 消息ID
   * @param {Object} options - 额外选项
   */
  createMessageElement(message, type, messageId, options = {}) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-item message-${type}`;
    messageDiv.dataset.messageId = messageId;
    
    // 基础样式
    messageDiv.style.cssText = `
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-size: 14px;
      font-weight: 500;
      word-wrap: break-word;
      pointer-events: auto;
      opacity: 0;
      transform: translateX(-100%);
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-left: 4px solid transparent;
      max-width: 400px;
    `;

    // 根据类型设置颜色
    const typeStyles = {
      success: {
        backgroundColor: '#10B981',
        borderLeftColor: '#059669'
      },
      error: {
        backgroundColor: '#EF4444',
        borderLeftColor: '#DC2626'
      },
      warning: {
        backgroundColor: '#F59E0B',
        borderLeftColor: '#D97706'
      },
      info: {
        backgroundColor: '#3B82F6',
        borderLeftColor: '#2563EB'
      }
    };

    const typeStyle = typeStyles[type] || typeStyles.info;
    Object.assign(messageDiv.style, typeStyle);

    // 消息内容
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // 支持图标
    if (options.icon) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'message-icon';
      iconSpan.textContent = options.icon;
      iconSpan.style.marginRight = '8px';
      contentDiv.appendChild(iconSpan);
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    contentDiv.appendChild(textSpan);

    // 支持关闭按钮
    if (options.closable !== false) {
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.className = 'message-close';
      closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        font-weight: bold;
        margin-left: 12px;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
        padding: 0;
        line-height: 1;
      `;
      closeBtn.addEventListener('click', () => this.remove(messageId));
      closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
      closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.7');
      
      const containerDiv = document.createElement('div');
      containerDiv.style.display = 'flex';
      containerDiv.style.alignItems = 'center';
      containerDiv.style.justifyContent = 'space-between';
      containerDiv.appendChild(contentDiv);
      containerDiv.appendChild(closeBtn);
      messageDiv.appendChild(containerDiv);
    } else {
      messageDiv.appendChild(contentDiv);
    }

    // 支持进度条
    if (options.showProgress && options.duration > 0) {
      const progressBar = document.createElement('div');
      progressBar.className = 'message-progress';
      progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        height: 2px;
        background: rgba(255, 255, 255, 0.3);
        width: 100%;
        transform-origin: left;
        animation: messageProgress ${options.duration || this.defaultDuration}ms linear;
      `;
      
      // 添加进度条动画
      if (!document.getElementById('message-progress-styles')) {
        const style = document.createElement('style');
        style.id = 'message-progress-styles';
        style.textContent = `
          @keyframes messageProgress {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
          }
        `;
        document.head.appendChild(style);
      }
      
      messageDiv.style.position = 'relative';
      messageDiv.appendChild(progressBar);
    }

    return messageDiv;
  }

  /**
   * 移除消息
   * @param {number} messageId - 消息ID
   */
  remove(messageId) {
    const messageData = this.messages.get(messageId);
    if (!messageData) return;

    const { element } = messageData;
    
    // 隐藏动画
    element.style.opacity = '0';
    element.style.transform = 'translateX(-100%)';
    
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.messages.delete(messageId);
    }, 300);
  }

  /**
   * 清除所有消息
   */
  clear() {
    this.messages.forEach((_, messageId) => this.remove(messageId));
  }

  /**
   * 成功消息快捷方法
   */
  success(message, duration, options) {
    return this.show(message, 'success', duration, { icon: '✓', ...options });
  }

  /**
   * 错误消息快捷方法
   */
  error(message, duration, options) {
    return this.show(message, 'error', duration, { icon: '✗', ...options });
  }

  /**
   * 警告消息快捷方法
   */
  warning(message, duration, options) {
    return this.show(message, 'warning', duration, { icon: '⚠', ...options });
  }

  /**
   * 信息消息快捷方法
   */
  info(message, duration, options) {
    return this.show(message, 'info', duration, { icon: 'ℹ', ...options });
  }

  /**
   * 设置默认持续时间
   */
  setDefaultDuration(duration) {
    this.defaultDuration = duration;
    return this;
  }

  /**
   * 设置最大消息数量
   */
  setMaxMessages(max) {
    this.maxMessages = max;
    return this;
  }

  /**
   * 获取当前消息数量
   */
  getMessageCount() {
    return this.messages.size;
  }

  /**
   * 销毁消息系统
   */
  destroy() {
    this.clear();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.messages.clear();
  }
}

// 创建全局消息系统实例
export const messageSystem = new MessageSystem();

export default MessageSystem;