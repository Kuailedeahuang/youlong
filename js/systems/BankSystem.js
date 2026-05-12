import { GAME_CONFIG } from '../data/gameConfig.js'

export default class BankSystem {
    constructor(game) {
        this.game = game
    }

    showBankModal(onComplete) {
        const state = this.game.gameState.data

        const jobLoanInfo = GAME_CONFIG.jobs.map(job => ({
            level: job.level,
            title: job.title,
            loanLimit: job.level >= 3 ? GAME_CONFIG.bank.loanLimitLevel3 : GAME_CONFIG.bank.loanLimitLevel1
        }))

        let jobContent = '【岗位借款额度】\n'
        jobLoanInfo.forEach(job => {
            const isCurrent = state.jobLevel === job.level
            const marker = isCurrent ? '★' : '  '
            jobContent += `${marker}Lv.${job.level} ${job.title}: ${job.loanLimit.toLocaleString()}金币\n`
        })

        const actions = [
            { text: '存款', callback: () => this.doDeposit(onComplete) },
            { text: '贷款', callback: () => this.doLoan(onComplete) }
        ]

        if (state.bankLoan > 0) {
            actions.push({ text: '还款', callback: () => this.doRepay(onComplete) })
        }

        this.game.uiManager.addModal({
            type: 'action',
            title: '银行',
            content: `存款利率: 每${GAME_CONFIG.bank.depositInterestDays}天${GAME_CONFIG.bank.depositInterestRate * 100}%  |  贷款利率: 每${GAME_CONFIG.bank.loanInterestDays}天${GAME_CONFIG.bank.loanInterestRate * 100}%\n当前欠款: ${state.bankLoan.toLocaleString()} 金币\n\n${jobContent}`,
            actions: actions,
            height: 320
        })
    }

    doDeposit(onComplete) {
        const state = this.game.gameState.data
        this.game.uiManager.addModal({
            type: 'trade',
            title: '存款',
            content: '',
            itemName: '存款金额',
            price: 1,
            quantity: 100,
            maxQuantity: state.money,
            total: 100,
            tradeType: 'deposit',
            height: 220,
            onConfirm: (qty) => {
                if (state.money >= qty) {
                    state.money -= qty
                    state.bankDeposit += qty
                    this.game.gameState.save()

                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money')
                    this.game.gameState.addDelayedAnimation('increase', qty, 'bankDeposit')

                    if (onComplete) onComplete()
                }
            }
        })
    }

    doLoan(onComplete) {
        const state = this.game.gameState.data
        const maxLoan = state.jobLevel >= 3 ? GAME_CONFIG.bank.loanLimitLevel3 : GAME_CONFIG.bank.loanLimitLevel1
        this.game.uiManager.addModal({
            type: 'trade',
            title: '银行贷款',
            content: '',
            itemName: '贷款金额',
            price: 1,
            quantity: 1000,
            maxQuantity: maxLoan - state.bankLoan,
            total: 1000,
            tradeType: 'loan',
            height: 220,
            onConfirm: (qty) => {
                state.bankLoan += qty
                state.money += qty
                this.game.gameState.save()

                this.game.gameState.addDelayedAnimation('loan', qty, 'bankLoan')
                this.game.gameState.addDelayedAnimation('increase', qty, 'money')

                if (onComplete) onComplete()
            }
        })
    }

    doRepay(onComplete) {
        const state = this.game.gameState.data
        if (state.bankLoan <= 0) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '无需还款',
                content: '您当前没有银行贷款',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }

        const maxRepay = Math.min(state.bankLoan, state.money)
        this.game.uiManager.addModal({
            type: 'trade',
            title: '银行还款',
            content: `当前欠款: ${state.bankLoan.toLocaleString()}金币`,
            itemName: '还款金额',
            price: 1,
            quantity: maxRepay,
            maxQuantity: maxRepay,
            total: maxRepay,
            tradeType: 'repay',
            height: 220,
            onConfirm: (qty) => {
                if (state.money >= qty && state.bankLoan >= qty) {
                    state.money -= qty
                    state.bankLoan -= qty
                    this.game.gameState.save()

                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money')
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'bankLoan')

                    if (onComplete) onComplete()
                }
            }
        })
    }
}
