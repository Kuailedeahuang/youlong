import { CLOUD_ENV_ID } from '../config.js'

const STORAGE_KEY = 'bigcitylife_save'
const USER_INFO_KEY = 'user_info'

export default class GameState {
    constructor() {
        this.data = this.getDefaultState()
        this.userInfo = this.getUserInfo()
        this.isCloudReady = false
        this.isLoaded = false

        this.delayedAnimations = []

        this.loadPromise = this.load()
    }
    
    getUserInfo() {
        try {
            const saved = wx.getStorageSync(USER_INFO_KEY)
            if (saved) {
                return saved
            }
        } catch (e) {
            console.warn('获取用户信息失败:', e)
        }
        return null
    }
    
    setUserInfo(info) {
        this.userInfo = info
        try {
            wx.setStorageSync(USER_INFO_KEY, info)
        } catch (e) {
            console.warn('保存用户信息失败:', e)
        }
    }
    
    isLoggedIn() {
        return this.userInfo && this.userInfo.openid
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
        const db = wx.cloud.database({})

                await this.loadUserUnlockedHouses()

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
            if (wx.cloud) {
                if (!wx.cloud.database) {
                    await wx.cloud.init({
                        env: CLOUD_ENV_ID,
                        traceUser: true
                    })
                    console.log('云开发初始化成功')
                }

                const db = wx.cloud.database({})
                const openid = this.userInfo?.openid

                if (!openid) {
                    console.warn('没有 openid，无法保存到云数据库')
                } else {
                    const saveData = { ...this.data }
                    delete saveData._id
                    delete saveData._openid

                    try {
                        const res = await db.collection('gameprogress').where({
                            _openid: openid
                        }).limit(1).get()

                        if (res.data && res.data.length > 0) {
                            const cloudId = res.data[0]._id
                            await db.collection('gameprogress').doc(cloudId).update({
                                data: {
                                    ...saveData,
                                    updateTime: db.serverDate()
                                }
                            })
                            this.data._id = cloudId
                            console.log('云数据库更新成功')
                        } else {
                            const addRes = await db.collection('gameprogress').add({
                                data: {
                                    ...saveData,
                                    createTime: db.serverDate(),
                                    updateTime: db.serverDate()
                                }
                            })
                            this.data._id = addRes._id
                            this.isCloudReady = true
                            console.log('云数据库创建成功')
                        }
                    } catch (dbError) {
                        console.warn('gameprogress 集合操作失败，将使用本地存储:', dbError)
                    }
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

        // 保存用户的解锁房屋到独立集合
        await this.saveUserUnlockedHouses()
    }

    async reset() {
        // 从云数据库获取用户的解锁房屋列表（永久保留）
        let unlockedHouses = []
        
        try {
            if (wx.cloud) {
                const db = wx.cloud.database({})
      const res = await db.collection('user_unlocked_houses').limit(1).get()

      if (res.data && res.data.length > 0) {
        unlockedHouses = res.data[0].unlockedHouses || []
        console.log('reset: 从云数据库获取解锁房屋:', unlockedHouses)
      }
            }
        } catch (e) {
            console.warn('reset: 从云数据库获取解锁房屋失败:', e)
            // 回退到当前数据
            unlockedHouses = this.data.unlockedHouses || []
        }
        
        // 重置为默认状态，但保留解锁的房屋
        this.data = this.getDefaultState()
        this.data.unlockedHouses = unlockedHouses
        
        await this.save()
    }
    
    // 加载用户的解锁房屋（用户独立的永久数据）
    async loadUserUnlockedHouses() {
        try {
            if (!wx.cloud) return
            
            const db = wx.cloud.database({})
            
    const res = await db.collection('user_unlocked_houses').limit(1).get()
            
            if (res.data && res.data.length > 0) {
                // 用户有解锁记录，加载到当前数据中
                this.data.unlockedHouses = res.data[0].unlockedHouses || []
                this.data._unlockedHousesId = res.data[0]._id
                console.log('从云数据库加载用户解锁房屋:', this.data.unlockedHouses)
            } else {
                // 用户没有解锁记录，初始化为空数组
                this.data.unlockedHouses = []
                this.data._unlockedHousesId = null
                console.log('用户无解锁房屋记录，初始化为空')
            }
        } catch (e) {
            console.warn('加载用户解锁房屋失败:', e)
            // 从本地存储尝试加载
            const saved = wx.getStorageSync('user_unlocked_houses')
            if (saved && saved.unlockedHouses) {
                this.data.unlockedHouses = saved.unlockedHouses
            }
        }
    }
    
    // 保存用户的解锁房屋（用户独立的永久数据）
    async saveUserUnlockedHouses() {
        try {
            if (!wx.cloud) return
            
            const db = wx.cloud.database({})
            const unlockedHouses = this.data.unlockedHouses || []
            
            // 同时保存到本地存储作为备份
            wx.setStorageSync('user_unlocked_houses', { unlockedHouses })
            
            if (this.data._unlockedHousesId) {
                // 更新现有记录
                await db.collection('user_unlocked_houses').doc(this.data._unlockedHousesId).update({
                    data: {
                        unlockedHouses: unlockedHouses,
                        updateTime: db.serverDate()
                    }
                })
                console.log('更新用户解锁房屋到云数据库:', unlockedHouses)
            } else {
                // 创建新记录
                const res = await db.collection('user_unlocked_houses').add({
                    data: {
                        unlockedHouses: unlockedHouses,
                        createTime: db.serverDate(),
                        updateTime: db.serverDate()
                    }
                })
                this.data._unlockedHousesId = res._id
                console.log('创建用户解锁房屋记录到云数据库:', unlockedHouses)
            }
        } catch (e) {
            console.warn('保存用户解锁房屋到云数据库失败:', e)
            // 保存到本地存储
            wx.setStorageSync('user_unlocked_houses', { 
                unlockedHouses: this.data.unlockedHouses || [] 
            })
        }
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