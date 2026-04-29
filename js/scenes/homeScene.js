import ItemData, { categories } from '../data/items.js'
import imageManager from '../utils/imageManager.js'
import { restartGame } from '../utils/resetGame.js'
import animationManager from '../utils/animationManager.js'
import iconManager from '../components/IconManager.js'
import InteractiveAreaManager from '../components/InteractiveAreaManager.js'
import BackGameManager from '../managers/backgamemanger.js'

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
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '设置',
            content: '设置功能开发中...',
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {}
        })
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
            this.endDay()
        }, { bgColor: 'transparent' })
    }

    renderStatBox(renderer, x, y, w, h, label, value, color) {
        renderer.drawRect(x, y, w, h, 'rgba(26, 26, 46, 0.85)', 6)
        renderer.drawRect(x, y, 4, h, color, 3)
        renderer.drawText(label, x + 10, y + 12, '#7f8c8d', 10, 'left')
        renderer.drawText(String(value), x + 10, y + 26, '#ffffff', 12, 'left')
    }

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

    enterHouseScene() {
        console.log('[HomeScene] enterHouseScene 被调用')
        this.game.sceneManager.switchTo('house')
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
