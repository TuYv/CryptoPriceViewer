/**
 * 简单的价格图表库
 * 使用Canvas绘制价格折线图
 */

export class PriceChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.data = [];
    this.width = canvas.width;
    this.height = canvas.height;
    this.padding = { top: 20, right: 20, bottom: 30, left: 60 };
    this.chartWidth = this.width - this.padding.left - this.padding.right;
    this.chartHeight = this.height - this.padding.top - this.padding.bottom;
  }

  /**
   * 设置图表数据
   * @param {Array} data - 价格数据数组 [{timestamp, price}, ...]
   */
  setData(data) {
    this.data = data.sort((a, b) => a.timestamp - b.timestamp);
    this.draw();
  }

  /**
   * 清空画布
   */
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  /**
   * 绘制图表
   */
  draw() {
    if (this.data.length === 0) return;

    this.clear();
    this.drawGrid();
    this.drawAxes();
    this.drawLine();
    this.drawPoints();
  }

  /**
   * 绘制网格
   */
  drawGrid() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;

    // 垂直网格线
    for (let i = 0; i <= 5; i++) {
      const x = this.padding.left + (this.chartWidth / 5) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.padding.top);
      this.ctx.lineTo(x, this.padding.top + this.chartHeight);
      this.ctx.stroke();
    }

    // 水平网格线
    for (let i = 0; i <= 4; i++) {
      const y = this.padding.top + (this.chartHeight / 4) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(this.padding.left, y);
      this.ctx.lineTo(this.padding.left + this.chartWidth, y);
      this.ctx.stroke();
    }
  }

  /**
   * 绘制坐标轴
   */
  drawAxes() {
    const minPrice = Math.min(...this.data.map(d => d.price));
    const maxPrice = Math.max(...this.data.map(d => d.price));
    
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.font = '10px Inter';
    this.ctx.textAlign = 'right';

    // Y轴标签（价格）
    for (let i = 0; i <= 4; i++) {
      const price = minPrice + (maxPrice - minPrice) * (1 - i / 4);
      const y = this.padding.top + (this.chartHeight / 4) * i;
      this.ctx.fillText(this.formatPrice(price), this.padding.left - 5, y + 3);
    }

    // X轴标签（时间）
    this.ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const dataIndex = Math.floor((this.data.length - 1) * (i / 5));
      const timestamp = this.data[dataIndex]?.timestamp;
      if (timestamp) {
        const x = this.padding.left + (this.chartWidth / 5) * i;
        const y = this.padding.top + this.chartHeight + 15;
        this.ctx.fillText(this.formatTime(timestamp), x, y);
      }
    }
  }

  /**
   * 绘制价格线
   */
  drawLine() {
    if (this.data.length < 2) return;

    const minPrice = Math.min(...this.data.map(d => d.price));
    const maxPrice = Math.max(...this.data.map(d => d.price));
    const priceRange = maxPrice - minPrice || 1;

    // 创建渐变
    const gradient = this.ctx.createLinearGradient(0, this.padding.top, 0, this.padding.top + this.chartHeight);
    gradient.addColorStop(0, 'rgba(72, 187, 120, 0.8)');
    gradient.addColorStop(1, 'rgba(72, 187, 120, 0.2)');

    // 绘制填充区域
    this.ctx.beginPath();
    this.data.forEach((point, index) => {
      const x = this.padding.left + (this.chartWidth / (this.data.length - 1)) * index;
      const y = this.padding.top + this.chartHeight - ((point.price - minPrice) / priceRange) * this.chartHeight;
      
      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
    
    // 完成填充路径
    const lastIndex = this.data.length - 1;
    const lastX = this.padding.left + (this.chartWidth / (this.data.length - 1)) * lastIndex;
    this.ctx.lineTo(lastX, this.padding.top + this.chartHeight);
    this.ctx.lineTo(this.padding.left, this.padding.top + this.chartHeight);
    this.ctx.closePath();
    
    this.ctx.fillStyle = gradient;
    this.ctx.fill();

    // 绘制线条
    this.ctx.beginPath();
    this.data.forEach((point, index) => {
      const x = this.padding.left + (this.chartWidth / (this.data.length - 1)) * index;
      const y = this.padding.top + this.chartHeight - ((point.price - minPrice) / priceRange) * this.chartHeight;
      
      if (index === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });
    
    this.ctx.strokeStyle = '#48bb78';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }

  /**
   * 绘制数据点
   */
  drawPoints() {
    const minPrice = Math.min(...this.data.map(d => d.price));
    const maxPrice = Math.max(...this.data.map(d => d.price));
    const priceRange = maxPrice - minPrice || 1;

    this.ctx.fillStyle = '#48bb78';
    
    this.data.forEach((point, index) => {
      const x = this.padding.left + (this.chartWidth / (this.data.length - 1)) * index;
      const y = this.padding.top + this.chartHeight - ((point.price - minPrice) / priceRange) * this.chartHeight;
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
      this.ctx.fill();
    });
  }

  /**
   * 格式化价格显示
   */
  formatPrice(price) {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(1)}K`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  }

  /**
   * 格式化时间显示
   */
  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }

  /**
   * 显示加载状态
   */
  showLoading() {
    this.clear();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.font = '14px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Loading chart...', this.width / 2, this.height / 2);
  }

  /**
   * 显示错误状态
   */
  showError(message = 'Failed to load chart data') {
    this.clear();
    this.ctx.fillStyle = 'rgba(245, 101, 101, 0.8)';
    this.ctx.font = '12px Inter';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(message, this.width / 2, this.height / 2);
  }
}