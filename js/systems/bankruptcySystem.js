// 破产系统
export default class BankruptcySystem {
    constructor(game) {
        this.game = game
    }
    
    // 检查是否破产
    checkBankruptcy() {
        const state = this.game.gameState.data
        const totalAssets = this.calculateTotalAssets()
        const totalDebt = state.bankLoan + state.privateLoan
        
        // 破产条件1: 负债超过资产150%且逾期2天以上
        if (totalDebt > totalAssets * 1.5 && state.overdueDays >= 2) {
            return {
                isBankrupt: true,
                reason: '负债超过资产150%且逾期2天以上',
                type: 'debt'
            }
        }
        
        // 破产条件2: 健康归零且金币不足
        if (state.health <= 0 && state.money < 50) {
            return {
                isBankrupt: true,
                reason: '健康归零且金币不足',
                type: 'health'
            }
        }
        
        // 破产条件3: 私人借贷逾期7天以上
        if (state.overdueDays >= 7) {
            return {
                isBankrupt: true,
                reason: '私人借贷逾期7天以上',
                type: 'overdue'
            }
        }
        
        return { isBankrupt: false }
    }
    
    // 计算总资产
    calculateTotalAssets() {
        const state = this.game.gameState.data
        let assets = state.money + state.bankDeposit
        
        // 计算仓库商品价值
        const warehouse = state.warehouse || {}
        const marketScene = this.game.sceneManager.scenes.market
        
        for (const [itemId, quantity] of Object.entries(warehouse)) {
            let price = 0
            if (marketScene && marketScene.itemPrices[itemId]) {
                price = marketScene.itemPrices[itemId].current
            }
            assets += price * quantity
        }
        
        // 房产价值
        if (state.purchasedHouse) {
            assets += 220000
        }
        
        return assets
    }
    
    // 执行破产清算
    executeBankruptcy() {
        const state = this.game.gameState.data
        
        // 记录破产次数
        state.bankruptcyCount = (state.bankruptcyCount || 0) + 1
        
        // 清空仓库
        state.warehouse = {}
        
        // 清空存款
        state.bankDeposit = 0
        
        // 保留少量现金重新开始
        state.money = 1000
        
        // 重置职位
        state.jobLevel = 1
        state.jobTitle = '外卖/快递员'
        
        // 清空债务
        state.bankLoan = 0
        state.privateLoan = 0
        state.overdueDays = 0
        
        // 重置属性
        state.health = 50
        state.mood = 50
        state.reputation = 50
        state.energy = 3
        state.maxEnergy = 5
        state.consecutiveGymDays = 0
        
        // 重置职场状态
        state.salaryDeduction = false
        state.salaryDeductionDays = 0
        state.unemployed = false
        state.unemployedDays = 0
        
        // 重置购房状态
        state.purchasedHouse = null
        state.housingType = 'suburban'
        
        this.game.gameState.save()
        
        // 显示破产弹窗
        this.showBankruptcyModal()
    }
    
    // 显示破产弹窗
    showBankruptcyModal() {
        const state = this.game.gameState.data
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '💸 破产清算',
            content: `你已经破产！\n\n这是第 ${state.bankruptcyCount} 次破产\n\n所有资产被清算：\n• 仓库商品全部清空\n• 银行存款清零\n• 债务一笔勾销\n\n你获得了1000金币重新开始`,
            confirmText: '重新开始',
            singleButton: true,
            onConfirm: () => {
                // 继续游戏
                this.game.uiManager.addModal({
                    type: 'confirm',
                    title: '重新开始',
                    content: '你已经重新开始，请谨慎经营！',
                    confirmText: '知道了',
                    singleButton: true,
                    onConfirm: () => {}
                })
            }
        })
    }
    
    // 检查并执行破产
    checkAndExecuteBankruptcy() {
        const result = this.checkBankruptcy()
        if (result.isBankrupt) {
            this.executeBankruptcy()
            return true
        }
        return false
    }
    
    // 获取破产预警信息
    getBankruptcyWarning() {
        const state = this.game.gameState.data
        const totalAssets = this.calculateTotalAssets()
        const totalDebt = state.bankLoan + state.privateLoan
        const debtRatio = totalDebt / totalAssets
        
        const warnings = []
        
        // 负债率警告
        if (debtRatio > 1.2) {
            warnings.push({
                level: 'danger',
                message: '负债率过高，濒临破产！'
            })
        } else if (debtRatio > 0.8) {
            warnings.push({
                level: 'warning',
                message: '负债率较高，请注意风险'
            })
        }
        
        // 逾期警告
        if (state.overdueDays >= 5) {
            warnings.push({
                level: 'danger',
                message: `逾期${state.overdueDays}天，即将破产！`
            })
        } else if (state.overdueDays >= 2) {
            warnings.push({
                level: 'warning',
                message: `已逾期${state.overdueDays}天，请尽快还款`
            })
        }
        
        // 健康警告
        if (state.health <= 20) {
            warnings.push({
                level: 'danger',
                message: '健康值极低，请注意身体'
            })
        }
        
        return warnings
    }
    
    // 显示破产预警
    showBankruptcyWarning() {
        const warnings = this.getBankruptcyWarning()
        if (warnings.length === 0) return
        
        const dangerWarnings = warnings.filter(w => w.level === 'danger')
        if (dangerWarnings.length > 0) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '⚠️ 破产预警',
                content: dangerWarnings.map(w => w.message).join('\n'),
                confirmText: '我知道了',
                singleButton: true,
                onConfirm: () => {}
            })
        }
    }
}
