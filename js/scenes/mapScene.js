import iconManager from '../components/IconManager.js'
import imageManager from '../utils/imageManager.js'

export default class MapScene {
    constructor(game) {
        this.game = game
        this.bgImage = null
        this.imageLoaded = false
        this.useCloudImage = false
        this.loadAttempted = false
        this.loadError = null
        
        this.offsetX = 0
        this.offsetY = 0
        this.isDragging = false
        this.lastTouchX = 0
        this.lastTouchY = 0
        this.dragStartX = 0
        this.dragStartY = 0
        this.hasDragged = false
        
        this.clickFeedback = null
        
        this.locations = [
            {
                id: 'bank',
                name: '银行',
                xPercent: 0.05,
                yPercent: 0.30,
                widthPercent: 0.28,
                heightPercent: 0.18,
                action: () => this.game.sceneManager.goToLocation('bank')
            },
            {
                id: 'hospital',
                name: '医院',
                xPercent: 0.36,
                yPercent: 0.30,
                widthPercent: 0.28,
                heightPercent: 0.18,
                action: () => this.game.sceneManager.goToLocation('hospital')
            },
            {
                id: 'house',
                name: '售楼部',
                xPercent: 0.67,
                yPercent: 0.30,
                widthPercent: 0.28,
                heightPercent: 0.18,
                action: () => this.game.sceneManager.goToLocation('house')
            },
            {
                id: 'work',
                name: '工作',
                xPercent: 0.05,
                yPercent: 0.53,
                widthPercent: 0.28,
                heightPercent: 0.18,
                action: () => this.game.sceneManager.goToLocation('work')
            },
            {
                id: 'market',
                name: '市场',
                xPercent: 0.36,
                yPercent: 0.53,
                widthPercent: 0.28,
                heightPercent: 0.18,
                action: () => this.enterMarket()
            },
            {
                id: 'gym',
                name: '健身房',
                xPercent: 0.67,
                yPercent: 0.53,
                widthPercent: 0.28,
                heightPercent: 0.18,
                action: () => this.game.sceneManager.goToLocation('gym')
            },
            {
                id: 'home',
                name: '出租屋',
                xPercent: 0.36,
                yPercent: 0.80,
                widthPercent: 0.28,
                heightPercent: 0.18,
                action: () => this.game.sceneManager.goToLocation('home')
            },
            {
                id: 'privateLoan',
                name: '个人借贷',
                xPercent: 0.67,
                yPercent: 0.80,
                widthPercent: 0.28,
                heightPercent: 0.18,
                action: () => this.game.sceneManager.goToLocation('privateLoan')
            }
        ]
    }
    
    async onEnter() {
        console.log('[MapScene] onEnter 开始')
        this.bgImage = null
        this.imageLoaded = false
        this.useCloudImage = false
        this.loadAttempted = true
        this.loadError = null
        
        this.isDragging = false
        this.hasDragged = false
        
        try {
            console.log('[MapScene] 开始加载大地图背景图...')
            const cloudImage = await imageManager.loadImageFromCloud('daditu.png')
            console.log('[MapScene] loadImageFromCloud 返回:', cloudImage)
            
            if (cloudImage && cloudImage.image) {
                this.bgImage = cloudImage.image
                this.imageLoaded = true
                this.useCloudImage = true
                console.log('[MapScene] 大地图背景图加载成功, 图片尺寸:', cloudImage.image.width, 'x', cloudImage.image.height)
            } else {
                this.loadError = 'cloudImage 或 cloudImage.image 为空'
                console.warn('[MapScene]', this.loadError)
            }
        } catch (e) {
            this.loadError = e.message || String(e)
            console.error('[MapScene] 加载大地图背景图失败:', e)
        }
    }
    
    enterMarket() {
        const state = this.game.gameState.data
        
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
        }
        
        this.game.sceneManager.switchTo('market')
    }
    
    showClickFeedback(x, y, name) {
        this.clickFeedback = {
            x: x,
            y: y,
            name: name,
            startTime: Date.now(),
            duration: 500
        }
    }
    
    update(deltaTime) {
        if (this.clickFeedback) {
            const elapsed = Date.now() - this.clickFeedback.startTime
            if (elapsed > this.clickFeedback.duration) {
                this.clickFeedback = null
            }
        }
    }
    
    clampOffset() {
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        
        if (!this.bgImage) return
        
        const drawWidth = this.bgImage.width
        const drawHeight = this.bgImage.height
        
        const minX = Math.min(0, w - drawWidth)
        const minY = Math.min(0, h - drawHeight)
        
        this.offsetX = Math.min(0, Math.max(minX, this.offsetX))
        this.offsetY = Math.min(0, Math.max(minY, this.offsetY))
    }
    
    render(renderer) {
        const w = renderer.width
        const h = renderer.height
        
        this.game.uiManager.clear()
        
        if (this.imageLoaded && this.bgImage) {
            try {
                renderer.clear('#2c3e50')
                
                const ctx = renderer.ctx
                ctx.save()
                ctx.translate(this.offsetX, this.offsetY)
                
                const drawWidth = this.bgImage.width
                const drawHeight = this.bgImage.height
                const drawX = 0
                const drawY = 0
                
                ctx.drawImage(this.bgImage, drawX, drawY, drawWidth, drawHeight)
                
                this.renderBuildings(renderer, this.bgImage.width, this.bgImage.height)
                
                ctx.restore()
            } catch (e) {
                console.warn('绘制大地图背景图失败:', e)
                renderer.clear('#2c3e50')
            }
        } else {
            renderer.clear('#2c3e50')
        }
        
        if (this.clickFeedback) {
            this.renderClickFeedback(renderer)
        }
        
        this.renderTopBar(renderer)
        renderer.renderStatsPanel(this.game, this.game.gameState.data)
    }
    
    renderBuildings(renderer, imgWidth, imgHeight) {
        const ctx = renderer.ctx
        
        for (const loc of this.locations) {
            const locX = loc.xPercent * imgWidth
            const locY = loc.yPercent * imgHeight
            const locW = loc.widthPercent * imgWidth
            const locH = loc.heightPercent * imgHeight
            
            const centerX = locX + locW / 2
            const centerY = locY + locH / 2
            
            const labelHeight = 24
            const labelPaddingX = 10
            ctx.font = '12px Arial, sans-serif'
            const textWidth = ctx.measureText(loc.name).width
            const labelWidth = textWidth + labelPaddingX * 2
            const labelX = centerX - labelWidth / 2
            const labelY = centerY - locH * 0.35 - labelHeight / 2
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
            this.drawRoundRect(ctx, labelX, labelY, labelWidth, labelHeight, 4)
            ctx.fill()
            
            ctx.fillStyle = '#000000'
            ctx.font = '12px Arial, sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(loc.name, centerX, labelY + labelHeight / 2)
        }
    }
    
    drawRoundRect(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2)
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + width - r, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + r)
        ctx.lineTo(x + width, y + height - r)
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
        ctx.lineTo(x + r, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - r)
        ctx.lineTo(x, y + r)
        ctx.quadraticCurveTo(x, y, x + r, y)
        ctx.closePath()
    }
    
    renderClickFeedback(renderer) {
        const feedback = this.clickFeedback
        const elapsed = Date.now() - feedback.startTime
        const progress = elapsed / feedback.duration
        
        const ctx = renderer.ctx
        const x = feedback.x
        const y = feedback.y
        
        const alpha = 1 - progress
        const radius = 30 + progress * 20
        
        ctx.save()
        ctx.globalAlpha = alpha
        
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
        ctx.fill()
        
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.strokeStyle = '#FFD700'
        ctx.lineWidth = 3
        ctx.stroke()
        
        ctx.globalAlpha = alpha
        ctx.font = 'bold 18px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = '#2D3436'
        ctx.fillText(feedback.name, x, y - radius - 20)
        
        ctx.restore()
    }
    
    renderTopBar(renderer) {
        const state = this.game.gameState.data
        const w = renderer.width
        const ctx = renderer.ctx
        const padding = 12
        const barH = 48

        renderer.drawRect(padding, 8, w - padding * 2, barH, '#FFF5E6', 12)

        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        renderer.beginRoundRectPath(padding, 8, w - padding * 2, barH, 12)
        ctx.stroke()

        iconManager.draw(ctx, 'calendar', padding + 22, 24, { size: 20 })
        renderer.drawText(`第${state.day}天 / ${state.totalDays}天`, padding + 42, 28, '#5D4037', 13, 'left')

        const rightX = w - padding - 15
        const moneyText = state.money.toLocaleString()
        iconManager.draw(ctx, 'coin', rightX - 85, 24, { size: 18 })
        renderer.drawText(moneyText, rightX, 28, '#D4A574', 15, 'right')
    }
    
    handleTouchStart(x, y) {
        if (y <= 64) {
            return false
        }
        
        const statsBarY = this.game.renderer.height - 112 - 12
        if (y >= statsBarY) {
            return false
        }
        
        this.isDragging = true
        this.hasDragged = false
        this.lastTouchX = x
        this.lastTouchY = y
        this.dragStartX = x
        this.dragStartY = y
        
        return true
    }
    
    handleTouchMove(x, y) {
        if (!this.isDragging) return
        
        const dx = x - this.lastTouchX
        const dy = y - this.lastTouchY
        
        if (Math.abs(x - this.dragStartX) > 15 || Math.abs(y - this.dragStartY) > 15) {
            this.hasDragged = true
        }
        
        this.offsetX += dx
        this.offsetY += dy
        this.clampOffset()
        
        this.lastTouchX = x
        this.lastTouchY = y
    }
    
    handleTouchEnd(x, y) {
        if (y <= 64) {
            this.isDragging = false
            this.hasDragged = false
            return
        }
        
        const statsBarY = this.game.renderer.height - 112 - 12
        if (y >= statsBarY) {
            this.isDragging = false
            this.hasDragged = false
            return
        }
        
        if (!this.hasDragged) {
            const w = this.game.renderer.width
            const h = this.game.renderer.height
            
            const mapX = x - this.offsetX
            const mapY = y - this.offsetY
            
            for (const loc of this.locations) {
                const locX = loc.xPercent * this.bgImage.width
                const locY = loc.yPercent * this.bgImage.height
                const locW = loc.widthPercent * this.bgImage.width
                const locH = loc.heightPercent * this.bgImage.height
                
                if (mapX >= locX && mapX <= locX + locW && mapY >= locY && mapY <= locY + locH) {
                    const centerX = locX + locW / 2 + this.offsetX
                    const centerY = locY + locH / 2 + this.offsetY
                    this.showClickFeedback(centerX, centerY, loc.name)
                    
                    setTimeout(() => {
                        loc.action()
                    }, 300)
                    break
                }
            }
        }
        
        this.isDragging = false
        this.hasDragged = false
    }
}
