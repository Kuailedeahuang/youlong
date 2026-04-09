import ItemData, { categories } from '../data/items.js'

export default class HomeScene {
    constructor(game) {
        this.game = game
        this.itemPrices = {}
        this.bgImage = null
        this.imageLoaded = false
        this.loadBackground()
        this.initPrices()
    }
    
    loadBackground() {
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
    }
    
    update(deltaTime) {
        
    }
    
    render(renderer) {
        const w = renderer.width
        const h = renderer.height
        const state = this.game.gameState.data
        
        this.game.uiManager.clear()
        
        if (this.imageLoaded && this.bgImage) {
            const ctx = renderer.ctx
            ctx.drawImage(this.bgImage, 0, 0, w, h)
        } else {
            renderer.clear('#1a1a2e')
        }
        
        this.renderTopBar(renderer, state)
        
        const topBarH = 50
        const tabBarH = 50
        
        this.renderStats(renderer, topBarH, state)
        
        this.renderButtons(renderer, h - tabBarH, state)
        this.renderTabBar(renderer)
    }
    
    renderTopBar(renderer, state) {
        renderer.drawRect(0, 0, renderer.width, 50, '#1a1a2e')
        
        renderer.drawText(`第${state.day}天/${state.totalDays}天`, 15, 25, '#f39c12', 14, 'left')
        
        renderer.drawText(`金币: ${state.money}`, renderer.width - 15, 15, '#f39c12', 12, 'right')
        
        const deposit = state.bankDeposit - (state.bankLoan + state.privateLoan)
        const depositColor = deposit >= 0 ? '#27ae60' : '#e74c3c'
        const depositText = deposit >= 0 ? `存款: +${deposit}` : `欠款: ${deposit}`
        renderer.drawText(depositText, renderer.width - 15, 35, depositColor, 11, 'right')
    }
    
    renderStats(renderer, topBarH, state) {
        const w = renderer.width
        const h = renderer.height
        const roadY = h * 0.35
        const roadH = h * 0.1
        
        const padding = 15
        const fontSize = 14
        const ctx = renderer.ctx
        
        ctx.font = `bold ${fontSize}px sans-serif`
        ctx.textAlign = 'left'
        ctx.fillStyle = '#ffffff'
        ctx.fillText(`名誉 ${state.reputation}/100`, padding, roadY + padding + 5)
        
        ctx.textAlign = 'right'
        ctx.fillText(`精力 ${state.energy}/${state.maxEnergy}`, w - padding, roadY + padding + 5)
        
        ctx.textAlign = 'left'
        ctx.fillText(`心情 ${state.mood}/100`, padding, roadY + roadH - padding)
        
        ctx.textAlign = 'right'
        ctx.fillText(`健康 ${state.health}/100`, w - padding, roadY + roadH - padding)
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
        const btnH = 40
        const btnGap = 6
        const endBtnH = 45
        const totalBtnH = btnH * 2 + btnGap + endBtnH + 15
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
            ui.addButton(innerX + i * (btnW + btnGap), startY, btnW, btnH, btn.text, btn.action, { fontSize: 13 })
        })
        
        const btnW2 = (innerW - btnGap * 3) / 4
        row2.forEach((btn, i) => {
            ui.addButton(innerX + i * (btnW2 + btnGap), startY + btnH + btnGap, btnW2, btnH, btn.text, btn.action, { fontSize: 13 })
        })
        
        const endBtnY = startY + btnH * 2 + btnGap * 2 + 5
        ui.addButton(innerX + (innerW - 120) / 2, endBtnY, 120, endBtnH, '结束今日', () => this.endDay(), { bgColor: '#f39c12', fontSize: 14 })
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
        ui.addButton(tabW, y, tabW, h, '', () => this.game.sceneManager.switchTo('market'), { bgColor: 'transparent' })
    }
    
    showLoanModal() {
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '个人借贷',
            content: '日利率: 2.5%\n逾期惩罚严厉\n是否借贷?',
            confirmText: '借贷',
            onConfirm: () => {
                this.game.uiManager.addModal({
                    type: 'trade',
                    title: '借贷金额',
                    content: '',
                    itemName: '私人借贷',
                    price: 1,
                    quantity: 1000,
                    maxQuantity: 120000,
                    total: 1000,
                    tradeType: 'loan',
                    onConfirm: (qty) => {
                        this.game.gameState.data.privateLoan += qty
                        this.game.gameState.data.money += qty
                        this.game.gameState.save()
                    }
                })
            }
        })
    }
    
    showBankModal() {
        this.game.uiManager.addModal({
            type: 'action',
            title: '银行',
            content: '存款利率: 每6天2%\n贷款利率: 每6天6%',
            actions: [
                { text: '存款', callback: () => this.doDeposit() },
                { text: '贷款', callback: () => this.doLoan() },
                { text: '还款', callback: () => this.doRepay() }
            ],
            height: 160
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
            onConfirm: (qty) => {
                if (state.money >= qty) {
                    state.money -= qty
                    state.bankDeposit += qty
                    this.game.gameState.save()
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
            onConfirm: (qty) => {
                state.bankLoan += qty
                state.money += qty
                this.game.gameState.save()
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
            onConfirm: (qty) => {
                if (state.money >= qty) {
                    state.money -= qty
                    state.bankLoan -= qty
                    this.game.gameState.save()
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
        
        const jobs = [
            { baseSalary: 120, overtimeSalary: 180 },
            { baseSalary: 240, overtimeSalary: 360 },
            { baseSalary: 480, overtimeSalary: 720 },
            { baseSalary: 960, overtimeSalary: 1440 },
            { baseSalary: 1920, overtimeSalary: 2880 }
        ]
        
        const job = jobs[state.jobLevel - 1]
        let baseSalary = job.baseSalary
        let overtimeSalary = job.overtimeSalary
        
        if (state.salaryDeduction) {
            baseSalary = Math.floor(baseSalary * 0.8)
            overtimeSalary = Math.floor(overtimeSalary * 0.8)
        }
        
        this.game.uiManager.addModal({
            type: 'action',
            title: `工作 (${state.jobTitle})`,
            content: `上班: ${baseSalary}金币 (1精力)\n加班: ${overtimeSalary}金币 (1精力,健康-5)`,
            actions: [
                { text: '上班', callback: () => this.doWork(false, baseSalary) },
                { text: '加班', callback: () => this.doWork(true, overtimeSalary) }
            ],
            height: 160
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
        
        state.energy -= 1
        state.money += salary
        
        if (isOvertime) {
            state.health -= 5
        }
        
        this.game.gameState.save()
    }
    
    doCharity() {
        const state = this.game.gameState.data
        
        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法参与公益',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '公益活动',
            content: '消耗1精力\n名誉+5~+10\n心情+5~+10',
            confirmText: '参与',
            onConfirm: () => {
                state.energy -= 1
                state.reputation = Math.min(100, state.reputation + 5 + Math.floor(Math.random() * 6))
                state.mood = Math.min(100, state.mood + 5 + Math.floor(Math.random() * 6))
                this.game.gameState.save()
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
                state.energy -= 1
                state.health = Math.min(100, state.health + 5 + Math.floor(Math.random() * 6))
                state.consecutiveGymDays++
                
                if (state.consecutiveGymDays >= 3) {
                    state.maxEnergy = Math.min(15, state.maxEnergy + 1)
                }
                
                this.game.gameState.save()
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
                    state.energy -= 1
                    state.money -= 50
                    state.mood = Math.min(100, state.mood + 15 + Math.floor(Math.random() * 11))
                    state.consecutiveGymDays = 0
                    this.game.gameState.save()
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
                this.triggerRandomEvents()
                
                this.game.gameState.nextDay()
                
                const events = this.game.gameState.getEvents()
                if (events.length > 0) {
                    this.showEventsModal(events)
                } else if (this.game.gameState.data.day > 180) {
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
    
    triggerRandomEvents() {
        const state = this.game.gameState.data
        const eventChance = Math.random()
        
        if (eventChance < 0.15) {
            const events = [
                { text: '路边捡到钱包，获得50金币', effect: () => { state.money += 50 } },
                { text: '不小心丢了钱包，损失30金币', effect: () => { state.money = Math.max(0, state.money - 30) } },
                { text: '遇到好心人，心情+10', effect: () => { state.mood = Math.min(100, state.mood + 10) } },
                { text: '被小偷偷了，损失20金币', effect: () => { state.money = Math.max(0, state.money - 20) } },
                { text: '身体不适，健康-5', effect: () => { state.health = Math.max(0, state.health - 5) } },
                { text: '收到红包，获得100金币', effect: () => { state.money += 100 } },
                { text: '帮助老人，名誉+5', effect: () => { state.reputation = Math.min(100, state.reputation + 5) } },
                { text: '被误解，名誉-5', effect: () => { state.reputation = Math.max(-100, state.reputation - 5) } },
                { text: '睡了个好觉，心情+5', effect: () => { state.mood = Math.min(100, state.mood + 5) } },
                { text: '做了噩梦，心情-5', effect: () => { state.mood = Math.max(0, state.mood - 5) } }
            ]
            
            const event = events[Math.floor(Math.random() * events.length)]
            event.effect()
            this.game.gameState.addEvent(event.text)
        }
        
        if (state.health < 30 && Math.random() < 0.3) {
            state.health = Math.max(0, state.health - 5)
            this.game.gameState.addEvent('健康过低，病情加重')
        }
        
        if (state.mood < 20 && Math.random() < 0.2) {
            state.mood = Math.max(0, state.mood - 5)
            this.game.gameState.addEvent('心情太差，更加抑郁')
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
