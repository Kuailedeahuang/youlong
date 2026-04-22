export const HOUSES_DATA = [
    {
        id: 1,
        name: '城中村棚屋',
        price: 50000,
        description: '位于城中村的简易棚屋，条件艰苦但价格低廉',
        parentAttitude: '强烈反对',
        location: '城中村',
        area: '20㎡',
        facilities: ['公共卫生间', '简易厨房']
    },
    {
        id: 2,
        name: '老旧民房',
        price: 120000,
        description: '城区老旧民房，设施陈旧但位置尚可',
        parentAttitude: '不太满意',
        location: '老城区',
        area: '35㎡',
        facilities: ['独立卫生间', '小厨房']
    },
    {
        id: 3,
        name: '标准一居室',
        price: 220000,
        description: '位于市区的标准一居室，丈母娘的最低要求',
        parentAttitude: '勉强认可',
        location: '市区',
        area: '45㎡',
        facilities: ['独立卫生间', '小厨房', '阳台']
    },
    {
        id: 4,
        name: '舒适两居室',
        price: 350000,
        description: '宽敞明亮的两居室，适合小家庭居住',
        parentAttitude: '非常满意',
        location: '市区',
        area: '75㎡',
        facilities: ['双卫生间', '大厨房', '阳台', '客厅']
    },
    {
        id: 5,
        name: '豪华三居室',
        price: 580000,
        description: '豪华宽敞的三居室，彰显身份地位',
        parentAttitude: '无比自豪',
        location: '高档小区',
        area: '120㎡',
        facilities: ['双卫生间', '开放式厨房', '大阳台', '客厅', '书房']
    },
    {
        id: 6,
        name: '江景别墅',
        price: 1500000,
        description: '豪华江景别墅，享受高品质生活和绝美江景',
        parentAttitude: '骄傲不已',
        location: '江边豪宅区',
        area: '250㎡',
        facilities: ['多卫生间', '豪华厨房', '花园', '车库', '健身房', '娱乐室', '江景阳台']
    },
    {
        id: 7,
        name: '花园洋房',
        price: 850000,
        description: '带花园的洋房，环境优美，适合家庭居住',
        parentAttitude: '非常满意',
        location: '郊区',
        area: '150㎡',
        facilities: ['双卫生间', '大厨房', '花园', '阳台', '客厅', '书房']
    },
    {
        id: 8,
        name: '市中心公寓',
        price: 420000,
        description: '位于市中心的高档公寓，交通便利',
        parentAttitude: '满意',
        location: '市中心',
        area: '65㎡',
        facilities: ['独立卫生间', '开放式厨房', '阳台', '客厅']
    },
    {
        id: 9,
        name: '联排别墅',
        price: 980000,
        description: '联排别墅，既有独立空间又有社区氛围',
        parentAttitude: '非常自豪',
        location: '郊区',
        area: '180㎡',
        facilities: ['双卫生间', '大厨房', '小花园', '车库', '客厅', '书房']
    },
    {
        id: 10,
        name: '海景别墅',
        price: 2000000,
        description: '豪华海景别墅，享受无敌海景和奢华生活',
        parentAttitude: '极度骄傲',
        location: '海边',
        area: '300㎡',
        facilities: ['多卫生间', '豪华厨房', '花园', '车库', '健身房', '娱乐室', '海景阳台', '私人泳池']
    }
]

export function getHouseById(id) {
    return HOUSES_DATA.find(house => house.id === id)
}

export function getAllHouses() {
    return HOUSES_DATA
}

export function checkPurchaseEligibility(state, houseId) {
    const house = getHouseById(houseId)
    if (!house) {
        return {
            eligible: false,
            reason: '房产不存在'
        }
    }
    
    if (state.day > 180) {
        return {
            eligible: false,
            reason: '已超过购房期限（180天）'
        }
    }
    
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