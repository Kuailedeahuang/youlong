import { GAME_CONFIG } from '../data/gameConfig.js'

export default class WorkSystem {
    constructor(game) {
        this.game = game
    }

    showWorkModal(onComplete) {
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

        const jobs = GAME_CONFIG.jobs
        const job = jobs[state.jobLevel - 1]
        let baseSalary = job.baseSalary
        let overtimeSalary = job.overtimeSalary

        if (state.salaryDeduction) {
            baseSalary = Math.floor(baseSalary * 0.8)
            overtimeSalary = Math.floor(overtimeSalary * 0.8)
        }

        const nextJob = jobs[state.jobLevel]
        let nextLevelInfo = ''
        if (nextJob) {
            nextLevelInfo = `\n\n【下一级】\nLv.${nextJob.level} ${nextJob.title}\n日薪: ${nextJob.baseSalary}金币`
        }

        const lineCount = 6 + (nextJob ? 3 : 0)
        const contentHeight = 55 + lineCount * 22 + 80

        this.game.uiManager.addModal({
            type: 'action',
            title: `工作 - ${state.jobTitle}`,
            content: `【当前岗位】\nLv.${job.level} ${job.title}\n\n上班: ${baseSalary}金币 (消耗1精力)\n加班: ${overtimeSalary}金币 (消耗1精力,健康-5)${nextLevelInfo}`,
            actions: [
                { text: '上班', callback: () => this._startWorkWithMiniGame(false, baseSalary, onComplete) },
                { text: '加班', callback: () => this._startWorkWithMiniGame(true, overtimeSalary, onComplete) }
            ],
            height: Math.max(350, contentHeight)
        })
    }

    _startWorkWithMiniGame(isOvertime, salary, onComplete) {
        if (isOvertime) {
            const state = this.game.gameState.data
            if (state.health < 30) {
                this.game.uiManager.addModal({
                    type: 'confirm',
                    title: '健康不足',
                    content: '无法加班',
                    confirmText: '知道了',
                    onConfirm: () => {}
                })
                return
            }
        }

        this.game.startMiniGame('work', {
            salary,
            isOvertime
        }, (successRate) => {
            const adjustedSalary = Math.floor(salary * successRate)
            this.doWork(isOvertime, adjustedSalary, successRate, onComplete)
        })
    }

    doWork(isOvertime, salary, successRate, onComplete) {
        const state = this.game.gameState.data

        state.energy = Math.max(0, state.energy - 1)
        state.money += salary

        if (isOvertime) {
            state.health = Math.max(0, state.health - GAME_CONFIG.work.overtimeHealthCost)
        }

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
                this.game.gameState.addDelayedAnimation('increase', reputationChange, 'reputation')
            } else {
                this.game.gameState.addDelayedAnimation('decrease', Math.abs(reputationChange), 'reputation')
            }
        }

        this.game.gameState.save()

        state.daysWorked++

        this.game.gameState.addDelayedAnimation('decrease', 1, 'energy')
        this.game.gameState.addDelayedAnimation('increase', salary, 'money')

        if (isOvertime) {
            this.game.gameState.addDelayedAnimation('decrease', 5, 'health')
        }

        let workResultContent = `获得 ${salary} 金币！`

        if (successRate < 1.0) {
            let ratingLabel = ''
            if (successRate >= 0.6) {
                ratingLabel = '表现良好'
            } else {
                ratingLabel = '表现不佳'
            }
            workResultContent += `\n专注挑战：${ratingLabel}（${Math.round(successRate * 100)}%薪资）`
        } else if (successRate >= 1.0) {
            workResultContent += '\n专注挑战：完美表现！'
        }

        if (reputationChange !== 0) {
            workResultContent += `\n${reputationReason}，名誉${reputationChange > 0 ? '+' : ''}${reputationChange}`
        }

        const promotionConfig = GAME_CONFIG.promotion
        const nextJob = GAME_CONFIG.jobs[state.jobLevel]
        const canPromote = nextJob &&
            state.reputation >= promotionConfig.reputationRequired &&
            state.daysWorked >= promotionConfig.daysWorkedRequired &&
            state.health >= promotionConfig.healthRequired

        if (canPromote) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '工作完成',
                content: workResultContent + `\n\n恭喜！您符合升职条件！\n可以升职为 ${nextJob.title}`,
                confirmText: '升职',
                cancelText: '暂不',
                onConfirm: () => {
                    this.promote(onComplete)
                },
                onCancel: () => {
                    if (onComplete) onComplete()
                }
            })
        } else {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '工作完成',
                content: workResultContent,
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {
                    if (onComplete) onComplete()
                }
            })
        }
    }

    promote(onComplete) {
        const state = this.game.gameState.data
        const nextJob = GAME_CONFIG.jobs[state.jobLevel]

        if (!nextJob) return

        state.jobLevel = nextJob.level
        state.jobTitle = nextJob.title
        this.game.gameState.save()

        this.game.gameState.addEvent(`恭喜升职为${nextJob.title}！`)

        this.game.uiManager.addModal({
            type: 'confirm',
            title: '升职成功！',
            content: `您已升职为 ${nextJob.title}！\n日薪: ${nextJob.baseSalary}金币\n加班费: ${nextJob.overtimeSalary}金币`,
            confirmText: '太好了',
            singleButton: true,
            onConfirm: () => {
                if (onComplete) onComplete()
            }
        })
    }
}
