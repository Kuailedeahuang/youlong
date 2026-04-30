import SVGIcons from '../utils/svgIcons.js'

/**
 * 悬浮手机按钮组件
 * 支持拖拽、自动吸附、半隐藏状态
 */
export default class FloatPhoneButton {
    constructor(game, options = {}) {
        this.game = game
        
        // 配置选项
        this.options = {
            position: options.position || 'bottom-right',
            offsetX: options.offsetX || 16,
            offsetY: options.offsetY || 20,
            size: options.size || 72,
            bgColor: options.bgColor || '#FFE080',
            onClick: options.onClick || null,
            animate: options.animate !== false,
            edgeMargin: 16,
            edgeThreshold: 40,
            ...options
        }
        
        // 按钮状态
        this.isVisible = true
        this.isAnimating = false
        this.animationOffset = 0
        
        // 拖拽状态机: 'idle' | 'pressing' | 'dragging'
        this.dragState = 'idle'
        this.touchStartX = 0
        this.touchStartY = 0
        this.buttonStartX = 0
        this.buttonStartY = 0
        this.pressStartTime = 0
        
        // 半隐藏状态
        this.isSemiHidden = false
        this.semiHiddenProgress = 0
        this.lastInteractionTime = Date.now()
        this.semiHiddenTimer = null
        this.semiHiddenAnimFrame = null
        
        this.wasSemiHiddenOnTouchStart = false
        
        // 吸附动画
        this.snapAnimation = null
        
        // 当前位置
        this.currentX = 0
        this.currentY = 0
        this.targetX = 0
        this.targetY = 0
        
        // 吸附边
        this.snapSide = 'right'
        
        // 计算初始位置
        this.calculatePosition()
        this.currentX = this.x
        this.currentY = this.y
        this.targetX = this.x
        this.targetY = this.y
        
        // 启动半隐藏检查
        this.startSemiHiddenCheck()
    }
    
    /**
     * 计算按钮初始位置
     */
    calculatePosition() {
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        const size = this.options.size
        const offsetX = this.options.offsetX
        const offsetY = this.options.offsetY
        
        switch (this.options.position) {
            case 'top-left':
                this.x = offsetX + size / 2
                this.y = offsetY + size / 2
                this.snapSide = 'left'
                break
            case 'top-right':
                this.x = w - offsetX - size / 2
                this.y = offsetY + size / 2
                this.snapSide = 'right'
                break
            case 'bottom-left':
                this.x = offsetX + size / 2
                this.y = h - offsetY - size / 2
                this.snapSide = 'left'
                break
            case 'bottom-right':
            default:
                this.x = w - offsetX - size / 2
                this.y = h - offsetY - size / 2
                this.snapSide = 'right'
                break
        }
    }
    
    /**
     * 更新位置
     */
    updatePosition() {
        this.calculatePosition()
        
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        
        if (this.snapSide === 'left') {
            this.currentX = this.options.edgeMargin + this.options.size / 2
        } else {
            this.currentX = w - this.options.edgeMargin - this.options.size / 2
        }
        
        this.currentY = Math.max(this.options.size, Math.min(h - this.options.size, this.currentY))
        this.targetX = this.currentX
        this.targetY = this.currentY
    }
    
    /**
     * 处理触摸开始
     */
    processTouchStart(x, y) {
        if (!this.isPointInButton(x, y)) {
            return false
        }
        
        this.touchStartX = x
        this.touchStartY = y
        this.buttonStartX = this.currentX
        this.buttonStartY = this.currentY
        this.pressStartTime = Date.now()
        
        if (this.isSemiHidden) {
            this.wasSemiHiddenOnTouchStart = true
            this.restoreFromSemiHidden()
        } else {
            this.wasSemiHiddenOnTouchStart = false
        }
        
        this.dragState = 'pressing'
        this.lastInteractionTime = Date.now()
        this.stopSnapAnimation()
        
        return true
    }
    
    /**
     * 处理触摸移动
     */
    processTouchMove(x, y) {
        if (this.dragState === 'idle') {
            return false
        }
        
        const dx = x - this.touchStartX
        const dy = y - this.touchStartY
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (this.dragState === 'pressing' && distance >= 10) {
            this.dragState = 'dragging'
        }
        
        if (this.dragState === 'dragging') {
            this.currentX = this.buttonStartX + dx
            this.currentY = this.buttonStartY + dy
            
            const w = this.game.renderer.width
            const h = this.game.renderer.height
            const size = this.options.size
            
            this.currentX = Math.max(size / 2, Math.min(w - size / 2, this.currentX))
            this.currentY = Math.max(size / 2, Math.min(h - size / 2, this.currentY))
            
            this.checkEdgeProximity()
        }
        
        this.lastInteractionTime = Date.now()
        return true
    }
    
    /**
     * 处理触摸结束
     */
    processTouchEnd(x, y) {
        if (this.dragState === 'idle') {
            return false
        }
        
        const prevState = this.dragState
        const wasSemiHidden = this.wasSemiHiddenOnTouchStart
        this.dragState = 'idle'
        this.wasSemiHiddenOnTouchStart = false
        this.lastInteractionTime = Date.now()
        
        if (prevState === 'pressing') {
            const pressDuration = Date.now() - this.pressStartTime
            if (pressDuration < 200 && !wasSemiHidden) {
                this.handleClick()
            }
            return true
        }
        
        if (prevState === 'dragging') {
            this.snapToEdge()
            return true
        }
        
        return true
    }
    
    /**
     * 检查拖拽时是否靠近屏幕边缘，靠近则进入半隐藏
     */
    checkEdgeProximity() {
        const w = this.game.renderer.width
        const threshold = this.options.edgeThreshold
        const size = this.options.size
        
        const distToLeft = this.currentX - size / 2
        const distToRight = w - (this.currentX + size / 2)
        
        const nearEdge = distToLeft < threshold || distToRight < threshold
        
        if (nearEdge && !this.isSemiHidden) {
            this.snapSide = this.currentX < w / 2 ? 'left' : 'right'
            this.enterSemiHidden()
        } else if (!nearEdge && this.isSemiHidden) {
            this.restoreFromSemiHidden()
        }
    }
    
    /**
     * 检查点是否在按钮内
     */
    isPointInButton(x, y) {
        const size = this.options.size
        const halfSize = size / 2
        
        let buttonX = this.currentX
        if (this.semiHiddenProgress > 0) {
            const w = this.game.renderer.width
            const targetX = this.snapSide === 'left'
                ? -size * 0.1
                : w + size * 0.1
            buttonX = this.currentX + (targetX - this.currentX) * this.semiHiddenProgress
        }
        
        const hitPadding = this.isSemiHidden ? halfSize * 0.3 : 0
        
        return x >= buttonX - halfSize - hitPadding && 
               x <= buttonX + halfSize + hitPadding && 
               y >= this.currentY - halfSize - hitPadding && 
               y <= this.currentY + halfSize + hitPadding
    }
    
    /**
     * 吸附到最近的左右边缘
     */
    snapToEdge() {
        const w = this.game.renderer.width
        const size = this.options.size
        const margin = this.options.edgeMargin
        
        const distToLeft = this.currentX
        const distToRight = w - this.currentX
        
        if (distToLeft < distToRight) {
            this.snapSide = 'left'
            this.targetX = margin + size / 2
        } else {
            this.snapSide = 'right'
            this.targetX = w - margin - size / 2
        }
        
        this.targetY = this.currentY
        
        this.startSnapAnimation()
    }
    
    /**
     * 启动吸附动画（弹性缓动，250ms）
     */
    startSnapAnimation() {
        this.stopSnapAnimation()
        
        const startX = this.currentX
        const startY = this.currentY
        const targetX = this.targetX
        const targetY = this.targetY
        const duration = 250
        const startTime = Date.now()
        
        const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            
            // 弹性缓动函数
            const easeOutElastic = (t) => {
                const c4 = (2 * Math.PI) / 3
                return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
            }
            
            const eased = easeOutElastic(progress)
            
            this.currentX = startX + (targetX - startX) * eased
            this.currentY = startY + (targetY - startY) * eased
            
            if (progress < 1) {
                this.snapAnimation = requestAnimationFrame(animate)
            } else {
                this.snapAnimation = null
                this.enterSemiHidden()
            }
        }
        
        this.snapAnimation = requestAnimationFrame(animate)
    }
    
    /**
     * 停止吸附动画
     */
    stopSnapAnimation() {
        if (this.snapAnimation) {
            cancelAnimationFrame(this.snapAnimation)
            this.snapAnimation = null
        }
    }
    
    /**
     * 进入半隐藏状态
     */
    enterSemiHidden() {
        if (this.isSemiHidden) return
        this.isSemiHidden = true
        this.lastInteractionTime = Date.now()
        this.animateSemiHidden(1)
    }
    
    /**
     * 从半隐藏恢复
     */
    restoreFromSemiHidden() {
        if (!this.isSemiHidden) return
        this.isSemiHidden = false
        this.lastInteractionTime = Date.now()
        this.animateSemiHidden(0)
    }
    
    /**
     * 半隐藏状态动画
     */
    animateSemiHidden(targetProgress) {
        // 停止之前的动画
        if (this.semiHiddenAnimFrame) {
            cancelAnimationFrame(this.semiHiddenAnimFrame)
            this.semiHiddenAnimFrame = null
        }
        
        const startProgress = this.semiHiddenProgress
        const duration = targetProgress === 1 ? 300 : 200
        const startTime = Date.now()
        
        const animate = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            
            const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
            const eased = easeInOutCubic(progress)
            
            this.semiHiddenProgress = startProgress + (targetProgress - startProgress) * eased
            
            if (progress < 1) {
                this.semiHiddenAnimFrame = requestAnimationFrame(animate)
            } else {
                this.semiHiddenAnimFrame = null
            }
        }
        
        this.semiHiddenAnimFrame = requestAnimationFrame(animate)
    }
    
    /**
     * 启动半隐藏检查定时器
     */
    startSemiHiddenCheck() {
        this.semiHiddenTimer = setInterval(() => {
            if (this.dragState !== 'idle') return
            
            const idleTime = Date.now() - this.lastInteractionTime
            
            // 静止2秒后进入半隐藏
            if (idleTime >= 2000 && !this.isSemiHidden) {
                this.enterSemiHidden()
            }
        }, 100)
    }
    
    /**
     * 停止半隐藏检查定时器
     */
    stopSemiHiddenCheck() {
        if (this.semiHiddenTimer) {
            clearInterval(this.semiHiddenTimer)
            this.semiHiddenTimer = null
        }
    }
    
    /**
     * 显示按钮
     */
    show() {
        this.isVisible = true
        if (this.options.animate) {
            this.startShowAnimation()
        }
    }
    
    /**
     * 隐藏按钮
     */
    hide() {
        this.isVisible = false
    }
    
    /**
     * 开始显示动画
     */
    startShowAnimation() {
        this.isAnimating = true
        this.animationOffset = 20
        
        const animate = () => {
            if (!this.isAnimating) return
            
            this.animationOffset *= 0.85
            if (Math.abs(this.animationOffset) < 0.5) {
                this.animationOffset = 0
                this.isAnimating = false
            } else {
                requestAnimationFrame(animate)
            }
        }
        
        requestAnimationFrame(animate)
    }
    
    /**
     * 渲染按钮
     */
    render(renderer) {
        if (!this.isVisible) return
        
        const ctx = renderer.ctx
        const size = this.options.size
        const radius = size / 2
        const w = renderer.width
        
        let renderX = this.currentX
        if (this.semiHiddenProgress > 0) {
            const targetX = this.snapSide === 'left'
                ? -size * 0.1
                : w + size * 0.1
            renderX = this.currentX + (targetX - this.currentX) * this.semiHiddenProgress
        }
        
        let renderY = this.currentY
        
        // 添加显示动画偏移
        if (this.options.position.includes('bottom')) {
            renderY += this.animationOffset
        } else {
            renderY -= this.animationOffset
        }
        
        // 计算透明度：半隐藏时50%
        const alpha = 1 - 0.5 * this.semiHiddenProgress
        
        ctx.save()
        ctx.globalAlpha = alpha
        
        // 绘制阴影
        ctx.beginPath()
        ctx.arc(renderX, renderY + 3, radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(139, 115, 85, 0.2)'
        ctx.fill()
        
        // 绘制按钮背景
        ctx.beginPath()
        ctx.arc(renderX, renderY, radius, 0, Math.PI * 2)
        ctx.fillStyle = this.options.bgColor
        ctx.fill()
        
        // 绘制轮廓线
        ctx.beginPath()
        ctx.arc(renderX, renderY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.5
        ctx.stroke()
        
        // 绘制内圈装饰线
        ctx.beginPath()
        ctx.arc(renderX, renderY, radius - 4, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(212, 165, 116, 0.4)'
        ctx.lineWidth = 1
        ctx.stroke()
        
        ctx.restore()
        
        // 绘制手机图标
        ctx.save()
        ctx.globalAlpha = alpha
        SVGIcons.drawPhone(ctx, renderX, renderY, size * 0.55)
        ctx.restore()
    }
    
    /**
     * 处理点击事件
     */
    handleClick() {
        console.log('[FloatPhoneButton] 点击悬浮手机按钮')
        
        if (this.game.gameState.data.settings?.vibrationEnabled) {
            wx.vibrateShort({ type: 'light' })
        }
        
        if (typeof this.options.onClick === 'function') {
            this.options.onClick()
        }
    }
    
    /**
     * 销毁组件
     */
    destroy() {
        this.isVisible = false
        this.isAnimating = false
        this.dragState = 'idle'
        this.stopSnapAnimation()
        this.stopSemiHiddenCheck()
        if (this.semiHiddenAnimFrame) {
            cancelAnimationFrame(this.semiHiddenAnimFrame)
            this.semiHiddenAnimFrame = null
        }
    }
}
