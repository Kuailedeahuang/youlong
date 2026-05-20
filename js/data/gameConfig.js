export const GAME_CONFIG = {
    initial: {
        money: 15000,
        health: 100,
        energy: 5,
        maxEnergy: 5,
        mood: 100,
        reputation: 50,
        totalDays: 180
    },
    
    daily: {
        baseExpense: 60,
        expenseFluctuation: 10
    },
    
    jobs: [
        { level: 1, title: '外卖/快递员', baseSalary: 200, overtimeSalary: 300 },
        { level: 2, title: '文员', baseSalary: 400, overtimeSalary: 600 },
        { level: 3, title: '主管', baseSalary: 800, overtimeSalary: 1200 },
        { level: 4, title: '经理', baseSalary: 1600, overtimeSalary: 2400 },
        { level: 5, title: '总监', baseSalary: 3200, overtimeSalary: 4800 }
    ],
    
    promotion: {
        reputationRequired: 20,
        daysWorkedRequired: 20,
        healthRequired: 40,
        moodRequired: 30
    },
    
    rest: {
        energyRecovery: 3,
        moodRecovery: 15,
        healthRecovery: 8
    },
    
    gym: {
        cost: 40,
        healthRecovery: 20,
        energyCost: 1,
        moodBonus: 5
    },
    
    entertainment: {
        costs: [20, 50, 100],
        moodRecovery: [20, 40, 60],
        energyCost: 1
    },
    
    hospital: {
        costPerHealth: 8,
        maxHeal: 80
    },
    
    randomEvent: {
        probability: 0.12,
        goodEventProbability: 0.4,
        badEventProbability: 0.3,
        neutralEventProbability: 0.3
    },
    
    bank: {
        depositInterestRate: 0.03,
        depositInterestDays: 5,
        loanInterestRate: 0.05,
        loanInterestDays: 5,
        loanLimitLevel1: 50000,
        loanLimitLevel3: 100000
    },
    
    ad: {
        maxWatchCount: 3,
        rewardAmount: 8000
    },
    
    housing: {
        rentCosts: {
            suburban: 0,
            urban: 40,
            premium: 80
        }
    },
    
    work: {
        energyCost: 1,
        overtimeHealthCost: 3,
        goodPerformanceReputation: 3,
        badPerformanceReputation: -2,
        goodPerformanceThreshold: { health: 70, mood: 50 },
        badPerformanceThreshold: { health: 30, mood: 20 }
    },
    
    mood: {
        lowHealthPenalty: { threshold: 40, healthLoss: 1 },
        veryLowHealthPenalty: { threshold: 20, healthLoss: 3 },
        lowMoodPenalty: { threshold: 30, moodLoss: 3 }
    },
    
    reputation: {
        maxValue: 100,
        minValue: -100,
        highReputationBonus: { threshold: 50, salaryMultiplier: 1.1 },
        lowReputationPenalty: { threshold: -30, salaryMultiplier: 0.9 }
    },
    
    warehouse: {
        initialCapacity: 20,
        upgradeLevels: [
            { level: 1, capacity: 20, cost: 0 },
            { level: 2, capacity: 50, cost: 5000 },
            { level: 3, capacity: 100, cost: 15000 },
            { level: 4, capacity: 200, cost: 40000 },
            { level: 5, capacity: 500, cost: 100000 }
        ]
    },

    miniGame: {
        work: {
            timeLimit: 5000,
            totalTargets: 8,
            requiredHits: 6,
            targetRadius: 20,
            targetLifetime: 1500,
            touchRadius: 32,
            resultDisplayTime: 1500
        },
        gym: {
            totalRounds: 5,
            sweetZoneWidthRatio: 0.28,
            sweetZoneDecrement: 0.05,
            goodZoneExtraRatio: 0.15,
            baseSpeed: 1.8,
            speedIncrement: 0.6,
            resultDisplayTime: 900,
            summaryDisplayTime: 1500
        }
    }
}

export function getJobByLevel(level) {
    return GAME_CONFIG.jobs.find(job => job.level === level)
}

export function getNextJob(level) {
    return GAME_CONFIG.jobs.find(job => job.level === level + 1)
}

export function calculateDailyIncome(jobLevel, workCount, isOvertime = false) {
    const job = getJobByLevel(jobLevel)
    if (!job) return 0
    
    const salary = isOvertime ? job.overtimeSalary : job.baseSalary
    return salary * workCount
}

export function calculateFinalMoney(days, dailyNetIncome, initialMoney) {
    return initialMoney + (dailyNetIncome * days)
}
