import imageManager from '../utils/imageManager.js'

export default class LoginScene {
    constructor(game) {
        this.game = game
        this.logoImage = null
        this.imageLoaded = false
        this.isLoginProcessing = false
        this.loginStatus = 'waiting'
        this.loginButtonRect = null
        this.loadLogo()
    }
    
    async loadLogo() {
        try {
            const cloudImage = await imageManager.loadImageFromCloud('game_logo.png')
            if (cloudImage && cloudImage.image) {
                this.logoImage = cloudImage.image
                this.imageLoaded = true
                console.log('使用云存储Logo图片: game_logo.png')
                return
            }
        } catch (e) {
            console.warn('从云端加载Logo失败，使用本地图片:', e)
        }
        
        this.logoImage = wx.createImage()
        this.logoImage.onload = () => {
            this.imageLoaded = true
        }
        this.logoImage.onerror = () => {
            console.error('Logo图片加载失败')
        }
        this.logoImage.src = 'tupian/logo.png'
    }
    
    onEnter() {
        const systemInfo = wx.getSystemInfoSync()
        const screenWidth = systemInfo.windowWidth
        const screenHeight = systemInfo.windowHeight
        
        const buttonWidth = screenWidth * 0.7
        const buttonHeight = 50
        const buttonX = (screenWidth - buttonWidth) / 2
        const buttonY = screenHeight * 0.65
        
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
                this.game.sceneManager.switchTo('home')
            }, 500)
        }
    }
    
    onExit() {}
    
    async handleLoginClick() {
        if (this.isLoginProcessing) return
        
        this.isLoginProcessing = true
        this.loginStatus = 'processing'
        
        try {
            const loginRes = await this.wxLogin()
            
            if (loginRes.code) {
                console.log('wx.login 获取 code 成功')
                
                let openidResult = null
                try {
                    const cloudRes = await wx.cloud.callFunction({
                        name: 'userLogin',
                        data: {
                            code: loginRes.code
                        }
                    })
                    openidResult = cloudRes.result
                } catch (e) {
                    console.warn('userLogin云函数调用失败，尝试getOpenId:', e)
                    const cloudRes = await wx.cloud.callFunction({
                        name: 'getOpenId'
                    })
                    openidResult = cloudRes.result
                }
                
                if (openidResult && openidResult.openid) {
                    await this.saveUserLoginRecord(openidResult.openid)
                    
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
                        this.game.sceneManager.switchTo('home')
                    }, 1200)
                } else {
                    throw new Error('登录失败，未获取到openid')
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
                content: '登录过程中出现错误，请重试',
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
    
    wxLogin() {
        return new Promise((resolve, reject) => {
            wx.login({
                success: (res) => resolve(res),
                fail: (err) => reject(err)
            })
        })
    }
    
    async saveUserLoginRecord(openid) {
        try {
            const db = wx.cloud.database()
            const userCollection = db.collection('users')
            
            const queryResult = await userCollection.where({
                openid: openid
            }).get()
            
            if (queryResult.data.length > 0) {
                await userCollection.doc(queryResult.data[0]._id).update({
                    data: {
                        lastLoginTime: db.serverDate(),
                        loginCount: db.command.inc(1)
                    }
                })
                console.log('更新用户登录记录成功')
            } else {
                await userCollection.add({
                    data: {
                        openid: openid,
                        lastLoginTime: db.serverDate(),
                        createTime: db.serverDate(),
                        loginCount: 1
                    }
                })
                console.log('创建用户登录记录成功')
            }
        } catch (e) {
            console.warn('保存用户登录记录失败:', e)
        }
    }
    
    update(deltaTime) {}
    
    render(renderer) {
        const w = renderer.width
        const h = renderer.height
        const ctx = renderer.ctx
        
        renderer.clear('#1a1a2e')
        
        const logoSize = Math.min(w, h) * 0.25
        const logoX = (w - logoSize) / 2
        const logoY = h * 0.2
        
        if (this.imageLoaded && this.logoImage && this.logoImage.width > 0) {
            try {
                ctx.drawImage(this.logoImage, logoX, logoY, logoSize, logoSize)
            } catch (e) {
                renderer.drawRect(logoX, logoY, logoSize, logoSize, '#2c3e50')
                renderer.drawText('游', logoX + logoSize / 2, logoY + logoSize / 2, '#f39c12', 48, 'center')
            }
        } else {
            renderer.drawRect(logoX, logoY, logoSize, logoSize, '#2c3e50')
            renderer.drawText('游', logoX + logoSize / 2, logoY + logoSize / 2, '#f39c12', 48, 'center')
        }
        
        const titleY = logoY + logoSize + 30
        renderer.drawText('游龙市场为买房', w / 2, titleY, '#f39c12', 22, 'center')
        
        const subtitleY = titleY + 35
        renderer.drawText('登录游戏', w / 2, subtitleY, '#95a5a6', 14, 'center')
        
        if (this.loginButtonRect) {
            const btn = this.loginButtonRect
            let bgColor = '#3498db'
            let textColor = '#ffffff'
            let buttonText = '微信一键登录'
            
            if (this.loginStatus === 'processing') {
                bgColor = '#95a5a6'
                buttonText = '登录中...'
            } else if (this.loginStatus === 'success') {
                bgColor = '#2ecc71'
                buttonText = '登录成功!'
            } else if (this.loginStatus === 'error') {
                bgColor = '#e74c3c'
                buttonText = '登录失败，点击重试'
            }
            
            renderer.drawRect(btn.x, btn.y, btn.width, btn.height, bgColor, 25)
            renderer.drawText(buttonText, w / 2, btn.y + btn.height / 2 + 5, textColor, 16, 'center')
        }
        
        const footerY = h * 0.85
        renderer.drawText('登录后游戏数据将自动保存到云端', w / 2, footerY, '#7f8c8d', 12, 'center')
    }
    
    handleTouchStart(x, y) {
        if (!this.loginButtonRect) {
            return false
        }
        
        if (this.isLoginProcessing || this.loginStatus === 'success') {
            return true
        }
        
        const btn = this.loginButtonRect
        if (x >= btn.x && x <= btn.x + btn.width &&
            y >= btn.y && y <= btn.y + btn.height) {
            this.handleLoginClick()
            return true
        }
        return false
    }
    
    handleTouchMove(x, y) {}
    
    handleTouchEnd(x, y) {}
}
