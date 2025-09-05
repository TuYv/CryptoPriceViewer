/**
 * DOM管理器 - 统一DOM操作和事件管理
 * [OPT-1] 解决DOM操作重复模式问题
 */

export class DOMManager {
  constructor() {
    this.elements = new Map();
    this.eventListeners = new Map();
  }

  /**
   * 批量注册DOM元素
   * @param {Object} elementMap - 元素ID到变量名的映射
   */
  registerElements(elementMap) {
    Object.entries(elementMap).forEach(([key, id]) => {
      const element = document.getElementById(id);
      if (element) {
        this.elements.set(key, element);
      } else {
        console.warn(`Element with id '${id}' not found`);
      }
    });
    return this;
  }

  /**
   * 获取已注册的DOM元素
   * @param {string} key - 元素键名
   */
  get(key) {
    return this.elements.get(key);
  }

  /**
   * 批量添加事件监听器
   * @param {Array} eventConfigs - 事件配置数组 [{element, event, handler}]
   */
  addEventListeners(eventConfigs) {
    eventConfigs.forEach(({ element, event, handler, options = {} }) => {
      const el = typeof element === 'string' ? this.get(element) : element;
      if (el) {
        el.addEventListener(event, handler, options);
        
        // 记录监听器以便后续清理
        const key = `${element}-${event}`;
        if (!this.eventListeners.has(key)) {
          this.eventListeners.set(key, []);
        }
        this.eventListeners.get(key).push({ element: el, event, handler, options });
      }
    });
    return this;
  }

  /**
   * 批量移除事件监听器
   */
  removeAllEventListeners() {
    this.eventListeners.forEach((listeners) => {
      listeners.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
    });
    this.eventListeners.clear();
    return this;
  }

  /**
   * 批量显示/隐藏元素
   * @param {Object} visibilityMap - 元素显示状态映射
   */
  updateVisibility(visibilityMap) {
    Object.entries(visibilityMap).forEach(([key, visible]) => {
      const element = this.get(key);
      if (element) {
        element.style.display = visible ? 'block' : 'none';
      }
    });
    return this;
  }

  /**
   * 批量添加/移除CSS类
   * @param {Object} classMap - 类名映射 {element: {add: [], remove: []}}
   */
  updateClasses(classMap) {
    Object.entries(classMap).forEach(([key, { add = [], remove = [] }]) => {
      const element = this.get(key);
      if (element) {
        remove.forEach(className => element.classList.remove(className));
        add.forEach(className => element.classList.add(className));
      }
    });
    return this;
  }

  /**
   * 批量设置元素文本内容
   * @param {Object} textMap - 文本内容映射
   */
  updateTextContent(textMap) {
    Object.entries(textMap).forEach(([key, text]) => {
      const element = this.get(key);
      if (element) {
        element.textContent = text;
      }
    });
    return this;
  }

  /**
   * 批量设置元素属性
   * @param {Object} attributeMap - 属性映射 {element: {attr: value}}
   */
  updateAttributes(attributeMap) {
    Object.entries(attributeMap).forEach(([key, attributes]) => {
      const element = this.get(key);
      if (element) {
        Object.entries(attributes).forEach(([attr, value]) => {
          if (value === null || value === undefined) {
            element.removeAttribute(attr);
          } else {
            element.setAttribute(attr, value);
          }
        });
      }
    });
    return this;
  }

  /**
   * 清理所有引用
   */
  destroy() {
    this.removeAllEventListeners();
    this.elements.clear();
  }
}

export default DOMManager;