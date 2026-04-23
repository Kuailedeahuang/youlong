export const HOUSES_DATA = [
    {
        id: 1,
        name: '城中村棚屋',
        price: 50000,
        description: '位于城中村的简易棚屋，面积狭小，设施简陋，但价格低廉，适合临时居住',
        parentAttitude: '强烈反对',
        location: '城中村',
        area: '20㎡',
        facilities: ['公共卫生间', '简易厨房'],
        imageName: 'chengzhongcunpengwu'
    },
    {
        id: 2,
        name: '老旧民房',
        price: 120000,
        description: '建于上世纪的老旧民房，墙体斑驳，设施陈旧，但位于城区，生活便利',
        parentAttitude: '不太满意',
        location: '老城区',
        area: '35㎡',
        facilities: ['独立卫生间', '小厨房'],
        imageName: 'laojiuminfang'
    },
    {
        id: 3,
        name: '标准一居室',
        price: 220000,
        description: '位于市区的标准一居室，户型方正，采光良好，配套设施完善',
        parentAttitude: '勉强认可',
        location: '市区',
        area: '45㎡',
        facilities: ['独立卫生间', '小厨房', '阳台'],
        imageName: 'biaozhunyijushi'
    },
    {
        id: 4,
        name: '舒适两居室',
        price: 350000,
        description: '宽敞明亮的两居室，南北通透，空间布局合理，适合小家庭居住',
        parentAttitude: '非常满意',
        location: '市区',
        area: '75㎡',
        facilities: ['双卫生间', '大厨房', '阳台', '客厅'],
        imageName: 'shushiliangjushi'
    },
    {
        id: 5,
        name: '豪华三居室',
        price: 580000,
        description: '位于高档小区的豪华三居室，装修精致，空间宽敞，配套设施一流',
        parentAttitude: '无比自豪',
        location: '高档小区',
        area: '120㎡',
        facilities: ['双卫生间', '开放式厨房', '大阳台', '客厅', '书房'],
        imageName: 'haohuasanjushi'
    },
    {
        id: 6,
        name: '江景别墅',
        price: 1500000,
        description: '临江而建的豪华别墅，拥有开阔的江景视野，建筑典雅，环境幽静',
        parentAttitude: '骄傲不已',
        location: '江边豪宅区',
        area: '250㎡',
        facilities: ['多卫生间', '豪华厨房', '花园', '车库', '健身房', '娱乐室', '江景阳台'],
        imageName: 'jiangjingbieshu'
    },
    {
        id: 7,
        name: '花园洋房',
        price: 850000,
        description: '带独立花园的洋房，绿树环绕，空气清新，拥有私密的户外空间',
        parentAttitude: '非常满意',
        location: '郊区',
        area: '150㎡',
        facilities: ['双卫生间', '大厨房', '花园', '阳台', '客厅', '书房'],
        imageName: 'huayuanyangfang'
    },
    {
        id: 8,
        name: '市中心公寓',
        price: 420000,
        description: '位于市中心核心地段的高档公寓，交通便利，周边商业配套齐全',
        parentAttitude: '满意',
        location: '市中心',
        area: '65㎡',
        facilities: ['独立卫生间', '开放式厨房', '阳台', '客厅'],
        imageName: 'shizhongxingongyu'
    },
    {
        id: 9,
        name: '联排别墅',
        price: 980000,
        description: '联排式别墅，建筑外观统一美观，既有独立空间又享社区配套',
        parentAttitude: '非常自豪',
        location: '郊区',
        area: '180㎡',
        facilities: ['双卫生间', '大厨房', '小花园', '车库', '客厅', '书房'],
        imageName: 'lianpaibieshu'
    },
    {
        id: 10,
        name: '海景别墅',
        price: 2000000,
        description: '面朝大海的豪华别墅，拥有无敌海景，建筑设计独特，设施奢华',
        parentAttitude: '极度骄傲',
        location: '海边',
        area: '300㎡',
        facilities: ['多卫生间', '豪华厨房', '花园', '车库', '健身房', '娱乐室', '海景阳台', '私人泳池'],
        imageName: 'haijingbieshu'
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

    if (state.money < house.price) {
        return {
            eligible: false,
            reason: `资金不足，需要${house.price.toLocaleString()}金币`
        }
    }

    return {
        eligible: true,
        reason: ''
    }
}
