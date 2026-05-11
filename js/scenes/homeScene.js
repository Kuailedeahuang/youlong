import ItemData, { categories } from '../data/items.js'
import imageManager from '../utils/imageManager.js'
import { restartGame } from '../utils/resetGame.js'
import animationManager from '../utils/animationManager.js'
import { GAME_CONFIG, getJobByLevel, getNextJob } from '../data/gameConfig.js'
import iconManager from '../components/IconManager.js'
import InteractiveAreaManager from '../components/InteractiveAreaManager.js'
import BackGameManager from '../managers/backgamemanger.js'
import SleepTransitionManager from '../utils/sleepTransitionManager.js'

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
                labelBorderColor: 'transparent',
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
                labelBorderColor: 'transparent',
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
                labelBorderColor: 'transparent',
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
            title: '休息',
            content: '是否要上床休息，结束今天？',
            confirmText: '休息',
            cancelText: '再逛逛',
            onConfirm: () => this.startSleepTransition()
        })
    }

    startSleepTransition() {
        const bedPos = this.getBedScreenPos()
        this.sleepTransition = new SleepTransitionManager(
            this.game, bedPos, () => {
                this.sleepTransition = null
                this.backGameManager.endDay()
            }
        )
        this.sleepTransition.start()
    }

    getBedScreenPos() {
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        const area = this.areaManager.get('homeBed')
        if (area) {
            const hit = area.hitArea
            return {
                x: w * (hit.xPercent + hit.widthPercent / 2),
                y: h * (hit.yPercent + hit.heightPercent / 2)
            }
        }
        return { x: w * 0.75, y: h * 0.56 }
    }

    /**
     * 电脑点击事件
     */
    onComputerClick() {
        console.log('[HomeScene] 点击电脑')
        this.game.sceneManager.switchTo('computer')
    }

    /**
     * 设置点击事件
     */
    onSettingClick() {
        console.log('[HomeScene] 点击设置')
        this.game.sceneManager.switchTo('settings')
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

    handleTouchStart(x, y) {
        if (this.sleepTransition && this.sleepTransition.isActive()) {
            return this.sleepTransition.handleTouchStart(x, y)
        }
        if (this.areaManager) {
            const w = this.game.renderer.width
            const h = this.game.renderer.height
            return this.areaManager.handleTouchStart(x, y, w, h)
        }
        return false
    }

    handleTouchEnd(x, y) {
        if (this.sleepTransition && this.sleepTransition.isActive()) {
            return this.sleepTransition.handleTouchEnd(x, y)
        }
        if (this.areaManager) {
            const w = this.game.renderer.width
            const h = this.game.renderer.height
            return this.areaManager.handleTouchEnd(x, y, w, h)
        }
        return false
    }

    update(deltaTime) {
        if (this.sleepTransition) {
            this.sleepTransition.update(deltaTime)
        }
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

        renderer.renderStatsPanel(this.game, state)

        animationManager.updateAndRender(renderer)

        if (this.sleepTransition) {
            this.sleepTransition.render(renderer)
        }
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
        renderer.beginRoundRectPath(padding, 8, w - padding * 2, h - 8, 12)
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

    renderStatBox(renderer, x, y, w, h, label, value, color) {
        renderer.drawRect(x, y, w, h, 'rgba(26, 26, 46, 0.85)', 6)
        renderer.drawRect(x, y, 4, h, color, 3)
        renderer.drawText(label, x + 10, y + 12, '#7f8c8d', 10, 'left')
        renderer.drawText(String(value), x + 10, y + 26, '#ffffff', 12, 'left')
    }
    
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
            { text: '个人借贷', action: () => this.game.sceneManager.goToLocation('privateLoan') },
            { text: '银行', action: () => this.game.sceneManager.goToLocation('bank') },
            { text: '工作', action: () => this.game.sceneManager.goToLocation('work') }
        ]
        
        const row2 = [
            { text: '公益', action: () => this.doCharity() },
            { text: '医院', action: () => this.game.sceneManager.goToLocation('hospital') },
            { text: '健身房', action: () => this.game.sceneManager.goToLocation('gym') },
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
        ui.addButton(innerX, row3Y, btnW3, btnH, '售楼部', () => this.game.sceneManager.goToLocation('house'), { fontSize: 12 })
        
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
    
    enterHouseScene() {
        console.log('[HomeScene] enterHouseScene 被调用')
        this.game.sceneManager.goToLocation('house')
    }
    
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
                
                this.game.sceneManager.goToLocation('home')
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
                    
                    this.game.sceneManager.goToLocation('home')
                }
            }
        })
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
            content: `恭喜您升职为 ${nextJob.title}！\n\n新工资：\n上班: ${nextJob.baseSalary}金币\n加班费: ${nextJob.overtimeSalary}金币`,
            confirmText: '太棒了',
            singleButton: true,
            onConfirm: () => {
                this.game.sceneManager.goToLocation('home')
            }
        })
    }

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
}
