// 购房系统
import { getAllHouses, checkPurchaseEligibility } from '../data/houses.js'

export default class HouseSystem {
    constructor(game) {
        this.game = game
        this.houses = getAllHouses()
    }
    
    // 显示购房界面
    showHouseModal() {
        const state = this.game.gameState.data
        
        // 检查精力
        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '去售楼部需要消耗1点精力',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }
        
        // 扣除精力
        state.energy -= 1
        this.game.gameState.save()
        
        // 构建房产列表内容
        let content = ''
        this.houses.forEach((house, index) => {
            const eligibility = checkPurchaseEligibility(state, house.id)
            const status = eligibility.eligible ? '✅ 可购买' : `❌ ${eligibility.reason}`
            content += `${index + 1}. ${house.name}\n`
            content += `   价格: ${house.price} 金币\n`
            content += `   位置: ${house.location} | 面积: ${house.area}\n`
            content += `   丈母娘态度: ${house.parentAttitude}\n`
            content += `   ${status}\n\n`
        })
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '售楼部',
            content: content,
            confirmText: '购买一居室',
            cancelText: '离开',
            onConfirm: () => {
                this.purchaseHouse(1)
            },
            onCancel: () => {}
        })
    }
    
    // 购买房产
    purchaseHouse(houseId) {
        const state = this.game.gameState.data
        const eligibility = checkPurchaseEligibility(state, houseId)
        
        if (!eligibility.eligible) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '无法购买',
                content: eligibility.reason,
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }
        
        const house = eligibility.house
        
        // 确认购买
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '确认购买',
            content: `确定购买 ${house.name} 吗？\n\n价格: ${house.price} 金币\n位置: ${house.location}\n面积: ${house.area}\n\n购买后将触发结局判定`,
            confirmText: '确认购买',
            cancelText: '再想想',
            onConfirm: () => {
                this.completePurchase(house)
            },
            onCancel: () => {}
        })
    }
    
    // 完成购买
    completePurchase(house) {
        const state = this.game.gameState.data
        
        // 扣除金币
        state.money -= house.price
        
        // 记录购房
        state.purchasedHouse = house.id
        state.housingType = 'owned'
        
        this.game.gameState.save()
        
        // 显示购买成功
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '购房成功',
            content: `恭喜！你成功购买了 ${house.name}\n\n丈母娘的态度: ${house.parentAttitude}\n\n现在将进行结局判定...`,
            confirmText: '查看结局',
            singleButton: true,
            onConfirm: () => {
                // 触发结局判定
                if (this.game.endingSystem) {
                    this.game.endingSystem.dailyCheck()
                }
            }
        })
    }
    
    // 获取当前房产信息
    getCurrentHouse() {
        const state = this.game.gameState.data
        if (!state.purchasedHouse) return null
        
        return this.houses.find(h => h.id === state.purchasedHouse)
    }
    
    // 检查是否已购房
    hasPurchasedHouse() {
        const state = this.game.gameState.data
        return !!state.purchasedHouse
    }
}
