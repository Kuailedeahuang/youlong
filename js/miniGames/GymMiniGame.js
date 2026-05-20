import MiniGameBase from './MiniGameBase.js'
import { GAME_CONFIG } from '../data/gameConfig.js'

export default class GymMiniGame extends MiniGameBase {
    constructor(game, timeProvider, onComplete) {
        super(game, timeProvider, onComplete)

        const config = GAME_CONFIG.miniGame.gym
        this.totalRounds = config.totalRounds
        this.sweetZoneBaseRatio = config.sweetZoneWidthRatio
        this.sweetZoneDecrement = config.sweetZoneDecrement
        this.goodZoneExtraRatio = config.goodZoneExtraRatio
        this.baseSpeed = config.baseSpeed
        this.speedIncrement = config.speedIncrement
        this.resultDisplayTime = config.resultDisplayTime
        this.summaryDisplayTime = config.summaryDisplayTime
        this.roundTimeoutMs = 5000

        this.round = 0
        this.results = []
        this.barX = 0
        this.barSpeed = 0
        this.barDirection = 1
        this.trackWidth = 0
        this.trackX = 0
        this.sweetZoneStart = 0
        this.sweetZoneEnd = 0
        this.goodZoneStart = 0
        this.goodZoneEnd = 0
        this.successRate = 0
        this.resultTimer = 0
        this.roundStartElapsed = 0
    }

    _initState(config) {
        this.round = 0
        this.results = []
        this.successRate = 0
        this.resultTimer = 0

        const w = this.game.renderer.width
        this.trackWidth = w * 0.72
        this.trackX = (w - this.trackWidth) / 2

        this._startNextRound()
    }

    _startNextRound() {
        this.round++
        this.phase = 'playing'

        this.barX = 0
        this.barDirection = 1
        this.barSpeed = this.baseSpeed + this.round * this.speedIncrement
        this.roundStartElapsed = this.time.elapsed

        const currentSweetRatio = Math.max(0.10, this.sweetZoneBaseRatio - (this.round - 1) * this.sweetZoneDecrement)
        const sweetZoneWidth = this.trackWidth * currentSweetRatio
        this.sweetZoneStart = (this.trackWidth - sweetZoneWidth) / 2
        this.sweetZoneEnd = this.sweetZoneStart + sweetZoneWidth

        const goodExtra = this.trackWidth * this.goodZoneExtraRatio
        this.goodZoneStart = this.sweetZoneStart - goodExtra
        this.goodZoneEnd = this.sweetZoneEnd + goodExtra
    }

    _updateLogic(deltaTime) {
        if (this.phase === 'playing') {
            const moveAmount = this.barSpeed * this.time.normalizedDelta
            this.barX += moveAmount * this.barDirection

            if (this.barX >= this.trackWidth) {
                this.barX = this.trackWidth
                this.barDirection = -1
            } else if (this.barX <= 0) {
                this.barX = 0
                this.barDirection = 1
            }

            const roundElapsedMs = (this.time.elapsed - this.roundStartElapsed) * 1000
            if (roundElapsedMs >= this.roundTimeoutMs) {
                this.results.push('miss')
                this.phase = 'result'
                this.resultTimer = this.resultDisplayTime / 1000
            }
        } else if (this.phase === 'result') {
            this.resultTimer -= deltaTime
            if (this.resultTimer <= 0) {
                if (this.round >= this.totalRounds) {
                    this._finish()
                } else {
                    this._startNextRound()
                }
            }
        } else if (this.phase === 'summary') {
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

        if (this.phase === 'summary') {
            this._renderSummary(ctx, w, h)
            return
        }

        ctx.fillStyle = '#81C784'
        ctx.font = 'bold 18px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('节奏锻炼！把握时机', w / 2, 45)

        ctx.fillStyle = '#FFFFFF'
        ctx.font = '13px sans-serif'
        ctx.fillText(`回合 ${this.round}/${this.totalRounds}`, w / 2, 72)

        const trackY = h * 0.38
        const trackH = 22

        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
        this._drawRoundRect(ctx, this.trackX, trackY, this.trackWidth, trackH, 11)
        ctx.fill()

        const goodW = this.goodZoneEnd - this.goodZoneStart
        ctx.fillStyle = 'rgba(255, 224, 128, 0.18)'
        this._drawRoundRect(
            ctx,
            this.trackX + this.goodZoneStart,
            trackY - 2,
            goodW,
            trackH + 4,
            8
        )
        ctx.fill()

        const sweetW = this.sweetZoneEnd - this.sweetZoneStart
        const pulse = Math.sin(this.time.elapsed * 5) * 0.08 + 0.92
        ctx.fillStyle = `rgba(129, 199, 132, ${0.35 + pulse * 0.15})`
        this._drawRoundRect(
            ctx,
            this.trackX + this.sweetZoneStart,
            trackY - 2,
            sweetW,
            trackH + 4,
            8
        )
        ctx.fill()

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.font = '10px sans-serif'
        ctx.fillText('★ 甜蜜区 ★', this.trackX + this.sweetZoneStart + sweetW / 2, trackY + trackH / 2 + 3)

        const barW = 18
        const barH = trackH + 14
        const barX = this.trackX + this.barX - barW / 2
        const barY = trackY - 7

        ctx.save()
        ctx.shadowColor = '#FFE080'
        ctx.shadowBlur = 12
        ctx.fillStyle = '#FFE080'
        this._drawRoundRect(ctx, barX, barY, barW, barH, 6)
        ctx.fill()
        ctx.restore()

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        this._drawRoundRect(ctx, barX + 3, barY + 3, barW - 6, barH / 2 - 2, 3)
        ctx.fill()

        if (this.phase === 'result') {
            const resultY = trackY + trackH + 50
            const lastResult = this.results.length > 0 ? this.results[this.results.length - 1] : null
            let resultText = ''
            let resultColor = '#FFFFFF'

            if (lastResult === 'perfect') {
                resultText = '完美！+100%'
                resultColor = '#81C784'
            } else if (lastResult === 'good') {
                resultText = '不错！+80%'
                resultColor = '#FFE080'
            } else {
                resultText = '错过！+30%'
                resultColor = '#E57373'
            }

            ctx.fillStyle = resultColor
            ctx.font = 'bold 22px sans-serif'
            ctx.fillText(resultText, w / 2, resultY)
        }

        this._renderParticles(ctx)

        const summaryY = h * 0.72
        let perfectCount = 0
        let goodCount = 0
        let missCount = 0

        for (const r of this.results) {
            if (r === 'perfect') perfectCount++
            else if (r === 'good') goodCount++
            else missCount++
        }

        const statW = 180
        const statH = 8
        const statX = (w - statW) / 2
        const statY = summaryY

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        this._drawRoundRect(ctx, statX, statY, statW, statH, 4)
        ctx.fill()

        const pW = (perfectCount / this.totalRounds) * statW
        if (pW > 0) {
            ctx.fillStyle = '#81C784'
            this._drawRoundRect(ctx, statX, statY, pW, statH, 4)
            ctx.fill()
        }

        const gW = (goodCount / this.totalRounds) * statW
        if (gW > 0) {
            ctx.fillStyle = '#FFE080'
            this._drawRoundRect(ctx, statX + pW, statY, gW, statH, 0)
            ctx.fill()
        }

        const mW = (missCount / this.totalRounds) * statW
        if (mW > 0) {
            ctx.fillStyle = '#E57373'
            this._drawRoundRect(ctx, statX + pW + gW, statY, mW, statH, 4)
            ctx.fill()
        }

        ctx.fillStyle = '#FFFFFF'
        ctx.font = '12px sans-serif'
        ctx.fillText(`完美:${perfectCount}  不错:${goodCount}  错过:${missCount}`, w / 2, statY + statH + 20)

        if (this.phase === 'playing') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)'
            ctx.font = '12px sans-serif'
            ctx.fillText('指示条经过绿色区域时点击！', w / 2, statY + statH + 45)
        }
    }

    _handleTouch(x, y) {
        const trackY = this.game.renderer.height * 0.38
        const touchRange = 50

        if (y < trackY - touchRange || y > trackY + 22 + touchRange) {
            return false
        }

        if (x < this.trackX - touchRange || x > this.trackX + this.trackWidth + touchRange) {
            return false
        }

        const barCenter = this.barX

        let result = 'miss'

        if (barCenter >= this.sweetZoneStart && barCenter <= this.sweetZoneEnd) {
            result = 'perfect'
        } else if (barCenter >= this.goodZoneStart && barCenter <= this.goodZoneEnd) {
            result = 'good'
        }

        this.results.push(result)
        this.phase = 'result'
        this.resultTimer = this.resultDisplayTime / 1000

        if (result !== 'miss') {
            const resultY = trackY + 22 + 50
            const color = result === 'perfect' ? '#81C784' : '#FFE080'
            this._spawnParticles(this.game.renderer.width / 2, resultY - 15, [color], 6)
        }

        return true
    }

    _finish() {
        this.phase = 'summary'
        this.resultTimer = this.summaryDisplayTime / 1000

        let perfectCount = 0
        let goodCount = 0

        for (const r of this.results) {
            if (r === 'perfect') perfectCount++
            if (r === 'good') goodCount++
        }

        const hitCount = perfectCount + goodCount
        const hitThreshold = Math.ceil(this.totalRounds * 0.8)
        const goodThreshold = Math.ceil(this.totalRounds * 0.4)

        if (hitCount >= hitThreshold) {
            this.successRate = 1.0
        } else if (hitCount >= goodThreshold) {
            this.successRate = 0.8
        } else {
            this.successRate = 0.3
        }
    }

    _renderSummary(ctx, w, h) {
        let perfectCount = 0
        let goodCount = 0
        let missCount = 0

        for (const r of this.results) {
            if (r === 'perfect') perfectCount++
            else if (r === 'good') goodCount++
            else missCount++
        }

        let title = ''
        let titleColor = '#FFFFFF'
        let detail = ''

        if (this.successRate >= 1.0) {
            title = '完美！'
            titleColor = '#81C784'
            detail = `命中 ${perfectCount + goodCount}/${this.totalRounds} - 获得100%效果`
        } else if (this.successRate >= 0.8) {
            title = '不错！'
            titleColor = '#FFE080'
            detail = `命中 ${perfectCount + goodCount}/${this.totalRounds} - 获得80%效果`
        } else {
            title = '还需努力...'
            titleColor = '#E57373'
            detail = `命中 ${perfectCount + goodCount}/${this.totalRounds} - 获得30%效果`
        }

        ctx.fillStyle = titleColor
        ctx.font = 'bold 28px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(title, w / 2, h * 0.32)

        ctx.fillStyle = '#FFFFFF'
        ctx.font = '15px sans-serif'
        ctx.fillText(detail, w / 2, h * 0.32 + 45)

        ctx.font = '13px sans-serif'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.fillText(`完美:${perfectCount}  不错:${goodCount}  错过:${missCount}`, w / 2, h * 0.32 + 80)
    }
}
