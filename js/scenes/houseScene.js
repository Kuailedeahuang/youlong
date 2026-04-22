import { getAllHouses, checkPurchaseEligibility } from '../data/houses.js'
import animationManager from '../utils/animationManager.js'

export class HouseScene {
    constructor(game) {
        this.game = game
        this.name = 'house'
        this.houses = getAllHouses()
        this.selectedHouse = null
        
        this.scrollY = 0
        this.maxScrollY = 0
        this.isDragging = false
        this.lastTouchY = 0
        this.contentHeight = 0
        
        this.cardPadding = 10
        this.cardHeight = 180
        this.topBarHeight = 60
        this.titleHeight = 40
        this.listStartY = this.topBarHeight + this.titleHeight
        
        this.initTouchEvents()
    }
    
    initTouchEvents() {
        wx.onTouchStart((e) => {
            if (this.selectedHouse) return
            
            const touch = e.touches[0]
            this.isDragging = true
            this.lastTouchY = touch.clientY
        })
        
        wx.onTouchMove((e) => {
            if (!this.isDragging || this.selectedHouse) return
            
            const touch = e.touches[0]
            const deltaY = touch.clientY - this.lastTouchY
            this.lastTouchY = touch.clientY
            
            this.scrollY += deltaY
            
            this.scrollY = Math.max(-this.maxScrollY, Math.min(0, this.scrollY))
        })
        
        wx.onTouchEnd(() => {
            this.isDragging = false
        })
        
        wx.onTouchCancel(() => {
            this.isDragging = false
        })
    }
    
    onEnter() {
        this.selectedHouse = null
        this.scrollY = 0
    }
    
    onExit() {
        this.selectedHouse = null
    }
    
    update(deltaTime) {
        
    }
    
    render(renderer) {
        const w = renderer.width
        const h = renderer.height
        const state = this.game.gameState.data
        
        this.game.uiManager.clear()
        
        renderer.clear('#1a1a2e')
        
        this.renderTopBar(renderer, state)
        
        renderer.drawText('售楼部', w / 2, 50, '#f39c12', 18, 'center')
        
        if (!this.selectedHouse) {
            this.renderHouseList(renderer, state, w, h)
        }
        
        if (this.selectedHouse) {
            this.renderHouseDetail(renderer, state)
        }
    }
    
    renderTopBar(renderer, state) {
        const w = renderer.width
        
        renderer.drawRect(0, 0, w, 40, '#16213e')
        
        const ctx = renderer.ctx
        ctx.strokeStyle = '#f39c12'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(25, 20)
        ctx.lineTo(35, 12)
        ctx.moveTo(25, 20)
        ctx.lineTo(35, 28)
        ctx.moveTo(25, 20)
        ctx.lineTo(40, 20)
        ctx.stroke()
        
        const ui = this.game.uiManager
        ui.addButton(10, 5, 40, 30, '', () => {
            this.game.sceneManager.switchTo('home')
        }, { bgColor: 'transparent' })
        
        renderer.drawText(`精力: ${state.energy}/${state.maxEnergy}`, w - 15, 25, '#7f8c8d', 12, 'right')
    }
    
    renderHouseList(renderer, state, w, h) {
        const cardW = (w - this.cardPadding * 3) / 2
        const cardsPerRow = 2
        const totalRows = Math.ceil(this.houses.length / cardsPerRow)
        
        this.contentHeight = totalRows * (this.cardHeight + this.cardPadding) + this.cardPadding
        const visibleHeight = h - this.listStartY
        
        this.maxScrollY = Math.max(0, this.contentHeight - visibleHeight)
        
        const ctx = renderer.ctx
        
        ctx.save()
        ctx.beginPath()
        ctx.rect(0, this.listStartY, w, visibleHeight)
        ctx.clip()
        
        const ui = this.game.uiManager
        
        this.houses.forEach((house, index) => {
            const col = index % cardsPerRow
            const row = Math.floor(index / cardsPerRow)
            const x = this.cardPadding + col * (cardW + this.cardPadding)
            const y = this.listStartY + this.scrollY + this.cardPadding + row * (this.cardHeight + this.cardPadding)
            
            if (y + this.cardHeight < this.listStartY || y > h) {
                return
            }
            
            // 检查房屋是否已解锁（购买过）
            const isUnlocked = state.unlockedHouses && state.unlockedHouses.includes(house.id)
            
            // 根据解锁状态设置颜色
            const cardBgColor = isUnlocked ? 'rgba(22, 33, 62, 0.95)' : 'rgba(40, 40, 40, 0.9)'
            const imgBgColor = isUnlocked ? '#2d3748' : '#4a4a4a'
            const nameColor = isUnlocked ? '#f39c12' : '#7f8c8d'
            const priceColor = isUnlocked ? '#27ae60' : '#95a5a6'
            const descColor = isUnlocked ? '#bdc3c7' : '#7f8c8d'
            
            // 绘制卡片背景
            renderer.drawRect(x, y, cardW, this.cardHeight, cardBgColor, 8)
            
            // 绘制图片区域
            const imgH = 100
            renderer.drawRect(x + 5, y + 5, cardW - 10, imgH, imgBgColor, 4)
            
            // 如果未解锁，添加灰色遮罩
            if (!isUnlocked) {
                renderer.drawRect(x + 5, y + 5, cardW - 10, imgH, 'rgba(0, 0, 0, 0.4)', 4)
            }
            
            // 绘制房屋名称
            renderer.drawText(house.name, x + cardW / 2, y + imgH + 20, nameColor, 13, 'center')
            
            // 绘制价格
            renderer.drawText(`${house.price}金币`, x + cardW / 2, y + imgH + 38, priceColor, 11, 'center')
            
            // 绘制简介
            const shortDesc = house.description.length > 20 ? house.description.substring(0, 20) + '...' : house.description
            renderer.drawText(shortDesc, x + cardW / 2, y + imgH + 55, descColor, 10, 'center')
            
            // 添加点击区域
            ui.addButton(x, y, cardW, this.cardHeight, '', () => {
                this.selectedHouse = house
            }, { bgColor: 'transparent' })
        })
        
        ctx.restore()
        
        if (this.maxScrollY > 0) {
            this.renderScrollBar(renderer, w, h, visibleHeight)
        }
    }
    
    renderScrollBar(renderer, w, h, visibleHeight) {
        const scrollBarWidth = 4
        const scrollBarX = w - scrollBarWidth - 4
        const scrollBarHeight = Math.max(30, visibleHeight * (visibleHeight / this.contentHeight))
        const scrollProgress = Math.abs(this.scrollY) / this.maxScrollY
        const scrollBarY = this.listStartY + (visibleHeight - scrollBarHeight) * scrollProgress
        
        renderer.drawRect(scrollBarX, this.listStartY, scrollBarWidth, visibleHeight, 'rgba(255, 255, 255, 0.1)', 2)
        
        renderer.drawRect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight, 'rgba(243, 156, 18, 0.6)', 2)
    }
    
    renderHouseDetail(renderer, state) {
        const w = renderer.width
        const h = renderer.height
        const modalW = w * 0.85
        const modalH = 320
        const modalX = (w - modalW) / 2
        const modalY = (h - modalH) / 2
        
        const house = this.selectedHouse
        const eligibility = checkPurchaseEligibility(state, house.id)
        
        renderer.drawRect(0, 0, w, h, 'rgba(0, 0, 0, 0.7)')
        
        renderer.drawRect(modalX, modalY, modalW, modalH, '#1a1a2e', 12)
        
        renderer.drawText(house.name, modalX + modalW / 2, modalY + 25, '#f39c12', 16, 'center')
        
        const imgW = modalW - 30
        const imgH = 100
        renderer.drawRect(modalX + 15, modalY + 40, imgW, imgH, '#2d3748', 6)
        
        let lineY = modalY + 155
        renderer.drawText(`价格: ${house.price} 金币`, modalX + 15, lineY, '#27ae60', 12, 'left')
        lineY += 22
        renderer.drawText(`位置: ${house.location}`, modalX + 15, lineY, '#bdc3c7', 12, 'left')
        lineY += 22
        renderer.drawText(`面积: ${house.area}`, modalX + 15, lineY, '#bdc3c7', 12, 'left')
        lineY += 22
        renderer.drawText(`设施: ${house.facilities.join('、')}`, modalX + 15, lineY, '#bdc3c7', 11, 'left')
        lineY += 22
        renderer.drawText(`介绍: ${house.description}`, modalX + 15, lineY, '#bdc3c7', 10, 'left')
        
        const btnY = modalY + modalH - 50
        const ui = this.game.uiManager
        
        if (eligibility.eligible) {
            ui.addButton(modalX + 15, btnY, (modalW - 45) / 2, 40, '购买', () => {
                this.purchaseHouse(house)
            }, { bgColor: '#27ae60', fontSize: 14 })
            
            ui.addButton(modalX + 30 + (modalW - 45) / 2, btnY, (modalW - 45) / 2, 40, '取消', () => {
                this.selectedHouse = null
            }, { bgColor: '#7f8c8d', fontSize: 14 })
        } else {
            renderer.drawText(`无法购买: ${eligibility.reason}`, modalX + modalW / 2, btnY - 10, '#e74c3c', 11, 'center')
            
            ui.addButton(modalX + (modalW - 100) / 2, btnY, 100, 40, '关闭', () => {
                this.selectedHouse = null
            }, { bgColor: '#7f8c8d', fontSize: 14 })
        }
    }
    
    purchaseHouse(house) {
        const state = this.game.gameState.data
        
        state.money -= house.price
        state.purchasedHouse = house.id
        
        // 将房屋添加到永久解锁列表
        if (!state.unlockedHouses) {
            state.unlockedHouses = []
        }
        if (!state.unlockedHouses.includes(house.id)) {
            state.unlockedHouses.push(house.id)
        }
        
        this.game.gameState.save()
        
        this.game.gameState.addDelayedAnimation('decrease', house.price, 'money', '金币', '#f39c12')
        
        this.selectedHouse = null
        
        // 播放结局（购房结局）
        this.playEnding(house)
    }
    
    playEnding(house) {
        // 结局内容（临时，等待图片制作完成）
        const endingContent = `【购房结局】\n\n您成功购买了 ${house.name}！\n\n${house.parentAttitude}\n\n在这个繁华的大都市，您终于拥有了自己的栖身之所。虽然前路依然充满挑战，但您已经迈出了重要的一步。\n\n愿您在新的家园中，开启人生的新篇章。`
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '结局 - 安家立业',
            content: endingContent,
            confirmText: '再活一世',
            singleButton: true,
            onConfirm: () => {
                this.restartGameWithUnlockedHouses()
            }
        })
    }
    
    restartGameWithUnlockedHouses() {
        const state = this.game.gameState.data
        
        // 保存解锁的房屋列表（永久保留）
        const unlockedHouses = state.unlockedHouses || []
        
        // 清除本地存储
        wx.clearStorageSync()
        
        // 创建新的默认状态，保留解锁的房屋
        const defaultState = {
            money: 5000,
            health: 100,
            energy: 5,
            maxEnergy: 5,
            mood: 100,
            reputation: 100,
            day: 1,
            totalDays: 180,
            consecutiveGymDays: 0,
            bankLoan: 0,
            bankDeposit: 0,
            privateLoan: 0,
            overdueDays: 0,
            warehouseCapacity: 20,
            warehouse: {},
            purchasedHouse: null,
            unlockedHouses: unlockedHouses, // 保留解锁的房屋
            gameEnded: false,
            jobLevel: 1,
            jobTitle: '外卖/快递员',
            salaryDeduction: false,
            salaryDeductionDays: 0,
            unemployed: false,
            unemployedDays: 0,
            adWatchedCount: 0,
            housingType: 'suburban',
            bankruptcyCount: 0,
            currentScene: 'home',
            todayEvents: [],
            newspaperShown: false,
            yesterdayExpense: 0,
            marketEnteredToday: false
        }
        
        // 保存新状态
        wx.setStorageSync('bigcitylife_save', defaultState)
        
        // 更新游戏状态
        this.game.gameState.data = defaultState
        this.game.gameState.save()
        
        // 切换到首页场景
        this.game.sceneManager.switchTo('home')
        
        wx.showToast({
            title: '重新开始游戏',
            icon: 'success'
        })
    }
}

export default HouseScene