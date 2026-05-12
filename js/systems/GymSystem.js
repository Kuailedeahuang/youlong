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
                this.doExercise(onComplete)
            }
        })
    }

    doExercise(onComplete) {
        const state = this.game.gameState.data
        const config = GAME_CONFIG.gym

        state.energy -= config.energyCost
        state.money -= config.cost
        state.health = Math.min(100, state.health + config.healthRecovery)
        
        if (config.moodBonus) {
            state.mood = Math.min(100, state.mood + config.moodBonus)
        }
        
        state.consecutiveGymDays++

        if (state.consecutiveGymDays >= 3) {
            state.maxEnergy = Math.min(15, state.maxEnergy + 1)
        }

        this.game.gameState.save()

        this.game.gameState.addDelayedAnimation('decrease', config.energyCost, 'energy')
        this.game.gameState.addDelayedAnimation('decrease', config.cost, 'money')
        this.game.gameState.addDelayedAnimation('increase', config.healthRecovery, 'health')
        
        if (config.moodBonus) {
            this.game.gameState.addDelayedAnimation('increase', config.moodBonus, 'mood')
        }

        if (onComplete) onComplete()
    }
}
