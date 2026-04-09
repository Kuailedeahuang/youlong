import ItemData, { categories } from '../data/items.js'

const newspapers = [
    { title: '市场快报', content: '今日市场行情平稳，各商品价格小幅波动。' },
    { title: '农业新闻', content: '近期农产品丰收，农副产品价格可能下跌。' },
    { title: '工业周刊', content: '建筑行业需求旺盛，建材类商品看涨。' },
    { title: '财经日报', content: '贵金属市场波动加剧，投资需谨慎。' },
    { title: '能源观察', content: '能源化工产品受政策影响，价格波动明显。' },
    { title: '科技前沿', content: '数码产品更新换代快，价格波动剧烈。' },
    { title: '出行资讯', content: '出行工具市场火热，二手交易活跃。' },
    { title: '特别报道', content: '据内部消息，部分商品即将迎来大涨。' },
    { title: '市场预警', content: '有分析师预测，近期部分商品可能大跌。' },
    { title: '综合新闻', content: '市场整体稳定，建议理性投资。' }
]

export default class MarketScene {
    constructor(game) {
        this.game = game
        this.selectedCategory = null
        this.itemPrices = {}
        this.bgImage = null
        this.imageLoaded = false
        this.todayNewspaper = null
        this.loadBackground()
        this.initPrices()
    }
    
    loadBackground() {
        this.bgImage = wx.createImage()
        this.bgImage.onload = () => {
            this.imageLoaded = true
        }
        this.bgImage.src = 'tupian/shichang.png'
    }
    
    initPrices() {
        ItemData.forEach(item => {
            const fluctuation = item.naturalFluctuation.min + Math.random() * (item.naturalFluctuation.max - item.naturalFluctuation.min)
            this.itemPrices[item.id] = {
                current: Math.round(item.basePrice * (1 + fluctuation)),
                change: Math.round(fluctuation * 100)
            }
        })
    }
    
    generateNewspaper() {
        const randomIndex = Math.floor(Math.random() * newspapers.length)
        this.todayNewspaper = newspapers[randomIndex]
        return this.todayNewspaper
    }
    
    onEnter() {
        this.initPrices()
        this.selectedCategory = null
        
        const state = this.game.gameState.data
        if (!state.newspaperShown) {
            const paper = this.generateNewspaper()
            this.game.uiManager.addModal({
                type: 'confirm',
                title: `第${state.day}天 ${paper.title}`,
                content: paper.content,
                confirmText: '知道了',
                onConfirm: () => {
                    this.game.gameState.set('newspaperShown', true)
                }
            })
        }
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
            renderer.clear('#16213e')
        }
        
        this.renderTopBar(renderer, state)
        
        const contentY = 55
        const contentH = h - contentY - 55
        const leftW = w * 0.48
        const rightW = w * 0.48
        
        this.renderMarketSection(renderer, 5, contentY, leftW, contentH)
        this.renderWarehouseSection(renderer, w - rightW - 5, contentY, rightW, contentH)
        
        this.renderTabBar(renderer)
    }
    
    renderTopBar(renderer, state) {
        renderer.drawRect(0, 0, renderer.width, 50, '#1a1a2e')
        
        renderer.drawText(`第${state.day}天`, 15, 18, '#f39c12', 13, 'left')
        renderer.drawText(`精力: ${state.energy}/${state.maxEnergy}`, 15, 36, '#7f8c8d', 11, 'left')
        renderer.drawText(`金币: ${state.money}`, renderer.width - 15, 25, '#f39c12', 13, 'right')
    }
    
    renderMarketSection(renderer, x, y, w, h) {
        renderer.drawRect(x, y, w, h, 'rgba(0, 0, 0, 0.6)', 8)
        
        renderer.drawText(this.selectedCategory ? categories.find(c => c.id === this.selectedCategory)?.name || '市场' : '市场', x + 10, y + 18, '#f39c12', 13, 'left')
        
        if (this.selectedCategory) {
            const backX = x + w - 45
            const ui = this.game.uiManager
            ui.addButton(backX, y + 5, 40, 25, '返回', () => {
                this.selectedCategory = null
            }, { fontSize: 10, bgColor: '#3498db' })
        }
        
        const listY = y + 35
        const listH = h - 40
        
        if (!this.selectedCategory) {
            this.renderCategoryList(renderer, x + 5, listY, w - 10, listH)
        } else {
            this.renderItemList(renderer, x + 5, listY, w - 10, listH)
        }
    }
    
    renderCategoryList(renderer, x, y, w, h) {
        const itemH = 40
        const gap = 5
        const ui = this.game.uiManager
        
        categories.forEach((cat, i) => {
            const itemY = y + i * (itemH + gap)
            if (itemY + itemH > y + h) return
            
            renderer.drawRect(x, itemY, w, itemH, 'rgba(0, 0, 0, 0.5)', 6)
            renderer.drawRect(x, itemY, 4, itemH, cat.color, 3)
            renderer.drawText(cat.name, x + 12, itemY + itemH / 2, '#ffffff', 12, 'left')
            renderer.drawText(`${cat.count}种`, x + w - 8, itemY + itemH / 2, '#7f8c8d', 10, 'right')
            
            ui.addButton(x, itemY, w, itemH, '', () => {
                this.selectedCategory = cat.id
            }, { bgColor: 'transparent' })
        })
    }
    
    renderItemList(renderer, x, y, w, h) {
        const items = ItemData.filter(item => item.category === this.selectedCategory)
        const itemH = 55
        const gap = 5
        const ui = this.game.uiManager
        
        items.forEach((item, i) => {
            const itemY = y + i * (itemH + gap)
            if (itemY + itemH > y + h) return
            
            const priceData = this.itemPrices[item.id]
            const changeColor = priceData.change >= 0 ? '#27ae60' : '#e74c3c'
            const changeText = priceData.change >= 0 ? `+${priceData.change}%` : `${priceData.change}%`
            
            renderer.drawRect(x, itemY, w, itemH, 'rgba(0, 0, 0, 0.5)', 6)
            renderer.drawText(item.name, x + 8, itemY + 20, '#ffffff', 13, 'left')
            renderer.drawText(`现价: ${priceData.current}`, x + 8, itemY + 40, '#f39c12', 12, 'left')
            renderer.drawText(changeText, x + w - 8, itemY + 20, changeColor, 11, 'right')
            
            ui.addButton(x, itemY, w, itemH, '', () => {
                this.showBuyModal(item, priceData)
            }, { bgColor: 'transparent' })
        })
    }
    
    renderWarehouseSection(renderer, x, y, w, h) {
        renderer.drawRect(x, y, w, h, 'rgba(0, 0, 0, 0.6)', 8)
        
        const state = this.game.gameState.data
        const warehouse = state.warehouse
        let used = 0
        Object.keys(warehouse).forEach(id => { 
            if (warehouse[id] && warehouse[id].quantity > 0) used++ 
        })
        
        renderer.drawText('仓库', x + 10, y + 18, '#f39c12', 13, 'left')
        renderer.drawText(`${used}/${state.warehouseCapacity}`, x + w - 10, y + 18, '#7f8c8d', 11, 'right')
        
        const listY = y + 35
        const listH = h - 40
        
        this.renderWarehouseItems(renderer, x + 5, listY, w - 10, listH)
    }
    
    renderWarehouseItems(renderer, x, y, w, h) {
        const state = this.game.gameState.data
        const warehouse = state.warehouse
        const ui = this.game.uiManager
        
        const items = Object.keys(warehouse).filter(id => warehouse[id] && warehouse[id].quantity > 0)
        
        if (items.length === 0) {
            renderer.drawText('仓库空空如也', x + w / 2, y + 40, '#7f8c8d', 12, 'center')
            renderer.drawText('去市场进货吧!', x + w / 2, y + 60, '#7f8c8d', 10, 'center')
            return
        }
        
        const itemH = 50
        const gap = 5
        
        items.forEach((itemId, i) => {
            const itemY = y + i * (itemH + gap)
            if (itemY + itemH > y + h) return
            
            const item = ItemData.find(it => it.id === parseInt(itemId))
            const quantity = warehouse[itemId].quantity
            const avgPrice = this.game.gameState.getWarehouseAvgPrice(parseInt(itemId))
            const priceData = this.itemPrices[itemId]
            
            renderer.drawRect(x, itemY, w, itemH, 'rgba(0, 0, 0, 0.5)', 6)
            renderer.drawText(item.name, x + 8, itemY + 15, '#ffffff', 12, 'left')
            renderer.drawText(`x${quantity}`, x + w - 8, itemY + 15, '#f39c12', 11, 'right')
            renderer.drawText(`购入: ${avgPrice}`, x + 8, itemY + 35, '#3498db', 10, 'left')
            renderer.drawText(`现价: ${priceData.current}`, x + w - 8, itemY + 35, '#27ae60', 10, 'right')
            
            ui.addButton(x, itemY, w, itemH, '', () => {
                this.showSellModal(item, priceData, quantity)
            }, { bgColor: 'transparent' })
        })
    }
    
    renderTabBar(renderer) {
        const w = renderer.width
        const h = 50
        const y = renderer.height - h
        
        renderer.drawRect(0, y, w, h, '#1a1a2e')
        renderer.drawRect(0, y, w, 1, 'rgba(255,255,255,0.1)')
        
        const tabW = w / 2
        renderer.drawText('出租屋', tabW / 2, y + h / 2, '#7f8c8d', 13, 'center')
        renderer.drawText('市场', tabW + tabW / 2, y + h / 2, '#f39c12', 13, 'center')
        
        const ui = this.game.uiManager
        ui.addButton(0, y, tabW, h, '', () => this.game.sceneManager.switchTo('home'), { bgColor: 'transparent' })
        ui.addButton(tabW, y, tabW, h, '', () => {}, { bgColor: 'transparent' })
    }
    
    showBuyModal(item, priceData) {
        const state = this.game.gameState.data
        
        if (state.energy < 2) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '需要2点精力才能交易',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        let usedSlots = 0
        Object.keys(state.warehouse).forEach(id => {
            if (state.warehouse[id] && state.warehouse[id].quantity > 0) usedSlots++
        })
        
        const maxBuy = Math.min(
            Math.floor(state.money / priceData.current),
            state.warehouseCapacity - usedSlots + (state.warehouse[item.id] ? 1 : 0)
        )
        
        this.game.uiManager.addModal({
            type: 'trade',
            title: '购买商品',
            content: '消耗2精力',
            itemName: item.name,
            price: priceData.current,
            quantity: 1,
            maxQuantity: Math.max(1, maxBuy),
            total: priceData.current,
            tradeType: 'buy',
            onConfirm: (qty, total) => {
                if (state.money >= total && state.energy >= 2) {
                    state.money -= total
                    state.energy -= 2
                    
                    this.game.gameState.addToWarehouse(item.id, qty, total)
                }
            }
        })
    }
    
    showSellModal(item, priceData, quantity) {
        const state = this.game.gameState.data
        
        this.game.uiManager.addModal({
            type: 'trade',
            title: '出售商品',
            content: '',
            itemName: item.name,
            price: priceData.current,
            quantity: 1,
            maxQuantity: quantity,
            total: priceData.current,
            tradeType: 'sell',
            onConfirm: (qty, total) => {
                if (this.game.gameState.getWarehouseQuantity(item.id) >= qty) {
                    state.money += total
                    this.game.gameState.removeFromWarehouse(item.id, qty)
                }
            }
        })
    }
}
