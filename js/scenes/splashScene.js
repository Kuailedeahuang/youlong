import imageManager from '../utils/imageManager.js'
import { GHIBLI_COLORS, drawGhibliBackground, drawLogo, drawRoundRectPath, drawGhibliPanel, drawTextWithOutline } from '../utils/GhibliRenderer.js'

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
        this.cloudTime = 0

        this.logoLoadPromise = this.loadLogo()
    }

    static getSharedLogo() {
        return sharedLogoImage
    }

    static getSharedLogoPromise() {
        return sharedLogoPromise
    }

    async loadLogo() {
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
            this.useLocalLogo()

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
        this.startTime = Date.now()
        this.loadingProgress = 0
    }

    update(deltaTime) {
        if (!this.startTime) return

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

        drawGhibliBackground(ctx, w, h, this.cloudTime)

        const logoSize = Math.min(w, h) * 0.3
        const logoX = (w - logoSize) / 2
        const logoY = h * 0.18

        drawLogo(ctx, logoX, logoY, logoSize, this.logoImage, this.imageLoaded, this.logoFadeStartTime)

        this.drawTitle(ctx, w, logoY + logoSize)

        const barWidth = w * 0.6
        const barHeight = 14
        const barX = (w - barWidth) / 2
        const barY = h * 0.6

        this.drawLoadingBar(ctx, barX, barY, barWidth, barHeight)

        this.drawLoadingTips(ctx, w, barY + barHeight)
    }

    drawTitle(ctx, w, baseY) {
        ctx.save()

        const titleY = baseY + 45
        drawTextWithOutline(ctx, '游龙市场为买房', w / 2, titleY, 26, GHIBLI_COLORS.textMain, GHIBLI_COLORS.outline)

        ctx.restore()
    }

    drawLoadingBar(ctx, x, y, width, height) {
        const radius = height * 0.5

        drawGhibliPanel(ctx, x, y, width, height, radius)

        const progressWidth = width * this.loadingProgress
        if (progressWidth > 0) {
            const progressGradient = ctx.createLinearGradient(x, y, x, y + height)
            progressGradient.addColorStop(0, '#FFD54F')
            progressGradient.addColorStop(0.5, '#FF8F00')
            progressGradient.addColorStop(1, '#FFD54F')

            ctx.save()
            ctx.beginPath()
            drawRoundRectPath(ctx, x + 2, y + 2, progressWidth - 4, height - 4, radius - 2)
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
        ctx.fillStyle = GHIBLI_COLORS.textMain
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
        ctx.fillStyle = GHIBLI_COLORS.textSub
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
