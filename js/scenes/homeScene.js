import ItemData, { categories } from '../data/items.js'
import imageManager from '../utils/imageManager.js'
import { restartGame } from '../utils/resetGame.js'
import animationManager from '../utils/animationManager.js'

export default class HomeScene {
    constructor(game) {
        this.game = game
        this.itemPrices = {}
        this.bgImage = null
        this.imageLoaded = false
        this.useCloudImage = false
        this.loadBackground()
        this.initPrices()
        
    }
    
    getStatPositions() {
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        const roadY = h * 0.40
        const roadH = h * 0.15
        const padding = 15
        
        return {
            money: { x: w - 50, y: 15 },
            reputation: { x: padding + 30, y: roadY + padding + 10 },
            energy: { x: w - padding - 30, y: roadY + padding + 10 },
            mood: { x: padding + 30, y: roadY + roadH - padding - 5 },
            health: { x: w - padding - 30, y: roadY + roadH - padding - 5 },
            privateLoan: { x: w - 50, y: 45 },
            bankLoan: { x: w - 50, y: 30 },
            bankDeposit: { x: w - 50, y: 55 }
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
        const colorMap = {
            money: '#f39c12',
            health: '#27ae60',
            energy: '#3498db',
            mood: '#e91e63',
            reputation: '#9b59b6',
            privateLoan: '#e74c3c',
            bankLoan: '#3498db',
            bankDeposit: '#27ae60'
        }
        return colorMap[statType] || '#ffffff'
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
        const tabBarH = 50
        
        this.renderStats(renderer, topBarH, state)
        
        this.renderButtons(renderer, h - tabBarH, state)
        this.renderTabBar(renderer)
        
        animationManager.updateAndRender(renderer)
    }
    
    renderTopBar(renderer, state) {
        renderer.drawRect(0, 0, renderer.width, 60, '#1a1a2e')
        
        renderer.drawText(`第${state.day}天/${state.totalDays}天`, 15, 25, '#f39c12', 14, 'left')
        
        renderer.drawText(`金币: ${state.money}`, renderer.width - 15, 15, '#f39c12', 12, 'right')
        
        const bankNet = state.bankDeposit - state.bankLoan
        const bankColor = bankNet >= 0 ? '#27ae60' : '#e74c3c'
        const bankText = bankNet >= 0 ? `银行存款: +${bankNet}` : `银行欠款: ${bankNet}`
        renderer.drawText(bankText, renderer.width - 15, 30, bankColor, 10, 'right')
        
        if (state.privateLoan > 0) {
            renderer.drawText(`个人欠款: ${state.privateLoan}`, renderer.width - 15, 45, '#e74c3c', 10, 'right')
        }
        
        if (state.day > 1 && state.yesterdayExpense > 0) {
            renderer.drawText(`昨日开销: ${state.yesterdayExpense}金币`, renderer.width / 2, 25, '#e74c3c', 11, 'center')
        }
    }
    
    renderStats(renderer, topBarH, state) {
        const w = renderer.width
        const h = renderer.height
        const roadY = h * 0.40
        const roadH = h * 0.15
        
        const padding = 15
        const fontSize = 12
        const ctx = renderer.ctx
        
        ctx.font = `bold ${fontSize}px sans-serif`
        
        ctx.textAlign = 'left'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(`名誉 ${state.reputation}/100`, padding + 5, roadY + padding + 10)
        
        ctx.textAlign = 'right'
        ctx.fillText(`精力 ${state.energy}/${state.maxEnergy}`, w - padding - 5, roadY + padding + 10)
        
        ctx.textAlign = 'left'
        ctx.fillText(`心情 ${state.mood}/100`, padding + 5, roadY + roadH - padding - 5)
        
        ctx.textAlign = 'right'
        ctx.fillText(`健康 ${state.health}/100`, w - padding - 5, roadY + roadH - padding - 5)
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
        const endBtnH = 40
        const restartBtnH = 32
        const totalBtnH = btnH * 2 + btnGap * 2 + endBtnH + restartBtnH + 20
        const startY = bottomY - totalBtnH
        const btnW = (innerW - btnGap * 2) / 3
        
        const ui = this.game.uiManager
        
        const row1 = [
            { text: '个人借贷', action: () => this.showLoanModal() },
            { text: '银行', action: () => this.showBankModal() },
            { text: '工作', action: () => this.showWorkModal() }
        ]
        
        const row2 = [
            { text: '公益', action: () => this.doCharity() },
            { text: '医院', action: () => this.doHospital() },
            { text: '健身房', action: () => this.doGym() },
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
        ui.addButton(innerX, row3Y, btnW3, btnH, '售楼部', () => this.enterHouseScene(), { fontSize: 12 })
        
        const adText = this.game.adSystem.getAdButtonText()
        ui.addButton(innerX + btnW3 + btnGap, row3Y, btnW3, btnH, adText, () => this.game.adSystem.showAd(), { fontSize: 11 })
        
        const endBtnY = row3Y + btnH + btnGap + 5
        ui.addButton(innerX + (innerW - 120) / 2, endBtnY, 120, endBtnH, '结束今日', () => this.endDay(), { bgColor: '#f39c12', fontSize: 14 })
        
        const restartBtnY = endBtnY + endBtnH + btnGap
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
    
    renderTabBar(renderer) {
        const w = renderer.width
        const h = 50
        const y = renderer.height - h
        
        renderer.drawRect(0, y, w, h, '#1a1a2e')
        renderer.drawRect(0, y, w, 1, 'rgba(255,255,255,0.1)')
        
        const tabW = w / 2
        renderer.drawText('出租屋', tabW / 2, y + h / 2, '#f39c12', 13, 'center')
        renderer.drawText('市场', tabW + tabW / 2, y + h / 2, '#7f8c8d', 13, 'center')
        
        const ui = this.game.uiManager
        ui.addButton(0, y, tabW, h, '', () => {}, { bgColor: 'transparent' })
        ui.addButton(tabW, y, tabW, h, '', () => this.enterMarket(), { bgColor: 'transparent' })
    }
    
    enterMarket() {
        const state = this.game.gameState.data
        
        // 检查是否是今天第一次进入市场
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
            
            this.game.gameState.addDelayedAnimation('decrease', 2, 'energy', '精力', '#3498db')
        }
        
        this.game.sceneManager.switchTo('market')
    }
    
    enterHouseScene() {
        this.game.sceneManager.switchTo('house')
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
        
        // 所有岗位和借款挡位信息
        const jobLoanInfo = [
            { level: 1, title: '外卖/快递员', loanLimit: 50000 },
            { level: 2, title: '文员', loanLimit: 50000 },
            { level: 3, title: '主管', loanLimit: 75000 },
            { level: 4, title: '经理', loanLimit: 75000 },
            { level: 5, title: '总监', loanLimit: 75000 }
        ]
        
        // 构建岗位和借款挡位显示内容
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
            content: `存款利率: 每6天2%  |  贷款利率: 每6天6%\n当前欠款: ${state.bankLoan.toLocaleString()} 金币\n\n${jobContent}`,
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
        const maxLoan = state.jobLevel >= 3 ? 75000 : 50000
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
        const jobs = [
            { level: 1, title: '外卖/快递员', baseSalary: 120, overtimeSalary: 180 },
            { level: 2, title: '文员', baseSalary: 240, overtimeSalary: 360 },
            { level: 3, title: '主管', baseSalary: 480, overtimeSalary: 720 },
            { level: 4, title: '经理', baseSalary: 960, overtimeSalary: 1440 },
            { level: 5, title: '总监', baseSalary: 1920, overtimeSalary: 2880 }
        ]
        
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
        
        this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
        this.game.gameState.addDelayedAnimation('increase', salary, 'money', '金币', '#f39c12')
        
        if (isOvertime) {
            this.game.gameState.addDelayedAnimation('decrease', 5, 'health', '健康', '#27ae60')
        }
        
        let workResultContent = `获得 ${salary} 金币！`
        if (reputationChange !== 0) {
            workResultContent += `\n${reputationReason}，名誉${reputationChange > 0 ? '+' : ''}${reputationChange}`
        }
        
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
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '医院',
            content: '消耗1精力\n花费100金币\n恢复健康+30',
            confirmText: '治疗',
            onConfirm: () => {
                if (state.money >= 100) {
                    state.energy -= 1
                    state.money -= 100
                    state.health = Math.min(100, state.health + 30)
                    this.game.gameState.save()
                    
                    this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
                    this.game.gameState.addDelayedAnimation('decrease', 100, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('increase', 30, 'health', '健康', '#27ae60')
                    
                    this.game.sceneManager.switchTo('home')
                }
            }
        })
    }
    
    doGym() {
        const state = this.game.gameState.data
        
        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法健身',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '健身房',
            content: '消耗1精力\n健康+5~+10\n连续健身可提升精力上限',
            confirmText: '健身',
            onConfirm: () => {
                const healthGain = 5 + Math.floor(Math.random() * 6)
                state.energy -= 1
                state.health = Math.min(100, state.health + healthGain)
                state.consecutiveGymDays++
                
                if (state.consecutiveGymDays >= 3) {
                    state.maxEnergy = Math.min(15, state.maxEnergy + 1)
                }
                
                this.game.gameState.save()
                
                this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
                this.game.gameState.addDelayedAnimation('increase', healthGain, 'health', '健康', '#27ae60')
                
                this.game.sceneManager.switchTo('home')
            }
        })
    }
    
    doEntertainment() {
        const state = this.game.gameState.data
        
        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法娱乐',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '娱乐',
            content: '消耗1精力\n花费50金币\n心情+15~+25',
            confirmText: '娱乐',
            onConfirm: () => {
                if (state.money >= 50) {
                    const moodGain = 15 + Math.floor(Math.random() * 11)
                    state.energy -= 1
                    state.money -= 50
                    state.mood = Math.min(100, state.mood + moodGain)
                    state.consecutiveGymDays = 0
                    this.game.gameState.save()
                    
                    this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
                    this.game.gameState.addDelayedAnimation('decrease', 50, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('increase', moodGain, 'mood', '心情', '#e91e63')
                    
                    this.game.sceneManager.switchTo('home')
                }
            }
        })
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
        
        if (eventChance < 0.15) {
            const events = [
                { 
                    text: '路边捡到钱包，获得50金币', 
                    effect: () => { state.money += 50 },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 50, 'money', '金币', '#f39c12')
                },
                { 
                    text: '不小心丢了钱包，损失30金币', 
                    effect: () => { state.money = Math.max(0, state.money - 30) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 30, 'money', '金币', '#f39c12')
                },
                { 
                    text: '遇到好心人，心情+10', 
                    effect: () => { state.mood = Math.min(100, state.mood + 10) },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 10, 'mood', '心情', '#e91e63')
                },
                { 
                    text: '被小偷偷了，损失20金币', 
                    effect: () => { state.money = Math.max(0, state.money - 20) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 20, 'money', '金币', '#f39c12')
                },
                { 
                    text: '身体不适，健康-5', 
                    effect: () => { state.health = Math.max(0, state.health - 5) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 5, 'health', '健康', '#27ae60')
                },
                { 
                    text: '收到红包，获得100金币', 
                    effect: () => { state.money += 100 },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 100, 'money', '金币', '#f39c12')
                },
                { 
                    text: '帮助老人，名誉+5', 
                    effect: () => { state.reputation = Math.min(100, state.reputation + 5) },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 5, 'reputation', '名誉', '#9b59b6')
                },
                { 
                    text: '被误解，名誉-5', 
                    effect: () => { state.reputation = Math.max(-100, state.reputation - 5) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 5, 'reputation', '名誉', '#9b59b6')
                },
                { 
                    text: '睡了个好觉，心情+5', 
                    effect: () => { state.mood = Math.min(100, state.mood + 5) },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 5, 'mood', '心情', '#e91e63')
                },
                { 
                    text: '做了噩梦，心情-5', 
                    effect: () => { state.mood = Math.max(0, state.mood - 5) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 5, 'mood', '心情', '#e91e63')
                }
            ]
            
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