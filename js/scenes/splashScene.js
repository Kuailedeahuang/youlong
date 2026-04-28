import imageManager from '../utils/imageManager.js'

// 全局共享的Logo图片
let sharedLogoImage = null
let sharedLogoPromise = null

export default class SplashScene {
    constructor(game) {
        this.game = game
        this.logoImage = null
        this.imageLoaded = false
        this.logoFadeStartTime = null
        this.loadingProgress = 0
        this.loadingDuration = 5000
        this.startTime = null
        this.cloudTime = 0 // 用于云朵动画，避免Date.now()跳跃
        
        // 吉卜力风格配色（优化版 - 增强对比度）
        this.colors = {
            bgStart: '#B8D4E8',
            bgEnd: '#E8F0F8',
            bgLight: '#F5FAFF',
            bgMedium: '#C8E0F0',
            bgDark: '#A8C8E0',
            panel: '#FFF8F0',
            primary: '#FFD54F',
            primaryDark: '#FFB300',
            secondary: '#5A9FD4',
            accent: '#7ED957',
            warm: '#E8913A',
            textMain: '#4A3728',
            textSub: '#5A6A7A',
            textLight: '#8A9AAA',
            outline: '#3D3D3D',
            success: '#81C784',
            warning: '#FFD54F',
            error: '#E57373'
        }
        
        // 保存Promise以便后续等待
        this.logoLoadPromise = this.loadLogo()
    }
    
    // 获取共享Logo的方法，供loginScene使用
    static getSharedLogo() {
        return sharedLogoImage
    }
    
    static getSharedLogoPromise() {
        return sharedLogoPromise
    }
    
    async loadLogo() {
        // 如果已经有共享的Promise，直接等待
        if (sharedLogoPromise) {
            await sharedLogoPromise
            return
        }

        const loadPromise = this._loadLogoInternal()
        sharedLogoPromise = loadPromise
        
        await loadPromise
    }

    async _loadLogoInternal() {
        try {
            // 优先使用本地图片，快速显示
            this.useLocalLogo()

            // 同时异步加载云端高清图片
            if (wx.cloud) {
                const cloudImage = await imageManager.loadImageFromCloud('game_logo.png')
                if (cloudImage && cloudImage.image) {
                    this.logoImage = cloudImage.image
                    sharedLogoImage = cloudImage.image
                    this.imageLoaded = true
                    this.logoFadeStartTime = Date.now()
                    console.log('使用云存储Logo图片: game_logo.png')
                }
            }
        } catch (e) {
            console.warn('从云端加载Logo失败，继续使用本地图片:', e)
        }
    }

    useLocalLogo() {
        this.logoImage = wx.createImage()
        this.logoImage.onload = () => {
            this.imageLoaded = true
            this.logoFadeStartTime = Date.now()
            if (!sharedLogoImage) {
                sharedLogoImage = this.logoImage
            }
        }
        this.logoImage.onerror = () => {
            console.error('Logo图片加载失败')
        }
        this.logoImage.src = 'tupian/logo.png'
    }
    
    onEnter() {
        // 等待Logo加载完成后再开始计时
        if (this.logoLoadPromise) {
            this.logoLoadPromise.then(() => {
                this.startTime = Date.now()
                this.loadingProgress = 0
            })
        } else {
            this.startTime = Date.now()
            this.loadingProgress = 0
        }
    }
    
    update(deltaTime) {
        if (!this.startTime) return
        
        // 使用deltaTime累积云朵动画时间，避免Date.now()跳跃
        this.cloudTime += deltaTime * 0.1
        
        const elapsed = Date.now() - this.startTime
        this.loadingProgress = Math.min(1, elapsed / this.loadingDuration)
        
        if (this.loadingProgress >= 1) {
            this.game.sceneManager.switchTo('login')
        }
    }
    
    render(renderer) {
        const w = renderer.width
        const h = renderer.height
        const ctx = renderer.ctx
        
        this.drawGhibliBackground(ctx, w, h)
        
        const logoSize = Math.min(w, h) * 0.3
        const logoX = (w - logoSize) / 2
        const logoY = h * 0.18
        
        this.drawLogo(ctx, logoX, logoY, logoSize)
        
        this.drawTitle(ctx, w, logoY + logoSize)
        
        const barWidth = w * 0.6
        const barHeight = 14
        const barX = (w - barWidth) / 2
        const barY = h * 0.6
        
        this.drawLoadingBar(ctx, barX, barY, barWidth, barHeight)
        
        this.drawLoadingTips(ctx, w, barY + barHeight)
    }
    
    drawGhibliBackground(ctx, w, h) {
        const gradient = ctx.createLinearGradient(0, 0, 0, h)
        gradient.addColorStop(0, this.colors.bgStart)
        gradient.addColorStop(0.5, this.colors.bgLight)
        gradient.addColorStop(1, this.colors.bgEnd)
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, w, h)
        
        this.drawBackgroundDetails(ctx, w, h)
        this.drawClouds(ctx, w, h)
    }
    
    drawBackgroundDetails(ctx, w, h) {
        // 底部草地渐变
        const grassGradient = ctx.createLinearGradient(0, h * 0.7, 0, h)
        grassGradient.addColorStop(0, 'rgba(152, 251, 152, 0.08)')
        grassGradient.addColorStop(1, 'rgba(144, 238, 144, 0.03)')
        ctx.fillStyle = grassGradient
        ctx.fillRect(0, h * 0.7, w, h * 0.3)
        
        // 远处的山脉剪影
        ctx.save()
        ctx.globalAlpha = 0.06
        ctx.fillStyle = this.colors.secondary
        ctx.beginPath()
        ctx.moveTo(0, h * 0.85)
        ctx.bezierCurveTo(w * 0.2, h * 0.78, w * 0.4, h * 0.88, w * 0.6, h * 0.82)
        ctx.bezierCurveTo(w * 0.8, h * 0.86, w * 0.95, h * 0.8, w, h * 0.85)
        ctx.lineTo(w, h)
        ctx.lineTo(0, h)
        ctx.fill()
        ctx.restore()
    }
    
    drawClouds(ctx, w, h) {
        ctx.save()
        // 使用累积的cloudTime替代Date.now()
        const time = this.cloudTime
        
        const drawCloud = (x, y, size, offset, alpha) => {
            // 增加移动幅度：从 0.3 增加到 0.8，让飘动更明显
            const moveX = Math.sin(time * 0.5 + offset) * size * 0.8
            ctx.globalAlpha = alpha
            ctx.fillStyle = '#FFFFFF'
            ctx.beginPath()
            ctx.arc(x + moveX, y, size, 0, Math.PI * 2)
            ctx.arc(x + moveX + size * 0.6, y - size * 0.3, size * 0.8, 0, Math.PI * 2)
            ctx.arc(x + moveX + size * 1.2, y, size * 0.7, 0, Math.PI * 2)
            ctx.fill()
        }
        
        // 远景云：更大、更慢、提高透明度使其可见
        drawCloud(w * 0.15, h * 0.22, 35, 0, 0.35)
        drawCloud(w * 0.75, h * 0.28, 28, 2, 0.30)

        // 中景云
        drawCloud(w * 0.05, h * 0.18, 25, 1, 0.55)
        drawCloud(w * 0.85, h * 0.25, 22, 3, 0.50)

        // 近景云：更小、更快、更明显，位置在Logo周围
        drawCloud(w * 0.25, h * 0.35, 18, 0.5, 0.80)
        drawCloud(w * 0.7, h * 0.32, 15, 1.5, 0.75)
        
        ctx.restore()
    }
    
    drawLogo(ctx, x, y, size) {
        let alpha = 1
        if (this.logoFadeStartTime) {
            const elapsed = Date.now() - this.logoFadeStartTime
            alpha = Math.min(1, elapsed / 800)
        }
        
        ctx.save()
        ctx.globalAlpha = alpha
        
        if (this.imageLoaded && this.logoImage && this.logoImage.width > 0) {
            try {
                ctx.drawImage(this.logoImage, x, y, size, size)
            } catch (e) {
                console.warn('绘制Logo失败:', e)
                this.drawPlaceholderLogo(ctx, x, y, size)
            }
        } else {
            this.drawPlaceholderLogo(ctx, x, y, size)
        }
        
        ctx.restore()
    }
    
    drawPlaceholderLogo(ctx, x, y, size) {
        const radius = size * 0.2
        
        this.drawGhibliPanel(ctx, x, y, size, size, radius)
        
        ctx.fillStyle = this.colors.primary
        ctx.font = `bold ${size * 0.5}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('游', x + size / 2, y + size / 2)
    }
    
    drawGhibliPanel(ctx, x, y, w, h, r) {
        ctx.fillStyle = this.colors.panel
        
        ctx.shadowColor = 'rgba(45, 45, 45, 0.08)'
        ctx.shadowBlur = 8
        ctx.shadowOffsetY = 3
        this.drawRoundRectPath(ctx, x, y, w, h, r)
        ctx.fill()
        ctx.shadowColor = 'transparent'
        
        const highlight = ctx.createLinearGradient(x, y, x, y + h * 0.3)
        highlight.addColorStop(0, 'rgba(255, 255, 255, 0.35)')
        highlight.addColorStop(1, 'rgba(255, 255, 255, 0)')
        ctx.fillStyle = highlight
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + r)
        ctx.lineTo(x + w, y + h * 0.28)
        ctx.bezierCurveTo(x + w * 0.75, y + h * 0.18, x + w * 0.25, y + h * 0.18, x, y + h * 0.28)
        ctx.lineTo(x, y + r)
        ctx.quadraticCurveTo(x, y, x + r, y)
        ctx.fill()
        ctx.restore()
        
        ctx.strokeStyle = this.colors.outline
        ctx.lineWidth = 2
        this.drawRoundRectPath(ctx, x, y, w, h, r)
        ctx.stroke()
    }
    
    // 使用quadraticCurveTo替代arcTo以提高兼容性
    drawRoundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + r)
        ctx.lineTo(x + w, y + h - r)
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
        ctx.lineTo(x + r, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - r)
        ctx.lineTo(x, y + r)
        ctx.quadraticCurveTo(x, y, x + r, y)
        ctx.closePath()
    }
    
    drawTitle(ctx, w, baseY) {
        ctx.save()
        
        const titleY = baseY + 45
        this.drawTextWithOutline(ctx, '游龙市场为买房', w / 2, titleY, 26, this.colors.textMain, this.colors.outline)
        
        ctx.restore()
    }
    
    drawTextWithOutline(ctx, text, x, y, fontSize, fillColor, outlineColor) {
        ctx.save()
        ctx.font = `bold ${fontSize}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        ctx.strokeStyle = outlineColor
        ctx.lineWidth = 3
        ctx.lineJoin = 'round'
        ctx.strokeText(text, x, y)
        
        ctx.fillStyle = fillColor
        ctx.fillText(text, x, y)
        
        ctx.restore()
    }
    
    drawLoadingBar(ctx, x, y, width, height) {
        const radius = height * 0.5
        
        this.drawGhibliPanel(ctx, x, y, width, height, radius)
        
        const progressWidth = width * this.loadingProgress
        if (progressWidth > 0) {
            const progressGradient = ctx.createLinearGradient(x, y, x, y + height)
            progressGradient.addColorStop(0, '#FFD54F')
            progressGradient.addColorStop(0.5, '#FF8F00')
            progressGradient.addColorStop(1, '#FFD54F')
            
            ctx.save()
            ctx.beginPath()
            this.drawRoundRectPath(ctx, x + 2, y + 2, progressWidth - 4, height - 4, radius - 2)
            ctx.clip()
            
            ctx.fillStyle = progressGradient
            ctx.fillRect(x + 2, y + 2, progressWidth - 4, height - 4)
            
            const highlight = ctx.createLinearGradient(x + 2, y + 2, x + 2, y + height / 2)
            highlight.addColorStop(0, 'rgba(255, 255, 255, 0.45)')
            highlight.addColorStop(1, 'rgba(255, 255, 255, 0)')
            ctx.fillStyle = highlight
            ctx.fillRect(x + 2, y + 2, progressWidth - 4, height / 2)
            
            ctx.restore()
        }
        
        const percentage = Math.floor(this.loadingProgress * 100)
        ctx.fillStyle = this.colors.textMain
        ctx.font = 'bold 15px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${percentage}%`, x + width / 2, y + height / 2)
    }
    
    drawLoadingTips(ctx, w, baseY) {
        const tips = [
            '正在加载游戏资源...',
            '正在连接服务器...',
            '正在初始化数据...',
            '即将进入游戏...'
        ]
        const tipIndex = Math.min(Math.floor(this.loadingProgress * tips.length), tips.length - 1)
        
        ctx.save()
        ctx.fillStyle = this.colors.textSub
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        
        const breathe = Math.sin(Date.now() * 0.002) * 0.2 + 0.8
        ctx.globalAlpha = breathe
        ctx.fillText(tips[tipIndex], w / 2, baseY + 32)
        ctx.restore()
    }
    
    handleTouchStart(x, y) {
        this.game.sceneManager.switchTo('login')
    }
    
    handleTouchMove(x, y) {}
    
    handleTouchEnd(x, y) {}
}
