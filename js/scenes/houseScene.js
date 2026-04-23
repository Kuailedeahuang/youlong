import { getAllHouses, checkPurchaseEligibility } from '../data/houses.js'
import animationManager from '../utils/animationManager.js'
import { CLOUD_ENV_ID } from '../config.js'

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
        
        // 存储加载的房屋图片
        this.houseImages = {}
        this.imagesLoaded = false
        
        this.initTouchEvents()
    }
    
    // 从云存储加载房屋图片（使用与其他场景相同的方式：云函数 getTempFileURL）
    async loadHouseImages() {
        try {
            if (!wx.cloud) {
                console.warn('云开发未初始化，无法加载房屋图片')
                return
            }
            
            console.log('开始加载房屋图片...')
            
            for (const house of this.houses) {
                if (house.imageName) {
                    const filePath = `sellhouse/${house.imageName}.png`
                    const fileID = `cloud://${CLOUD_ENV_ID}/${filePath}`
                    
                    console.log(`尝试加载图片: ${house.name}, fileID: ${fileID}`)
                    
                    try {
                        // 通过云函数获取临时链接（与其他场景相同）
                        const res = await wx.cloud.callFunction({
                            name: 'getTempFileURL',
                            data: {
                                fileList: [fileID]
                            }
                        })
                        
                        console.log(`云函数返回:`, res)
                        
                        if (!res.result || !res.result.fileList || !res.result.fileList[0] || !res.result.fileList[0].tempFileURL) {
                            console.warn(`云函数获取临时链接失败: ${house.name}`, res)
                            continue
                        }
                        
                        const tempURL = res.result.fileList[0].tempFileURL
                        console.log(`获取临时链接成功: ${tempURL}`)
                        
                        // 使用 wx.createImage 加载图片（与其他场景相同）
                        const img = wx.createImage()
                        img.onload = () => {
                            this.houseImages[house.id] = img
                            console.log(`加载房屋图片成功: ${house.name}, size: ${img.width}x${img.height}`)
                            // 图片加载完成后触发重新渲染
                            if (this.game && this.game.render) {
                                this.game.render()
                            }
                        }
                        img.onerror = (err) => {
                            console.warn(`加载房屋图片失败: ${house.name}`, err)
                        }
                        img.src = tempURL
                    } catch (e) {
                        console.warn(`处理图片失败: ${house.name}`, e)
                    }
                }
            }
            
            console.log('房屋图片加载完成，已加载:', Object.keys(this.houseImages))
        } catch (e) {
            console.warn('加载房屋图片失败:', e)
        }
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
    
    async onEnter() {
        this.selectedHouse = null
        this.scrollY = 0
        
        // 进入场景时加载图片（确保云开发已初始化）
        if (!this.imagesLoaded) {
            await this.loadHouseImages()
            this.imagesLoaded = true
        }
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
            const imgX = x + 5
            const imgY = y + 5
            const imgW = cardW - 10
            
            // 绘制图片背景
            renderer.drawRect(imgX, imgY, imgW, imgH, imgBgColor, 4)
            
            // 绘制房屋图片（如果已加载）
            const houseImg = this.houseImages[house.id]
            if (houseImg && houseImg.width > 0) {
                try {
                    ctx.save()
                    ctx.beginPath()
                    ctx.rect(imgX, imgY, imgW, imgH)
                    ctx.clip()
                    
                    // 计算图片绘制尺寸（保持比例填充）
                    const imgRatio = houseImg.width / houseImg.height
                    const drawRatio = imgW / imgH
                    
                    let drawW, drawH, drawX, drawY
                    if (imgRatio > drawRatio) {
                        drawH = imgH
                        drawW = drawH * imgRatio
                        drawX = imgX - (drawW - imgW) / 2
                        drawY = imgY
                    } else {
                        drawW = imgW
                        drawH = drawW / imgRatio
                        drawX = imgX
                        drawY = imgY - (drawH - imgH) / 2
                    }
                    
                    // 使用与其他场景相同的绘制方式
                    ctx.drawImage(houseImg, drawX, drawY, drawW, drawH)
                    ctx.restore()
                } catch (e) {
                    console.warn('绘制房屋图片失败:', e)
                }
            }
            
            // 如果未解锁，添加灰色遮罩
            if (!isUnlocked) {
                renderer.drawRect(imgX, imgY, imgW, imgH, 'rgba(0, 0, 0, 0.4)', 4)
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
        
        // 保存游戏状态和用户解锁的房屋（用户独立的永久数据）
        this.game.gameState.save()
        this.game.gameState.saveUserUnlockedHouses()
        
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
            cancelText: '退出游戏',
            singleButton: false,
            onConfirm: () => {
                this.restartGameWithUnlockedHouses()
            },
            onCancel: () => {
                // 退出游戏
                wx.exitMiniProgram({
                    success: () => {
                        console.log('退出游戏成功')
                    },
                    fail: (err) => {
                        console.error('退出游戏失败:', err)
                        wx.showModal({
                            title: '退出失败',
                            content: '请手动关闭小程序',
                            showCancel: false
                        })
                    }
                })
            }
        })
    }
    
    async restartGameWithUnlockedHouses() {
        // 从云数据库获取用户的解锁房屋列表（永久保留）
        let unlockedHouses = []
        
        try {
            if (wx.cloud) {
                const db = wx.cloud.database({ env: CLOUD_ENV_ID })
                const res = await db.collection('user_unlocked_houses').where({
                    _openid: '{openid}'
                }).limit(1).get()
                
                if (res.data && res.data.length > 0) {
                    unlockedHouses = res.data[0].unlockedHouses || []
                    console.log('从云数据库获取解锁房屋:', unlockedHouses)
                }
            }
        } catch (e) {
            console.warn('从云数据库获取解锁房屋失败:', e)
            // 回退到当前数据
            unlockedHouses = this.game.gameState.data.unlockedHouses || []
        }
        
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
        
        // 先保存解锁房屋到云端，确保不会丢失
        await this.game.gameState.saveUserUnlockedHouses()
        
        // 再保存游戏状态
        await this.game.gameState.save()
        
        // 重新从云端加载解锁房屋，确保数据一致
        await this.game.gameState.loadUserUnlockedHouses()
        
        // 切换到首页场景
        this.game.sceneManager.switchTo('home')
        
        wx.showToast({
            title: '重新开始游戏',
            icon: 'success'
        })
    }
}

export default HouseScene