import { CLOUD_ENV_ID } from '../config.js'

const STORAGE_KEY = 'bigcitylife_save'

export default class GameState {
    constructor() {
        this.data = this.getDefaultState()
        this.isCloudReady = false

        this.delayedAnimations = []

        this.load()
    }

    addDelayedAnimation(type, value, statType, label, color = null) {
        console.log('[动画队列] 添加动画:', type, statType, value)
        this.delayedAnimations.push({
            type,
            value,
            statType,
            label,
            color,
            timestamp: Date.now()
        })
    }

    getAndClearDelayedAnimations() {
        const anims = [...this.delayedAnimations]
        this.delayedAnimations = []
        return anims
    }

    hasDelayedAnimations() {
        return this.delayedAnimations.length > 0
    }

    getDefaultState() {
        return {
            money: 5000,
            health: 100,
            energy: 5,
            maxEnergy: 5,
            mood: 100,
            reputation: 100,
            day: 1,
            totalDays: 180,
            consecutiveGymDays: 0,

            bankLoan: 0,
            bankDeposit: 0,
            privateLoan: 0,
            overdueDays: 0,

            warehouseCapacity: 20,
            warehouse: {},

            purchasedHouse: null,
            unlockedHouses: [], // 永久解锁的房屋列表（跨游戏保留）
            gameEnded: false,

            jobLevel: 1,
            jobTitle: '外卖/快递员',
            salaryDeduction: false,
            salaryDeductionDays: 0,
            unemployed: false,
            unemployedDays: 0,

            adWatchedCount: 0,
            housingType: 'suburban',

            bankruptcyCount: 0,
            currentScene: 'home',

            todayEvents: [],
            newspaperShown: false,
            yesterdayExpense: 0,
            marketEnteredToday: false,
            _id: null
        }
    }

    async load() {
        try {
            if (wx.cloud) {
                await wx.cloud.init({
                    env: CLOUD_ENV_ID,
                    traceUser: true
                })
                console.log('云开发初始化成功')

                const db = wx.cloud.database({})
                try {
                    const res = await db.collection('gameprogress').limit(1).get()

                    if (res.data && res.data.length > 0) {
                        const cloudData = res.data[0]
                        this.data = { ...this.getDefaultState(), ...cloudData }
                        this.isCloudReady = true
                        console.log('从云数据库加载成功')
                        return
                    } else {
                        console.log('云数据库中无记录，使用默认数据')
                    }
                } catch (dbError) {
                    console.warn('gameprogress 集合操作失败，将使用本地存储:', dbError)
                    this.isCloudReady = false
                }
            }
        } catch (e) {
            console.warn('云开发初始化失败，使用本地存储', e)
        }

        try {
            const saved = wx.getStorageSync(STORAGE_KEY)
            if (saved) {
                this.data = { ...this.getDefaultState(), ...saved }
                console.log('从本地存储加载成功')
            }
        } catch (e) {
            console.warn('本地存储加载失败:', e)
            this.data = this.getDefaultState()
        }
    }

    async save() {
        try {
            if (wx.cloud && this.isCloudReady) {
                if (!wx.cloud.database) {
                    await wx.cloud.init({
                        env: CLOUD_ENV_ID,
                        traceUser: true
                    })
                    console.log('云开发初始化成功')
                }

                const db = wx.cloud.database({})

                const saveData = { ...this.data }
                delete saveData._id
                delete saveData._openid

                try {
                    if (this.data._id) {
                        await db.collection('gameprogress').doc(this.data._id).update({
                            data: {
                                ...saveData,
                                updateTime: db.serverDate()
                            }
                        })
                        console.log('云数据库更新成功')
                    } else {
                        const res = await db.collection('gameprogress').add({
                            data: {
                                ...saveData,
                                createTime: db.serverDate(),
                                updateTime: db.serverDate()
                            }
                        })
                        this.data._id = res._id
                        this.isCloudReady = true
                        console.log('云数据库创建成功')
                    }
                } catch (dbError) {
                    console.warn('gameprogress 集合操作失败，将使用本地存储:', dbError)
                    this.isCloudReady = false
                }
            }
        } catch (e) {
            console.warn('云开发保存失败，使用本地存储:', e)
        }

        try {
            const saveData = { ...this.data }
            delete saveData._id
            delete saveData._openid
            wx.setStorageSync(STORAGE_KEY, saveData)
        } catch (e) {
            console.error('本地存储保存失败:', e)
        }
    }

    async reset() {
        // 保存解锁的房屋列表（永久保留）
        const unlockedHouses = this.data.unlockedHouses || []
        
        // 重置为默认状态，但保留解锁的房屋
        this.data = this.getDefaultState()
        this.data.unlockedHouses = unlockedHouses
        
        await this.save()
    }

    get(key) {
        return this.data[key]
    }

    set(key, value) {
        this.data[key] = value
        this.save()
    }

    addMoney(amount) {
        this.data.money += amount
        this.save()
    }

    addEnergy(amount) {
        this.data.energy = Math.min(this.data.maxEnergy, Math.max(0, this.data.energy + amount))
        this.save()
    }

    addHealth(amount) {
        this.data.health = Math.min(100, Math.max(0, this.data.health + amount))
        this.save()
    }

    addMood(amount) {
        this.data.mood = Math.min(100, Math.max(0, this.data.mood + amount))
        this.save()
    }

    addReputation(amount) {
        this.data.reputation = Math.min(100, Math.max(-100, this.data.reputation + amount))
        this.save()
    }

    addToWarehouse(itemId, quantity, totalPrice) {
        if (!this.data.warehouse[itemId]) {
            this.data.warehouse[itemId] = { quantity: 0, totalCost: 0 }
        }
        this.data.warehouse[itemId].quantity += quantity
        this.data.warehouse[itemId].totalCost += totalPrice
        this.save()
    }

    removeFromWarehouse(itemId, quantity) {
        if (this.data.warehouse[itemId]) {
            const avgPrice = this.data.warehouse[itemId].totalCost / this.data.warehouse[itemId].quantity
            this.data.warehouse[itemId].quantity -= quantity
            this.data.warehouse[itemId].totalCost -= avgPrice * quantity

            if (this.data.warehouse[itemId].quantity <= 0) {
                delete this.data.warehouse[itemId]
            }
            this.save()
        }
    }

    getWarehouseAvgPrice(itemId) {
        if (this.data.warehouse[itemId] && this.data.warehouse[itemId].quantity > 0) {
            return Math.round(this.data.warehouse[itemId].totalCost / this.data.warehouse[itemId].quantity)
        }
        return 0
    }

    getWarehouseQuantity(itemId) {
        return this.data.warehouse[itemId]?.quantity || 0
    }

    addEvent(eventText) {
        this.data.todayEvents.push(eventText)
        this.save()
    }

    clearEvents() {
        this.data.todayEvents = []
        this.save()
    }

    getEvents() {
        return this.data.todayEvents
    }

    nextDay() {
        this.data.day++
        this.data.energy = this.data.maxEnergy
        this.data.newspaperShown = false
        this.data.marketEnteredToday = false
        this.data.todayEvents = []

        let baseExpense = 80
        const fluctuation = Math.floor(Math.random() * 11) - 5
        let dailyExpense = baseExpense + fluctuation

        this.data.yesterdayExpense = dailyExpense

        if (this.data.money >= dailyExpense) {
            this.data.money -= dailyExpense
            this.addDelayedAnimation('decrease', dailyExpense, 'money', '日常 消费', '#f39c12')
        } else {
            const deficit = dailyExpense - this.data.money
            this.data.money = 0
            this.data.privateLoan += Math.ceil(deficit * 1.05)
            this.data.overdueDays++
            this.addEvent('因资金不足，自动借入私人借贷')
            this.addDelayedAnimation('decrease', this.data.money, 'money', '金币', '#f39c12')
            this.addDelayedAnimation('loan', Math.ceil(deficit * 1.05), 'privateLoan', '私人贷款', '#e74c3c')
        }

        if (this.data.mood < 40) {
            this.data.health -= 1
        }
        if (this.data.mood < 20) {
            this.data.health -= 2
        }

        if (this.data.salaryDeduction) {
            this.data.salaryDeductionDays--
            if (this.data.salaryDeductionDays <= 0) {
                this.data.salaryDeduction = false
            }
        }

        if (this.data.unemployed) {
            this.data.unemployedDays--
            if (this.data.unemployedDays <= 0) {
                this.data.unemployed = false
            }
        }

        if (this.data.day % 6 === 0) {
            this.data.bankDeposit = Math.floor(this.data.bankDeposit * 1.02)
            this.data.bankLoan = Math.floor(this.data.bankLoan * 1.06)
        }

        if (this.data.privateLoan > 0) {
            this.data.privateLoan = Math.floor(this.data.privateLoan * 1.025)
            // 逾期还款减少名誉
            const reputationLoss = 3
            this.data.reputation = Math.max(-100, this.data.reputation - reputationLoss)
            this.addEvent(`私人借贷逾期，名誉-${reputationLoss}`)
        }
        
        if (this.data.bankLoan > 0) {
            // 银行贷款逾期也减少名誉
            const reputationLoss = 2
            this.data.reputation = Math.max(-100, this.data.reputation - reputationLoss)
            this.addEvent(`银行贷款逾期，名誉-${reputationLoss}`)
        }

        this.save()
    }

    getDeposit() {
        return this.data.bankDeposit - (this.data.bankLoan + this.data.privateLoan)
    }
}