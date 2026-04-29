/**
 * 交互区域管理器 - 统一管理 Canvas 场景中的可点击热点区域
 * 
 * 新设计：点击区域和文字标签分离
 * - hitArea: 透明点击热区（覆盖家具）
 * - labelArea: 固定高度、自适应宽度的文字标签
 * 
 * @author 游龙游戏开发团队
 * @version 2.0.0
 */

/**
 * 交互区域配置对象（新格式）
 * @typedef {Object} InteractiveAreaConfig
 * @property {string} id - 区域唯一标识
 * @property {string} label - 显示文字标签
 * @property {Function} action - 点击回调函数
 * @property {HitArea} hitArea - 点击热区配置
 * @property {LabelArea} labelArea - 文字标签配置
 * @property {AreaStyle} [style] - 样式配置（可选）
 */

/**
 * 点击热区配置
 * @typedef {Object} HitArea
 * @property {number} xPercent - X轴位置（0-1）
 * @property {number} yPercent - Y轴位置（0-1）
 * @property {number} widthPercent - 宽度（0-1）
 * @property {number} heightPercent - 高度（0-1）
 */

/**
 * 文字标签配置
 * @typedef {Object} LabelArea
 * @property {number} xPercent - X轴位置（0-1）
 * @property {number} yPercent - Y轴位置（0-1）
 * @property {number} height - 固定高度（像素）
 * @property {number} [paddingX] - 水平内边距（像素），默认10
 */

/**
 * 区域样式配置对象
 * @typedef {Object} AreaStyle
 * @property {string} [hitAreaBgColor='transparent'] - 点击区域背景色
 * @property {string} [hitAreaBorderColor='transparent'] - 点击区域边框色
 * @property {string} [labelBgColor='rgba(255,255,255,0.85)'] - 标签背景色
 * @property {string} [labelBorderColor='rgba(0,0,0,0.2)'] - 标签边框色
 * @property {string} [textColor='#000000'] - 文字颜色
 * @property {number} [fontSize=12] - 字体大小
 * @property {string} [fontFamily='Arial, sans-serif'] - 字体
 */

class InteractiveAreaManager {
    constructor(game) {
        this.game = game
        this.areas = new Map()
        this.hoveredArea = null
        this.pressedArea = null
        
        // 默认样式
        this.defaultStyle = {
            hitAreaBgColor: 'transparent',
            hitAreaBorderColor: 'transparent',
            labelBgColor: 'rgba(255, 255, 255, 0.85)',
            labelBorderColor: 'rgba(0, 0, 0, 0.2)',
            textColor: '#000000',
            fontSize: 12,
            fontFamily: 'Arial, sans-serif',
            labelPaddingX: 10,
            labelBorderRadius: 4
        }
        
        this.minTouchSize = 44
        this.debugMode = false
    }
    
    /**
     * 注册交互区域（新格式）
     * @param {string} id - 区域唯一标识
     * @param {InteractiveAreaConfig} config - 区域配置
     * @returns {InteractiveAreaManager}
     */
    register(id, config) {
        if (!id || typeof id !== 'string') {
            console.error('[InteractiveAreaManager] 注册失败：id 必须是有效的字符串')
            return this
        }
        
        if (!config || typeof config !== 'object') {
            console.error(`[InteractiveAreaManager] 注册失败 [${id}]：config 必须是对象`)
            return this
        }
        
        // 验证 hitArea 必要字段
        if (!config.hitArea) {
            console.error(`[InteractiveAreaManager] 注册失败 [${id}]：缺少 hitArea 配置`)
            return this
        }
        
        const hitFields = ['xPercent', 'yPercent', 'widthPercent', 'heightPercent']
        for (const field of hitFields) {
            if (typeof config.hitArea[field] !== 'number') {
                console.error(`[InteractiveAreaManager] 注册失败 [${id}]：hitArea 缺少 ${field}`)
                return this
            }
        }
        
        // 验证 labelArea 必要字段
        if (!config.labelArea) {
            console.error(`[InteractiveAreaManager] 注册失败 [${id}]：缺少 labelArea 配置`)
            return this
        }
        
        const labelFields = ['xPercent', 'yPercent', 'height']
        for (const field of labelFields) {
            if (typeof config.labelArea[field] !== 'number') {
                console.error(`[InteractiveAreaManager] 注册失败 [${id}]：labelArea 缺少 ${field}`)
                return this
            }
        }
        
        // 合并配置
        const areaConfig = {
            id,
            label: config.label || '',
            action: typeof config.action === 'function' ? config.action : null,
            hitArea: { ...config.hitArea },
            labelArea: { 
                ...config.labelArea,
                paddingX: config.labelArea.paddingX || this.defaultStyle.labelPaddingX
            },
            style: { ...this.defaultStyle, ...config.style }
        }
        
        this.areas.set(id, areaConfig)
        console.log(`[InteractiveAreaManager] 注册区域: ${id}`)
        
        return this
    }
    
    /**
     * 批量注册
     */
    registerBatch(configs) {
        if (!configs || typeof configs !== 'object') return this
        Object.entries(configs).forEach(([id, config]) => this.register(id, config))
        return this
    }
    
    /**
     * 注销区域
     */
    unregister(id) {
        if (this.areas.has(id)) {
            this.areas.delete(id)
            console.log(`[InteractiveAreaManager] 注销区域: ${id}`)
        }
        if (this.hoveredArea === id) this.hoveredArea = null
        if (this.pressedArea === id) this.pressedArea = null
        return this
    }
    
    /**
     * 注销所有区域
     */
    unregisterAll() {
        this.areas.clear()
        this.hoveredArea = null
        this.pressedArea = null
        return this
    }
    
    /**
     * 获取区域
     */
    get(id) { return this.areas.get(id) }
    has(id) { return this.areas.has(id) }
    getAllIds() { return Array.from(this.areas.keys()) }
    
    /**
     * 计算 hitArea 像素坐标
     */
    calculateHitAreaPixels(hitArea, screenWidth, screenHeight) {
        return {
            x: screenWidth * hitArea.xPercent,
            y: screenHeight * hitArea.yPercent,
            width: screenWidth * hitArea.widthPercent,
            height: screenHeight * hitArea.heightPercent
        }
    }
    
    /**
     * 计算 labelArea 像素坐标和自适应宽度
     */
    calculateLabelAreaPixels(labelArea, label, screenWidth, screenHeight, style) {
        const ctx = this.game.renderer.ctx
        const fontSize = style.fontSize || 12
        const paddingX = labelArea.paddingX || 10
        
        // 测量文字宽度
        ctx.font = `${fontSize}px ${style.fontFamily}`
        const textWidth = ctx.measureText(label).width
        
        // 计算总宽度（文字 + 左右内边距）
        const totalWidth = textWidth + paddingX * 2
        
        return {
            x: screenWidth * labelArea.xPercent,
            y: screenHeight * labelArea.yPercent,
            width: totalWidth,
            height: labelArea.height
        }
    }
    
    /**
     * 检查点是否在 hitArea 内
     */
    isPointInHitArea(x, y, area, screenWidth, screenHeight) {
        const pos = this.calculateHitAreaPixels(area.hitArea, screenWidth, screenHeight)
        
        const touchWidth = Math.max(pos.width, this.minTouchSize)
        const touchHeight = Math.max(pos.height, this.minTouchSize)
        const touchX = pos.x + (pos.width - touchWidth) / 2
        const touchY = pos.y + (pos.height - touchHeight) / 2
        
        return x >= touchX && x <= touchX + touchWidth && 
               y >= touchY && y <= touchY + touchHeight
    }
    
    /**
     * 检查点是否在 labelArea 内
     */
    isPointInLabelArea(x, y, area, screenWidth, screenHeight) {
        const pos = this.calculateLabelAreaPixels(
            area.labelArea, area.label, screenWidth, screenHeight, area.style
        )
        
        return x >= pos.x && x <= pos.x + pos.width && 
               y >= pos.y && y <= pos.y + pos.height
    }
    
    /**
     * 查找点所在的区域（优先检查 labelArea，再检查 hitArea）
     */
    findAreaAt(x, y, screenWidth, screenHeight) {
        // 倒序遍历，优先选中上层区域
        for (let i = this.areas.size - 1; i >= 0; i--) {
            const area = Array.from(this.areas.values())[i]
            
            // 先检查 labelArea（通常更小，优先响应）
            if (this.isPointInLabelArea(x, y, area, screenWidth, screenHeight)) {
                return area
            }
            
            // 再检查 hitArea
            if (this.isPointInHitArea(x, y, area, screenWidth, screenHeight)) {
                return area
            }
        }
        return null
    }
    
    /**
     * 处理触摸事件
     */
    handleTouchStart(x, y, screenWidth, screenHeight) {
        const area = this.findAreaAt(x, y, screenWidth, screenHeight)
        if (area) {
            this.pressedArea = area.id
            return true
        }
        return false
    }
    
    handleTouchEnd(x, y, screenWidth, screenHeight) {
        const pressedId = this.pressedArea
        this.pressedArea = null
        
        if (!pressedId) return false
        
        const area = this.findAreaAt(x, y, screenWidth, screenHeight)
        if (area && area.id === pressedId && area.action) {
            area.action()
            return true
        }
        return false
    }
    
    /**
     * 渲染所有区域
     */
    render(renderer, options = {}) {
        const { ctx, width, height } = renderer
        const registerButtons = options.registerButtons !== false
        const showDebug = options.showDebug || this.debugMode
        
        this.areas.forEach(area => {
            this.renderArea(ctx, area, width, height, registerButtons, showDebug)
        })
    }
    
    /**
     * 渲染单个区域（hitArea + labelArea）
     */
    renderArea(ctx, area, screenWidth, screenHeight, registerButton, showDebug) {
        const style = area.style
        const isPressed = this.pressedArea === area.id
        const isHovered = this.hoveredArea === area.id
        
        ctx.save()
        
        // 1. 渲染 hitArea（点击区域）
        const hitPos = this.calculateHitAreaPixels(area.hitArea, screenWidth, screenHeight)
        
        // hitArea 背景（通常是透明）
        if (style.hitAreaBgColor && style.hitAreaBgColor !== 'transparent') {
            ctx.fillStyle = isPressed 
                ? 'rgba(255, 255, 255, 0.1)' 
                : (isHovered ? 'rgba(255, 255, 255, 0.05)' : style.hitAreaBgColor)
            ctx.fillRect(hitPos.x, hitPos.y, hitPos.width, hitPos.height)
        }
        
        // hitArea 边框（调试模式显示）
        if (showDebug || (style.hitAreaBorderColor && style.hitAreaBorderColor !== 'transparent')) {
            ctx.strokeStyle = showDebug ? 'rgba(255, 0, 0, 0.5)' : style.hitAreaBorderColor
            ctx.lineWidth = showDebug ? 2 : 1
            ctx.strokeRect(hitPos.x, hitPos.y, hitPos.width, hitPos.height)
        }
        
        // 2. 渲染 labelArea（文字标签）
        const labelPos = this.calculateLabelAreaPixels(
            area.labelArea, area.label, screenWidth, screenHeight, style
        )
        
        // labelArea 背景
        ctx.fillStyle = style.labelBgColor
        ctx.beginPath()
        this.drawRoundRect(ctx, labelPos.x, labelPos.y, labelPos.width, labelPos.height, style.labelBorderRadius)
        ctx.fill()
        
        // labelArea 边框
        ctx.strokeStyle = style.labelBorderColor
        ctx.lineWidth = 1
        ctx.stroke()
        
        // labelArea 文字
        ctx.fillStyle = style.textColor
        ctx.font = `${style.fontSize}px ${style.fontFamily}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(area.label, labelPos.x + labelPos.width / 2, labelPos.y + labelPos.height / 2)
        
        ctx.restore()
        
        // 3. 注册点击事件（hitArea + labelArea 都响应）
        if (registerButton && this.game && this.game.uiManager) {
            // 注册 hitArea 的点击
            this.game.uiManager.addButton(
                hitPos.x, hitPos.y, hitPos.width, hitPos.height,
                '', () => { if (area.action) area.action() },
                { bgColor: 'transparent' }
            )
            
            // 注册 labelArea 的点击
            this.game.uiManager.addButton(
                labelPos.x, labelPos.y, labelPos.width, labelPos.height,
                '', () => { if (area.action) area.action() },
                { bgColor: 'transparent' }
            )
        }
    }
    
    /**
     * 绘制圆角矩形
     */
    drawRoundRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2)
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + width - r, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + r)
        ctx.lineTo(x + width, y + height - r)
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
        ctx.lineTo(x + r, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - r)
        ctx.lineTo(x, y + r)
        ctx.quadraticCurveTo(x, y, x + r, y)
        ctx.closePath()
    }
    
    setDebugMode(enabled) {
        this.debugMode = enabled
        return this
    }
}

export default InteractiveAreaManager
