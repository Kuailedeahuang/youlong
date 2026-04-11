// 房产数据
export const HOUSES_DATA = [
    {
        id: 1,
        name: '标准一居室',
        price: 220000,
        description: '位于市区的标准一居室，丈母娘的最低要求',
        parentAttitude: '勉强认可',
        location: '市区',
        area: '45㎡',
        facilities: ['独立卫生间', '小厨房', '阳台']
    }
]

// 获取房产信息
export function getHouseById(id) {
    return HOUSES_DATA.find(house => house.id === id)
}

// 获取所有房产
export function getAllHouses() {
    return HOUSES_DATA
}

// 检查购房资格
export function checkPurchaseEligibility(state, houseId) {
    const house = getHouseById(houseId)
    if (!house) {
        return {
            eligible: false,
            reason: '房产不存在'
        }
    }
    
    // 检查天数
    if (state.day > 180) {
        return {
            eligible: false,
            reason: '已超过购房期限（180天）'
        }
    }
    
    // 检查负债
    if (state.bankLoan > 0) {
        return {
            eligible: false,
            reason: '有银行贷款未还清'
        }
    }
    
    if (state.privateLoan > 0) {
        return {
            eligible: false,
            reason: '有私人借贷未还清'
        }
    }
    
    // 检查金币
    if (state.money < house.price) {
        return {
            eligible: false,
            reason: `金币不足，需要 ${house.price} 金币`
        }
    }
    
    return {
        eligible: true,
        house: house
    }
}

export default HOUSES_DATA
