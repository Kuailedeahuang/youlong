export const GHIBLI_COLORS = {
    bgStart: '#B8D4E8',
    bgEnd: '#E8F0F8',
    bgLight: '#F5FAFF',
    bgMedium: '#C8E0F0',
    bgDark: '#A8C8E0',
    panel: '#FFF8F0',
    primary: '#FFD54F',
    primaryDark: '#FFB300',
    secondary: '#5A9FD4',
    accent: '#7ED957',
    warm: '#E8913A',
    textMain: '#4A3728',
    textSub: '#5A6A7A',
    textLight: '#8A9AAA',
    outline: '#3D3D3D',
    success: '#81C784',
    warning: '#FFD54F',
    error: '#E57373'
}

export function drawGhibliBackground(ctx, w, h, cloudTime) {
    const gradient = ctx.createLinearGradient(0, 0, 0, h)
    gradient.addColorStop(0, GHIBLI_COLORS.bgStart)
    gradient.addColorStop(0.5, GHIBLI_COLORS.bgLight)
    gradient.addColorStop(1, GHIBLI_COLORS.bgEnd)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    drawBackgroundDetails(ctx, w, h)
    drawClouds(ctx, w, h, cloudTime)
}

export function drawBackgroundDetails(ctx, w, h) {
    const grassGradient = ctx.createLinearGradient(0, h * 0.7, 0, h)
    grassGradient.addColorStop(0, 'rgba(152, 251, 152, 0.08)')
    grassGradient.addColorStop(1, 'rgba(144, 238, 144, 0.03)')
    ctx.fillStyle = grassGradient
    ctx.fillRect(0, h * 0.7, w, h * 0.3)

    ctx.save()
    ctx.globalAlpha = 0.06
    ctx.fillStyle = GHIBLI_COLORS.secondary
    ctx.beginPath()
    ctx.moveTo(0, h * 0.85)
    ctx.bezierCurveTo(w * 0.25, h * 0.78, w * 0.45, h * 0.88, w * 0.65, h * 0.82)
    ctx.bezierCurveTo(w * 0.85, h * 0.86, w * 0.98, h * 0.8, w, h * 0.85)
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.fill()
    ctx.restore()
}

export function drawClouds(ctx, w, h, cloudTime) {
    ctx.save()
    const time = cloudTime

    const drawCloud = (x, y, size, offset, alpha) => {
        const moveX = Math.sin(time * 0.5 + offset) * size * 0.8
        ctx.globalAlpha = alpha
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(x + moveX, y, size, 0, Math.PI * 2)
        ctx.arc(x + moveX + size * 0.6, y - size * 0.3, size * 0.8, 0, Math.PI * 2)
        ctx.arc(x + moveX + size * 1.2, y, size * 0.7, 0, Math.PI * 2)
        ctx.fill()
    }

    drawCloud(w * 0.15, h * 0.22, 35, 0, 0.35)
    drawCloud(w * 0.75, h * 0.28, 28, 2, 0.30)
    drawCloud(w * 0.05, h * 0.18, 25, 1, 0.55)
    drawCloud(w * 0.85, h * 0.25, 22, 3, 0.50)
    drawCloud(w * 0.25, h * 0.35, 18, 0.5, 0.80)
    drawCloud(w * 0.7, h * 0.32, 15, 1.5, 0.75)

    ctx.restore()
}

export function drawLogo(ctx, x, y, size, logoImage, imageLoaded, logoFadeStartTime) {
    let alpha = 1
    if (logoFadeStartTime) {
        const elapsed = Date.now() - logoFadeStartTime
        alpha = Math.min(1, elapsed / 800)
    }

    ctx.save()
    ctx.globalAlpha = alpha

    if (imageLoaded && logoImage && logoImage.width > 0) {
        try {
            ctx.drawImage(logoImage, x, y, size, size)
        } catch (e) {
            drawPlaceholderLogo(ctx, x, y, size)
        }
    } else {
        drawPlaceholderLogo(ctx, x, y, size)
    }

    ctx.restore()
}

export function drawPlaceholderLogo(ctx, x, y, size) {
    const radius = size * 0.2

    drawGhibliPanel(ctx, x, y, size, size, radius)

    ctx.fillStyle = GHIBLI_COLORS.primary
    ctx.font = `bold ${size * 0.5}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('游', x + size / 2, y + size / 2)
}

export function drawGhibliPanel(ctx, x, y, w, h, r) {
    ctx.fillStyle = GHIBLI_COLORS.panel

    ctx.shadowColor = 'rgba(45, 45, 45, 0.08)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 3
    drawRoundRectPath(ctx, x, y, w, h, r)
    ctx.fill()
    ctx.shadowColor = 'transparent'

    const highlight = ctx.createLinearGradient(x, y, x, y + h * 0.3)
    highlight.addColorStop(0, 'rgba(255, 255, 255, 0.35)')
    highlight.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = highlight
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h * 0.28)
    ctx.bezierCurveTo(x + w * 0.75, y + h * 0.18, x + w * 0.25, y + h * 0.18, x, y + h * 0.28)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.fill()
    ctx.restore()

    ctx.strokeStyle = GHIBLI_COLORS.outline
    ctx.lineWidth = 2
    drawRoundRectPath(ctx, x, y, w, h, r)
    ctx.stroke()
}

export function drawRoundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
}

export function drawTextWithOutline(ctx, text, x, y, fontSize, fillColor, outlineColor) {
    ctx.save()
    ctx.font = `bold ${fontSize}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.strokeStyle = outlineColor
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.strokeText(text, x, y)

    ctx.fillStyle = fillColor
    ctx.fillText(text, x, y)

    ctx.restore()
}
