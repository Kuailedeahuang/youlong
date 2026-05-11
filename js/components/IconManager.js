import SVGIcons from '../utils/svgIcons.js'

/**
 * 图标管理器 - 统一管理游戏中的 SVG 图标
 * 支持：图标绘制、尺寸配置、颜色主题、批量管理
 */
class IconManager {
    constructor() {
        // 默认图标尺寸配置
        this.defaultSizes = {
            xs: 12,      // 超小 - 紧凑显示
            sm: 16,      // 小 - 列表、标签
            md: 20,      // 中 - 按钮、导航
            lg: 24,      // 大 - 主要图标
            xl: 32       // 超大 - 重点展示
        }
        
        // 当前主题配置
        this.theme = {
            strokeColor: '#2C2418',      // 轮廓线颜色
            strokeWidth: 1.5,             // 轮廓线宽度
            enableShadow: true,           // 是否启用投影
            shadowOpacity: 0.15           // 投影透明度
        }
        
        // 图标注册表 - 统一管理所有图标
        this.iconRegistry = {
            // 顶部信息栏图标
            calendar: { drawer: SVGIcons.drawCalendar.bind(SVGIcons), label: '日历' },
            coin: { drawer: SVGIcons.drawCoin.bind(SVGIcons), label: '金币' },
            bank: { drawer: SVGIcons.drawBank.bind(SVGIcons), label: '银行' },
            warning: { drawer: SVGIcons.drawWarning.bind(SVGIcons), label: '警告' },
            loanWarning: { drawer: SVGIcons.drawLoanWarning.bind(SVGIcons), label: '借贷警示' },
            
            // 属性图标
            health: { drawer: SVGIcons.drawHealth.bind(SVGIcons), label: '健康', color: '#7CB87C' },
            energy: { drawer: SVGIcons.drawEnergy.bind(SVGIcons), label: '精力', color: '#7BA3C9' },
            mood: { drawer: SVGIcons.drawMood.bind(SVGIcons), label: '心情', color: '#D49BA3' },
            reputation: { drawer: SVGIcons.drawReputation.bind(SVGIcons), label: '名誉', color: '#B8A3C9' },

            // 功能图标
            map: { drawer: SVGIcons.drawMap.bind(SVGIcons), label: '地图', color: '#D4A574' },

            // 设置页面图标
            sound: { drawer: SVGIcons.drawSound.bind(SVGIcons), label: '音效', color: '#7BA3C9' },
            vibration: { drawer: SVGIcons.drawVibration.bind(SVGIcons), label: '震动', color: '#D4A574' },
            stats: { drawer: SVGIcons.drawStats.bind(SVGIcons), label: '统计', color: '#7CB87C' },
            clear: { drawer: SVGIcons.drawClear.bind(SVGIcons), label: '清除', color: '#C17B6B' },
            version: { drawer: SVGIcons.drawVersion.bind(SVGIcons), label: '版本', color: '#D4A574' },
            back: { drawer: SVGIcons.drawBack.bind(SVGIcons), label: '返回', color: '#7BA3C9' },
            reset: { drawer: SVGIcons.drawReset.bind(SVGIcons), label: '重置', color: '#C17B6B' },
            arrowRight: { drawer: SVGIcons.drawArrowRight.bind(SVGIcons), label: '右箭头', color: '#8B7355' },
            moon: { drawer: SVGIcons.drawMoon.bind(SVGIcons), label: '月亮', color: '#FFF5E6' },
            sun: { drawer: SVGIcons.drawSun.bind(SVGIcons), label: '太阳', color: '#FFE2A4' }
        }
    }
    
    /**
     * 绘制图标 - 主要接口
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {string} iconName - 图标名称
     * @param {number} x - 中心点 X 坐标
     * @param {number} y - 中心点 Y 坐标
     * @param {Object} options - 配置选项
     * @returns {boolean} 是否绘制成功
     * 
     * 使用示例:
     * iconManager.draw(ctx, 'health', 100, 100, { size: 'md', color: '#ff0000' })
     */
    draw(ctx, iconName, x, y, options = {}) {
        const icon = this.iconRegistry[iconName]
        if (!icon) {
            console.warn(`[IconManager] 未找到图标: ${iconName}`)
            return false
        }
        
        // 解析尺寸
        const size = this.parseSize(options.size || 'md')
        
        // 保存上下文状态
        ctx.save()
        
        // 应用自定义颜色（如果提供）
        if (options.color) {
            ctx.fillStyle = options.color
        }
        
        // 应用自定义轮廓线颜色
        if (options.strokeColor) {
            ctx.strokeStyle = options.strokeColor
        }
        
        // 应用自定义轮廓线宽度
        if (options.strokeWidth) {
            ctx.lineWidth = options.strokeWidth
        }
        
        // 绘制投影（如果启用）
        if (options.shadow !== false && this.theme.enableShadow) {
            this.drawShadow(ctx, x, y, size)
        }
        
        // 执行图标绘制
        try {
            icon.drawer(ctx, x, y, size, options)
        } catch (e) {
            console.error(`[IconManager] 绘制图标失败: ${iconName}`, e)
            ctx.restore()
            return false
        }
        
        // 恢复上下文状态
        ctx.restore()
        return true
    }
    
    /**
     * 批量绘制图标组
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {Array} icons - 图标配置数组
     * 
     * 使用示例:
     * iconManager.drawBatch(ctx, [
     *   { name: 'health', x: 50, y: 50, options: { size: 'lg' } },
     *   { name: 'energy', x: 100, y: 50, options: { size: 'lg' } }
     * ])
     */
    drawBatch(ctx, icons) {
        icons.forEach(item => {
            this.draw(ctx, item.name, item.x, item.y, item.options || {})
        })
    }
    
    /**
     * 绘制带标签的图标
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {string} iconName - 图标名称
     * @param {number} x - 图标中心 X
     * @param {number} y - 图标中心 Y
     * @param {string} label - 标签文字
     * @param {Object} options - 配置选项
     * @param {Function} textRenderer - 文字渲染函数
     */
    drawWithLabel(ctx, iconName, x, y, label, options = {}, textRenderer) {
        const size = this.parseSize(options.size || 'md')
        const labelPosition = options.labelPosition || 'bottom'
        const spacing = options.spacing || 4
        
        // 绘制图标
        this.draw(ctx, iconName, x, y, options)
        
        // 计算标签位置
        let labelX = x
        let labelY = y
        
        switch (labelPosition) {
            case 'top':
                labelY = y - size / 2 - spacing
                break
            case 'bottom':
                labelY = y + size / 2 + spacing + 8
                break
            case 'left':
                labelX = x - size / 2 - spacing
                break
            case 'right':
                labelX = x + size / 2 + spacing
                break
        }
        
        // 渲染标签文字
        if (textRenderer && label) {
            const labelColor = options.labelColor || '#5D4037'
            const labelSize = options.labelSize || 10
            textRenderer(label, labelX, labelY, labelColor, labelSize, labelPosition === 'left' ? 'right' : 'left')
        }
    }
    
    /**
     * 绘制属性图标组（用于底部面板）
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {Object} stats - 属性值对象 { health, energy, mood, reputation }
     * @param {Array} positions - 位置数组 [{x, y}, ...]
     * @param {Object} options - 配置选项
     */
    drawStatsGroup(ctx, stats, positions, options = {}) {
        const statTypes = ['health', 'energy', 'mood', 'reputation']
        const size = this.parseSize(options.size || 'md')
        
        statTypes.forEach((type, index) => {
            if (positions[index] && stats[type] !== undefined) {
                const pos = positions[index]
                this.draw(ctx, type, pos.x, pos.y, { 
                    size: size,
                    color: this.iconRegistry[type]?.color 
                })
            }
        })
    }
    
    /**
     * 注册新图标
     * @param {string} name - 图标名称
     * @param {Function} drawer - 绘制函数
     * @param {Object} metadata - 元数据 { label, color, ... }
     */
    register(name, drawer, metadata = {}) {
        this.iconRegistry[name] = {
            drawer: drawer.bind(this),
            label: metadata.label || name,
            ...metadata
        }
        console.log(`[IconManager] 注册图标: ${name}`)
    }
    
    /**
     * 注销图标
     * @param {string} name - 图标名称
     */
    unregister(name) {
        if (this.iconRegistry[name]) {
            delete this.iconRegistry[name]
            console.log(`[IconManager] 注销图标: ${name}`)
        }
    }
    
    /**
     * 更新主题配置
     * @param {Object} theme - 主题配置
     */
    setTheme(theme) {
        this.theme = { ...this.theme, ...theme }
    }
    
    /**
     * 获取图标信息
     * @param {string} name - 图标名称
     * @returns {Object|null} 图标信息
     */
    getIconInfo(name) {
        return this.iconRegistry[name] || null
    }
    
    /**
     * 获取所有图标名称
     * @returns {Array} 图标名称数组
     */
    getIconNames() {
        return Object.keys(this.iconRegistry)
    }
    
    /**
     * 解析尺寸
     * @param {string|number} size - 尺寸标识或数值
     * @returns {number} 实际像素值
     */
    parseSize(size) {
        if (typeof size === 'number') return size
        return this.defaultSizes[size] || this.defaultSizes.md
    }
    
    /**
     * 设置默认尺寸
     * @param {string} key - 尺寸键名
     * @param {number} value - 像素值
     */
    setDefaultSize(key, value) {
        this.defaultSizes[key] = value
    }
    
    /**
     * 绘制投影
     * @private
     */
    drawShadow(ctx, x, y, size) {
        ctx.fillStyle = `rgba(139, 115, 85, ${this.theme.shadowOpacity})`
        ctx.beginPath()
        ctx.arc(x, y + size * 0.1, size * 0.4, 0, Math.PI * 2)
        ctx.fill()
    }
}

// 创建单例实例
const iconManager = new IconManager()

export default iconManager
export { IconManager }
