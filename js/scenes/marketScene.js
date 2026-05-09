import ItemData, { categories } from '../data/items.js'
import imageManager from '../utils/imageManager.js'
import animationManager from '../utils/animationManager.js'
import { GAME_CONFIG } from '../data/gameConfig.js'
import iconManager from '../components/IconManager.js'

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
        this.newspaperBgImage = null
        this.newspaperBgLoaded = false
        this.useCloudBgImage = false
        this.useCloudNewspaperImage = false
        this.loadBackground()
        this.loadNewspaperBackground()
        this.initPrices()
    }
    
    async loadBackground() {
        try {
            const cloudImage = await imageManager.loadImageFromCloud('ShiChang.png')
            if (cloudImage && cloudImage.image) {
                this.bgImage = cloudImage.image
                this.imageLoaded = true
                this.useCloudBgImage = true
                console.log('使用云存储背景图: ShiChang.png')
                return
            }
        } catch (e) {
            console.warn('从云端加载背景图失败，使用本地图片:', e)
        }
        
        this.bgImage = wx.createImage()
        this.bgImage.onload = () => {
            this.imageLoaded = true
        }
        this.bgImage.src = 'tupian/shichang.png'
    }
    
    async loadNewspaperBackground() {
        try {
            const cloudImage = await imageManager.loadImageFromCloud('BaoZhi.png')
            if (cloudImage && cloudImage.image) {
                this.newspaperBgImage = cloudImage.image
                this.newspaperBgLoaded = true
                this.useCloudNewspaperImage = true
                console.log('使用云存储报纸背景图: BaoZhi.png')
                return
            }
        } catch (e) {
            console.warn('从云端加载报纸背景图失败，使用本地图片:', e)
        }
        
        this.newspaperBgImage = wx.createImage()
        this.newspaperBgImage.onload = () => {
            this.newspaperBgLoaded = true
        }
        this.newspaperBgImage.src = 'tupian/baozhi.png'
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
            setTimeout(() => {
                this.game.uiManager.addModal({
                    type: 'confirm',
                    title: `第${state.day}天 ${paper.title}`,
                    content: paper.content,
                    confirmText: '知道了',
                    singleButton: true,
                    backgroundImage: this.newspaperBgImage,
                    backgroundImageLoaded: this.newspaperBgLoaded,
                    height: 320,
                    isNewspaper: true,
                    onConfirm: () => {
                        this.game.gameState.set('newspaperShown', true)
                    }
                })
            }, 100)
        }
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
                renderer.clear('#16213e')
            }
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
        
        this.renderStats(renderer)
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
        let totalQuantity = 0
        Object.keys(warehouse).forEach(id => { 
            if (warehouse[id] && warehouse[id].quantity > 0) {
                totalQuantity += warehouse[id].quantity
            }
        })
        
        renderer.drawText('仓库', x + 10, y + 18, '#f39c12', 13, 'left')
        renderer.drawText(`${totalQuantity}/${state.warehouseCapacity}`, x + w - 10, y + 18, '#7f8c8d', 11, 'right')
        
        const nextUpgrade = GAME_CONFIG.warehouse.upgradeLevels[state.warehouseLevel]
        if (nextUpgrade) {
            renderer.drawText(`升级(${nextUpgrade.cost}金币)`, x + w / 2, y + 18, '#3498db', 10, 'center')
            const ui = this.game.uiManager
            ui.addButton(x + w / 2 - 40, y + 5, 80, 20, '', () => {
                this.upgradeWarehouse()
            }, { bgColor: 'transparent' })
        }
        
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
    
    renderStats(renderer) {
        const state = this.game.gameState.data
        const w = renderer.width
        const h = renderer.height
        const padding = 12
        const panelH = 100
        const panelY = h - panelH - padding
        const centerBtnSize = 56
        const ctx = renderer.ctx

        renderer.drawRect(padding, panelY, w - padding * 2, panelH, '#E0F0FF', 16)

        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        this.roundRectPath(ctx, padding, panelY, w - padding * 2, panelH, 16)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(padding + 25, panelY + 3)
        ctx.lineTo(w - padding - 25, panelY + 3)
        ctx.strokeStyle = 'rgba(135, 160, 180, 0.3)'
        ctx.lineWidth = 2
        ctx.stroke()

        const centerX = w / 2
        const leftSectionX = padding + 35
        const rightSectionX = w - padding - 35
        const topRowY = panelY + 30
        const bottomRowY = panelY + panelH - 30

        this.renderStatItem(renderer, leftSectionX, topRowY, 'health', state.health, 100, '#7CB87C')
        this.renderStatItem(renderer, rightSectionX, topRowY, 'energy', state.energy, state.maxEnergy, '#7BA3C9', true)
        this.renderStatItem(renderer, leftSectionX, bottomRowY, 'mood', state.mood, 100, '#D49BA3')
        this.renderStatItem(renderer, rightSectionX, bottomRowY, 'reputation', state.reputation, 100, '#B8A3C9', true)

        this.renderCenterButton(renderer, centerX, panelY + panelH / 2, centerBtnSize)
    }

    renderStatItem(renderer, x, y, statType, value, max, color, isRight = false) {
        const progress = value / max
        let valueColor = color
        if (progress < 0.3) valueColor = '#C17B6B'
        else if (progress < 0.5) valueColor = '#D4A574'

        const ctx = renderer.ctx
        const labelColor = '#5A6B7A'

        const labelMap = {
            health: '健康',
            energy: '精力',
            mood: '心情',
            reputation: '名誉'
        }
        const label = labelMap[statType] || statType

        if (isRight) {
            iconManager.draw(ctx, statType, x - 75, y, { size: 22 })
            renderer.drawText(label, x - 45, y - 6, labelColor, 12, 'left')
            renderer.drawText(`${value}/${max}`, x - 45, y + 10, valueColor, 13, 'left')
        } else {
            iconManager.draw(ctx, statType, x + 12, y, { size: 22 })
            renderer.drawText(label, x + 38, y - 1, labelColor, 12, 'left')
            renderer.drawText(`${value}/${max}`, x + 38, y + 14, valueColor, 13, 'left')
        }
    }

    renderCenterButton(renderer, x, y, size) {
        const ctx = renderer.ctx
        const radius = size / 2

        ctx.beginPath()
        ctx.arc(x, y + 3, radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(139, 115, 85, 0.15)'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = '#FFE080'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(x, y, radius - 5, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(212, 165, 116, 0.4)'
        ctx.lineWidth = 1
        ctx.stroke()

        iconManager.draw(ctx, 'map', x, y, { size: 32 })

        const ui = this.game.uiManager
        ui.addButton(x - radius, y - radius, size, size, '', () => {
            this.game.sceneManager.switchTo('map')
        }, { bgColor: 'transparent' })
    }

    roundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.arcTo(x + w, y, x + w, y + r, r)
        ctx.lineTo(x + w, y + h - r)
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
        ctx.lineTo(x + r, y + h)
        ctx.arcTo(x, y + h, x, y + h - r, r)
        ctx.lineTo(x, y + r)
        ctx.arcTo(x, y, x + r, y, r)
        ctx.closePath()
    }
    
    showBuyModal(item, priceData) {
        const state = this.game.gameState.data
        
        let totalQuantity = 0
        Object.keys(state.warehouse).forEach(id => {
            if (state.warehouse[id] && state.warehouse[id].quantity > 0) {
                totalQuantity += state.warehouse[id].quantity
            }
        })
        
        const remainingCapacity = state.warehouseCapacity - totalQuantity
        
        if (remainingCapacity <= 0) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '仓库已满',
                content: '仓库容量不足，请先出售商品或升级仓库',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }
        
        const maxBuy = Math.min(
            Math.floor(state.money / priceData.current),
            remainingCapacity
        )
        
        this.game.uiManager.addModal({
            type: 'trade',
            title: '购买商品',
            content: `仓库剩余容量: ${remainingCapacity}`,
            itemName: item.name,
            price: priceData.current,
            quantity: 1,
            maxQuantity: Math.max(1, maxBuy),
            total: priceData.current,
            tradeType: 'buy',
            onConfirm: (qty, total) => {
                let currentTotal = 0
                Object.keys(state.warehouse).forEach(id => {
                    if (state.warehouse[id] && state.warehouse[id].quantity > 0) {
                        currentTotal += state.warehouse[id].quantity
                    }
                })
                
                if (currentTotal + qty > state.warehouseCapacity) {
                    this.game.uiManager.addModal({
                        type: 'confirm',
                        title: '仓库已满',
                        content: '仓库容量不足，无法购买',
                        confirmText: '知道了',
                        singleButton: true,
                        onConfirm: () => {}
                    })
                    return
                }
                
                if (state.money >= total) {
                    state.money -= total
                    
                    this.game.gameState.addToWarehouse(item.id, qty, total)
                    
                    this.game.gameState.addDelayedAnimation('decrease', total, 'money', '金币', '#f39c12')
                }
            }
        })
    }
    
    showSellModal(item, priceData, quantity) {
        const state = this.game.gameState.data
        const avgPrice = this.game.gameState.getWarehouseAvgPrice(item.id)
        const profitPerItem = priceData.current - avgPrice
        
        this.game.uiManager.addModal({
            type: 'trade',
            title: '出售商品',
            content: avgPrice > 0 ? `购入均价: ${avgPrice}金币\n${profitPerItem >= 0 ? '预计盈利' : '预计亏损'}: ${Math.abs(profitPerItem)}金币/件` : '',
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
                    
                    // 市场投机影响名誉
                    if (avgPrice > 0) {
                        const profit = priceData.current - avgPrice
                        if (profit > 0) {
                            // 盈利增加名誉
                            const reputationGain = Math.min(5, Math.floor(profit / 10))
                            if (reputationGain > 0) {
                                state.reputation = Math.min(100, state.reputation + reputationGain)
                                this.game.gameState.addEvent(`市场投机成功，名誉+${reputationGain}`)
                                this.game.gameState.addDelayedAnimation('increase', reputationGain, 'reputation', '名誉', '#9b59b6')
                            }
                        } else if (profit < 0) {
                            // 亏损减少名誉
                            const reputationLoss = Math.min(5, Math.floor(Math.abs(profit) / 10))
                            if (reputationLoss > 0) {
                                state.reputation = Math.max(-100, state.reputation - reputationLoss)
                                this.game.gameState.addEvent(`市场投机失败，名誉-${reputationLoss}`)
                                this.game.gameState.addDelayedAnimation('decrease', reputationLoss, 'reputation', '名誉', '#9b59b6')
                            }
                        }
                    }
                    
                    this.game.gameState.addDelayedAnimation('increase', total, 'money', '金币', '#f39c12')
                }
            }
        })
    }
    
    upgradeWarehouse() {
        const state = this.game.gameState.data
        const currentLevel = state.warehouseLevel
        const nextLevel = GAME_CONFIG.warehouse.upgradeLevels[currentLevel]
        
        if (!nextLevel) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '仓库已满级',
                content: '仓库已达到最高等级',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }
        
        if (state.money < nextLevel.cost) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '金币不足',
                content: `需要${nextLevel.cost}金币才能升级仓库`,
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '升级仓库',
            content: `花费${nextLevel.cost}金币\n仓库容量: ${state.warehouseCapacity} → ${nextLevel.capacity}`,
            confirmText: '升级',
            onConfirm: () => {
                state.money -= nextLevel.cost
                state.warehouseCapacity = nextLevel.capacity
                state.warehouseLevel = currentLevel + 1
                this.game.gameState.save()
                
                this.game.gameState.addDelayedAnimation('decrease', nextLevel.cost, 'money', '金币', '#f39c12')
                this.game.gameState.addEvent(`仓库升级成功，容量提升至${nextLevel.capacity}`)
            },
            onCancel: () => {}
        })
    }
}