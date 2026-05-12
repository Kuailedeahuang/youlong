export default class LoanSystem {
    constructor(game) {
        this.game = game
    }

    showLoanModal(onComplete) {
        const state = this.game.gameState.data

        const actions = []

        actions.push({
            text: '借贷',
            callback: () => this.doPrivateLoan(onComplete),
            color: '#e74c3c'
        })

        if (state.privateLoan > 0) {
            actions.push({
                text: '还款',
                callback: () => this.doPrivateRepay(onComplete),
                color: '#27ae60'
            })
        }

        this.game.uiManager.addModal({
            type: 'action',
            title: '个人借贷',
            content: `日利率: 2.5%\n逾期惩罚严厉\n\n当前欠款: ${state.privateLoan} 金币`,
            actions: actions,
            height: 180
        })
    }

    doPrivateLoan(onComplete) {
        const state = this.game.gameState.data
        this.game.uiManager.addModal({
            type: 'trade',
            title: '个人借贷',
            content: '日利率: 2.5%\n逾期惩罚严厉',
            itemName: '借贷金额',
            price: 1,
            quantity: 1000,
            maxQuantity: 120000,
            total: 1000,
            tradeType: 'loan',
            height: 240,
            onConfirm: (qty) => {
                state.privateLoan += qty
                state.money += qty
                this.game.gameState.save()

                this.game.gameState.addDelayedAnimation('loan', qty, 'privateLoan')
                this.game.gameState.addDelayedAnimation('increase', qty, 'money')

                if (onComplete) onComplete()
            }
        })
    }

    doPrivateRepay(onComplete) {
        const state = this.game.gameState.data
        if (state.privateLoan <= 0) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '无需还款',
                content: '您当前没有私人贷款',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }

        const maxRepay = Math.min(state.privateLoan, state.money)
        this.game.uiManager.addModal({
            type: 'trade',
            title: '私人还款',
            content: `当前欠款: ${state.privateLoan}金币`,
            itemName: '还款金额',
            price: 1,
            quantity: maxRepay,
            maxQuantity: maxRepay,
            total: maxRepay,
            tradeType: 'repay',
            height: 240,
            onConfirm: (qty) => {
                if (state.money >= qty && state.privateLoan >= qty) {
                    state.money -= qty
                    state.privateLoan -= qty
                    this.game.gameState.save()

                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money')
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'privateLoan')

                    if (onComplete) onComplete()
                }
            }
        })
    }
}
