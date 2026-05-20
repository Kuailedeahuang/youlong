export default class MiniGameBase {
    constructor(game, timeProvider, onComplete) {
        this.game = game
        this.time = timeProvider
        this.onComplete = onComplete

        this.active = false
        this.phase = 'idle'
        this.particles = []
        this.overlayOpacity = 0.55
    }

    start(config) {
        this.active = true
        this.phase = 'playing'
        this.particles = []
        this._initState(config)
        
        if (config && config.overlayOpacity !== undefined) {
            this.overlayOpacity = config.overlayOpacity
        }
    }

    update() {
        if (!this.active) return

        this._updateLogic(this.time.deltaTime)
        this._updateParticles()
    }

    render(renderer) {
        if (!this.active) return
        this._renderUI(renderer)
    }

    handleTouch(x, y) {
        if (!this.active || this.phase !== 'playing') return false
        return this._handleTouch(x, y)
    }

    complete(successRate) {
        this.active = false
        this.phase = 'completed'

        if (this.onComplete) {
            this.onComplete(successRate)
        }
    }

    destroy() {
        this.active = false
        this.phase = 'idle'
        this.particles = []
    }

    _initState(config) {}

    _updateLogic(deltaTime) {}

    _renderUI(renderer) {}

    _handleTouch(x, y) {
        return false
    }

    _spawnParticles(x, y, colors, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
            const speed = 1 + Math.random() * 2
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 1.0,
                size: 2 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)]
            })
        }
    }

    _updateParticles() {
        const dt = this.time.normalizedDelta
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i]
            p.life -= 0.03 * dt
            p.x += p.vx * dt
            p.y += p.vy * dt
            p.vy += 0.2 * dt
            if (p.life <= 0) {
                this.particles.splice(i, 1)
            }
        }
    }

    _renderParticles(ctx) {
        for (const p of this.particles) {
            ctx.save()
            ctx.globalAlpha = Math.max(0, p.life)
            ctx.fillStyle = p.color
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size * Math.max(0, p.life), 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
        }
    }

    _drawRoundRect(ctx, x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2)
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
}
