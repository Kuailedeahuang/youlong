import imageManager from '../utils/imageManager.js'
import SplashScene from './splashScene.js'

export default class LoginScene {
    constructor(game) {
        this.game = game
        this.logoImage = null
        this.imageLoaded = false
        this.logoFadeStartTime = null
        this.isLoginProcessing = false
        this.loginStatus = 'waiting' // waiting | processing | success | error
        this.loginButtonRect = null
        this.buttonPressed = false
        this.loadingAngle = 0
        this.logoLoadStarted = false
        this.cloudTime = 0 // 用于云朵动画，避免Date.now()跳跃

        // 吉卜力风格配色（优化版 - 增强对比度，与splash统一）
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
    }

    async loadLogo() {
        const sharedLogo = SplashScene.getSharedLogo()
        if (sharedLogo) {
            this.logoImage = sharedLogo
            this.imageLoaded = true
            this.logoFadeStartTime = Date.now()
            console.log('使用共享Logo图片')
            return
        }

        const sharedPromise = SplashScene.getSharedLogoPromise()
        if (sharedPromise) {
            try {
                await sharedPromise
                const logo = SplashScene.getSharedLogo()
                if (logo) {
                    this.logoImage = logo
                    this.imageLoaded = true
                    this.logoFadeStartTime = Date.now()
                    console.log('等待共享Logo加载完成')
                    return
                }
            } catch (e) {
                console.warn('等待共享Logo失败，自行加载:', e)
            }
        }

        try {
            this.useLocalLogo()

            if (wx.cloud) {
                const cloudImage = await imageManager.loadImageFromCloud('game_logo.png')
                if (cloudImage && cloudImage.image) {
                    this.logoImage = cloudImage.image
                    this.imageLoaded = true
                    this.logoFadeStartTime = Date.now()
                    console.log('使用云存储Logo图片: game_logo.png')
                }
            }
        } catch (e) {
            console.warn('从云端加载Logo失败，使用本地图片:', e)
        }
    }

    useLocalLogo() {
        this.logoImage = wx.createImage()
        this.logoImage.onload = () => {
            this.imageLoaded = true
            this.logoFadeStartTime = Date.now()
        }
        this.logoImage.onerror = () => {
            console.error('Logo图片加载失败')
        }
        this.logoImage.src = 'tupian/logo.png'
    }

    onEnter() {
        console.log('[LoginScene] onEnter() 被调用')
        console.log('[LoginScene] gameState:', this.game.gameState)
        console.log('[LoginScene] isLoggedIn:', this.game.gameState.isLoggedIn())

        if (!this.logoLoadStarted) {
            this.loadLogo()
            this.logoLoadStarted = true
        }

        const systemInfo = wx.getSystemInfoSync()
        const screenWidth = systemInfo.windowWidth
        const screenHeight = systemInfo.windowHeight

        const buttonWidth = screenWidth * 0.65
        const buttonHeight = 62
        const buttonX = (screenWidth - buttonWidth) / 2
        const buttonY = screenHeight * 0.63

        this.loginButtonRect = {
            x: buttonX,
            y: buttonY,
            width: buttonWidth,
            height: buttonHeight
        }

        if (this.game.gameState.isLoggedIn()) {
            console.log('用户已登录，自动进入游戏')
            this.loginStatus = 'success'
            setTimeout(() => {
<<<<<<< HEAD
                this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
=======
                this.game.sceneManager.switchTo('home')
>>>>>>> 9ee67bfa37532d9ba32be0503a8550afbb81b6fb
            }, 800)
        }
    }

    onExit() {}

    async handleLoginClick() {
        console.log('[LoginScene] handleLoginClick() 被调用')
        console.log('[LoginScene] isLoginProcessing:', this.isLoginProcessing)
        console.log('[LoginScene] loginStatus:', this.loginStatus)

        if (this.isLoginProcessing || this.loginStatus === 'success' || this.loginStatus === 'processing') {
            console.log('[LoginScene] 登录处理中或已完成，直接返回')
            return
        }

        this.isLoginProcessing = true
        this.loginStatus = 'processing'

        try {
            const loginRes = await this.wxLogin()

            if (loginRes.code) {
                console.log('wx.login 获取 code 成功')

                let openidResult = null
                try {
                    const cloudRes = await this.callFunctionWithTimeout('userLogin', { code: loginRes.code })
                    console.log('[Login] userLogin云函数返回:', cloudRes)
                    openidResult = cloudRes.result
                    console.log('[Login] openidResult:', openidResult)
                } catch (e) {
                    console.error('[Login] userLogin云函数调用失败:', e)
                    throw new Error('登录服务暂时不可用，请稍后重试')
                }

                if (openidResult && openidResult.success && openidResult.openid) {
                    const userInfo = {
                        openid: openidResult.openid,
                        loginTime: Date.now()
                    }

                    if (openidResult.userData) {
                        Object.assign(userInfo, openidResult.userData)
                    }

                    this.game.gameState.setUserInfo(userInfo)

                    this.loginStatus = 'success'
                    console.log('微信登录成功，openid:', openidResult.openid)

                    wx.showToast({
                        title: '登录成功',
                        icon: 'success',
                        duration: 1000
                    })

                    setTimeout(() => {
<<<<<<< HEAD
                        this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
=======
                        this.game.sceneManager.switchTo('home')
>>>>>>> 9ee67bfa37532d9ba32be0503a8550afbb81b6fb
                    }, 1000)
                } else {
                    const errMsg = openidResult && openidResult.error ? openidResult.error : '未获取到openid'
                    throw new Error('登录失败：' + errMsg)
                }
            } else {
                throw new Error('wx.login 失败')
            }
        } catch (e) {
            console.error('微信登录失败:', e)
            this.loginStatus = 'error'
            this.isLoginProcessing = false

            wx.showModal({
                title: '登录失败',
                content: e.message || '登录过程中出现错误，请重试',
                confirmText: '重试',
                cancelText: '取消',
                success: (res) => {
                    if (res.confirm) {
                        this.loginStatus = 'waiting'
                        this.isLoginProcessing = false
                    }
                }
            })
        }
    }

    callFunctionWithTimeout(name, data, timeout = 10000) {
        console.log(`[Login] 调用云函数: ${name}, data:`, data)
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('请求超时')), timeout)
        })
        return Promise.race([
            wx.cloud.callFunction({ name, data }),
            timeoutPromise
        ])
    }

    wxLogin() {
        console.log('[Login] 调用 wx.login()')
        return new Promise((resolve, reject) => {
            wx.login({
                success: (res) => {
                    console.log('[Login] wx.login 成功:', res)
                    resolve(res)
                },
                fail: (err) => {
                    console.error('[Login] wx.login 失败:', err)
                    reject(err)
                }
            })
        })
    }

    update(deltaTime) {
        // 使用deltaTime累积云朵动画时间
        this.cloudTime += deltaTime * 0.1

        if (this.loginStatus === 'processing') {
            // 防止loadingAngle溢出
            this.loadingAngle = (this.loadingAngle + deltaTime * 0.003) % (Math.PI * 2)
        }
    }

    render(renderer) {
        const w = renderer.width
        const h = renderer.height
        const ctx = renderer.ctx

        this.drawGhibliBackground(ctx, w, h)

        const logoSize = Math.min(w, h) * 0.28
        const logoX = (w - logoSize) / 2
        const logoY = h * 0.16

        this.drawLogo(ctx, logoX, logoY, logoSize)

        this.drawTitle(ctx, w, logoY + logoSize)

        if (this.loginButtonRect) {
            this.drawLoginButton(ctx, w)
        }

        this.drawFooter(ctx, w, h)
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
        const grassGradient = ctx.createLinearGradient(0, h * 0.7, 0, h)
        grassGradient.addColorStop(0, 'rgba(152, 251, 152, 0.08)')
        grassGradient.addColorStop(1, 'rgba(144, 238, 144, 0.03)')
        ctx.fillStyle = grassGradient
        ctx.fillRect(0, h * 0.7, w, h * 0.3)

        ctx.save()
        ctx.globalAlpha = 0.06
        ctx.fillStyle = this.colors.secondary
        ctx.beginPath()
        ctx.moveTo(0, h * 0.85)
        ctx.bezierCurveTo(w * 0.25, h * 0.78, w * 0.45, h * 0.88, w * 0.65, h * 0.82)
        ctx.bezierCurveTo(w * 0.85, h * 0.86, w * 0.98, h * 0.8, w, h * 0.85)
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

        const subtitleY = titleY + 40
        ctx.fillStyle = this.colors.textSub
        ctx.font = '16px sans-serif'
        ctx.fillText('登录游戏', w / 2, subtitleY)

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

    drawLoginButton(ctx, w) {
        const btn = this.loginButtonRect
        const radius = btn.height * 0.2

        let bgColor = this.colors.primary
        let buttonText = '微信一键登录'
        let scale = 1

        if (this.loginStatus === 'processing') {
            bgColor = this.colors.textSub
            buttonText = '登录中...'
        } else if (this.loginStatus === 'success') {
            bgColor = this.colors.success
            buttonText = '登录成功!'
        } else if (this.loginStatus === 'error') {
            bgColor = this.colors.error
            buttonText = '登录失败，点击重试'
        }

        if (this.buttonPressed && this.loginStatus === 'waiting') {
            scale = 0.95
            bgColor = this.colors.primaryDark
        }

        ctx.save()
        ctx.translate(btn.x + btn.width / 2, btn.y + btn.height / 2)
        ctx.scale(scale, scale)
        ctx.translate(-(btn.x + btn.width / 2), -(btn.y + btn.height / 2))

        ctx.fillStyle = bgColor

        if (this.buttonPressed && this.loginStatus === 'waiting') {
            ctx.shadowColor = 'rgba(45, 45, 45, 0.12)'
            ctx.shadowBlur = 10
            ctx.shadowOffsetY = 4
        } else if (this.loginStatus === 'waiting') {
            ctx.shadowColor = 'rgba(255, 224, 128, 0.25)'
            ctx.shadowBlur = 10
            ctx.shadowOffsetY = 2
        }

        this.drawRoundRectPath(ctx, btn.x, btn.y, btn.width, btn.height, radius)
        ctx.fill()
        ctx.shadowColor = 'transparent'

        if (this.loginStatus === 'waiting') {
            const highlight = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + btn.height * 0.3)
            highlight.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
            highlight.addColorStop(1, 'rgba(255, 255, 255, 0)')
            ctx.fillStyle = highlight
            ctx.save()
            ctx.beginPath()
            ctx.moveTo(btn.x + radius, btn.y)
            ctx.lineTo(btn.x + btn.width - radius, btn.y)
            ctx.quadraticCurveTo(btn.x + btn.width, btn.y, btn.x + btn.width, btn.y + radius)
            ctx.lineTo(btn.x + btn.width, btn.y + btn.height * 0.28)
            ctx.bezierCurveTo(btn.x + btn.width * 0.75, btn.y + btn.height * 0.18, btn.x + btn.width * 0.25, btn.y + btn.height * 0.18, btn.x, btn.y + btn.height * 0.28)
            ctx.lineTo(btn.x, btn.y + radius)
            ctx.quadraticCurveTo(btn.x, btn.y, btn.x + radius, btn.y)
            ctx.fill()
            ctx.restore()
        }

        ctx.strokeStyle = this.colors.outline
        ctx.lineWidth = 2
        this.drawRoundRectPath(ctx, btn.x, btn.y, btn.width, btn.height, radius)
        ctx.stroke()

        ctx.fillStyle = this.colors.textMain
        ctx.font = 'bold 18px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(buttonText, btn.x + btn.width / 2, btn.y + btn.height / 2)

        if (this.loginStatus === 'processing') {
            this.drawLoadingSpinner(ctx, btn.x + btn.width - 48, btn.y + btn.height / 2)
        }

        ctx.restore()
    }

    drawLoadingSpinner(ctx, x, y) {
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(this.loadingAngle)

        ctx.strokeStyle = this.colors.textMain
        ctx.lineWidth = 3.5
        ctx.lineCap = 'round'

        ctx.beginPath()
        ctx.arc(0, 0, 12, 0, Math.PI * 1.5)
        ctx.stroke()

        ctx.restore()
    }

    drawFooter(ctx, w, h) {
        const footerY = h * 0.86
        ctx.save()
        ctx.fillStyle = this.colors.textSub
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const breathe = Math.sin(Date.now() * 0.0018) * 0.2 + 0.8
        ctx.globalAlpha = breathe
        ctx.fillText('登录后游戏数据将自动保存到云端', w / 2, footerY)
        ctx.restore()
    }

    handleTouchStart(x, y) {
        if (!this.loginButtonRect) {
            return false
        }

        if (this.isLoginProcessing || this.loginStatus === 'success') {
            return true
        }

        const btn = this.loginButtonRect
        if (x >= btn.x - 12 && x <= btn.x + btn.width + 12 &&
            y >= btn.y - 12 && y <= btn.y + btn.height + 12) {
            this.buttonPressed = true
            // 添加try-catch处理振动API兼容性
            try {
                wx.vibrateShort({ type: 'light' })
            } catch (e) {
                // 降级处理
                try {
                    wx.vibrateShort()
                } catch (err) {
                    // 忽略振动失败
                }
            }
            return true
        }
        return false
    }

    handleTouchMove(x, y) {
        if (this.buttonPressed) {
            const btn = this.loginButtonRect
            if (x < btn.x - 12 || x > btn.x + btn.width + 12 ||
                y < btn.y - 12 || y > btn.y + btn.height + 12) {
                this.buttonPressed = false
            }
        }
    }

    handleTouchEnd(x, y) {
        if (this.buttonPressed) {
            this.buttonPressed = false
            this.handleLoginClick()
        }
    }
}
