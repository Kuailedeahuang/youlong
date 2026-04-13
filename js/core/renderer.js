export default class Renderer {
    constructor(ctx, width, height) {
        this.ctx = ctx
        this.width = width
        this.height = height
        this.fontSize = 14
    }
    
    clear(color = '#16213e') {
        this.ctx.fillStyle = color
        this.ctx.fillRect(0, 0, this.width, this.height)
    }
    
    drawRect(x, y, w, h, color, radius = 0) {
        this.ctx.fillStyle = color
        if (radius > 0) {
            this.drawRoundRect(x, y, w, h, radius)
            this.ctx.fill()
        } else {
            this.ctx.fillRect(x, y, w, h)
        }
    }
    
    drawRoundRect(x, y, w, h, r) {
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
    
    drawText(text, x, y, color = '#ffffff', fontSize = 14, align = 'left') {
        this.ctx.fillStyle = color
        this.ctx.font = `${fontSize}px sans-serif`
        this.ctx.textAlign = align
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(text, x, y)
    }
    
    drawButton(x, y, w, h, text, bgColor = '#f39c12', textColor = '#ffffff', fontSize = 14) {
        this.drawRect(x, y, w, h, bgColor, 8)
        this.ctx.fillStyle = textColor
        this.ctx.font = `bold ${fontSize}px sans-serif`
        this.ctx.textAlign = 'center'
        this.ctx.textBaseline = 'middle'
        this.ctx.fillText(text, x + w / 2, y + h / 2)
    }
    
    drawProgressBar(x, y, w, h, progress, bgColor = 'rgba(255,255,255,0.1)', fillColor = '#f39c12') {
        this.drawRect(x, y, w, h, bgColor, h / 2)
        if (progress > 0) {
            const fillWidth = w * Math.min(1, Math.max(0, progress))
            this.drawRect(x, y, fillWidth, h, fillColor, h / 2)
        }
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
