import iconManager from '../components/IconManager.js'

export default class SleepTransitionManager {
    constructor(game, bedPos, onComplete) {
        this.game = game
        this.bedX = bedPos.x
        this.bedY = bedPos.y
        this.onComplete = onComplete

        this.state = 'idle'
        this.elapsed = 0
        this.totalDuration = 3.0

        this.overlayAlpha = 0

        this.zParticles = [
            { startTime: 0.1, offsetX: -8, offsetY: 0, life: 1.2 },
            { startTime: 0.35, offsetX: 8, offsetY: -10, life: 1.2 },
            { startTime: 0.6, offsetX: 0, offsetY: -5, life: 1.1 }
        ]

        this.stars = [
            { x: 0, y: 0, phase: 0 },
            { x: 0, y: 0, phase: 1.2 },
            { x: 0, y: 0, phase: 2.4 }
        ]

        this.moonAlpha = 0
        this.sunAlpha = 0
        this.textAlpha = 0

        this.skipButton = { x: 0, y: 0, w: 60, h: 36, alpha: 0 }
        this.skipHovered = false
    }

    start() {
        const w = this.game.renderer.width
        const h = this.game.renderer.height

        this.state = 'night'
        this.elapsed = 0
        this.overlayAlpha = 0
        this.moonAlpha = 0
        this.sunAlpha = 0
        this.textAlpha = 0
        this.skipButton.alpha = 0

        this.zParticles.forEach(p => {
            p.active = false
            p.alpha = 0
            p.progress = 0
        })

        this.stars[0].x = w * 0.25
        this.stars[0].y = h * 0.08
        this.stars[1].x = w * 0.55
        this.stars[1].y = h * 0.05
        this.stars[2].x = w * 0.78
        this.stars[2].y = h * 0.13

        this.skipButton.x = w - 70
        this.skipButton.y = h - 55

        this.game.uiManager.clearAll()
    }

    skip() {
        this.state = 'done'
        if (this.onComplete) {
            this.onComplete()
        }
    }

    update(dt) {
        if (this.state === 'idle' || this.state === 'done') return

        this.elapsed += dt

        if (this.elapsed < 1.0) {
            this.state = 'night'

            const t = this.elapsed / 1.0
            this.overlayAlpha = 0.7 * t

            this.moonAlpha = this.smoothFade(this.elapsed, 0.25, 0.5)

            this.zParticles.forEach(p => {
                if (this.elapsed >= p.startTime && !p.active) {
                    p.active = true
                    p.startElapsed = this.elapsed
                }
                if (p.active) {
                    p.progress = (this.elapsed - p.startElapsed) / p.life
                    if (p.progress < 0.2) {
                        p.alpha = p.progress / 0.2
                    } else if (p.progress < 0.8) {
                        p.alpha = 1
                    } else if (p.progress < 1.0) {
                        p.alpha = 1 - (p.progress - 0.8) / 0.2
                    } else {
                        p.alpha = 0
                    }
                }
            })
        } else {
            this.state = 'morning'

            const t = (this.elapsed - 1.0) / 2.0
            this.overlayAlpha = 0.7 * (1 - t)

            this.sunAlpha = this.smoothFade(this.elapsed - 1.0, 0.0, 0.5)

            this.textAlpha = this.fadeText(this.elapsed - 1.0, 0.1, 0.5, 1.2, 2.0)
        }

        this.skipButton.alpha = Math.min(1, this.elapsed / 1.5)

        if (this.elapsed >= this.totalDuration) {
            this.state = 'done'
            if (this.onComplete) {
                this.onComplete()
            }
        }
    }

    smoothFade(elapsed, start, end) {
        if (elapsed < start) return 0
        if (elapsed > end) return 1
        const t = (elapsed - start) / (end - start)
        return t
    }

    fadeText(elapsed, fadeInStart, fadeInEnd, fadeOutStart, fadeOutEnd) {
        if (elapsed < fadeInStart) return 0
        if (elapsed >= fadeInStart && elapsed < fadeInEnd) {
            return (elapsed - fadeInStart) / (fadeInEnd - fadeInStart)
        }
        if (elapsed >= fadeInEnd && elapsed < fadeOutStart) {
            return 1
        }
        if (elapsed >= fadeOutStart && elapsed < fadeOutEnd) {
            return 1 - (elapsed - fadeOutStart) / (fadeOutEnd - fadeOutStart)
        }
        return 0
    }

    render(renderer) {
        if (this.state === 'idle' || this.state === 'done') return

        const w = renderer.width
        const h = renderer.height
        const ctx = renderer.ctx
        const day = this.game.gameState.data.day + 1

        ctx.save()

        ctx.globalAlpha = this.overlayAlpha
        ctx.fillStyle = '#1B2A3A'
        ctx.fillRect(0, 0, w, h)
        ctx.globalAlpha = 1

        this.renderMoon(ctx, w, h)
        this.renderStars(ctx, w, h)
        this.renderZZZs(ctx)
        this.renderSun(ctx, w, h)
        this.renderDayText(ctx, w, h, day)
        this.renderSkipButton(ctx)

        ctx.restore()
    }

    renderMoon(ctx, w, h) {
        if (this.moonAlpha <= 0) return
        const moonX = w * 0.85
        const moonY = h * 0.12

        ctx.save()
        ctx.globalAlpha = this.moonAlpha
        iconManager.draw(ctx, 'moon', moonX, moonY, { size: 40 })
        ctx.restore()
    }

    renderStars(ctx, w, h) {
        const time = this.elapsed
        this.stars.forEach(star => {
            const flicker = 0.5 + 0.5 * Math.sin(time * 3 + star.phase)
            const alpha = this.overlayAlpha * flicker
            if (alpha <= 0.02) return

            ctx.save()
            ctx.globalAlpha = alpha
            ctx.fillStyle = '#FFE2A4'
            ctx.strokeStyle = '#2C2418'
            ctx.lineWidth = 1.2

            ctx.beginPath()
            ctx.arc(star.x, star.y, 3.5, 0, Math.PI * 2)
            ctx.fill()
            ctx.stroke()

            ctx.strokeStyle = '#2C2418'
            ctx.lineWidth = 1
            ctx.lineCap = 'round'
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2 + time * 0.5
                ctx.beginPath()
                ctx.moveTo(star.x, star.y)
                ctx.lineTo(
                    star.x + Math.cos(angle) * 6,
                    star.y + Math.sin(angle) * 6
                )
                ctx.stroke()
            }

            ctx.restore()
        })
    }

    renderZZZs(ctx) {
        this.zParticles.forEach(p => {
            if (!p.active || p.alpha <= 0) return

            const x = this.bedX + p.offsetX + Math.sin(this.elapsed * 2 + p.startTime) * 5
            const y = this.bedY + p.offsetY - p.progress * 100
            const scale = 0.8 + p.progress * 0.6

            ctx.save()
            ctx.globalAlpha = p.alpha
            ctx.translate(x, y)
            ctx.scale(scale, scale)

            ctx.fillStyle = '#FFFFFF'
            ctx.strokeStyle = '#9BB5C9'
            ctx.lineWidth = 1.2

            ctx.font = 'bold 20px sans-serif'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'

            ctx.strokeText('Z', 0, 0)
            ctx.fillText('Z', 0, 0)

            ctx.restore()
        })
    }

    renderSun(ctx, w, h) {
        if (this.sunAlpha <= 0) return
        const sunX = w / 2
        const sunY = h * 0.15

        ctx.save()
        ctx.globalAlpha = this.sunAlpha
        iconManager.draw(ctx, 'sun', sunX, sunY, { size: 36 })
        ctx.restore()
    }

    renderDayText(ctx, w, h, day) {
        if (this.textAlpha <= 0) return

        ctx.save()
        ctx.globalAlpha = this.textAlpha

        ctx.fillStyle = '#5D4037'
        ctx.strokeStyle = '#FFF5E6'
        ctx.lineWidth = 2
        ctx.font = 'bold 16px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const textY1 = h * 0.28
        ctx.strokeText(`第 ${day} 天`, w / 2, textY1)
        ctx.fillText(`第 ${day} 天`, w / 2, textY1)

        ctx.font = '12px sans-serif'
        const textY2 = h * 0.33
        ctx.strokeText('新的一天开始了...', w / 2, textY2)
        ctx.fillText('新的一天开始了...', w / 2, textY2)

        ctx.restore()
    }

    renderSkipButton(ctx) {
        if (this.skipButton.alpha <= 0) return

        const btn = this.skipButton

        ctx.save()
        ctx.globalAlpha = this.skipButton.alpha

        ctx.fillStyle = this.skipHovered ? '#FFEED6' : '#FFF5E6'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.5

        ctx.beginPath()
        ctx.moveTo(btn.x + 6, btn.y)
        ctx.lineTo(btn.x + btn.w - 6, btn.y)
        ctx.quadraticCurveTo(btn.x + btn.w, btn.y, btn.x + btn.w, btn.y + 6)
        ctx.lineTo(btn.x + btn.w, btn.y + btn.h - 6)
        ctx.quadraticCurveTo(btn.x + btn.w, btn.y + btn.h, btn.x + btn.w - 6, btn.y + btn.h)
        ctx.lineTo(btn.x + 6, btn.y + btn.h)
        ctx.quadraticCurveTo(btn.x, btn.y + btn.h, btn.x, btn.y + btn.h - 6)
        ctx.lineTo(btn.x, btn.y + 6)
        ctx.quadraticCurveTo(btn.x, btn.y, btn.x + 6, btn.y)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#5D4037'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('跳过', btn.x + btn.w / 2, btn.y + btn.h / 2)

        ctx.restore()

        this.game.uiManager.clearAll()
        this.game.uiManager.addButton(btn.x, btn.y, btn.w, btn.h, '', () => {
            this.skip()
        }, { bgColor: 'transparent' })
    }

    handleTouchStart(x, y) {
        const btn = this.skipButton
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
            this.skipHovered = true
            return true
        }
        return this.isActive()
    }

    handleTouchEnd(x, y) {
        const btn = this.skipButton
        if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
            this.skipHovered = false
            this.skip()
            return true
        }
        this.skipHovered = false
        return false
    }

    isActive() {
        return this.state !== 'idle' && this.state !== 'done'
    }
}
