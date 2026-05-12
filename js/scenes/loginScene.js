import imageManager from '../utils/imageManager.js'
import SplashScene from './splashScene.js'
import { GHIBLI_COLORS, drawGhibliBackground, drawLogo, drawRoundRectPath, drawGhibliPanel, drawTextWithOutline } from '../utils/GhibliRenderer.js'

export default class LoginScene {
    constructor(game) {
        this.game = game
        this.logoImage = null
        this.imageLoaded = false
        this.logoFadeStartTime = null
        this.isLoginProcessing = false
        this.loginStatus = 'waiting'
        this.loginButtonRect = null
        this.buttonPressed = false
        this.loadingAngle = 0
        this.logoLoadStarted = false
        this.cloudTime = 0
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
                this.game.sceneManager.goToLocation('home')
            }, 800)
        }
    }

    onExit() {}

    async handleLoginClick() {
        if (this.isLoginProcessing || this.loginStatus === 'success' || this.loginStatus === 'processing') {
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
                    openidResult = cloudRes.result
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
                        this.game.sceneManager.goToLocation('home')
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
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('请求超时')), timeout)
        })
        return Promise.race([
            wx.cloud.callFunction({ name, data }),
            timeoutPromise
        ])
    }

    wxLogin() {
        return new Promise((resolve, reject) => {
            wx.login({
                success: (res) => resolve(res),
                fail: (err) => reject(err)
            })
        })
    }

    update(deltaTime) {
        this.cloudTime += deltaTime * 0.1

        if (this.loginStatus === 'processing') {
            this.loadingAngle = (this.loadingAngle + deltaTime * 0.003) % (Math.PI * 2)
        }
    }

    render(renderer) {
        const w = renderer.width
        const h = renderer.height
        const ctx = renderer.ctx

        drawGhibliBackground(ctx, w, h, this.cloudTime)

        const logoSize = Math.min(w, h) * 0.28
        const logoX = (w - logoSize) / 2
        const logoY = h * 0.16

        drawLogo(ctx, logoX, logoY, logoSize, this.logoImage, this.imageLoaded, this.logoFadeStartTime)

        this.drawTitle(ctx, w, logoY + logoSize)

        if (this.loginButtonRect) {
            this.drawLoginButton(ctx, w)
        }

        this.drawFooter(ctx, w, h)
    }

    drawTitle(ctx, w, baseY) {
        ctx.save()

        const titleY = baseY + 45
        drawTextWithOutline(ctx, '游龙市场为买房', w / 2, titleY, 26, GHIBLI_COLORS.textMain, GHIBLI_COLORS.outline)

        const subtitleY = titleY + 40
        ctx.fillStyle = GHIBLI_COLORS.textSub
        ctx.font = '16px sans-serif'
        ctx.fillText('登录游戏', w / 2, subtitleY)

        ctx.restore()
    }

    drawLoginButton(ctx, w) {
        const btn = this.loginButtonRect
        const radius = btn.height * 0.2

        let bgColor = GHIBLI_COLORS.primary
        let buttonText = '微信一键登录'
        let scale = 1

        if (this.loginStatus === 'processing') {
            bgColor = GHIBLI_COLORS.textSub
            buttonText = '登录中...'
        } else if (this.loginStatus === 'success') {
            bgColor = GHIBLI_COLORS.success
            buttonText = '登录成功!'
        } else if (this.loginStatus === 'error') {
            bgColor = GHIBLI_COLORS.error
            buttonText = '登录失败，点击重试'
        }

        if (this.buttonPressed && this.loginStatus === 'waiting') {
            scale = 0.95
            bgColor = GHIBLI_COLORS.primaryDark
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

        drawRoundRectPath(ctx, btn.x, btn.y, btn.width, btn.height, radius)
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

        ctx.strokeStyle = GHIBLI_COLORS.outline
        ctx.lineWidth = 2
        drawRoundRectPath(ctx, btn.x, btn.y, btn.width, btn.height, radius)
        ctx.stroke()

        ctx.fillStyle = GHIBLI_COLORS.textMain
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

        ctx.strokeStyle = GHIBLI_COLORS.textMain
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
        ctx.fillStyle = GHIBLI_COLORS.textSub
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
            try {
                wx.vibrateShort({ type: 'light' })
            } catch (e) {
                try {
                    wx.vibrateShort()
                } catch (err) {}
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
