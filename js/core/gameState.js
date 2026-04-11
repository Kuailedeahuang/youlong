const STORAGE_KEY = 'bigcitylife_save'
const CLOUD_ENV_ID = 'cloud1-1glyk3ivc2fc740d'

export default class GameState {
    constructor() {
        this.data = this.getDefaultState()
        this.isCloudReady = false
        this.load()
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
            hasEnteredMarketToday: false,
            _id: null
        }
    }
    
    async load() {
        try {
            if (wx.cloud) {
                const db = wx.cloud.database({
                    env: CLOUD_ENV_ID
                })
                const res = await db.collection('gameProgress').limit(1).get()
                
                if (res.data && res.data.length > 0) {
                    const cloudData = res.data[0]
                    this.data = { ...this.getDefaultState(), ...cloudData }
                    this.isCloudReady = true
                    console.log('从云数据库加载成功')
                    return
                }
            }
        } catch (e) {
            console.warn('云数据库加载失败，尝试本地存储:', e)
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
                const db = wx.cloud.database({
                    env: CLOUD_ENV_ID
                })
                
                const saveData = { ...this.data }
                delete saveData._id
                delete saveData._openid
                
                if (this.data._id) {
                    await db.collection('gameProgress').doc(this.data._id).update({
                        data: {
                            ...saveData,
                            updateTime: db.serverDate()
                        }
                    })
                    console.log('云数据库更新成功')
                } else {
                    const res = await db.collection('gameProgress').add({
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
            }
        } catch (e) {
            console.warn('云数据库保存失败，尝试本地存储:', e)
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
        this.data = this.getDefaultState()
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
        this.data.hasEnteredMarketToday = false
        this.data.todayEvents = []
        
        let baseExpense = 80
        const fluctuation = Math.floor(Math.random() * 11) - 5
        let dailyExpense = baseExpense + fluctuation
        
        this.data.yesterdayExpense = dailyExpense
        
        if (this.data.money >= dailyExpense) {
            this.data.money -= dailyExpense
        } else {
            const deficit = dailyExpense - this.data.money
            this.data.money = 0
            this.data.privateLoan += Math.ceil(deficit * 1.05)
            this.data.overdueDays++
            this.addEvent('因资金不足，自动借入私人借贷')
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
        }
        
        this.save()
    }
    
    getDeposit() {
        return this.data.bankDeposit - (this.data.bankLoan + this.data.privateLoan)
    }
}
