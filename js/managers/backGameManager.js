import { GAME_CONFIG } from '../data/gameConfig.js'
import WorkSystem from '../systems/WorkSystem.js'
import GymSystem from '../systems/GymSystem.js'
import BankSystem from '../systems/BankSystem.js'
import HospitalSystem from '../systems/HospitalSystem.js'
import LoanSystem from '../systems/LoanSystem.js'

export default class BackGameManager {
    constructor(game) {
        this.game = game
        this.workSystem = new WorkSystem(game)
        this.gymSystem = new GymSystem(game)
        this.bankSystem = new BankSystem(game)
        this.hospitalSystem = new HospitalSystem(game)
        this.loanSystem = new LoanSystem(game)
    }

    goHome() {
        this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
    }

    enterMarket() {
        const state = this.game.gameState.data

        if (!state.marketEnteredToday) {
            if (state.energy < 2) {
                this.game.uiManager.addModal({
                    type: 'confirm',
                    title: '精力不足',
                    content: '今日首次进入市场需要消耗2点精力\n当前精力不足，无法进入市场',
                    confirmText: '知道了',
                    onConfirm: () => {}
                })
                return
            }

            state.energy -= 2
            state.marketEnteredToday = true
            this.game.gameState.save()

            this.game.gameState.addDelayedAnimation('decrease', 2, 'energy')
        }

        this.game.sceneManager.switchTo('market')
    }

    endDay() {
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '结束今日',
            content: '确定结束今天吗?\n将自动扣除日常消费',
            confirmText: '确定',
            onConfirm: () => {
                this.game.gameState.nextDay()
                this.game.dailyCheck()
                this.goHome()
            }
        })
    }

    showWorkModal() {
        this.workSystem.showWorkModal(() => this.goHome())
    }

    doWork(isOvertime, salary) {
        this.workSystem.doWork(isOvertime, salary, () => this.goHome())
    }

    doGym() {
        this.gymSystem.showGymModal(() => this.goHome())
    }

    showBankModal() {
        this.bankSystem.showBankModal(() => this.goHome())
    }

    doHospital() {
        this.hospitalSystem.showHospitalModal(() => this.goHome())
    }

    showLoanModal() {
        this.loanSystem.showLoanModal(() => this.goHome())
    }

    doPrivateLoan() {
        this.loanSystem.doPrivateLoan(() => this.goHome())
    }

    doPrivateRepay() {
        this.loanSystem.doPrivateRepay(() => this.goHome())
    }

    doCharity() {
        const state = this.game.gameState.data

        this.game.uiManager.addModal({
            type: 'action',
            title: '公益活动',
            content: '选择参与方式',
            actions: [
                { text: '捐款', callback: () => this.doDonation(), color: '#D4A574' },
                { text: '体力劳动', callback: () => this.doVolunteerWork(), color: '#7CB87C' }
            ],
            height: 160
        })
    }

    doDonation() {
        const state = this.game.gameState.data

        if (state.money < 50) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '金币不足',
                content: '需要至少50金币才能捐款',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }

        this.game.uiManager.addModal({
            type: 'trade',
            title: '捐款',
            content: '消耗金币\n名誉+5~+10\n心情+5~+10',
            itemName: '捐款金额',
            price: 1,
            quantity: 50,
            maxQuantity: state.money,
            total: 50,
            tradeType: 'donation',
            height: 220,
            onConfirm: (qty) => {
                if (state.money >= qty) {
                    const reputationGain = 5 + Math.floor(Math.random() * 6)
                    const moodGain = 5 + Math.floor(Math.random() * 6)
                    state.money -= qty
                    state.reputation = Math.min(100, state.reputation + reputationGain)
                    state.mood = Math.min(100, state.mood + moodGain)
                    this.game.gameState.save()

                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money')
                    this.game.gameState.addDelayedAnimation('increase', reputationGain, 'reputation')
                    this.game.gameState.addDelayedAnimation('increase', moodGain, 'mood')

                    this.goHome()
                }
            }
        })
    }

    doVolunteerWork() {
        const state = this.game.gameState.data

        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '需要1点精力才能参与体力劳动',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }

        const reputationGain = 5 + Math.floor(Math.random() * 6)
        const moodGain = 5 + Math.floor(Math.random() * 6)
        state.energy -= 1
        state.reputation = Math.min(100, state.reputation + reputationGain)
        state.mood = Math.min(100, state.mood + moodGain)
        this.game.gameState.save()

        this.game.gameState.addDelayedAnimation('decrease', 1, 'energy')
        this.game.gameState.addDelayedAnimation('increase', reputationGain, 'reputation')
        this.game.gameState.addDelayedAnimation('increase', moodGain, 'mood')

        this.game.uiManager.addModal({
            type: 'confirm',
            title: '公益活动完成',
            content: `你参与了体力劳动！\n\n消耗: 1精力\n获得: 名誉+${reputationGain}, 心情+${moodGain}`,
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {
                this.goHome()
            }
        })
    }

    doEntertainment() {
        const state = this.game.gameState.data

        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法娱乐',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }

        this.game.uiManager.addModal({
            type: 'confirm',
            title: '娱乐',
            content: '消耗1精力\n花费50金币\n心情+15~+25',
            confirmText: '娱乐',
            onConfirm: () => {
                if (state.money >= 50) {
                    const moodGain = 15 + Math.floor(Math.random() * 11)
                    state.energy -= 1
                    state.money -= 50
                    state.mood = Math.min(100, state.mood + moodGain)
                    state.consecutiveGymDays = 0
                    this.game.gameState.save()

                    this.game.gameState.addDelayedAnimation('decrease', 1, 'energy')
                    this.game.gameState.addDelayedAnimation('decrease', 50, 'money')
                    this.game.gameState.addDelayedAnimation('increase', moodGain, 'mood')

                    this.goHome()
                }
            }
        })
    }
}
