import MiniGameBase from './MiniGameBase.js'
import { GAME_CONFIG } from '../data/gameConfig.js'

export default class WorkMiniGame extends MiniGameBase {
    constructor(game, timeProvider, onComplete) {
        super(game, timeProvider, onComplete)

        const config = GAME_CONFIG.miniGame.work
        this.totalTargets = config.totalTargets
        this.requiredHits = config.requiredHits
        this.timeLimit = config.timeLimit
        this.targetRadius = config.targetRadius
        this.targetLifetime = config.targetLifetime
        this.touchRadius = config.touchRadius
        this.resultDisplayTime = config.resultDisplayTime

        this.targets = []
        this.hitCount = 0
        this.gameElapsedMs = 0
        this.timeUp = false
        this.successRate = 0
        this.resultTimer = 0
    }

    _initState(config) {
        this.targets = []
        this.hitCount = 0
        this.gameElapsedMs = 0
        this.timeUp = false
        this.successRate = 0
        this.resultTimer = 0
        this._startElapsed = this.time.elapsed

        this._spawnTargets()
    }

    _spawnTargets() {
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        const effectiveTime = this.timeLimit - this.targetLifetime
        const spawnInterval = effectiveTime / (this.totalTargets - 1)

        const minDist = this.touchRadius * 2.5

        for (let i = 0; i < this.totalTargets; i++) {
            let x, y
            let attempts = 0
            let valid = false

            while (!valid && attempts < 20) {
                x = 60 + Math.random() * (w - 120)
                y = 140 + Math.random() * (h - 280)
                valid = true

                for (const existing of this.targets) {
                    const dx = x - existing.x
                    const dy = y - existing.y
                    if (Math.sqrt(dx * dx + dy * dy) < minDist) {
                        valid = false
                        break
                    }
                }
                attempts++
            }

            const availableTime = this.timeLimit - i * spawnInterval
            const lifetime = Math.min(this.targetLifetime, availableTime)

            this.targets.push({
                x,
                y,
                radius: this.targetRadius,
                hit: false,
                expired: false,
                spawnOffsetMs: i * spawnInterval,
                lifetime,
                opacity: 1.0
            })
        }
    }

    _updateLogic(deltaTime) {
        this.gameElapsedMs = (this.time.elapsed - this._startElapsed) * 1000

        if (this.phase === 'playing') {
            for (const target of this.targets) {
                if (target.hit || target.expired) continue

                const age = this.gameElapsedMs - target.spawnOffsetMs
                if (age < 0) continue

                if (age >= target.lifetime) {
                    target.expired = true
                    target.opacity = 0
                } else if (age >= target.lifetime * 0.7) {
                    target.opacity = 1.0 - (age - target.lifetime * 0.7) / (target.lifetime * 0.3)
                }
            }

            if (this.gameElapsedMs >= this.timeLimit && !this.timeUp) {
                this.timeUp = true
                this._finish()
            }
        } else if (this.phase === 'result') {
            this.resultTimer -= deltaTime
            if (this.resultTimer <= 0) {
                this.complete(this.successRate)
            }
        }
    }

    _renderUI(renderer) {
        const ctx = renderer.ctx
        const w = renderer.width
        const h = renderer.height

        if (this.phase === 'result') {
            this._renderResult(ctx, w, h)
            return
        }

        ctx.fillStyle = '#FFE080'
        ctx.font = 'bold 18px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('专注挑战！快速点击目标', w / 2, 50)

        for (const target of this.targets) {
            if (target.hit) {
                ctx.fillStyle = 'rgba(129, 199, 132, 0.6)'
                ctx.beginPath()
                ctx.arc(target.x, target.y, target.radius * 0.8, 0, Math.PI * 2)
                ctx.fill()

                ctx.fillStyle = '#FFFFFF'
                ctx.font = 'bold 22px sans-serif'
                ctx.fillText('✓', target.x - 7, target.y + 8)
            } else if (!target.expired && this.gameElapsedMs >= target.spawnOffsetMs) {
                const age = this.gameElapsedMs - target.spawnOffsetMs

                ctx.save()
                ctx.globalAlpha = Math.max(0, target.opacity)

                const pulse = Math.sin(age * 0.005) * 0.1 + 1.0
                const drawRadius = target.radius * pulse

                ctx.beginPath()
                ctx.arc(target.x, target.y, drawRadius, 0, Math.PI * 2)
                ctx.fillStyle = '#FFD700'
                ctx.fill()
                ctx.strokeStyle = '#FF8C00'
                ctx.lineWidth = 2.5
                ctx.stroke()

                ctx.beginPath()
                ctx.arc(target.x, target.y, drawRadius * 0.5, 0, Math.PI * 2)
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
                ctx.lineWidth = 1.5
                ctx.stroke()

                const lifeRatio = 1 - age / target.lifetime
                if (lifeRatio > 0 && lifeRatio <= 1) {
                    ctx.beginPath()
                    ctx.arc(target.x, target.y, drawRadius + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * lifeRatio)
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
                    ctx.lineWidth = 2
                    ctx.stroke()
                }

                ctx.restore()
            }
        }

        this._renderParticles(ctx)

        const progressWidth = 220
        const progressHeight = 14
        const progressX = (w - progressWidth) / 2
        const progressY = 80

        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
        this._drawRoundRect(ctx, progressX, progressY, progressWidth, progressHeight, 7)
        ctx.fill()

        const hitProgress = Math.min(1, this.hitCount / this.requiredHits)
        if (hitProgress > 0) {
            ctx.fillStyle = '#81C784'
            this._drawRoundRect(ctx, progressX, progressY, progressWidth * hitProgress, progressHeight, 7)
            ctx.fill()
        }

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.lineWidth = 1
        this._drawRoundRect(ctx, progressX, progressY, progressWidth, progressHeight, 7)
        ctx.stroke()

        ctx.fillStyle = '#FFFFFF'
        ctx.font = '13px sans-serif'
        ctx.fillText(`已点击: ${this.hitCount}/${this.requiredHits}`, w / 2, progressY + progressHeight + 18)

        const timeLeft = Math.max(0, this.timeLimit - this.gameElapsedMs)
        const timeColor = timeLeft < 2000 ? '#E57373' : '#FFFFFF'
        ctx.fillStyle = timeColor
        ctx.font = 'bold 15px sans-serif'
        ctx.fillText(`剩余: ${(timeLeft / 1000).toFixed(1)}s`, w / 2, progressY + progressHeight + 40)
    }

    _handleTouch(x, y) {
        for (const target of this.targets) {
            if (target.hit || target.expired) continue

            const age = this.gameElapsedMs - target.spawnOffsetMs
            if (age < 0) continue

            const dx = x - target.x
            const dy = y - target.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance <= this.touchRadius) {
                target.hit = true
                this.hitCount++
                this._spawnParticles(x, y, ['#FFD700', '#FF8C00', '#FFE080', '#FFFFFF'])
                return true
            }
        }

        return false
    }

    _finish() {
        this.phase = 'result'
        this.resultTimer = this.resultDisplayTime / 1000

        if (this.hitCount >= this.requiredHits) {
            this.successRate = 1.0
        } else if (this.hitCount >= Math.ceil(this.requiredHits * 0.5)) {
            this.successRate = 0.6
        } else {
            this.successRate = 0.3
        }
    }

    _renderResult(ctx, w, h) {
        let title = ''
        let titleColor = '#FFFFFF'
        let detail = ''

        if (this.successRate >= 1.0) {
            title = '完美！'
            titleColor = '#81C784'
            detail = `点击 ${this.hitCount}/${this.requiredHits} - 获得100%薪资`
        } else if (this.successRate >= 0.6) {
            title = '不错！'
            titleColor = '#FFE080'
            detail = `点击 ${this.hitCount}/${this.requiredHits} - 获得60%薪资`
        } else {
            title = '还需努力...'
            titleColor = '#E57373'
            detail = `点击 ${this.hitCount}/${this.requiredHits} - 获得30%薪资`
        }

        ctx.fillStyle = titleColor
        ctx.font = 'bold 28px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(title, w / 2, h * 0.38)

        ctx.fillStyle = '#FFFFFF'
        ctx.font = '15px sans-serif'
        ctx.fillText(detail, w / 2, h * 0.38 + 45)
    }
}
