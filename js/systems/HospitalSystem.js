import { GAME_CONFIG } from '../data/gameConfig.js'

export default class HospitalSystem {
    constructor(game) {
        this.game = game
    }

    showHospitalModal(onComplete) {
        const state = this.game.gameState.data
        const config = GAME_CONFIG.hospital

        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法去医院',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }

        const maxHeal = Math.min(config.maxHeal, 100 - state.health)
        const cost = maxHeal * config.costPerHealth

        if (maxHeal <= 0) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '健康已满',
                content: '无需治疗',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }

        this.game.uiManager.addModal({
            type: 'confirm',
            title: '医院',
            content: `消耗1精力\n花费${cost}金币\n恢复健康+${maxHeal}`,
            confirmText: '治疗',
            onConfirm: () => {
                this.doTreatment(cost, maxHeal, onComplete)
            }
        })
    }

    doTreatment(cost, healAmount, onComplete) {
        const state = this.game.gameState.data
        
        if (state.money >= cost) {
            state.energy -= 1
            state.money -= cost
            state.health = Math.min(100, state.health + healAmount)
            this.game.gameState.save()

            this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
            this.game.gameState.addDelayedAnimation('decrease', cost, 'money', '金币', '#f39c12')
            this.game.gameState.addDelayedAnimation('increase', healAmount, 'health', '健康', '#27ae60')

            if (onComplete) onComplete()
        }
    }
}
