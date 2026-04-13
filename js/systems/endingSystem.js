// 结局系统
export const ENDINGS = {
    // 7种结局定义
    HEALTH_COLLAPSE: {
        id: 'health_collapse',
        title: '健康崩溃',
        description: '长期透支身体，健康归零。你倒下了，游戏结束。',
        icon: '🏥',
        color: '#e74c3c',
        condition: '健康值归零'
    },
    REPUTATION_DESTROYED: {
        id: 'reputation_destroyed',
        title: '名誉扫地',
        description: '你的恶行被揭露，名誉扫地。在这个城市，你已经无法立足。',
        icon: '📉',
        color: '#7f8c8d',
        condition: '名誉值归零'
    },
    BANKRUPTCY: {
        id: 'bankruptcy',
        title: '破产清算',
        description: '债务压垮了你。所有资产被清算，你一无所有。',
        icon: '💸',
        color: '#c0392b',
        condition: '负债超过资产150%且逾期2天以上'
    },
    TIME_UP: {
        id: 'time_up',
        title: '时光流逝',
        description: '180天过去了，你没能买房。丈母娘对你很失望。',
        icon: '⏰',
        color: '#f39c12',
        condition: '超过180天未购房'
    },
    LOAN_DEBT: {
        id: 'loan_debt',
        title: '房奴生活',
        description: '虽然买了房，但背负着沉重的贷款。未来的日子会很艰难。',
        icon: '🏠',
        color: '#e67e22',
        condition: '购房时仍有负债'
    },
    RESENTFUL_MARRIAGE: {
        id: 'resentful_marriage',
        title: '怨偶天成',
        description: '你买了房，但丈母娘还是不满意。婚姻充满了怨气。',
        icon: '💔',
        color: '#9b59b6',
        condition: '购房但名誉≥20且健康≥40'
    },
    REGRET_BREAKUP: {
        id: 'regret_breakup',
        title: '遗憾分手',
        description: '你买了房，但失去了太多。最终，这段感情还是结束了。',
        icon: '💔',
        color: '#34495e',
        condition: '购房但名誉<20或健康<40'
    }
}

export default class EndingSystem {
    constructor(game) {
        this.game = game
        this.ending = null
        this.isGameOver = false
    }
    
    // 检查是否触发结局
    checkEnding() {
        const state = this.game.gameState.data
        
        // 1. 健康崩溃
        if (state.health <= 0) {
            return ENDINGS.HEALTH_COLLAPSE
        }
        
        // 2. 名誉扫地
        if (state.reputation <= 0) {
            return ENDINGS.REPUTATION_DESTROYED
        }
        
        // 3. 破产
        if (this.checkBankruptcy(state)) {
            return ENDINGS.BANKRUPTCY
        }
        
        // 4. 时间到
        if (state.day > 180 && !state.purchasedHouse) {
            return ENDINGS.TIME_UP
        }
        
        // 5-7. 购房结局
        if (state.purchasedHouse) {
            const totalDebt = state.bankLoan + state.privateLoan
            
            // 有负债
            if (totalDebt > 0) {
                return ENDINGS.LOAN_DEBT
            }
            
            // 无负债
            if (state.reputation >= 20 && state.health >= 40) {
                return ENDINGS.RESENTFUL_MARRIAGE
            } else {
                return ENDINGS.REGRET_BREAKUP
            }
        }
        
        return null
    }
    
    // 检查破产
    checkBankruptcy(state) {
        const totalAssets = this.calculateTotalAssets(state)
        const totalDebt = state.bankLoan + state.privateLoan
        
        // 负债超过资产150%且逾期2天以上
        if (totalDebt > totalAssets * 1.5 && state.overdueDays >= 2) {
            return true
        }
        
        // 健康归零且金币不足
        if (state.health <= 0 && state.money < 50) {
            return true
        }
        
        return false
    }
    
    // 计算总资产
    calculateTotalAssets(state) {
        let assets = state.money + state.bankDeposit
        
        // 计算仓库商品价值
        const warehouse = state.warehouse || {}
        for (const [itemId, quantity] of Object.entries(warehouse)) {
            // 获取当前市场价格
            const price = this.getItemCurrentPrice(parseInt(itemId))
            assets += price * quantity
        }
        
        // 房产价值
        if (state.purchasedHouse) {
            assets += 220000 // 标准房价
        }
        
        return assets
    }
    
    // 获取商品当前价格
    getItemCurrentPrice(itemId) {
        // 从市场场景获取当前价格
        const marketScene = this.game.sceneManager.scenes.market
        if (marketScene && marketScene.itemPrices[itemId]) {
            return marketScene.itemPrices[itemId].current
        }
        return 0
    }
    
    // 触发结局
    triggerEnding(ending) {
        this.ending = ending
        this.isGameOver = true
        
        const state = this.game.gameState.data
        state.gameEnded = true
        state.endingId = ending.id
        state.endingTitle = ending.title
        state.endingDescription = ending.description
        
        this.game.gameState.save()
        
        // 显示结局弹窗
        this.showEndingModal(ending)
    }
    
    // 显示结局弹窗
    showEndingModal(ending) {
        this.game.uiManager.addModal({
            type: 'confirm',
            title: `结局：${ending.title}`,
            content: `${ending.description}\n\n${ending.icon}`,
            confirmText: '重新开始',
            singleButton: true,
            onConfirm: () => {
                // 重置游戏
                this.game.resetGame()
            }
        })
    }
    
    // 每日检查
    dailyCheck() {
        const ending = this.checkEnding()
        if (ending) {
            this.triggerEnding(ending)
            return true
        }
        return false
    }
    
    // 获取结局统计
    getEndingStats() {
        const endings = wx.getStorageSync('game_endings') || {}
        return endings
    }
    
    // 记录结局
    recordEnding(endingId) {
        const endings = this.getEndingStats()
        if (!endings[endingId]) {
            endings[endingId] = {
                count: 0,
                firstTime: new Date().toISOString()
            }
        }
        endings[endingId].count++
        endings[endingId].lastTime = new Date().toISOString()
        wx.setStorageSync('game_endings', endings)
    }
}
