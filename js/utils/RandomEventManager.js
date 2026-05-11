import { GAME_CONFIG } from '../data/gameConfig.js'

export default class RandomEventManager {
    constructor(game) {
        this.game = game
        this.goodEvents = [
            {
                text: '路边捡到钱包，获得80金币',
                effect: (state) => { state.money += 80 },
                anim: () => this.game.gameState.addDelayedAnimation('increase', 80, 'money', '金币', '#f39c12')
            },
            {
                text: '遇到好心人，心情+15',
                effect: (state) => { state.mood = Math.min(100, state.mood + 15) },
                anim: () => this.game.gameState.addDelayedAnimation('increase', 15, 'mood', '心情', '#e91e63')
            },
            {
                text: '收到红包，获得150金币',
                effect: (state) => { state.money += 150 },
                anim: () => this.game.gameState.addDelayedAnimation('increase', 150, 'money', '金币', '#f39c12')
            },
            {
                text: '帮助老人，名誉+8',
                effect: (state) => { state.reputation = Math.min(100, state.reputation + 8) },
                anim: () => this.game.gameState.addDelayedAnimation('increase', 8, 'reputation', '名誉', '#9b59b6')
            },
            {
                text: '睡了个好觉，心情+10，健康+5',
                effect: (state) => {
                    state.mood = Math.min(100, state.mood + 10)
                    state.health = Math.min(100, state.health + 5)
                },
                anim: () => {
                    this.game.gameState.addDelayedAnimation('increase', 10, 'mood', '心情', '#e91e63')
                    this.game.gameState.addDelayedAnimation('increase', 5, 'health', '健康', '#27ae60')
                }
            }
        ]

        this.badEvents = [
            {
                text: '不小心丢了钱包，损失40金币',
                effect: (state) => { state.money = Math.max(0, state.money - 40) },
                anim: () => this.game.gameState.addDelayedAnimation('decrease', 40, 'money', '金币', '#f39c12')
            },
            {
                text: '被小偷偷了，损失30金币',
                effect: (state) => { state.money = Math.max(0, state.money - 30) },
                anim: () => this.game.gameState.addDelayedAnimation('decrease', 30, 'money', '金币', '#f39c12')
            },
            {
                text: '身体不适，健康-8',
                effect: (state) => { state.health = Math.max(0, state.health - 8) },
                anim: () => this.game.gameState.addDelayedAnimation('decrease', 8, 'health', '健康', '#27ae60')
            },
            {
                text: '被误解，名誉-8',
                effect: (state) => { state.reputation = Math.max(-100, state.reputation - 8) },
                anim: () => this.game.gameState.addDelayedAnimation('decrease', 8, 'reputation', '名誉', '#9b59b6')
            },
            {
                text: '做噩梦了，心情-10',
                effect: (state) => { state.mood = Math.max(0, state.mood - 10) },
                anim: () => this.game.gameState.addDelayedAnimation('decrease', 10, 'mood', '心情', '#e91e63')
            }
        ]
    }

    triggerRandomEvent(callback) {
        const state = this.game.gameState.data
        const eventChance = Math.random()
        const config = GAME_CONFIG.randomEvent

        if (eventChance < config.probability) {
            const isGoodEvent = Math.random() < config.goodEventProbability
            const events = isGoodEvent ? this.goodEvents : this.badEvents
            const event = events[Math.floor(Math.random() * events.length)]

            event.effect(state)
            event.anim()

            setTimeout(() => {
                this.game.uiManager.addModal({
                    type: 'confirm',
                    title: isGoodEvent ? '好事发生' : '倒霉事',
                    content: event.text,
                    confirmText: '知道了',
                    singleButton: true,
                    onConfirm: () => {
                        if (callback) callback()
                    }
                })
            }, 500)
        } else {
            if (callback) callback()
        }
    }
}
