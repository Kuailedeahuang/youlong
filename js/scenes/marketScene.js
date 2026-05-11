import ItemData, { categories } from '../data/items.js'
import imageManager from '../utils/imageManager.js'
import animationManager from '../utils/animationManager.js'
import { GAME_CONFIG } from '../data/gameConfig.js'

export default class MarketScene {
    constructor(game) {
        this.game = game
        this.selectedCategory = null
        this.itemPrices = {}
        this.bgImage = null
        this.imageLoaded = false
        this.newspaperBgImage = null
        this.newspaperBgLoaded = false
        this.useCloudBgImage = false
        this.useCloudNewspaperImage = false
        this.clickableAreas = []
        this._pressedArea = null
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
            const priceData = this.game.gameState.data.itemPrices[item.id]
            if (priceData) {
                this.itemPrices[item.id] = priceData
            } else {
                const fluctuation = item.naturalFluctuation.min + Math.random() * (item.naturalFluctuation.max - item.naturalFluctuation.min)
                this.itemPrices[item.id] = {
                    current: Math.round(item.basePrice * (1 + fluctuation)),
                    change: Math.round(fluctuation * 100)
                }
            }
        })
    }
    
    getAlwaysShowNewspaperSetting() {
        try {
            const saved = wx.getStorageSync('game_settings')
            if (saved) {
                const settings = JSON.parse(saved)
                return settings.alwaysShowNewspaper || false
            }
        } catch (e) {
            console.warn('[MarketScene] 读取报纸设置失败:', e)
        }
        return false
    }
    
    onEnter() {
        this.initPrices()
        this.selectedCategory = null
        
        const state = this.game.gameState.data
        const alwaysShow = this.getAlwaysShowNewspaperSetting()
        
        if (alwaysShow || !state.newspaperShown) {
            const newspaperData = state.todayNewspaper || []
            
            if (newspaperData.length > 0) {
                const newspaperContent = newspaperData.map(news => `【${news.title}】\n${news.content}`).join('\n\n')
                
                setTimeout(() => {
                    const rawLines = newspaperContent.split('\n')
                    const estimatedCharsPerLine = 16
                    let totalWrappedLines = 0
                    let emptyCount = 0
                    let headingCount = 0
                    rawLines.forEach(line => {
                        if (line === '') {
                            emptyCount++
                        } else {
                            const wrapped = Math.max(1, Math.ceil(line.length / estimatedCharsPerLine))
                            totalWrappedLines += wrapped
                            if (/^【.+】$/.test(line)) {
                                headingCount++
                            }
                        }
                    })
                    const contentHeight = 70 + totalWrappedLines * 22 + emptyCount * 14 + headingCount * 6 + 55
                    const modalHeight = Math.max(360, Math.min(700, contentHeight))
                    this.game.uiManager.addModal({
                        type: 'confirm',
                        title: `第${state.day}天 市场报纸`,
                        content: newspaperContent,
                        confirmText: '知道了',
                        singleButton: true,
                        backgroundImage: this.newspaperBgImage,
                        backgroundImageLoaded: this.newspaperBgLoaded,
                        height: modalHeight,
                        isNewspaper: true,
                        onConfirm: () => {
                            if (!alwaysShow) {
                                this.game.gameState.set('newspaperShown', true)
                            }
                        }
                    })
                }, 100)
            } else {
                if (!alwaysShow) {
                    this.game.gameState.set('newspaperShown', true)
                }
            }
        }
    }
    
    update(deltaTime) {
        
    }

    handleTouchStart(x, y) {
        for (const area of this.clickableAreas) {
            if (x >= area.x && x <= area.x + area.w &&
                y >= area.y && y <= area.y + area.h) {
                this._pressedArea = area
                return true
            }
        }
        return false
    }

    handleTouchEnd(x, y) {
        const area = this._pressedArea
        this._pressedArea = null
        if (!area) return false
        if (x >= area.x && x <= area.x + area.w &&
            y >= area.y && y <= area.y + area.h) {
            if (area.action) area.action()
            return true
        }
        return false
    }

    render(renderer) {
        const w = renderer.width
        const h = renderer.height
        const state = this.game.gameState.data
        
        this.game.uiManager.clear()
        this.clickableAreas = []

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
        
        renderer.renderStatsPanel(this.game, this.game.gameState.data)
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
            this.clickableAreas.push({ x: backX, y: y + 5, w: 40, h: 25, action: () => { this.selectedCategory = null } })
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
            this.clickableAreas.push({ x, y: itemY, w, h: itemH, action: () => { this.selectedCategory = cat.id } })
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
            const changeValue = priceData.totalChange !== undefined ? priceData.totalChange : priceData.change
            const changeColor = changeValue >= 0 ? '#27ae60' : '#e74c3c'
            const changeText = changeValue >= 0 ? `+${changeValue}%` : `${changeValue}%`
            
            renderer.drawRect(x, itemY, w, itemH, 'rgba(0, 0, 0, 0.5)', 6)
            renderer.drawText(item.name, x + 8, itemY + 20, '#ffffff', 13, 'left')
            renderer.drawText(`现价: ${priceData.current}`, x + 8, itemY + 40, '#f39c12', 12, 'left')
            renderer.drawText(changeText, x + w - 8, itemY + 20, changeColor, 11, 'right')
            
            const newsEffect = priceData.newsFluctuation || 0
            if (newsEffect !== 0) {
                const newsColor = newsEffect > 0 ? '#e74c3c' : '#3498db'
                const newsText = newsEffect > 0 ? `报+${newsEffect}%` : `报${newsEffect}%`
                renderer.drawText(newsText, x + w - 8, itemY + 38, newsColor, 9, 'right')
            }
            
            ui.addButton(x, itemY, w, itemH, '', () => {
                this.showBuyModal(item, priceData)
            }, { bgColor: 'transparent' })
            this.clickableAreas.push({ x, y: itemY, w, h: itemH, action: () => { this.showBuyModal(item, priceData) } })
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
            this.clickableAreas.push({ x: x + w / 2 - 40, y: y + 5, w: 80, h: 20, action: () => { this.upgradeWarehouse() } })
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
            this.clickableAreas.push({ x, y: itemY, w, h: itemH, action: () => { this.showSellModal(item, priceData, quantity) } })
        })
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