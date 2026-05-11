import iconManager from '../components/IconManager.js'

export default class Renderer {
    constructor(ctx, width, height) {
        this.ctx = ctx
        this.width = width
        this.height = height
        this.fontSize = 14
        this._fontCache = {}
        
        this.ghibliColors = {
            bgStart: '#E0F0FF',
            bgEnd: '#F0F5FF',
            panel: '#FFF5E6',
            primary: '#FFE080',
            primaryDark: '#E6C966',
            success: '#81C784',
            error: '#E57373',
            textMain: '#5D4037',
            textSub: '#7B8794',
            outline: '#2D2D2D'
        }
    }
    
    clear(color = '#16213e') {
        this.ctx.fillStyle = color
        this.ctx.fillRect(0, 0, this.width, this.height)
    }
    
    drawRect(x, y, w, h, color, radius = 0) {
        this.ctx.fillStyle = color
        if (radius > 0) {
            this.drawRoundRectPath(x, y, w, h, radius)
            this.ctx.fill()
        } else {
            this.ctx.fillRect(x, y, w, h)
        }
    }
    
    drawRoundRect(x, y, w, h, r) {
        this.drawRoundRectPath(x, y, w, h, r)
    }
    
    drawRoundRectPath(x, y, w, h, r) {
        this.ctx.beginPath()
        this.ctx.moveTo(x + r, y)
        this.ctx.lineTo(x + w - r, y)
        this.ctx.arcTo(x + w, y, x + w, y + r, r)
        this.ctx.lineTo(x + w, y + h - r)
        this.ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
        this.ctx.lineTo(x + r, y + h)
        this.ctx.arcTo(x, y + h, x, y + h - r, r)
        this.ctx.lineTo(x, y + r)
        this.ctx.arcTo(x, y, x + r, y, r)
        this.ctx.closePath()
    }
    
    drawGhibliPanel(x, y, w, h, bgColor = null) {
        const color = bgColor || this.ghibliColors.panel
        const radius = h * 0.15
        
        this.ctx.save()
        this.ctx.fillStyle = color
        this.ctx.strokeStyle = this.ghibliColors.outline
        this.ctx.lineWidth = 2
        
        this.drawRoundRectPath(x, y, w, h, radius)
        this.ctx.fill()
        this.ctx.stroke()
        this.ctx.restore()
    }
    
    drawText(text, x, y, color = '#ffffff', fontSize = 14, align = 'left') {
        const cacheKey = `${fontSize}px sans-serif`
        const ctx = this.ctx
        ctx.fillStyle = color
        ctx.font = cacheKey
        ctx.textAlign = align
        ctx.textBaseline = 'middle'
        ctx.fillText(text, x, y)
    }
    
    drawTextWithOutline(text, x, y, fontSize, fillColor, outlineColor) {
        this.ctx.save()
        this.ctx.font = `bold ${fontSize}px sans-serif`
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        
        this.ctx.strokeStyle = outlineColor
        this.ctx.lineWidth = 3
        this.ctx.lineJoin = 'round'
        this.ctx.strokeText(text, x, y)
        
        this.ctx.fillStyle = fillColor
        this.ctx.fillText(text, x, y)
        
        this.ctx.restore()
    }
    
    drawButton(x, y, w, h, text, bgColor = '#f39c12', textColor = '#ffffff', fontSize = 14) {
        this.drawGhibliButton(x, y, w, h, text, bgColor, textColor, fontSize)
    }
    
    drawGhibliButton(x, y, w, h, text, bgColor = null, textColor = null, fontSize = 14) {
        const bg = bgColor || this.ghibliColors.primary
        const textCol = textColor || this.ghibliColors.textMain
        const radius = h * 0.2
        
        this.ctx.save()
        
        if (bgColor !== 'transparent') {
            this.ctx.fillStyle = bg
            this.ctx.strokeStyle = this.ghibliColors.outline
            this.ctx.lineWidth = 2
            
            this.drawRoundRectPath(x, y, w, h, radius)
            this.ctx.fill()
            this.ctx.stroke()
            
            this.ctx.fillStyle = textCol
            this.ctx.font = `bold ${fontSize}px sans-serif`
            this.ctx.textAlign = 'center'
            this.ctx.textBaseline = 'middle'
            this.ctx.fillText(text, x + w / 2, y + h / 2)
        }
        
        this.ctx.restore()
    }
    
    drawProgressBar(x, y, w, h, progress, bgColor = 'rgba(255,255,255,0.1)', fillColor = '#f39c12') {
        this.drawRect(x, y, w, h, bgColor, h / 2)
        if (progress > 0) {
            const fillWidth = w * Math.min(1, Math.max(0, progress))
            this.drawRect(x, y, fillWidth, h, fillColor, h / 2)
        }
    }
    
    drawGhibliBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height)
        gradient.addColorStop(0, this.ghibliColors.bgStart)
        gradient.addColorStop(1, this.ghibliColors.bgEnd)
        this.ctx.fillStyle = gradient
        this.ctx.fillRect(0, 0, this.width, this.height)
        
        this.drawGhibliClouds()
    }
    
    drawGhibliClouds() {
        const ctx = this.ctx
        const w = this.width
        const h = this.height
        const time = Date.now() * 0.0001
        
        ctx.save()
        ctx.globalAlpha = 0.5
        ctx.fillStyle = '#FFFFFF'

        this._drawOneCloud(ctx, w * 0.15, h * 0.1, 30, time, 0)
        this._drawOneCloud(ctx, w * 0.75, h * 0.15, 25, time, 1.5)
        this._drawOneCloud(ctx, w * 0.5, h * 0.08, 20, time, 2.5)
        
        ctx.restore()
    }

    _drawOneCloud(ctx, x, y, size, time, offset) {
        const moveX = Math.sin(time + offset) * 10
        ctx.beginPath()
        ctx.arc(x + moveX, y, size, 0, Math.PI * 2)
        ctx.arc(x + moveX + size * 0.6, y - size * 0.3, size * 0.8, 0, Math.PI * 2)
        ctx.arc(x + moveX + size * 1.2, y, size * 0.7, 0, Math.PI * 2)
        ctx.fill()
    }
    
    drawSky(y, height) {
        const gradient = this.ctx.createLinearGradient(0, y, 0, y + height)
        gradient.addColorStop(0, '#87CEEB')
        gradient.addColorStop(0.5, '#B0E0E6')
        gradient.addColorStop(1, '#E0F7FA')
        this.ctx.fillStyle = gradient
        this.ctx.fillRect(0, y, this.width, height)
        
        this.drawCloud(this.width * 0.1, y + height * 0.1, 60, 20)
        this.drawCloud(this.width * 0.7, y + height * 0.3, 50, 18)
        this.drawCloud(this.width * 0.4, y + height * 0.5, 55, 16)
    }
    
    drawCloud(x, y, w, h) {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
        this.ctx.beginPath()
        this.ctx.arc(x, y, h, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.beginPath()
        this.ctx.arc(x + w * 0.5, y - h * 0.2, h * 1.2, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.beginPath()
        this.ctx.arc(x + w, y, h * 0.8, 0, Math.PI * 2)
        this.ctx.fill()
    }
    
    drawRoad(y, height) {
        this.ctx.fillStyle = '#4a4a4a'
        this.ctx.fillRect(0, y, this.width, height)
        
        this.ctx.fillStyle = '#f1c40f'
        const lineWidth = 20
        const gap = 30
        let x = 10
        while (x < this.width) {
            this.ctx.fillRect(x, y + height / 2 - 2, lineWidth, 4)
            x += lineWidth + gap
        }
    }
    
    drawRoom(y, height) {
        const gradient = this.ctx.createLinearGradient(0, y, 0, y + height)
        gradient.addColorStop(0, '#2c3e50')
        gradient.addColorStop(1, '#1a1a2e')
        this.ctx.fillStyle = gradient
        this.ctx.fillRect(0, y, this.width, height)
    }
    
    measureText(text, fontSize = 14) {
        this.ctx.font = `${fontSize}px sans-serif`
        return this.ctx.measureText(text).width
    }

    beginRoundRectPath(x, y, w, h, r) {
        this.ctx.beginPath()
        this.ctx.moveTo(x + r, y)
        this.ctx.lineTo(x + w - r, y)
        this.ctx.arcTo(x + w, y, x + w, y + r, r)
        this.ctx.lineTo(x + w, y + h - r)
        this.ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
        this.ctx.lineTo(x + r, y + h)
        this.ctx.arcTo(x, y + h, x, y + h - r, r)
        this.ctx.lineTo(x, y + r)
        this.ctx.arcTo(x, y, x + r, y, r)
        this.ctx.closePath()
    }

    renderStatItem(x, y, statType, value, max, color, isRight = false) {
        const progress = value / max
        let valueColor = color
        if (progress < 0.3) valueColor = '#C17B6B'
        else if (progress < 0.5) valueColor = '#D4A574'

        const labelColor = '#5A6B7A'
        const labelMap = {
            health: '健康',
            energy: '精力',
            mood: '心情',
            reputation: '名誉'
        }
        const label = labelMap[statType] || statType

        if (isRight) {
            iconManager.draw(this.ctx, statType, x - 75, y, { size: 22 })
            this.drawText(label, x - 45, y - 6, labelColor, 12, 'left')
            this.drawText(`${value}/${max}`, x - 45, y + 10, valueColor, 13, 'left')
        } else {
            iconManager.draw(this.ctx, statType, x + 12, y, { size: 22 })
            this.drawText(label, x + 38, y - 1, labelColor, 12, 'left')
            this.drawText(`${value}/${max}`, x + 38, y + 14, valueColor, 13, 'left')
        }
    }

    renderCenterButton(game, x, y, size) {
        const ctx = this.ctx
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

        if (game.debugPanel) {
            game.debugPanel.setMapButtonRect({
                x: x - radius,
                y: y - radius,
                width: size,
                height: size
            })
        }

        const ui = game.uiManager
        ui.addButton(x - radius, y - radius, size, size, '', () => {
            game.sceneManager.switchTo('map')
        }, { bgColor: 'transparent' })
    }

    renderStatsPanel(game, state) {
        const w = this.width
        const h = this.height
        const padding = 12
        const panelH = 100
        const panelY = h - panelH - padding
        const centerBtnSize = 56
        const ctx = this.ctx

        this.drawRect(padding, panelY, w - padding * 2, panelH, '#E0F0FF', 16)

        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        this.beginRoundRectPath(padding, panelY, w - padding * 2, panelH, 16)
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

        this.renderStatItem(leftSectionX, topRowY, 'health', state.health, 100, '#7CB87C')
        this.renderStatItem(rightSectionX, topRowY, 'energy', state.energy, state.maxEnergy, '#7BA3C9', true)
        this.renderStatItem(leftSectionX, bottomRowY, 'mood', state.mood, 100, '#D49BA3')
        this.renderStatItem(rightSectionX, bottomRowY, 'reputation', state.reputation, 100, '#B8A3C9', true)

        this.renderCenterButton(game, centerX, panelY + panelH / 2, centerBtnSize)
    }
}
