import ItemData, { categories } from '../data/items.js'
import imageManager from '../utils/imageManager.js'
import { restartGame } from '../utils/resetGame.js'
import animationManager from '../utils/animationManager.js'
<<<<<<< HEAD
import { GAME_CONFIG, getJobByLevel, getNextJob } from '../data/gameConfig.js'
import iconManager from '../components/IconManager.js'
import InteractiveAreaManager from '../components/InteractiveAreaManager.js'
import BackGameManager from '../managers/backgamemanger.js'
=======
import iconManager from '../components/IconManager.js'
import InteractiveAreaManager from '../components/InteractiveAreaManager.js'
import BackGameManager from '../managers/backgamemanger.js'
import FloatPhoneButton from '../components/FloatPhoneButton.js'
>>>>>>> 9ee67bfa37532d9ba32be0503a8550afbb81b6fb

export default class HomeScene {
    constructor(game) {
        this.game = game
        this.itemPrices = {}
        this.bgImage = null
        this.imageLoaded = false
        this.useCloudImage = false
        this.loadBackground()
        this.initPrices()
        this.initInteractiveAreas()
        // 初始化游戏功能管理器
        this.backGameManager = new BackGameManager(game)
<<<<<<< HEAD
=======
        // 初始化悬浮手机按钮
        this.initFloatPhoneButton()
    }

    /**
     * 初始化悬浮手机按钮
     */
    initFloatPhoneButton() {
        this.floatPhoneButton = new FloatPhoneButton(this.game, {
            position: 'bottom-right',
            offsetX: 20,
            offsetY: 120, // 在属性面板上方
            size: 72,
            bgColor: '#FFE080',
            animate: true,
            onClick: () => this.onPhoneClick()
        })
    }

    /**
     * 手机按钮点击事件
     */
    onPhoneClick() {
        console.log('[HomeScene] 点击手机按钮')
        // 这里可以打开手机功能菜单或切换到手机场景
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '📱 手机',
            content: '手机功能开发中...\n\n计划功能：\n• 查看消息\n• 银行APP\n• 娱乐游戏',
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {}
        })
>>>>>>> 9ee67bfa37532d9ba32be0503a8550afbb81b6fb
    }

    /**
     * 初始化交互区域（床、电脑、设置）
     * 新格式：hitArea 和 labelArea 分离
     */
    initInteractiveAreas() {
        // 创建交互区域管理器实例
        this.areaManager = new InteractiveAreaManager(this.game)

        // 注册床区域
        this.areaManager.register('homeBed', {
            label: '床',
            action: () => this.onBedClick(),
            hitArea: {
                xPercent: 0.589,
                yPercent: 0.445,
                widthPercent: 0.320,
                heightPercent: 0.241
            },
            labelArea: {
                xPercent: 0.65,
                yPercent: 0.42,
                height: 24,
                paddingX: 10
            },
            style: {
                hitAreaBgColor: 'transparent',
                hitAreaBorderColor: 'transparent',
                labelBgColor: 'rgba(255, 255, 255, 0.85)',
                labelBorderColor: 'rgba(0, 0, 0, 0.2)',
                textColor: '#000000',
                fontSize: 12
            }
        })

        // 注册电脑区域
        this.areaManager.register('homeComputer', {
            label: '电脑',
            action: () => this.onComputerClick(),
            hitArea: {
                xPercent: 0.358,
                yPercent: 0.432,
                widthPercent: 0.223,
                heightPercent: 0.159
            },
            labelArea: {
                xPercent: 0.40,
                yPercent: 0.40,
                height: 24,
                paddingX: 10
            },
            style: {
                hitAreaBgColor: 'transparent',
                hitAreaBorderColor: 'transparent',
                labelBgColor: 'rgba(255, 255, 255, 0.85)',
                labelBorderColor: 'rgba(0, 0, 0, 0.2)',
                textColor: '#000000',
                fontSize: 12
            }
        })

        // 注册设置区域
        this.areaManager.register('homeSetting', {
            label: '设置',
            action: () => this.onSettingClick(),
            hitArea: {
                xPercent: 0.159,
                yPercent: 0.395,
                widthPercent: 0.202,
                heightPercent: 0.218
            },
            labelArea: {
                xPercent: 0.20,
                yPercent: 0.36,
                height: 24,
                paddingX: 10
            },
            style: {
                hitAreaBgColor: 'transparent',
                hitAreaBorderColor: 'transparent',
                labelBgColor: 'rgba(255, 255, 255, 0.85)',
                labelBorderColor: 'rgba(0, 0, 0, 0.2)',
                textColor: '#000000',
                fontSize: 12
            }
        })
    }

    /**
     * 床点击事件
     */
    onBedClick() {
        console.log('[HomeScene] 点击床')
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '床',
            content: '这是你的床，可以在这里休息',
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {}
        })
    }

    /**
     * 电脑点击事件
     */
    onComputerClick() {
        console.log('[HomeScene] 点击电脑')
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '电脑',
            content: '这是你的电脑，可以上网、工作或玩游戏',
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {}
        })
    }

    /**
     * 设置点击事件
     */
    onSettingClick() {
        console.log('[HomeScene] 点击设置')
<<<<<<< HEAD
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '设置',
            content: '设置功能开发中...',
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {}
        })
=======
        this.game.sceneManager.switchTo('settings')
>>>>>>> 9ee67bfa37532d9ba32be0503a8550afbb81b6fb
    }

    getStatPositions() {
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        const padding = 12
        const panelH = 100
        const panelY = h - panelH - padding

        return {
            money: { x: w - 80, y: 20 },
            reputation: { x: w - padding - 40, y: panelY + panelH - 28 },
            energy: { x: w - padding - 40, y: panelY + 28 },
            mood: { x: padding + 60, y: panelY + panelH - 28 },
            health: { x: padding + 60, y: panelY + 28 },
            privateLoan: { x: w - 80, y: 50 },
            bankLoan: { x: w - 80, y: 35 },
            bankDeposit: { x: w - 80, y: 35 }
        }
    }

    async loadBackground() {
        try {
            const cloudImage = await imageManager.loadImageFromCloud('ChuZuWu.png')
            if (cloudImage && cloudImage.image) {
                this.bgImage = cloudImage.image
                this.imageLoaded = true
                this.useCloudImage = true
                console.log('使用云存储背景图: ChuZuWu.png')
                return
            }
        } catch (e) {
            console.warn('从云端加载背景图失败，使用本地图片:', e)
        }

        this.bgImage = wx.createImage()
        this.bgImage.onload = () => {
            this.imageLoaded = true
        }
        this.bgImage.src = 'tupian/chuzuwu.png'
    }

    initPrices() {
        ItemData.forEach(item => {
            const fluctuation = item.naturalFluctuation.min + Math.random() * (item.naturalFluctuation.max - item.naturalFluctuation.min)
            this.itemPrices[item.id] = Math.round(item.basePrice * (1 + fluctuation))
        })
    }

    onEnter() {
        this.initPrices()

        this.playDelayedAnimations()
    }

    playDelayedAnimations() {
        const anims = this.game.gameState.getAndClearDelayedAnimations()
        console.log('[动画] 播放延迟动画，数量:', anims.length)
        if (anims.length === 0) return

        const positions = this.getStatPositions()

        anims.forEach((anim, index) => {
            console.log('[动画] 准备播放:', anim.type, anim.statType, anim.value)
            setTimeout(() => {
                const pos = positions[anim.statType]
                if (pos) {
                    const color = anim.color || this.getDefaultColor(anim.statType)
                    console.log('[动画] 开始播放:', anim.type, '位置:', pos.x, pos.y)
                    if (anim.type === 'increase') {
                        animationManager.addIncreaseAnimation(pos.x, pos.y, anim.value, anim.label, color)
                    } else if (anim.type === 'decrease') {
                        animationManager.addDecreaseAnimation(pos.x, pos.y, anim.value, anim.label, color)
                    } else if (anim.type === 'loan') {
                        animationManager.addLoanAnimation(pos.x, pos.y, anim.value, anim.label, color)
                    }
                } else {
                    console.warn('[动画] 未找到位置:', anim.statType)
                }
            }, index * 200)
        })
    }

    getDefaultColor(statType) {
        // 吉卜力柔和配色
        const colorMap = {
            money: '#D4A574',      // 暖金色
            health: '#7CB87C',     // 柔和绿
            energy: '#7BA3C9',     // 柔和蓝
            mood: '#D49BA3',       // 柔和粉
            reputation: '#B8A3C9', // 柔和紫
            privateLoan: '#C17B6B',// 柔和红棕
            bankLoan: '#7BA3C9',   // 柔和蓝
            bankDeposit: '#7CB87C' // 柔和绿
        }
        return colorMap[statType] || '#5D4037'
    }

    update(deltaTime) {

    }

    render(renderer) {
        const w = renderer.width
        const h = renderer.height
        const state = this.game.gameState.data

        this.game.uiManager.clear()

        if (this.imageLoaded && this.bgImage && this.bgImage.width > 0) {
            try {
                const ctx = renderer.ctx
                ctx.drawImage(this.bgImage, 0, 0, w, h)
            } catch (e) {
                console.warn('绘制背景图失败:', e)
                renderer.clear('#1a1a2e')
            }
        } else {
            renderer.clear('#1a1a2e')
        }

        this.renderTopBar(renderer, state)

        const topBarH = 60
        const statsPanelH = 110

        // 渲染交互区域（床、电脑、设置）
        if (this.areaManager) {
            this.areaManager.render(renderer)
        }

        this.renderStats(renderer, h - statsPanelH, state)

<<<<<<< HEAD
=======
        // 渲染悬浮手机按钮
        if (this.floatPhoneButton) {
            this.floatPhoneButton.render(renderer)
        }

>>>>>>> 9ee67bfa37532d9ba32be0503a8550afbb81b6fb
        animationManager.updateAndRender(renderer)
    }

    renderTopBar(renderer, state) {
        const w = renderer.width
        const h = 56
        const ctx = renderer.ctx
        const padding = 12

        // 顶部背景 - 浅米木色平涂色块
        renderer.drawRect(padding, 8, w - padding * 2, h - 8, '#FFF5E6', 12)

        // 1px 干净黑色轮廓线
        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        this.roundRectPath(ctx, padding, 8, w - padding * 2, h - 8, 12)
        ctx.stroke()

        // 底部分隔线 - 柔和同色系
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.2)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(padding + 15, h - 2)
        ctx.lineTo(w - padding - 15, h - 2)
        ctx.stroke()

        // 左侧：天数 + 登录状态
        // 使用 IconManager 绘制日历图标（增大尺寸）
        iconManager.draw(ctx, 'calendar', padding + 22, 24, { size: 22 })
        // 深木棕文字（调整位置）
        renderer.drawText(`第${state.day}天 / ${state.totalDays}天`, padding + 45, 28, '#5D4037', 14, 'left')

        // 登录状态紧凑显示
        const isLoggedIn = this.game.gameState.isLoggedIn()
        const loginText = isLoggedIn ? '✓ 已登录' : '✗ 未登录'
        const loginColor = isLoggedIn ? '#6B8E6B' : '#C17B6B'
        renderer.drawText(loginText, padding + 15, 46, loginColor, 10, 'left')

        // 右侧：金币和银行信息
        const rightX = w - padding - 15

        // 金币 - 大字号突出显示，使用暖黄色（增大图标）
        const moneyText = state.money.toLocaleString()
        iconManager.draw(ctx, 'coin', rightX - 95, 22, { size: 20 })
        renderer.drawText(moneyText, rightX, 26, '#D4A574', 17, 'right')

        // 银行净额（增大图标）
        const bankNet = state.bankDeposit - state.bankLoan
        const bankColor = bankNet >= 0 ? '#6B8E6B' : '#C17B6B'
        const bankIconName = bankNet >= 0 ? 'bank' : 'warning'
        iconManager.draw(ctx, bankIconName, rightX - 80, 42, { size: 18 })
        const bankText = bankNet >= 0 ? `净额 +${bankNet.toLocaleString()}` : `欠款 ${bankNet.toLocaleString()}`
        renderer.drawText(bankText, rightX, 42, bankColor, 10, 'right')

        // 私人欠款（如果有）（增大图标）
        if (state.privateLoan > 0) {
            iconManager.draw(ctx, 'loanWarning', rightX - 80, 55, { size: 16 })
            renderer.drawText(`私借 ${state.privateLoan.toLocaleString()}`, rightX, 55, '#C17B6B', 10, 'right')
        }

        // 昨日开销提示
        if (state.day > 1 && state.yesterdayExpense > 0) {
            renderer.drawText(`昨日-${state.yesterdayExpense}`, w / 2, 36, '#C17B6B', 10, 'center')
        }
    }

    // 辅助方法：绘制圆角矩形路径
    roundRectPath(ctx, x, y, width, height, radius) {
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + width - radius, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
        ctx.lineTo(x + width, y + height - radius)
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
        ctx.lineTo(x + radius, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
    }

    handleLogout() {
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '退出登录',
            content: '确定要退出登录吗？\n退出后需要重新登录。',
            confirmText: '退出',
            cancelText: '取消',
            onConfirm: () => {
                this.game.gameState.setUserInfo(null)
                wx.showToast({
                    title: '已退出登录',
                    icon: 'success',
                    duration: 1000
                })
                this.game.sceneManager.switchTo('login')
            }
        })
    }

    renderStats(renderer, buttonsBottomY, state) {
        const w = renderer.width
        const h = renderer.height
        const padding = 12
        const panelH = 100
        const panelY = h - panelH - padding
        const centerBtnSize = 56
        const ctx = renderer.ctx

        // 属性面板背景 - 浅天蓝色平涂色块，吉卜力风格
        renderer.drawRect(padding, panelY, w - padding * 2, panelH, '#E0F0FF', 16)

        // 1.5px 干净黑色轮廓线
        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        this.roundRectPath(ctx, padding, panelY, w - padding * 2, panelH, 16)
        ctx.stroke()

        // 面板顶部装饰线 - 柔和同色系
        ctx.beginPath()
        ctx.moveTo(padding + 25, panelY + 3)
        ctx.lineTo(w - padding - 25, panelY + 3)
        ctx.strokeStyle = 'rgba(135, 160, 180, 0.3)'
        ctx.lineWidth = 2
        ctx.stroke()

        // 计算布局 - 左右分区，中间留给按钮
        const centerX = w / 2
        const leftSectionX = padding + 35
        const rightSectionX = w - padding - 35
        const topRowY = panelY + 30
        const bottomRowY = panelY + panelH - 30

        // 左上：健康
        this.renderStatItem(renderer, leftSectionX, topRowY, 'health', state.health, 100, '#7CB87C')
        // 右上：精力
        this.renderStatItem(renderer, rightSectionX, topRowY, 'energy', state.energy, state.maxEnergy, '#7BA3C9', true)
        // 左下：心情
        this.renderStatItem(renderer, leftSectionX, bottomRowY, 'mood', state.mood, 100, '#D49BA3')
        // 右下：名誉
        this.renderStatItem(renderer, rightSectionX, bottomRowY, 'reputation', state.reputation, 100, '#B8A3C9', true)

        // 中间圆形按钮
        this.renderCenterButton(renderer, centerX, panelY + panelH / 2, centerBtnSize)
    }

    renderStatItem(renderer, x, y, statType, value, max, color, isRight = false) {
        const progress = value / max
        let valueColor = color
        // 低数值时使用警示色，但仍保持柔和
        if (progress < 0.3) valueColor = '#C17B6B'
        else if (progress < 0.5) valueColor = '#D4A574'

        const ctx = renderer.ctx
        const labelOffset = 20

        // 深灰蓝文字颜色
        const labelColor = '#5A6B7A'

        // 获取标签文字
        const labelMap = {
            health: '健康',
            energy: '精力',
            mood: '心情',
            reputation: '名誉'
        }
        const label = labelMap[statType] || statType

        if (isRight) {
            // 右侧布局：图标 + 标签/数值上下排列（避免水平重叠）
            // 图标在左侧
            iconManager.draw(ctx, statType, x - 75, y, { size: 22 })
            // 标签在图标右侧偏上
            renderer.drawText(label, x - 45, y - 6, labelColor, 12, 'left')
            // 数值在标签下方
            renderer.drawText(`${value}/${max}`, x - 45, y + 10, valueColor, 13, 'left')
        } else {
            // 左侧：图标在左，标签数值在右
            // 使用 IconManager 绘制图标（增大尺寸）
            iconManager.draw(ctx, statType, x + 12, y, { size: 22 })
            // 标签（调整位置）
            renderer.drawText(label, x + labelOffset + 18, y - 1, labelColor, 12, 'left')
            // 数值
            renderer.drawText(`${value}/${max}`, x + labelOffset + 18, y + 14, valueColor, 13, 'left')
        }
    }

    renderCenterButton(renderer, x, y, size) {
        const ctx = renderer.ctx
        const radius = size / 2

        // 柔和投影 - 同色系低透明度
        ctx.beginPath()
        ctx.arc(x, y + 3, radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(139, 115, 85, 0.15)'
        ctx.fill()

        // 按钮背景 - 暖黄色平涂色块（吉卜力强调色）
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = '#FFE080'
        ctx.fill()

        // 1.5px 干净黑色轮廓线
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        ctx.stroke()

        // 按钮内圈装饰线 - 同色系浅色
        ctx.beginPath()
        ctx.arc(x, y, radius - 5, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(212, 165, 116, 0.4)'
        ctx.lineWidth = 1
        ctx.stroke()

        // 绘制地图图标
        iconManager.draw(ctx, 'map', x, y, { size: 32 })

        // 设置地图按钮位置到调试面板
        if (this.game.debugPanel) {
            this.game.debugPanel.setMapButtonRect({
                x: x - radius,
                y: y - radius,
                width: size,
                height: size
            })
        }

        // 添加按钮点击区域
        const ui = this.game.uiManager
        ui.addButton(x - radius, y - radius, size, size, '', () => {
<<<<<<< HEAD
            this.game.sceneManager.switchTo('map')
=======
            this.endDay()
>>>>>>> 9ee67bfa37532d9ba32be0503a8550afbb81b6fb
        }, { bgColor: 'transparent' })
    }

    renderStatBox(renderer, x, y, w, h, label, value, color) {
        renderer.drawRect(x, y, w, h, 'rgba(26, 26, 46, 0.85)', 6)
        renderer.drawRect(x, y, 4, h, color, 3)
        renderer.drawText(label, x + 10, y + 12, '#7f8c8d', 10, 'left')
        renderer.drawText(String(value), x + 10, y + 26, '#ffffff', 12, 'left')
    }
<<<<<<< HEAD
    
    renderButtons(renderer, bottomY, state) {
        const w = renderer.width
        const padding = 8
        const innerX = padding
        const innerW = w - padding * 2
        const btnH = 36
        const btnGap = 6
        const restartBtnH = 32
        const totalBtnH = btnH * 2 + btnGap * 2 + restartBtnH + 20
        const startY = bottomY - totalBtnH
        const btnW = (innerW - btnGap * 2) / 3
        
        const ui = this.game.uiManager
        
        const row1 = [
            { text: '个人借贷', action: () => this.enterSceneWithBackground('privateLoan') },
            { text: '银行', action: () => this.enterSceneWithBackground('bank') },
            { text: '工作', action: () => this.enterSceneWithBackground('work') }
        ]
        
        const row2 = [
            { text: '公益', action: () => this.doCharity() },
            { text: '医院', action: () => this.enterSceneWithBackground('hospital') },
            { text: '健身房', action: () => this.enterSceneWithBackground('gym') },
            { text: '娱乐', action: () => this.doEntertainment() }
        ]
        
        row1.forEach((btn, i) => {
            ui.addButton(innerX + i * (btnW + btnGap), startY, btnW, btnH, btn.text, btn.action, { fontSize: 12 })
        })
        
        const btnW2 = (innerW - btnGap * 3) / 4
        row2.forEach((btn, i) => {
            ui.addButton(innerX + i * (btnW2 + btnGap), startY + btnH + btnGap, btnW2, btnH, btn.text, btn.action, { fontSize: 12 })
        })
        
        const row3Y = startY + btnH * 2 + btnGap * 2
        const btnW3 = (innerW - btnGap) / 2
        ui.addButton(innerX, row3Y, btnW3, btnH, '售楼部', () => this.enterSceneWithBackground('house'), { fontSize: 12 })
        
        const adText = this.game.adSystem.getAdButtonText()
        ui.addButton(innerX + btnW3 + btnGap, row3Y, btnW3, btnH, adText, () => this.game.adSystem.showAd(), { fontSize: 11 })
        
        const restartBtnY = row3Y + btnH + btnGap + 5
        ui.addButton(innerX + (innerW - 100) / 2, restartBtnY, 100, restartBtnH, '重新开始', () => this.showRestartConfirm(), { bgColor: '#e74c3c', fontSize: 11 })
    }
    
    showRestartConfirm() {
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '重新开始游戏',
            content: '确定要重新开始游戏吗？\n当前游戏进度将被清除，但已解锁的房屋会保留！',
            confirmText: '确定',
            cancelText: '取消',
            onConfirm: () => {
                restartGame(this.game)
            }
        })
    }
    
    enterMarket() {
        const state = this.game.gameState.data
        
        if (!state.marketEnteredToday) {
            if (state.energy < 2) {
                this.game.uiManager.addModal({
                    type: 'confirm',
                    title: '精力不足',
                    content: '今日首次进入市场需要消耗2点精力\n当前精力不足，无法进入市场',
                    confirmText: '知道了',
                    onConfirm: () => {}
                })
                return
            }
            
            state.energy -= 2
            state.marketEnteredToday = true
            this.game.gameState.save()
        }
        
        this.game.sceneManager.switchTo('market')
    }
    
    enterSceneWithBackground(sceneName) {
        this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: sceneName })
    }
    
    endDay() {
        this.backGameManager.endDay()
    }
    
    showWorkModal() {
        this.backGameManager.showWorkModal()
    }
    
    doWork(isOvertime, salary) {
        this.backGameManager.doWork(isOvertime, salary)
    }
    
    doEntertainment() {
        this.backGameManager.doEntertainment()
    }
    
    showBankModal() {
        this.backGameManager.showBankModal()
    }
    
    doCharity() {
        this.backGameManager.doCharity()
    }
    
    doHospital() {
        this.backGameManager.doHospital()
    }
    
    doGym() {
        this.backGameManager.doGym()
    }
    
=======

    // ==================== 核心功能方法（保留在 HomeScene）====================

    /**
     * 进入市场
     * 首次进入消耗2精力
     */
    enterMarket() {
        this.backGameManager.enterMarket()
    }

    /**
     * 结束今日
     * 触发随机事件，进入下一天
     */
    endDay() {
        this.backGameManager.endDay()
    }

    /**
     * 显示工作弹窗
     */
    showWorkModal() {
        this.backGameManager.showWorkModal()
    }

    /**
     * 执行工作
     */
    doWork(isOvertime, salary) {
        this.backGameManager.doWork(isOvertime, salary)
    }

    /**
     * 娱乐
     * 消耗1精力+50金币，心情+15~25
     */
    doEntertainment() {
        this.backGameManager.doEntertainment()
    }

    // ==================== 以下方法通过 backGameManager 委托实现 ====================

    /**
     * 显示银行弹窗
     */
    showBankModal() {
        this.backGameManager.showBankModal()
    }

    /**
     * 显示私人借贷弹窗
     */
    showLoanModal() {
        this.backGameManager.showLoanModal()
    }

    /**
     * 公益活动
     */
    doCharity() {
        this.backGameManager.doCharity()
    }

    /**
     * 医院
     */
    doHospital() {
        this.backGameManager.doHospital()
    }

    /**
     * 健身房
     */
    doGym() {
        this.backGameManager.doGym()
    }

>>>>>>> 9ee67bfa37532d9ba32be0503a8550afbb81b6fb
    enterHouseScene() {
        console.log('[HomeScene] enterHouseScene 被调用')
        this.game.sceneManager.switchTo('house')
    }
<<<<<<< HEAD
    
    showLoanModal() {
        const state = this.game.gameState.data
        
        const actions = []
        
        actions.push({
            text: '借贷',
            callback: () => this.doPrivateLoan(),
            color: '#e74c3c'
        })
        
        if (state.privateLoan > 0) {
            actions.push({
                text: '还款',
                callback: () => this.doPrivateRepay(),
                color: '#27ae60'
            })
        }
        
        this.game.uiManager.addModal({
            type: 'action',
            title: '个人借贷',
            content: `日利率: 2.5%\n逾期惩罚严厉\n\n当前欠款: ${state.privateLoan} 金币`,
            actions: actions,
            height: 180
        })
    }
    
    doPrivateLoan() {
        const state = this.game.gameState.data
        this.game.uiManager.addModal({
            type: 'trade',
            title: '个人借贷',
            content: '日利率: 2.5%\n逾期惩罚严厉',
            itemName: '借贷金额',
            price: 1,
            quantity: 1000,
            maxQuantity: 120000,
            total: 1000,
            tradeType: 'loan',
            height: 240,
            onConfirm: (qty) => {
                state.privateLoan += qty
                state.money += qty
                this.game.gameState.save()
                
                this.game.gameState.addDelayedAnimation('loan', qty, 'privateLoan', '私人贷款', '#e74c3c')
                this.game.gameState.addDelayedAnimation('increase', qty, 'money', '金币', '#f39c12')
                
                this.game.sceneManager.switchTo('home')
            }
        })
    }
    
    doPrivateRepay() {
        const state = this.game.gameState.data
        if (state.privateLoan <= 0) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '无需还款',
                content: '当前没有私人借贷欠款',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }
        
        const maxRepay = Math.min(state.money, state.privateLoan)
        if (maxRepay <= 0) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '金币不足',
                content: '没有足够的金币还款',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }
        
        this.game.uiManager.addModal({
            type: 'trade',
            title: '还款',
            content: `当前欠款: ${state.privateLoan} 金币`,
            itemName: '还款金额',
            price: 1,
            quantity: maxRepay,
            maxQuantity: maxRepay,
            total: maxRepay,
            tradeType: 'repay',
            height: 240,
            onConfirm: (qty) => {
                if (state.money >= qty) {
                    state.money -= qty
                    state.privateLoan -= qty
                    this.game.gameState.save()
                    
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'privateLoan', '私人贷款', '#e74c3c')
                    
                    this.game.sceneManager.switchTo('home')
                }
            }
        })
    }
    
    showBankModal() {
        const state = this.game.gameState.data
        
        const jobLoanInfo = GAME_CONFIG.jobs.map(job => ({
            level: job.level,
            title: job.title,
            loanLimit: job.level >= 3 ? GAME_CONFIG.bank.loanLimitLevel3 : GAME_CONFIG.bank.loanLimitLevel1
        }))
        
        let jobContent = '【岗位借款额度】\n'
        jobLoanInfo.forEach(job => {
            const isCurrent = state.jobLevel === job.level
            const marker = isCurrent ? '★' : '  '
            jobContent += `${marker}Lv.${job.level} ${job.title}: ${job.loanLimit.toLocaleString()}金币\n`
        })
        
        const actions = [
            { text: '存款', callback: () => this.doDeposit() },
            { text: '贷款', callback: () => this.doLoan() }
        ]
        
        if (state.bankLoan > 0) {
            actions.push({ text: '还款', callback: () => this.doRepay() })
        }
        
        this.game.uiManager.addModal({
            type: 'action',
            title: '银行',
            content: `存款利率: 每${GAME_CONFIG.bank.depositInterestDays}天${GAME_CONFIG.bank.depositInterestRate * 100}%  |  贷款利率: 每${GAME_CONFIG.bank.loanInterestDays}天${GAME_CONFIG.bank.loanInterestRate * 100}%\n当前欠款: ${state.bankLoan.toLocaleString()} 金币\n\n${jobContent}`,
            actions: actions,
            height: 320
        })
    }
    
    doDeposit() {
        const state = this.game.gameState.data
        this.game.uiManager.addModal({
            type: 'trade',
            title: '存款',
            content: '',
            itemName: '存款金额',
            price: 1,
            quantity: 100,
            maxQuantity: state.money,
            total: 100,
            tradeType: 'deposit',
            height: 220,
            onConfirm: (qty) => {
                if (state.money >= qty) {
                    state.money -= qty
                    state.bankDeposit += qty
                    this.game.gameState.save()
                    
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('increase', qty, 'bankDeposit', '银行存款', '#27ae60')
                    
                    this.game.sceneManager.switchTo('home')
                }
            }
        })
    }
    
    doLoan() {
        const state = this.game.gameState.data
        const maxLoan = state.jobLevel >= 3 ? GAME_CONFIG.bank.loanLimitLevel3 : GAME_CONFIG.bank.loanLimitLevel1
        this.game.uiManager.addModal({
            type: 'trade',
            title: '银行贷款',
            content: '',
            itemName: '贷款金额',
            price: 1,
            quantity: 1000,
            maxQuantity: maxLoan - state.bankLoan,
            total: 1000,
            tradeType: 'loan',
            height: 220,
            onConfirm: (qty) => {
                state.bankLoan += qty
                state.money += qty
                this.game.gameState.save()
                
                this.game.gameState.addDelayedAnimation('loan', qty, 'bankLoan', '银行贷款', '#3498db')
                this.game.gameState.addDelayedAnimation('increase', qty, 'money', '金币', '#f39c12')
                
                this.game.sceneManager.switchTo('home')
            }
        })
    }
    
    doRepay() {
        const state = this.game.gameState.data
        if (state.bankLoan <= 0) {
            return
        }
        this.game.uiManager.addModal({
            type: 'trade',
            title: '还款',
            content: '',
            itemName: '还款金额',
            price: 1,
            quantity: Math.min(state.money, state.bankLoan),
            maxQuantity: Math.min(state.money, state.bankLoan),
            total: Math.min(state.money, state.bankLoan),
            tradeType: 'repay',
            height: 220,
            onConfirm: (qty) => {
                if (state.money >= qty) {
                    state.money -= qty
                    state.bankLoan -= qty
                    this.game.gameState.save()
                    
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'bankLoan', '银行贷款', '#3498db')
                    
                    this.game.sceneManager.switchTo('home')
                }
            }
        })
    }
    
    showWorkModal() {
        const state = this.game.gameState.data
        
        if (state.unemployed) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '失业中',
                content: `剩余${state.unemployedDays}天无法工作`,
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法工作',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        // 当前岗位信息
        const jobs = GAME_CONFIG.jobs
        const job = jobs[state.jobLevel - 1]
        let baseSalary = job.baseSalary
        let overtimeSalary = job.overtimeSalary
        
        if (state.salaryDeduction) {
            baseSalary = Math.floor(baseSalary * 0.8)
            overtimeSalary = Math.floor(overtimeSalary * 0.8)
        }
        
        // 计算下一级信息
        const nextJob = jobs[state.jobLevel]
        let nextLevelInfo = ''
        if (nextJob) {
            nextLevelInfo = `\n\n【下一级】\nLv.${nextJob.level} ${nextJob.title}\n日薪: ${nextJob.baseSalary}金币`
        }
        
        // 计算内容高度，确保按钮不会被遮挡
        // 每行内容约22像素，按钮区域需要80像素
        const lineCount = 6 + (nextJob ? 3 : 0) // 基础6行 + 下一级3行
        const contentHeight = 55 + lineCount * 22 + 80 // 标题55 + 内容 + 按钮区域80
        
        this.game.uiManager.addModal({
            type: 'action',
            title: `工作 - ${state.jobTitle}`,
            content: `【当前岗位】\nLv.${job.level} ${job.title}\n\n上班: ${baseSalary}金币 (消耗1精力)\n加班: ${overtimeSalary}金币 (消耗1精力,健康-5)${nextLevelInfo}`,
            actions: [
                { text: '上班', callback: () => this.doWork(false, baseSalary) },
                { text: '加班', callback: () => this.doWork(true, overtimeSalary) }
            ],
            height: Math.max(350, contentHeight)
        })
    }
    
    doWork(isOvertime, salary) {
        const state = this.game.gameState.data
        
        if (isOvertime && state.health < 30) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '健康不足',
                content: '无法加班',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        state.energy = Math.max(0, state.energy - 1)
        state.money += salary
        
        if (isOvertime) {
            state.health = Math.max(0, state.health - 5)
        }
        
        // 工作表现影响名誉
        let reputationChange = 0
        let reputationReason = ''
        
        if (state.health >= 80 && state.mood >= 60) {
            // 状态好，工作出色
            reputationChange = 2
            reputationReason = '工作表现出色'
        } else if (state.health < 40 || state.mood < 30) {
            // 状态差，工作不佳
            reputationChange = -2
            reputationReason = '工作状态不佳'
        }
        
        if (reputationChange !== 0) {
            state.reputation = Math.min(100, Math.max(-100, state.reputation + reputationChange))
            this.game.gameState.addEvent(`${reputationReason}，名誉${reputationChange > 0 ? '+' : ''}${reputationChange}`)
            if (reputationChange > 0) {
                this.game.gameState.addDelayedAnimation('increase', reputationChange, 'reputation', '名誉', '#9b59b6')
            } else {
                this.game.gameState.addDelayedAnimation('decrease', Math.abs(reputationChange), 'reputation', '名誉', '#9b59b6')
            }
        }
        
        this.game.gameState.save()
        
        state.daysWorked++
        
        this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
        this.game.gameState.addDelayedAnimation('increase', salary, 'money', '金币', '#f39c12')
        
        if (isOvertime) {
            this.game.gameState.addDelayedAnimation('decrease', 5, 'health', '健康', '#27ae60')
        }
        
        let workResultContent = `获得 ${salary} 金币！`
        if (reputationChange !== 0) {
            workResultContent += `\n${reputationReason}，名誉${reputationChange > 0 ? '+' : ''}${reputationChange}`
        }
        
        const promotionConfig = GAME_CONFIG.promotion
        const nextJob = GAME_CONFIG.jobs[state.jobLevel]
        const canPromote = nextJob && 
            state.reputation >= promotionConfig.reputationRequired &&
            state.daysWorked >= promotionConfig.daysWorkedRequired &&
            state.health >= promotionConfig.healthRequired
        
        if (canPromote) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '工作完成',
                content: workResultContent + `\n\n恭喜！您符合升职条件！\n可以升职为 ${nextJob.title}`,
                confirmText: '升职',
                cancelText: '暂不',
                onConfirm: () => {
                    this.promote()
                },
                onCancel: () => {
                    this.game.sceneManager.switchTo('home')
                }
            })
        } else {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '工作完成',
                content: workResultContent,
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {
                    this.game.sceneManager.switchTo('home')
                }
            })
        }
    }
    
    promote() {
        const state = this.game.gameState.data
        const nextJob = GAME_CONFIG.jobs[state.jobLevel]
        
        if (!nextJob) return
        
        state.jobLevel = nextJob.level
        state.jobTitle = nextJob.title
        state.daysWorked = 0
        this.game.gameState.save()
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '升职成功！',
            content: `恭喜您升职为 ${nextJob.title}！\n\n新工资：\n上班: ${nextJob.baseSalary}金币\n加班: ${nextJob.overtimeSalary}金币`,
            confirmText: '太棒了',
            singleButton: true,
            onConfirm: () => {
                this.game.sceneManager.switchTo('home')
            }
        })
    }
    
    doCharity() {
        const state = this.game.gameState.data
        
        this.game.uiManager.addModal({
            type: 'action',
            title: '公益活动',
            content: '选择参与方式',
            actions: [
                { 
                    text: '捐款', 
                    callback: () => this.doDonation(),
                    color: '#f39c12'
                },
                { 
                    text: '体力劳动', 
                    callback: () => this.doVolunteerWork(),
                    color: '#27ae60'
                }
            ],
            height: 160
        })
    }
    
    doDonation() {
        const state = this.game.gameState.data
        
        if (state.money < 50) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '金币不足',
                content: '需要至少50金币才能捐款',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        this.game.uiManager.addModal({
            type: 'trade',
            title: '捐款',
            content: '消耗金币\n名誉+5~+10\n心情+5~+10',
            itemName: '捐款金额',
            price: 1,
            quantity: 50,
            maxQuantity: state.money,
            total: 50,
            tradeType: 'donation',
            height: 220,
            onConfirm: (qty) => {
                if (state.money >= qty) {
                    const reputationGain = 5 + Math.floor(Math.random() * 6)
                    const moodGain = 5 + Math.floor(Math.random() * 6)
                    state.money -= qty
                    state.reputation = Math.min(100, state.reputation + reputationGain)
                    state.mood = Math.min(100, state.mood + moodGain)
                    this.game.gameState.save()
                    
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('increase', reputationGain, 'reputation', '名誉', '#9b59b6')
                    this.game.gameState.addDelayedAnimation('increase', moodGain, 'mood', '心情', '#e91e63')
                    
                    this.game.sceneManager.switchTo('home')
                }
            }
        })
    }
    
    doVolunteerWork() {
        const state = this.game.gameState.data
        
        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '需要1点精力才能参与体力劳动',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }
        
        const reputationGain = 5 + Math.floor(Math.random() * 6)
        const moodGain = 5 + Math.floor(Math.random() * 6)
        state.energy -= 1
        state.reputation = Math.min(100, state.reputation + reputationGain)
        state.mood = Math.min(100, state.mood + moodGain)
        this.game.gameState.save()
        
        this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
        this.game.gameState.addDelayedAnimation('increase', reputationGain, 'reputation', '名誉', '#9b59b6')
        this.game.gameState.addDelayedAnimation('increase', moodGain, 'mood', '心情', '#e91e63')
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '公益活动完成',
            content: `你参与了体力劳动！\n\n消耗: 1精力\n获得: 名誉+${reputationGain}, 心情+${moodGain}`,
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {
                this.game.sceneManager.switchTo('home')
            }
        })
    }
    
    doHospital() {
        const state = this.game.gameState.data
        const config = GAME_CONFIG.hospital
        
        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法去医院',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        const maxHeal = Math.min(config.maxHeal, 100 - state.health)
        const cost = maxHeal * config.costPerHealth
        
        if (maxHeal <= 0) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '健康已满',
                content: '无需治疗',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '医院',
            content: `消耗1精力\n花费${cost}金币\n恢复健康+${maxHeal}`,
            confirmText: '治疗',
            onConfirm: () => {
                if (state.money >= cost) {
                    state.energy -= 1
                    state.money -= cost
                    state.health = Math.min(100, state.health + maxHeal)
                    this.game.gameState.save()
                    
                    this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
                    this.game.gameState.addDelayedAnimation('decrease', cost, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('increase', maxHeal, 'health', '健康', '#27ae60')
                    
                    this.game.sceneManager.switchTo('home')
                }
            }
        })
    }
    
    doGym() {
        const state = this.game.gameState.data
        const config = GAME_CONFIG.gym
        
        if (state.energy < config.energyCost) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法健身',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        if (state.money < config.cost) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '金币不足',
                content: `需要${config.cost}金币`,
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '健身房',
            content: `消耗${config.energyCost}精力，花费${config.cost}金币\n健康+${config.healthRecovery}，心情+${config.moodBonus || 0}\n连续健身可提升精力上限`,
            confirmText: '健身',
            onConfirm: () => {
                state.energy -= config.energyCost
                state.money -= config.cost
                state.health = Math.min(100, state.health + config.healthRecovery)
                if (config.moodBonus) {
                    state.mood = Math.min(100, state.mood + config.moodBonus)
                }
                state.consecutiveGymDays++
                
                if (state.consecutiveGymDays >= 3) {
                    state.maxEnergy = Math.min(15, state.maxEnergy + 1)
                }
                
                this.game.gameState.save()
                
                this.game.gameState.addDelayedAnimation('decrease', config.energyCost, 'energy', '精力', '#3498db')
                this.game.gameState.addDelayedAnimation('decrease', config.cost, 'money', '金币', '#f39c12')
                this.game.gameState.addDelayedAnimation('increase', config.healthRecovery, 'health', '健康', '#27ae60')
                if (config.moodBonus) {
                    this.game.gameState.addDelayedAnimation('increase', config.moodBonus, 'mood', '心情', '#e91e63')
                }
                
                this.game.sceneManager.switchTo('home')
            }
        })
    }
    
    doEntertainment() {
        const state = this.game.gameState.data
        const config = GAME_CONFIG.entertainment
        
        if (state.energy < config.energyCost) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法娱乐',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        const options = config.costs.map((cost, index) => ({
            text: `${['简单', '普通', '豪华'][index]}娱乐 (${cost}金币)`,
            callback: () => this.doEntertainmentOption(index)
        }))
        
        this.game.uiManager.addModal({
            type: 'action',
            title: '娱乐',
            content: `消耗${config.energyCost}精力\n选择娱乐方式：`,
            actions: options,
            height: 280
        })
    }
    
    doEntertainmentOption(index) {
        const state = this.game.gameState.data
        const config = GAME_CONFIG.entertainment
        const cost = config.costs[index]
        const moodGain = config.moodRecovery[index]
        
        if (state.money < cost) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '金币不足',
                content: `需要${cost}金币`,
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        state.energy -= config.energyCost
        state.money -= cost
        state.mood = Math.min(100, state.mood + moodGain)
        state.consecutiveGymDays = 0
        this.game.gameState.save()
        
        this.game.gameState.addDelayedAnimation('decrease', config.energyCost, 'energy', '精力', '#3498db')
        this.game.gameState.addDelayedAnimation('decrease', cost, 'money', '金币', '#f39c12')
        this.game.gameState.addDelayedAnimation('increase', moodGain, 'mood', '心情', '#e91e63')
        
        this.game.sceneManager.switchTo('home')
    }
    
    endDay() {
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '结束今日',
            content: '确定结束今天吗?\n将自动扣除日常消费',
            confirmText: '确定',
            onConfirm: () => {
                this.triggerRandomEventsDirect()
                
                this.game.gameState.nextDay()
                
                this.game.dailyCheck()
                
                this.game.sceneManager.switchTo('home')
            }
        })
    }
    
    triggerRandomEventsDirect() {
        const state = this.game.gameState.data
        const eventChance = Math.random()
        const config = GAME_CONFIG.randomEvent
        
        if (eventChance < config.probability) {
            const goodEvents = [
                { 
                    text: '路边捡到钱包，获得80金币', 
                    effect: () => { state.money += 80 },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 80, 'money', '金币', '#f39c12')
                },
                { 
                    text: '遇到好心人，心情+15', 
                    effect: () => { state.mood = Math.min(100, state.mood + 15) },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 15, 'mood', '心情', '#e91e63')
                },
                { 
                    text: '收到红包，获得150金币', 
                    effect: () => { state.money += 150 },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 150, 'money', '金币', '#f39c12')
                },
                { 
                    text: '帮助老人，名誉+8', 
                    effect: () => { state.reputation = Math.min(100, state.reputation + 8) },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 8, 'reputation', '名誉', '#9b59b6')
                },
                { 
                    text: '睡了个好觉，心情+10，健康+5', 
                    effect: () => { 
                        state.mood = Math.min(100, state.mood + 10)
                        state.health = Math.min(100, state.health + 5)
                    },
                    anim: () => {
                        this.game.gameState.addDelayedAnimation('increase', 10, 'mood', '心情', '#e91e63')
                        this.game.gameState.addDelayedAnimation('increase', 5, 'health', '健康', '#27ae60')
                    }
                }
            ]
            
            const badEvents = [
                { 
                    text: '不小心丢了钱包，损失40金币', 
                    effect: () => { state.money = Math.max(0, state.money - 40) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 40, 'money', '金币', '#f39c12')
                },
                { 
                    text: '被小偷偷了，损失30金币', 
                    effect: () => { state.money = Math.max(0, state.money - 30) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 30, 'money', '金币', '#f39c12')
                },
                { 
                    text: '身体不适，健康-8', 
                    effect: () => { state.health = Math.max(0, state.health - 8) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 8, 'health', '健康', '#27ae60')
                },
                { 
                    text: '被误解，名誉-8', 
                    effect: () => { state.reputation = Math.max(-100, state.reputation - 8) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 8, 'reputation', '名誉', '#9b59b6')
                },
                { 
                    text: '做了噩梦，心情-10', 
                    effect: () => { state.mood = Math.max(0, state.mood - 10) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 10, 'mood', '心情', '#e91e63')
                }
            ]
            
            const neutralEvents = [
                { 
                    text: '今天风和日丽，心情+5', 
                    effect: () => { state.mood = Math.min(100, state.mood + 5) },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 5, 'mood', '心情', '#e91e63')
                },
                { 
                    text: '偶遇老朋友，心情+5', 
                    effect: () => { state.mood = Math.min(100, state.mood + 5) },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 5, 'mood', '心情', '#e91e63')
                }
            ]
            
            let events
            const typeChance = Math.random()
            if (typeChance < config.goodEventProbability) {
                events = goodEvents
            } else if (typeChance < config.goodEventProbability + config.badEventProbability) {
                events = badEvents
            } else {
                events = neutralEvents
            }
            
            const event = events[Math.floor(Math.random() * events.length)]
            event.effect()
            event.anim()
            
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '随机事件',
                content: event.text,
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
        }
        
        if (state.health < 30 && Math.random() < 0.3) {
            state.health = Math.max(0, state.health - 5)
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '健康警告',
                content: '健康过低，病情加重',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
        }
        
        if (state.mood < 20 && Math.random() < 0.2) {
            state.mood = Math.max(0, state.mood - 5)
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '心情警告',
                content: '心情太差，更加抑郁',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
        }
    }
    
=======

>>>>>>> 9ee67bfa37532d9ba32be0503a8550afbb81b6fb
    showEventsModal(events) {
        const content = events.join('\n')
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '今日事件',
            content: content,
            confirmText: '知道了',
            onConfirm: () => {
                this.game.gameState.clearEvents()

                if (this.game.gameState.data.day > 180) {
                    this.game.uiManager.addModal({
                        type: 'confirm',
                        title: '游戏结束',
                        content: '180天已结束!',
                        confirmText: '重新开始',
                        onConfirm: () => {
                            this.game.gameState.reset()
                        }
                    })
                }
            }
        })
    }
<<<<<<< HEAD
=======

    /**
     * 处理触摸开始事件
     */
    handleTouchStart(x, y) {
        // 优先处理悬浮手机按钮
        if (this.floatPhoneButton && this.floatPhoneButton.processTouchStart(x, y)) {
            return true
        }
        return false
    }

    /**
     * 处理触摸移动事件
     */
    handleTouchMove(x, y) {
        // 优先处理悬浮手机按钮
        if (this.floatPhoneButton && this.floatPhoneButton.processTouchMove(x, y)) {
            return true
        }
        return false
    }

    /**
     * 处理触摸结束事件
     */
    handleTouchEnd(x, y) {
        // 优先处理悬浮手机按钮
        if (this.floatPhoneButton && this.floatPhoneButton.processTouchEnd(x, y)) {
            return true
        }
        return false
    }
>>>>>>> 9ee67bfa37532d9ba32be0503a8550afbb81b6fb
}
