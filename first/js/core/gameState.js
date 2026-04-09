const STORAGE_KEY = 'bigcitylife_save'

export default class GameState {
    constructor() {
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
            newspaperShown: false
        }
    }
    
    load() {
        try {
            const saved = wx.getStorageSync(STORAGE_KEY)
            if (saved) {
                this.data = saved
            } else {
                this.data = this.getDefaultState()
            }
        } catch (e) {
            this.data = this.getDefaultState()
        }
    }
    
    save() {
        try {
            wx.setStorageSync(STORAGE_KEY, this.data)
        } catch (e) {
            console.error('Save failed:', e)
        }
    }
    
    reset() {
        this.data = this.getDefaultState()
        this.save()
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
        this.data.todayEvents = []
        
        let dailyExpense = 30
        if (this.data.housingType === 'suburban') {
            dailyExpense += 50
        } else if (this.data.housingType === 'urban') {
            dailyExpense += 100
        } else {
            dailyExpense += 20
        }
        
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
