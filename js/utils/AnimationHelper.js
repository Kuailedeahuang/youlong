import animationManager from './animationManager.js'

export default class AnimationHelper {
    constructor(game) {
        this.game = game
    }

    getStatPositions() {
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        const padding = 12
        const panelH = 100
        const panelY = h - panelH - padding
        const leftSectionX = padding + 35
        const rightSectionX = w - padding - 35
        const topRowY = panelY + 30
        const bottomRowY = panelY + panelH - 30

        return {
            health: { x: leftSectionX + 38, y: topRowY },
            energy: { x: rightSectionX - 45, y: topRowY },
            mood: { x: leftSectionX + 38, y: bottomRowY },
            reputation: { x: rightSectionX - 45, y: bottomRowY },
            money: { x: w - 80, y: 20 },
            privateLoan: { x: w - 80, y: 50 },
            bankLoan: { x: w - 80, y: 35 },
            bankDeposit: { x: w - 80, y: 35 }
        }
    }

    playDelayedAnimations() {
        const anims = this.game.gameState.getAndClearDelayedAnimations()
        if (anims.length === 0) return

        const positions = this.getStatPositions()

        anims.forEach((anim, index) => {
            setTimeout(() => {
                const pos = positions[anim.statType]
                if (pos) {
                    const color = anim.color || this.getDefaultColor(anim.statType)
                    if (anim.type === 'increase') {
                        animationManager.addIncreaseAnimation(pos.x, pos.y, anim.value, anim.label, color)
                    } else if (anim.type === 'decrease') {
                        animationManager.addDecreaseAnimation(pos.x, pos.y, anim.value, anim.label, color)
                    } else if (anim.type === 'loan') {
                        animationManager.addLoanAnimation(pos.x, pos.y, anim.value, anim.label, color)
                    }
                }
            }, index * 200)
        })
    }

    getDefaultColor(statType) {
        const colorMap = {
            money: '#D4A574',
            health: '#7CB87C',
            energy: '#7BA3C9',
            mood: '#D49BA3',
            reputation: '#B8A3C9',
            privateLoan: '#C17B6B',
            bankLoan: '#7BA3C9',
            bankDeposit: '#7CB87C'
        }
        return colorMap[statType] || '#5D4037'
    }
}
