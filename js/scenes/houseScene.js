import { getAllHouses, checkPurchaseEligibility } from '../data/houses.js'
import animationManager from '../utils/animationManager.js'
import imageManager from '../utils/imageManager.js'
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
        
        // 结局动画状态
        this.isEndingPlaying = false
        this.endingHouse = null
        this.endingScrollY = 0
        this.endingStartTime = 0
        this.endingPhase = ''
        this.endingLines = []
        this.endingTextHeight = 0
        
        this.initTouchEvents()
    }
    
    // 从云存储加载房屋图片（使用 imageManager，与其他场景保持一致）
    async loadHouseImages() {
        try {
            console.log('开始加载房屋图片...')
            
            for (const house of this.houses) {
                if (house.imageName) {
                    const imageName = `${house.imageName}.png`
                    
                    try {
                        // 使用 imageManager 加载图片（与其他场景相同）
                        const cloudImage = await imageManager.loadImageFromCloud(imageName)
                        
                        if (cloudImage && cloudImage.image) {
                            this.houseImages[house.id] = cloudImage.image
                            console.log(`加载房屋图片成功: ${house.name}`)
                        } else {
                            console.warn(`加载房屋图片失败: ${house.name}, 未找到图片`)
                        }
                    } catch (e) {
                        console.warn(`处理图片失败: ${house.name}`, e)
                    }
                }
            }
            
            console.log('房屋图片加载完成，已加载:', Object.keys(this.houseImages).length, '张')
        } catch (e) {
            console.warn('加载房屋图片失败:', e)
        }
    }
    
    initTouchEvents() {
        this.touchStartX = 0
        this.touchStartY = 0
        this.touchStartTime = 0
        this.isDragging = false
        this.hasMoved = false
        this.touchHandlers = null
        
        // 保存事件处理函数的引用，以便后续移除
        this.touchHandlers = {
            onTouchStart: (e) => {
                // 检查当前场景是否是 house
                if (this.game.sceneManager.currentScene !== 'house') return
                if (this.selectedHouse) return
                
                const touch = e.touches[0]
                this.touchStartX = touch.clientX
                this.touchStartY = touch.clientY
                this.touchStartTime = Date.now()
                this.isDragging = true
                this.hasMoved = false
                this.lastTouchY = touch.clientY
            },
            
            onTouchMove: (e) => {
                if (this.game.sceneManager.currentScene !== 'house') return
                if (!this.isDragging || this.selectedHouse) return
                
                const touch = e.touches[0]
                const deltaY = touch.clientY - this.lastTouchY
                const deltaX = touch.clientX - this.touchStartX
                const totalDeltaY = touch.clientY - this.touchStartY
                
                if (Math.abs(totalDeltaY) > 5 || Math.abs(deltaX) > 5) {
                    this.hasMoved = true
                }
                
                this.lastTouchY = touch.clientY
                this.scrollY += deltaY
                this.scrollY = Math.max(-this.maxScrollY, Math.min(0, this.scrollY))
            },
            
            onTouchEnd: (e) => {
                if (this.game.sceneManager.currentScene !== 'house') return
                if (!this.isDragging) return
                
                const touch = e.changedTouches[0]
                const deltaX = touch.clientX - this.touchStartX
                const deltaY = touch.clientY - this.touchStartY
                const duration = Date.now() - this.touchStartTime
                
                const isClick = !this.hasMoved && 
                               Math.abs(deltaX) < 10 && 
                               Math.abs(deltaY) < 10 && 
                               duration < 300
                
                if (isClick) {
                    // 先检查结局按钮
                    if (this.isEndingPlaying) {
                        this.handleEndingTouch(touch.clientX, touch.clientY)
                    } else if (!this.selectedHouse) {
                        this.handleCardClick(touch.clientX, touch.clientY)
                    }
                }
                
                this.isDragging = false
                this.hasMoved = false
            },
            
            onTouchCancel: () => {
                if (this.game.sceneManager.currentScene !== 'house') return
                this.isDragging = false
                this.hasMoved = false
            }
        }
        
        wx.onTouchStart(this.touchHandlers.onTouchStart)
        wx.onTouchMove(this.touchHandlers.onTouchMove)
        wx.onTouchEnd(this.touchHandlers.onTouchEnd)
        wx.onTouchCancel(this.touchHandlers.onTouchCancel)
    }
    
    // 处理卡片点击
    handleCardClick(x, y) {
        const w = this.game.renderer.width
        const cardW = (w - 30) / 2
        const cardH = this.cardHeight
        const startX = 10
        const startY = this.listStartY + this.scrollY
        
        // 检查是否点击在列表区域内
        if (y < this.listStartY || y > this.game.renderer.height - 20) {
            return
        }
        
        // 计算点击的是哪个卡片
        const relativeY = y - startY
        const row = Math.floor(relativeY / (cardH + this.cardPadding))
        const col = x < w / 2 ? 0 : 1
        const index = row * 2 + col
        
        if (index >= 0 && index < this.houses.length) {
            const house = this.houses[index]
            console.log(`点击房屋卡片: ${house.name}`)
            this.selectedHouse = house
            // 触发重新渲染
            if (this.game && this.game.render) {
                this.game.render()
            }
        }
    }
    
    async onEnter() {
        console.log('========== HouseScene onEnter 开始 ==========')
        this.selectedHouse = null
        this.scrollY = 0
        
        // 从 splashScene 获取预加载的房屋图片
        const splashScene = this.game.sceneManager.scenes.splash
        if (splashScene && splashScene.houseImages) {
            this.houseImages = splashScene.houseImages
            console.log('从 splashScene 获取预加载图片:', Object.keys(this.houseImages).length, '张')
        }
        
        console.log('========== HouseScene onEnter 结束 ==========')
    }
    
    onExit() {
        this.selectedHouse = null
    }
    
    update(deltaTime) {
        
    }
    
    // 绘制多行文本，自动换行
    drawMultiLineText(renderer, text, x, y, maxWidth, lineHeight, color, fontSize, align = 'left') {
        const ctx = renderer.ctx
        ctx.fillStyle = color
        ctx.font = `${fontSize}px sans-serif`
        ctx.textAlign = align
        ctx.textBaseline = 'top'
        
        const words = text.split('')
        let line = ''
        let currentY = y
        
        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i]
            const metrics = ctx.measureText(testLine)
            const testWidth = metrics.width
            
            if (testWidth > maxWidth && i > 0) {
                // 绘制当前行
                let drawX = x
                if (align === 'center') {
                    drawX = x + maxWidth / 2
                }
                ctx.fillText(line, drawX, currentY)
                line = words[i]
                currentY += lineHeight
            } else {
                line = testLine
            }
        }
        
        // 绘制最后一行
        let drawX = x
        if (align === 'center') {
            drawX = x + maxWidth / 2
        }
        ctx.fillText(line, drawX, currentY)
        
        return currentY + lineHeight - y // 返回总高度
    }
    
    render(renderer) {
        const w = renderer.width
        const h = renderer.height
        const state = this.game.gameState.data
        
        this.game.uiManager.clear()
        
        // 如果正在播放结局动画
        if (this.isEndingPlaying) {
            this.renderEnding(renderer)
            return
        }
        
        renderer.clear('#f5f0e1')
        
        this.renderTopBar(renderer, state)
        
        renderer.drawText('售楼部', w / 2, 50, '#8b6914', 18, 'center')
        
        if (!this.selectedHouse) {
            this.renderHouseList(renderer, state, w, h)
        }
        
        if (this.selectedHouse) {
            this.renderHouseDetail(renderer, state)
        }
    }
    
    renderTopBar(renderer, state) {
        const w = renderer.width
        
        renderer.drawRect(0, 0, w, 40, '#e8dcc8')
        
        const ctx = renderer.ctx
        ctx.strokeStyle = '#8b6914'
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
        
        renderer.drawText(`精力: ${state.energy}/${state.maxEnergy}`, w - 15, 25, '#8b6914', 12, 'right')
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
            // 未点亮：黑白灰色调；点亮：彩色+金色边框
            const cardBgColor = isUnlocked ? '#ffffff' : '#d0d0d0'
            const imgBgColor = isUnlocked ? '#e8e8e8' : '#b0b0b0'
            const nameColor = isUnlocked ? '#8b6914' : '#666666'
            const priceColor = isUnlocked ? '#2e7d32' : '#888888'
            const descColor = isUnlocked ? '#444444' : '#999999'
            const borderColor = isUnlocked ? '#d4a017' : '#999999'
            const borderWidth = isUnlocked ? 2.5 : 1.5
            
            // 绘制卡片边框
            ctx.save()
            ctx.strokeStyle = borderColor
            ctx.lineWidth = borderWidth
            ctx.beginPath()
            const borderRadius = 8
            ctx.moveTo(x + borderRadius, y)
            ctx.lineTo(x + cardW - borderRadius, y)
            ctx.arcTo(x + cardW, y, x + cardW, y + borderRadius, borderRadius)
            ctx.lineTo(x + cardW, y + this.cardHeight - borderRadius)
            ctx.arcTo(x + cardW, y + this.cardHeight, x + cardW - borderRadius, y + this.cardHeight, borderRadius)
            ctx.lineTo(x + borderRadius, y + this.cardHeight)
            ctx.arcTo(x, y + this.cardHeight, x, y + this.cardHeight - borderRadius, borderRadius)
            ctx.lineTo(x, y + borderRadius)
            ctx.arcTo(x, y, x + borderRadius, y, borderRadius)
            ctx.closePath()
            ctx.stroke()
            ctx.restore()
            
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
                    
                    // 未点亮时使用灰度滤镜
                    if (!isUnlocked) {
                        ctx.filter = 'grayscale(100%)'
                    }
                    
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
                    
                    ctx.drawImage(houseImg, drawX, drawY, drawW, drawH)
                    ctx.filter = 'none'
                    ctx.restore()
                } catch (e) {
                    console.warn('绘制房屋图片失败:', e)
                }
            }
            
            // 绘制房屋名称
            renderer.drawText(house.name, x + cardW / 2, y + imgH + 20, nameColor, 13, 'center')
            
            // 绘制价格
            renderer.drawText(`${house.price}金币`, x + cardW / 2, y + imgH + 38, priceColor, 11, 'center')
            
            // 绘制简介（多行文本，自动换行）
            const descX = x + 8
            const descY = y + imgH + 50
            const descMaxWidth = cardW - 16
            this.drawMultiLineText(renderer, house.description, descX, descY, descMaxWidth, 12, descColor, 9, 'left')
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
        
        renderer.drawRect(scrollBarX, this.listStartY, scrollBarWidth, visibleHeight, 'rgba(139, 105, 20, 0.15)', 2)
        
        renderer.drawRect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight, 'rgba(139, 105, 20, 0.5)', 2)
    }
    
    renderHouseDetail(renderer, state) {
        const w = renderer.width
        const h = renderer.height
        const modalW = w * 0.85
        const modalH = 360
        const modalX = (w - modalW) / 2
        const modalY = (h - modalH) / 2
        
        const house = this.selectedHouse
        const eligibility = checkPurchaseEligibility(state, house.id)
        const ctx = renderer.ctx
        
        renderer.drawRect(0, 0, w, h, 'rgba(0, 0, 0, 0.7)')
        
        renderer.drawRect(modalX, modalY, modalW, modalH, '#ffffff', 12)
        
        renderer.drawText(house.name, modalX + modalW / 2, modalY + 25, '#8b6914', 16, 'center')
        
        // 绘制房屋图片（大图）
        const imgW = modalW - 30
        const imgH = 180
        const imgX = modalX + 15
        const imgY = modalY + 45
        
        // 绘制图片背景
        renderer.drawRect(imgX, imgY, imgW, imgH, '#e8e8e8', 6)
        
        // 绘制房屋图片
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
                
                ctx.drawImage(houseImg, drawX, drawY, drawW, drawH)
                ctx.restore()
            } catch (e) {
                console.warn('绘制弹窗房屋图片失败:', e)
            }
        }
        
        const btnY = modalY + modalH - 55
        const ui = this.game.uiManager
        
        if (eligibility.eligible) {
            // 金币足够，显示购买和取消按钮
            ui.addButton(modalX + 15, btnY, (modalW - 45) / 2, 45, '购买', () => {
                this.purchaseHouse(house)
            }, { bgColor: '#27ae60', fontSize: 15 })
            
            ui.addButton(modalX + 30 + (modalW - 45) / 2, btnY, (modalW - 45) / 2, 45, '取消', () => {
                this.selectedHouse = null
            }, { bgColor: '#7f8c8d', fontSize: 15 })
        } else {
            // 金币不够，只显示取消按钮
            ui.addButton(modalX + (modalW - 120) / 2, btnY, 120, 45, '取消', () => {
                this.selectedHouse = null
            }, { bgColor: '#7f8c8d', fontSize: 15 })
        }
    }
    
    async purchaseHouse(house) {
        const state = this.game.gameState.data
        
        state.money -= house.price
        state.purchasedHouse = house.id
        
        // 将房屋添加到永久解锁列表
        if (!state.unlockedHouses) {
            state.unlockedHouses = []
        }
        if (!state.unlockedHouses.includes(house.id)) {
            state.unlockedHouses.push(house.id)
            console.log('[purchaseHouse] 添加房屋到解锁列表:', house.id, ', 当前列表:', state.unlockedHouses)
        }
        
        // 先保存用户解锁的房屋到云端（确保永久保存）
        console.log('[purchaseHouse] 开始保存解锁房屋到云端...')
        await this.game.gameState.saveUserUnlockedHouses()
        console.log('[purchaseHouse] 解锁房屋已保存到云端')
        
        // 再保存游戏状态
        await this.game.gameState.save()
        
        this.game.gameState.addDelayedAnimation('decrease', house.price, 'money', '金币', '#f39c12')
        
        this.selectedHouse = null
        
        // 播放结局（购房结局）
        this.playEnding(house)
    }
    
    playEnding(house) {
        // 设置结局动画状态
        this.isEndingPlaying = true
        this.endingHouse = house
        this.endingScrollY = 0
        this.endingStartTime = Date.now()
        this.endingPhase = 'fadein' // fadein -> scrolling -> fadeout -> buttons
        
        // 结局文字内容
        this.endingLines = [
            '',
            '',
            '',
            '',
            '【 购 房 结 局 】',
            '',
            '',
            `恭喜您成功购买了`,
            `${house.name}`,
            '',
            '',
            house.parentAttitude || '',
            '',
            '',
            '在这个繁华的大都市，',
            '您终于拥有了自己的栖身之所。',
            '',
            '虽然前路依然充满挑战，',
            '但您已经迈出了重要的一步。',
            '',
            '',
            '愿您在新的家园中，',
            '开启人生的新篇章。',
            '',
            '',
            '',
            '— 感谢游玩 —',
            '',
            ''
        ]
        
        // 计算文字总高度
        this.endingTextHeight = this.endingLines.length * 35
    }
    
    renderEnding(renderer) {
        if (!this.isEndingPlaying) return
        
        const ctx = renderer.ctx
        const w = renderer.width
        const h = renderer.height
        const elapsed = Date.now() - this.endingStartTime
        
        // 获取房屋图片
        const houseImg = this.houseImages[this.endingHouse.id]
        
        // 绘制房屋图片作为背景（半透明）
        if (houseImg && houseImg.width > 0) {
            ctx.save()
            
            // 计算图片绘制尺寸（覆盖整个屏幕）
            const imgRatio = houseImg.width / houseImg.height
            const screenRatio = w / h
            let drawW, drawH, drawX, drawY
            
            if (imgRatio > screenRatio) {
                drawH = h
                drawW = drawH * imgRatio
                drawX = (w - drawW) / 2
                drawY = 0
            } else {
                drawW = w
                drawH = drawW / imgRatio
                drawX = 0
                drawY = (h - drawH) / 2
            }
            
            // 绘制半透明背景图
            ctx.globalAlpha = 0.4
            ctx.drawImage(houseImg, drawX, drawY, drawW, drawH)
            ctx.globalAlpha = 1
            
            // 添加深色遮罩
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
            ctx.fillRect(0, 0, w, h)
            
            ctx.restore()
        } else {
            // 没有图片时使用纯色背景
            ctx.fillStyle = 'rgba(20, 20, 40, 0.95)'
            ctx.fillRect(0, 0, w, h)
        }
        
        // 根据阶段处理动画
        if (this.endingPhase === 'fadein') {
            // 淡入效果（1秒）
            const fadeProgress = Math.min(elapsed / 1000, 1)
            ctx.save()
            ctx.globalAlpha = fadeProgress
            this.renderEndingText(renderer)
            ctx.restore()
            
            if (elapsed >= 1000) {
                this.endingPhase = 'scrolling'
                this.endingStartTime = Date.now()
            }
        } else if (this.endingPhase === 'scrolling') {
            // 滚动效果
            const scrollDuration = 8000 // 8秒滚动完成
            const scrollProgress = Math.min(elapsed / scrollDuration, 1)
            const totalScroll = this.endingTextHeight + h
            this.endingScrollY = h - totalScroll * scrollProgress
            
            this.renderEndingText(renderer)
            
            if (elapsed >= scrollDuration) {
                this.endingPhase = 'buttons'
                this.endingStartTime = Date.now()
            }
        } else if (this.endingPhase === 'buttons') {
            // 显示按钮
            this.renderEndingText(renderer)
            this.renderEndingButtons(renderer)
        }
    }
    
    renderEndingText(renderer) {
        const ctx = renderer.ctx
        const w = renderer.width
        const h = renderer.height
        
        ctx.save()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'top'
        
        const startY = this.endingScrollY
        
        this.endingLines.forEach((line, index) => {
            const y = startY + index * 35
            
            // 只绘制在屏幕内的文字
            if (y > -50 && y < h + 50) {
                // 标题样式
                if (line.includes('【') && line.includes('】')) {
                    ctx.font = 'bold 28px sans-serif'
                    ctx.fillStyle = '#ffd700'
                } else if (line.includes('—')) {
                    ctx.font = 'italic 20px sans-serif'
                    ctx.fillStyle = '#aaaaaa'
                } else if (line === this.endingHouse.name) {
                    ctx.font = 'bold 26px sans-serif'
                    ctx.fillStyle = '#ffffff'
                } else if (line.includes('恭喜')) {
                    ctx.font = '22px sans-serif'
                    ctx.fillStyle = '#ffffff'
                } else {
                    ctx.font = '20px sans-serif'
                    ctx.fillStyle = '#dddddd'
                }
                
                ctx.fillText(line, w / 2, y)
            }
        })
        
        ctx.restore()
    }
    
    renderEndingButtons(renderer) {
        const ctx = renderer.ctx
        const w = renderer.width
        const h = renderer.height
        
        // 按钮位置
        const btnW = 140
        const btnH = 45
        const btnY = h - 80
        const gap = 30
        
        // 再活一世按钮
        const btn1X = w / 2 - btnW - gap / 2
        ctx.fillStyle = '#27ae60'
        ctx.beginPath()
        ctx.roundRect(btn1X, btnY, btnW, btnH, 8)
        ctx.fill()
        
        ctx.fillStyle = '#ffffff'
        ctx.font = '18px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('再活一世', btn1X + btnW / 2, btnY + btnH / 2)
        
        // 退出游戏按钮
        const btn2X = w / 2 + gap / 2
        ctx.fillStyle = '#7f8c8d'
        ctx.beginPath()
        ctx.roundRect(btn2X, btnY, btnW, btnH, 8)
        ctx.fill()
        
        ctx.fillStyle = '#ffffff'
        ctx.fillText('退出游戏', btn2X + btnW / 2, btnY + btnH / 2)
    }
    
    handleEndingTouch(x, y) {
        if (!this.isEndingPlaying || this.endingPhase !== 'buttons') return false
        
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        
        const btnW = 140
        const btnH = 45
        const btnY = h - 80
        const gap = 30
        
        // 再活一世按钮
        const btn1X = w / 2 - btnW - gap / 2
        if (x >= btn1X && x <= btn1X + btnW && y >= btnY && y <= btnY + btnH) {
            this.isEndingPlaying = false
            this.restartGameWithUnlockedHouses()
            return true
        }
        
        // 退出游戏按钮
        const btn2X = w / 2 + gap / 2
        if (x >= btn2X && x <= btn2X + btnW && y >= btnY && y <= btnY + btnH) {
            this.isEndingPlaying = false
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
            return true
        }
        
        return false
    }
    
    async restartGameWithUnlockedHouses() {
        console.log('[restartGameWithUnlockedHouses] 开始重新开始游戏...')
        
        // 从云数据库获取用户的解锁房屋列表（永久保留）
        let unlockedHouses = []
        
        try {
            if (wx.cloud) {
                const db = wx.cloud.database({})
                const res = await db.collection('user_unlocked_houses').where({
                    _openid: '{openid}'
                }).limit(1).get()
                
                console.log('[restartGameWithUnlockedHouses] 查询结果:', JSON.stringify(res.data))
                
                if (res.data && res.data.length > 0) {
                    unlockedHouses = res.data[0].unlockedHouses || []
                    console.log('[restartGameWithUnlockedHouses] 从云端获取解锁房屋:', unlockedHouses)
                }
            }
        } catch (e) {
            console.warn('[restartGameWithUnlockedHouses] 从云端获取解锁房屋失败:', e)
            unlockedHouses = this.game.gameState.data.unlockedHouses || []
            console.log('[restartGameWithUnlockedHouses] 使用当前解锁房屋:', unlockedHouses)
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