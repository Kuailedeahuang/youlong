import animationManager from '../utils/animationManager.js'
import { GAME_CONFIG } from '../data/gameConfig.js'

const RANDOM_EVENTS = [
    { text: '路边捡到钱包，获得50金币', stat: 'money', delta: 50, clampMin: 0, clampMax: Infinity, animType: 'increase', animLabel: '金币', animColor: '#f39c12' },
    { text: '不小心丢了钱包，损失30金币', stat: 'money', delta: -30, clampMin: 0, clampMax: Infinity, animType: 'decrease', animLabel: '金币', animColor: '#f39c12' },
    { text: '遇到好心人，心情+10', stat: 'mood', delta: 10, clampMin: 0, clampMax: 100, animType: 'increase', animLabel: '心情', animColor: '#e91e63' },
    { text: '被小偷偷了，损失20金币', stat: 'money', delta: -20, clampMin: 0, clampMax: Infinity, animType: 'decrease', animLabel: '金币', animColor: '#f39c12' },
    { text: '身体不适，健康-5', stat: 'health', delta: -5, clampMin: 0, clampMax: 100, animType: 'decrease', animLabel: '健康', animColor: '#27ae60' },
    { text: '收到红包，获得100金币', stat: 'money', delta: 100, clampMin: 0, clampMax: Infinity, animType: 'increase', animLabel: '金币', animColor: '#f39c12' },
    { text: '帮助老人，名誉+5', stat: 'reputation', delta: 5, clampMin: -100, clampMax: 100, animType: 'increase', animLabel: '名誉', animColor: '#9b59b6' },
    { text: '被误解，名誉-5', stat: 'reputation', delta: -5, clampMin: -100, clampMax: 100, animType: 'decrease', animLabel: '名誉', animColor: '#9b59b6' },
    { text: '睡了个好觉，心情+5', stat: 'mood', delta: 5, clampMin: 0, clampMax: 100, animType: 'increase', animLabel: '心情', animColor: '#e91e63' },
    { text: '做了噩梦，心情-5', stat: 'mood', delta: -5, clampMin: 0, clampMax: 100, animType: 'decrease', animLabel: '心情', animColor: '#e91e63' }
]

export default class BackGameManager {
    constructor(game) {
        this.game = game
    }

    /**
     * 进入市场
     * 首次进入消耗2精力
     */
    enterMarket() {
        const state = this.game.gameState.data

        // 检查是否是今天第一次进入市场
        if (!state.marketEnteredToday) {
            if (state.energy < 2) {
                this.game.uiManager.addModal({
                    type: 'confirm',
                    title: '精力不足',
                    content: '今日首次进入市场需要消耗2点精力\n当前精力不足，无法进入市场',
                    confirmText: '知道了',
                    onConfirm: () => {}
                })
                return
            }

            state.energy -= 2
            state.marketEnteredToday = true
            this.game.gameState.save()

            this.game.gameState.addDelayedAnimation('decrease', 2, 'energy', '精力', '#3498db')
        }

        this.game.sceneManager.switchTo('market')
    }

    /**
     * 结束今日
     * 触发随机事件，进入下一天
     */
    endDay() {
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '结束今日',
            content: '确定结束今天吗?\n将自动扣除日常消费',
            confirmText: '确定',
            onConfirm: () => {
                this.triggerRandomEventsDirect()

                this.game.gameState.nextDay()

                this.game.dailyCheck()

                this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
            }
        })
    }

    /**
     * 触发随机事件
     */
    triggerRandomEventsDirect() {
        const state = this.game.gameState.data
        const eventChance = Math.random()

        if (eventChance < 0.15) {
            const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)]
            state[event.stat] = Math.min(event.clampMax, Math.max(event.clampMin, state[event.stat] + event.delta))
            const absVal = Math.abs(event.delta)
            this.game.gameState.addDelayedAnimation(event.animType, absVal, event.stat, event.animLabel, event.animColor)

            this.game.uiManager.addModal({
                type: 'confirm',
                title: '随机事件',
                content: event.text,
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
        }

        if (state.health < 30 && Math.random() < 0.3) {
            state.health = Math.max(0, state.health - 5)
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '健康警告',
                content: '健康过低，病情加重',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
        }

        if (state.mood < 20 && Math.random() < 0.2) {
            state.mood = Math.max(0, state.mood - 5)
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '心情警告',
                content: '心情太差，更加抑郁',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
        }
    }

    /**
     * 显示工作弹窗
     */
    showWorkModal() {
        const state = this.game.gameState.data

        if (state.unemployed) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '失业中',
                content: `剩余${state.unemployedDays}天无法工作`,
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }

        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法工作',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }

        // 当前岗位信息
        const jobs = GAME_CONFIG.jobs

        const job = jobs[state.jobLevel - 1]
        let baseSalary = job.baseSalary
        let overtimeSalary = job.overtimeSalary

        if (state.salaryDeduction) {
            baseSalary = Math.floor(baseSalary * 0.8)
            overtimeSalary = Math.floor(overtimeSalary * 0.8)
        }

        // 计算下一级信息
        const nextJob = jobs[state.jobLevel]
        let nextLevelInfo = ''
        if (nextJob) {
            nextLevelInfo = `\n\n【下一级】\nLv.${nextJob.level} ${nextJob.title}\n日薪: ${nextJob.baseSalary}金币`
        }

        // 计算内容高度，确保按钮不会被遮挡
        // 每行内容约22像素，按钮区域需要80像素
        const lineCount = 6 + (nextJob ? 3 : 0) // 基础6行 + 下一级3行
        const contentHeight = 55 + lineCount * 22 + 80 // 标题55 + 内容 + 按钮区域80

        this.game.uiManager.addModal({
            type: 'action',
            title: `工作 - ${state.jobTitle}`,
            content: `【当前岗位】\nLv.${job.level} ${job.title}\n\n上班: ${baseSalary}金币 (消耗1精力)\n加班: ${overtimeSalary}金币 (消耗1精力,健康-5)${nextLevelInfo}`,
            actions: [
                { text: '上班', callback: () => this.doWork(false, baseSalary) },
                { text: '加班', callback: () => this.doWork(true, overtimeSalary) }
            ],
            height: Math.max(350, contentHeight)
        })
    }

    /**
     * 执行工作
     * @param {boolean} isOvertime - 是否加班
     * @param {number} salary - 薪资
     */
    doWork(isOvertime, salary) {
        const state = this.game.gameState.data

        if (isOvertime && state.health < 30) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '健康不足',
                content: '无法加班',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }

        state.energy = Math.max(0, state.energy - 1)
        state.money += salary

        if (isOvertime) {
            state.health = Math.max(0, state.health - GAME_CONFIG.work.overtimeHealthCost)
        }

        // 工作表现影响名誉
        let reputationChange = 0
        let reputationReason = ''

        if (state.health >= GAME_CONFIG.work.goodPerformanceThreshold.health && state.mood >= GAME_CONFIG.work.goodPerformanceThreshold.mood) {
            reputationChange = GAME_CONFIG.work.goodPerformanceReputation
            reputationReason = '工作表现出色'
        } else if (state.health < GAME_CONFIG.work.badPerformanceThreshold.health || state.mood < GAME_CONFIG.work.badPerformanceThreshold.mood) {
            reputationChange = GAME_CONFIG.work.badPerformanceReputation
            reputationReason = '工作状态不佳'
        }

        if (reputationChange !== 0) {
            state.reputation = Math.min(100, Math.max(-100, state.reputation + reputationChange))
            this.game.gameState.addEvent(`${reputationReason}，名誉${reputationChange > 0 ? '+' : ''}${reputationChange}`)
            if (reputationChange > 0) {
                this.game.gameState.addDelayedAnimation('increase', reputationChange, 'reputation', '名誉', '#9b59b6')
            } else {
                this.game.gameState.addDelayedAnimation('decrease', Math.abs(reputationChange), 'reputation', '名誉', '#9b59b6')
            }
        }

        this.game.gameState.save()

        this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
        this.game.gameState.addDelayedAnimation('increase', salary, 'money', '金币', '#f39c12')

        if (isOvertime) {
            this.game.gameState.addDelayedAnimation('decrease', 5, 'health', '健康', '#27ae60')
        }

        let workResultContent = `获得 ${salary} 金币！`
        if (reputationChange !== 0) {
            workResultContent += `\n${reputationReason}，名誉${reputationChange > 0 ? '+' : ''}${reputationChange}`
        }

        this.game.uiManager.addModal({
            type: 'confirm',
            title: '工作完成',
            content: workResultContent,
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {
this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
            }
        })
    }

    /**
     * 显示银行弹窗
     * 存贷款系统，利率每6天计算
     */
    showBankModal() {
        const state = this.game.gameState.data

        // 所有岗位和借款挡位信息
        const jobLoanInfo = [
            { level: 1, title: '外卖/快递员', loanLimit: GAME_CONFIG.bank.loanLimitLevel1 },
            { level: 2, title: '文员', loanLimit: GAME_CONFIG.bank.loanLimitLevel1 },
            { level: 3, title: '主管', loanLimit: GAME_CONFIG.bank.loanLimitLevel3 },
            { level: 4, title: '经理', loanLimit: GAME_CONFIG.bank.loanLimitLevel3 },
            { level: 5, title: '总监', loanLimit: GAME_CONFIG.bank.loanLimitLevel3 }
        ]

        // 构建岗位和借款挡位显示内容
        let jobContent = '【岗位借款额度】\n'
        jobLoanInfo.forEach(job => {
            const isCurrent = state.jobLevel === job.level
            const marker = isCurrent ? '★' : '  '
            jobContent += `${marker}Lv.${job.level} ${job.title}: ${job.loanLimit.toLocaleString()}金币\n`
        })

        const actions = [
            { text: '存款', callback: () => this.doDeposit() },
            { text: '贷款', callback: () => this.doLoan() }
        ]

        if (state.bankLoan > 0) {
            actions.push({ text: '还款', callback: () => this.doRepay() })
        }

        this.game.uiManager.addModal({
            type: 'action',
            title: '银行',
            content: `存款利率: 每${GAME_CONFIG.bank.depositInterestDays}天${(GAME_CONFIG.bank.depositInterestRate * 100).toFixed(0)}%  |  贷款利率: 每${GAME_CONFIG.bank.loanInterestDays}天${(GAME_CONFIG.bank.loanInterestRate * 100).toFixed(0)}%\n当前欠款: ${state.bankLoan.toLocaleString()} 金币\n\n${jobContent}`,
            actions: actions,
            height: 320
        })
    }

    /**
     * 银行存款
     */
    doDeposit() {
        const state = this.game.gameState.data
        this.game.uiManager.addModal({
            type: 'trade',
            title: '存款',
            content: '',
            itemName: '存款金额',
            price: 1,
            quantity: 100,
            maxQuantity: state.money,
            total: 100,
            tradeType: 'deposit',
            height: 220,
            onConfirm: (qty) => {
                if (state.money >= qty) {
                    state.money -= qty
                    state.bankDeposit += qty
                    this.game.gameState.save()

                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('increase', qty, 'bankDeposit', '银行存款', '#27ae60')

                    this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
                }
            }
        })
    }

    /**
     * 银行贷款
     */
    doLoan() {
        const state = this.game.gameState.data
        const maxLoan = state.jobLevel >= 3 ? GAME_CONFIG.bank.loanLimitLevel3 : GAME_CONFIG.bank.loanLimitLevel1
        this.game.uiManager.addModal({
            type: 'trade',
            title: '银行贷款',
            content: '',
            itemName: '贷款金额',
            price: 1,
            quantity: 1000,
            maxQuantity: maxLoan - state.bankLoan,
            total: 1000,
            tradeType: 'loan',
            height: 220,
            onConfirm: (qty) => {
                state.bankLoan += qty
                state.money += qty
                this.game.gameState.save()

                this.game.gameState.addDelayedAnimation('loan', qty, 'bankLoan', '银行贷款', '#3498db')
                this.game.gameState.addDelayedAnimation('increase', qty, 'money', '金币', '#f39c12')

                this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
            }
        })
    }

    /**
     * 银行还款
     */
    doRepay() {
        const state = this.game.gameState.data
        if (state.bankLoan <= 0) {
            return
        }
        this.game.uiManager.addModal({
            type: 'trade',
            title: '还款',
            content: '',
            itemName: '还款金额',
            price: 1,
            quantity: Math.min(state.money, state.bankLoan),
            maxQuantity: Math.min(state.money, state.bankLoan),
            total: Math.min(state.money, state.bankLoan),
            tradeType: 'repay',
            height: 220,
            onConfirm: (qty) => {
                if (state.money >= qty) {
                    state.money -= qty
                    state.bankLoan -= qty
                    this.game.gameState.save()

                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'bankLoan', '银行贷款', '#3498db')

                    this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
                }
            }
        })
    }

    /**
     * 显示私人借贷弹窗
     * 日利率2.5%
     */
    showLoanModal() {
        const state = this.game.gameState.data

        const actions = []

        actions.push({
            text: '借贷',
            callback: () => this.doPrivateLoan(),
            color: '#e74c3c'
        })

        if (state.privateLoan > 0) {
            actions.push({
                text: '还款',
                callback: () => this.doPrivateRepay(),
                color: '#27ae60'
            })
        }

        this.game.uiManager.addModal({
            type: 'action',
            title: '个人借贷',
            content: `日利率: 2.5%\n逾期惩罚严厉\n\n当前欠款: ${state.privateLoan} 金币`,
            actions: actions,
            height: 180
        })
    }

    /**
     * 私人借贷
     */
    doPrivateLoan() {
        const state = this.game.gameState.data
        this.game.uiManager.addModal({
            type: 'trade',
            title: '个人借贷',
            content: '日利率: 2.5%\n逾期惩罚严厉',
            itemName: '借贷金额',
            price: 1,
            quantity: 1000,
            maxQuantity: 120000,
            total: 1000,
            tradeType: 'loan',
            height: 240,
            onConfirm: (qty) => {
                state.privateLoan += qty
                state.money += qty
                this.game.gameState.save()

                this.game.gameState.addDelayedAnimation('loan', qty, 'privateLoan', '私人贷款', '#e74c3c')
                this.game.gameState.addDelayedAnimation('increase', qty, 'money', '金币', '#f39c12')

                this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
            }
        })
    }

    /**
     * 私人还款
     */
    doPrivateRepay() {
        const state = this.game.gameState.data
        if (state.privateLoan <= 0) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '无需还款',
                content: '当前没有私人借贷欠款',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }

        const maxRepay = Math.min(state.money, state.privateLoan)
        if (maxRepay <= 0) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '金币不足',
                content: '没有足够的金币还款',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }

        this.game.uiManager.addModal({
            type: 'trade',
            title: '还款',
            content: `当前欠款: ${state.privateLoan} 金币`,
            itemName: '还款金额',
            price: 1,
            quantity: maxRepay,
            maxQuantity: maxRepay,
            total: maxRepay,
            tradeType: 'repay',
            height: 240,
            onConfirm: (qty) => {
                if (state.money >= qty) {
                    state.money -= qty
                    state.privateLoan -= qty
                    this.game.gameState.save()

                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'privateLoan', '私人贷款', '#e74c3c')

                    this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
                }
            }
        })
    }

    /**
     * 公益活动
     * 捐款或体力劳动，提升名誉和心情
     */
    doCharity() {
        const state = this.game.gameState.data

        this.game.uiManager.addModal({
            type: 'action',
            title: '公益活动',
            content: '选择参与方式',
            actions: [
                {
                    text: '捐款',
                    callback: () => this.doDonation(),
                    color: '#f39c12'
                },
                {
                    text: '体力劳动',
                    callback: () => this.doVolunteerWork(),
                    color: '#27ae60'
                }
            ],
            height: 160
        })
    }

    /**
     * 捐款
     */
    doDonation() {
        const state = this.game.gameState.data

        if (state.money < 50) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '金币不足',
                content: '需要至少50金币才能捐款',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }

        this.game.uiManager.addModal({
            type: 'trade',
            title: '捐款',
            content: '消耗金币\n名誉+5~+10\n心情+5~+10',
            itemName: '捐款金额',
            price: 1,
            quantity: 50,
            maxQuantity: state.money,
            total: 50,
            tradeType: 'donation',
            height: 220,
            onConfirm: (qty) => {
                if (state.money >= qty) {
                    const reputationGain = 5 + Math.floor(Math.random() * 6)
                    const moodGain = 5 + Math.floor(Math.random() * 6)
                    state.money -= qty
                    state.reputation = Math.min(100, state.reputation + reputationGain)
                    state.mood = Math.min(100, state.mood + moodGain)
                    this.game.gameState.save()

                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('increase', reputationGain, 'reputation', '名誉', '#9b59b6')
                    this.game.gameState.addDelayedAnimation('increase', moodGain, 'mood', '心情', '#e91e63')

                    this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
                }
            }
        })
    }

    /**
     * 志愿者工作（体力劳动）
     */
    doVolunteerWork() {
        const state = this.game.gameState.data

        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '需要1点精力才能参与体力劳动',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }

        const reputationGain = 5 + Math.floor(Math.random() * 6)
        const moodGain = 5 + Math.floor(Math.random() * 6)
        state.energy -= 1
        state.reputation = Math.min(100, state.reputation + reputationGain)
        state.mood = Math.min(100, state.mood + moodGain)
        this.game.gameState.save()

        this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
        this.game.gameState.addDelayedAnimation('increase', reputationGain, 'reputation', '名誉', '#9b59b6')
        this.game.gameState.addDelayedAnimation('increase', moodGain, 'mood', '心情', '#e91e63')

        this.game.uiManager.addModal({
            type: 'confirm',
            title: '公益活动完成',
            content: `你参与了体力劳动！\n\n消耗: 1精力\n获得: 名誉+${reputationGain}, 心情+${moodGain}`,
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {
                this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
            }
        })
    }

    /**
     * 医院
     * 消耗1精力+100金币，恢复30健康
     */
    doHospital() {
        const state = this.game.gameState.data
        const config = GAME_CONFIG.hospital

        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法去医院',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }

        const maxHeal = Math.min(config.maxHeal, 100 - state.health)
        const cost = maxHeal * config.costPerHealth

        if (maxHeal <= 0) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '健康已满',
                content: '无需治疗',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }

        this.game.uiManager.addModal({
            type: 'confirm',
            title: '医院',
            content: `消耗1精力\n花费${cost}金币\n恢复健康+${maxHeal}`,
            confirmText: '治疗',
            onConfirm: () => {
                if (state.money >= cost) {
                    state.energy -= 1
                    state.money -= cost
                    state.health = Math.min(100, state.health + maxHeal)
                    this.game.gameState.save()

                    this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
                    this.game.gameState.addDelayedAnimation('decrease', cost, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('increase', maxHeal, 'health', '健康', '#27ae60')

                    this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
                }
            }
        })
    }

    /**
     * 健身房
     * 消耗1精力，健康+5~10，连续3天提升精力上限
     */
    doGym() {
        const state = this.game.gameState.data

        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法健身',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }

        this.game.uiManager.addModal({
            type: 'confirm',
            title: '健身房',
            content: '消耗1精力\n健康+5~+10\n连续健身可提升精力上限',
            confirmText: '健身',
            onConfirm: () => {
                const healthGain = 5 + Math.floor(Math.random() * 6)
                state.energy -= 1
                state.health = Math.min(100, state.health + healthGain)
                state.consecutiveGymDays++

                if (state.consecutiveGymDays >= 3) {
                    state.maxEnergy = Math.min(15, state.maxEnergy + 1)
                }

                this.game.gameState.save()

                this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
                this.game.gameState.addDelayedAnimation('increase', healthGain, 'health', '健康', '#27ae60')

                this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
            }
        })
    }

    /**
     * 娱乐
     * 消耗1精力+50金币，心情+15~25
     */
    doEntertainment() {
        const state = this.game.gameState.data

        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法娱乐',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }

        this.game.uiManager.addModal({
            type: 'confirm',
            title: '娱乐',
            content: '消耗1精力\n花费50金币\n心情+15~+25',
            confirmText: '娱乐',
            onConfirm: () => {
                if (state.money >= 50) {
                    const moodGain = 15 + Math.floor(Math.random() * 11)
                    state.energy -= 1
                    state.money -= 50
                    state.mood = Math.min(100, state.mood + moodGain)
                    state.consecutiveGymDays = 0
                    this.game.gameState.save()

                    this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
                    this.game.gameState.addDelayedAnimation('decrease', 50, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('increase', moodGain, 'mood', '心情', '#e91e63')

                    this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
                }
            }
        })
    }
}
