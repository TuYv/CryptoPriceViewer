import { http } from '../lib/http.js';
/**
 * Notion API 服务
 * 用于将反馈数据发送到 Notion 数据库
 */
class NotionService {
  constructor() {
    // Notion API 配置
    this.NOTION_API_URL = 'https://api.notion.com/v1';
    this.NOTION_VERSION = '2022-06-28';
    
    // 这些配置需要在使用前设置
    this.token = '';
    this.databaseId = '';
  }

  /**
   * 设置 Notion 配置
   * @param {string} token - Notion Integration Token
   * @param {string} databaseId - Notion Database ID
   */
  setConfig(token, databaseId) {
    this.token = token;
    this.databaseId = databaseId;
  }

  /**
   * 验证配置是否正确
   * @returns {boolean} 配置是否有效
   */
  isConfigured() {
    return !!(this.token && this.databaseId);
  }

  /**
   * 测试数据库连接
   * @returns {Promise<boolean>} 连接是否成功
   */
  async testConnection() {
    if (!this.isConfigured()) {
      throw new Error('Notion 配置未设置');
    }

    try {
      const data = await http.request(`${this.NOTION_API_URL}/databases/${this.databaseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Notion-Version': this.NOTION_VERSION,
          'Content-Type': 'application/json'
        }
      });

      console.log('成功连接到 Notion 数据库:', (data && data.title) || '');
      return true;
    } catch (error) {
      console.error('Notion 连接错误:', error);
      const status = error.status || 0;
      const payload = error.data || null;
      console.error('状态码:', status, '响应体:', payload);
      return false;
    }
  }

  /**
   * 创建反馈页面到 Notion
   * @param {Object} feedback - 反馈数据
   * @param {string} feedback.content - 反馈内容
   * @param {string} feedback.userAgent - 用户代理
   * @param {string} feedback.timestamp - 时间戳
   * @param {string} feedback.version - 扩展版本
   * @returns {Promise<Object|null>} 创建的页面数据或null
   */
  async createFeedbackPage(feedback) {
    if (!this.isConfigured()) {
      throw new Error('Notion 配置未设置');
    }

    const pageData = {
      parent: { database_id: this.databaseId },
      properties: {
        'Title': { title: [{ text: { content: '测试title' } }] },
        'Content': { rich_text: [{ text: { content: feedback.content } }] },
        'Published': { date: { start: feedback.timestamp, end: null } }
      }
    };

    try {
      const data = await http.request(`${this.NOTION_API_URL}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Notion-Version': this.NOTION_VERSION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pageData)
      });

      console.log('成功创建 Notion 反馈页面:', data && data.id);
      return data;
    } catch (error) {
      console.error('Notion API 请求错误:', error);
      const status = error.status || 0;
      const payload = error.data || null;
      console.error('状态码:', status, '响应体:', payload);
      return null;
    }
  }


}

// 导出单例实例
const notionService = new NotionService();
export { notionService };