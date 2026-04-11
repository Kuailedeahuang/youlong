import { getAllHouses, checkPurchaseEligibility } from '../data/houses.js'

export class HouseScene {
    constructor(game) {
        this.game = game
        this.name = 'house'
        this.houses = getAllHouses()
        this.selectedHouse = null
    }
    
    onEnter() {
        this.selectedHouse = null
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
        
        // 背景色
        renderer.clear('#1a1a2e')
        
        // 绘制顶部栏
        this.renderTopBar(renderer, state)
        
        // 绘制标题
        renderer.drawText('售楼部', w / 2, 50, '#f39c12', 18, 'center')
        
        // 绘制房型列表（两列）
        this.renderHouseList(renderer, state)
        
        // 如果选中了房型，显示详情弹窗
        if (this.selectedHouse) {
            this.renderHouseDetail(renderer, state)
        }
    }
    
    renderTopBar(renderer, state) {
        const w = renderer.width
        
        // 左上角返回按钮（箭头）
        renderer.drawRect(0, 0, w, 40, '#16213e')
        
        // 绘制返回箭头
        const ctx = renderer.ctx
        ctx.strokeStyle = '#f39c12'
        ctx.lineWidth = 3
        ctx.beginPath()
        // 箭头形状：<-
        ctx.moveTo(25, 20)
        ctx.lineTo(35, 12)
        ctx.moveTo(25, 20)
        ctx.lineTo(35, 28)
        ctx.moveTo(25, 20)
        ctx.lineTo(40, 20)
        ctx.stroke()
        
        // 添加返回按钮点击区域
        const ui = this.game.uiManager
        ui.addButton(10, 5, 40, 30, '', () => {
            this.game.sceneManager.switchTo('home')
        }, { bgColor: 'transparent' })
        
        // 显示精力
        renderer.drawText(`精力: ${state.energy}/${state.maxEnergy}`, w - 15, 25, '#7f8c8d', 12, 'right')
    }
    
    renderHouseList(renderer, state) {
        const w = renderer.width
        const h = renderer.height
        const startY = 70
        const padding = 10
        const cardW = (w - padding * 3) / 2
        const cardH = 180
        
        const ui = this.game.uiManager
        
        this.houses.forEach((house, index) => {
            const col = index % 2
            const row = Math.floor(index / 2)
            const x = padding + col * (cardW + padding)
            const y = startY + row * (cardH + padding)
            
            // 绘制卡片背景
            renderer.drawRect(x, y, cardW, cardH, 'rgba(22, 33, 62, 0.9)', 8)
            
            // 绘制图片区域（占位符）
            const imgH = 100
            renderer.drawRect(x + 5, y + 5, cardW - 10, imgH, '#2d3748', 4)
            
            // 绘制房型名称（图片下方）
            renderer.drawText(house.name, x + cardW / 2, y + imgH + 20, '#f39c12', 13, 'center')
            
            // 绘制价格
            renderer.drawText(`${house.price}金币`, x + cardW / 2, y + imgH + 38, '#27ae60', 11, 'center')
            
            // 绘制简介（限制行数）
            const shortDesc = house.description.length > 20 ? house.description.substring(0, 20) + '...' : house.description
            renderer.drawText(shortDesc, x + cardW / 2, y + imgH + 55, '#bdc3c7', 10, 'center')
            
            // 添加点击区域
            ui.addButton(x, y, cardW, cardH, '', () => {
                this.selectedHouse = house
            }, { bgColor: 'transparent' })
        })
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
        
        // 绘制半透明背景
        renderer.drawRect(0, 0, w, h, 'rgba(0, 0, 0, 0.7)')
        
        // 绘制弹窗背景
        renderer.drawRect(modalX, modalY, modalW, modalH, '#1a1a2e', 12)
        
        // 绘制标题
        renderer.drawText(house.name, modalX + modalW / 2, modalY + 25, '#f39c12', 16, 'center')
        
        // 绘制图片区域
        const imgW = modalW - 30
        const imgH = 100
        renderer.drawRect(modalX + 15, modalY + 40, imgW, imgH, '#2d3748', 6)
        
        // 绘制详细信息
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
        
        // 绘制按钮
        const btnY = modalY + modalH - 50
        const ui = this.game.uiManager
        
        if (eligibility.eligible) {
            // 可以购买
            ui.addButton(modalX + 15, btnY, (modalW - 45) / 2, 40, '购买', () => {
                this.purchaseHouse(house)
            }, { bgColor: '#27ae60', fontSize: 14 })
            
            ui.addButton(modalX + 30 + (modalW - 45) / 2, btnY, (modalW - 45) / 2, 40, '取消', () => {
                this.selectedHouse = null
            }, { bgColor: '#7f8c8d', fontSize: 14 })
        } else {
            // 无法购买
            renderer.drawText(`无法购买: ${eligibility.reason}`, modalX + modalW / 2, btnY - 10, '#e74c3c', 11, 'center')
            
            ui.addButton(modalX + (modalW - 100) / 2, btnY, 100, 40, '关闭', () => {
                this.selectedHouse = null
            }, { bgColor: '#7f8c8d', fontSize: 14 })
        }
    }
    
    purchaseHouse(house) {
        const state = this.game.gameState.data
        
        // 扣除金币
        state.money -= house.price
        state.purchasedHouse = house.id
        
        this.game.gameState.save()
        
        // 关闭详情
        this.selectedHouse = null
        
        // 显示购买成功提示
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '购房成功',
            content: `恭喜您购买了 ${house.name}！\n${house.parentAttitude}`,
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {}
        })
    }
}

export default HouseScene
