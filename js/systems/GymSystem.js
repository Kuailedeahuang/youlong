import { GAME_CONFIG } from '../data/gameConfig.js'

export default class GymSystem {
    constructor(game) {
        this.game = game
    }

    showGymModal(onComplete) {
        const state = this.game.gameState.data
        const config = GAME_CONFIG.gym

        if (state.energy < config.energyCost) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法健身',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }

        if (state.money < config.cost) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '金币不足',
                content: `需要${config.cost}金币`,
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }

        this.game.uiManager.addModal({
            type: 'confirm',
            title: '健身房',
            content: `消耗${config.energyCost}精力，花费${config.cost}金币\n健康+${config.healthRecovery}，心情+${config.moodBonus || 0}\n连续健身可提升精力上限`,
            confirmText: '健身',
            onConfirm: () => {
                this._startGymWithMiniGame(onComplete)
            }
        })
    }

    _startGymWithMiniGame(onComplete) {
        this.game.startMiniGame('gym', {}, (successRate) => {
            this.doExercise(onComplete, successRate)
        })
    }

    doExercise(onComplete, successRate = 1.0) {
        const state = this.game.gameState.data
        const config = GAME_CONFIG.gym

        const adjustedHealth = Math.floor(config.healthRecovery * successRate)
        const adjustedMood = config.moodBonus ? Math.floor(config.moodBonus * successRate) : 0

        state.energy -= config.energyCost
        state.money -= config.cost
        state.health = Math.min(100, state.health + adjustedHealth)

        if (adjustedMood > 0) {
            state.mood = Math.min(100, state.mood + adjustedMood)
        }

        state.consecutiveGymDays++

        if (state.consecutiveGymDays >= 3) {
            state.maxEnergy = Math.min(15, state.maxEnergy + 1)
            state.consecutiveGymDays = 0
        }

        this.game.gameState.save()

        this.game.gameState.addDelayedAnimation('decrease', config.energyCost, 'energy')
        this.game.gameState.addDelayedAnimation('decrease', config.cost, 'money')
        this.game.gameState.addDelayedAnimation('increase', adjustedHealth, 'health')

        if (adjustedMood > 0) {
            this.game.gameState.addDelayedAnimation('increase', adjustedMood, 'mood')
        }

        let resultContent = `健康+${adjustedHealth}`
        if (adjustedMood > 0) {
            resultContent += `，心情+${adjustedMood}`
        }

        if (successRate < 1.0) {
            let ratingLabel = ''
            if (successRate >= 0.8) {
                ratingLabel = '表现良好'
            } else {
                ratingLabel = '表现不佳'
            }
            resultContent += `\n节奏锻炼：${ratingLabel}（${Math.round(successRate * 100)}%效果）`
        } else if (successRate >= 1.0) {
            resultContent += '\n节奏锻炼：完美表现！'
        }

        if (state.consecutiveGymDays >= 3) {
            resultContent += '\n连续健身3天，精力上限+1！'
        }

        this.game.uiManager.addModal({
            type: 'confirm',
            title: '健身完成',
            content: resultContent,
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {
                if (onComplete) onComplete()
            }
        })
    }
}
