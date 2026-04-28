export default class Renderer {
    constructor(ctx, width, height) {
        this.ctx = ctx
        this.width = width
        this.height = height
        this.fontSize = 14
        
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
        this.ctx.save()
        this.ctx.fillStyle = color
        this.ctx.font = `${fontSize}px sans-serif`
        this.ctx.textAlign = align
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(text, x, y)
        this.ctx.restore()
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
        
        const drawCloud = (x, y, size, offset) => {
            const moveX = Math.sin(time + offset) * 10
            ctx.fillStyle = '#FFFFFF'
            ctx.beginPath()
            ctx.arc(x + moveX, y, size, 0, Math.PI * 2)
            ctx.arc(x + moveX + size * 0.6, y - size * 0.3, size * 0.8, 0, Math.PI * 2)
            ctx.arc(x + moveX + size * 1.2, y, size * 0.7, 0, Math.PI * 2)
            ctx.fill()
        }
        
        drawCloud(w * 0.15, h * 0.1, 30, 0)
        drawCloud(w * 0.75, h * 0.15, 25, 1.5)
        drawCloud(w * 0.5, h * 0.08, 20, 2.5)
        
        ctx.restore()
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
}
