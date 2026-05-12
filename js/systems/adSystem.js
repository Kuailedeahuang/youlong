// 广告系统
import animationManager from '../utils/animationManager.js'
import { GAME_CONFIG } from '../data/gameConfig.js'

export default class AdSystem {
    constructor(game) {
        this.game = game
        this.rewardedVideoAd = null
        this.adWatchedCount = 0
        this.maxWatchCount = GAME_CONFIG.ad.maxWatchCount
        this.rewardAmount = GAME_CONFIG.ad.rewardAmount
        this.initAd()
    }
    
    initAd() {
        if (wx.createRewardedVideoAd) {
            this.rewardedVideoAd = wx.createRewardedVideoAd({
                adUnitId: 'adunit-xxxxxxxxxxxxxxxx'
            })
            
            this.rewardedVideoAd.onLoad(() => {
                console.log('激励视频广告加载成功')
            })
            
            this.rewardedVideoAd.onError((err) => {
                console.error('激励视频广告加载失败:', err)
            })
            
            this.rewardedVideoAd.onClose((res) => {
                if (res && res.isEnded) {
                    this.giveReward()
                } else {
                    this.game.uiManager.addModal({
                        type: 'confirm',
                        title: '广告未看完',
                        content: '需要完整观看广告才能获得奖励',
                        confirmText: '知道了',
                        singleButton: true,
                        onConfirm: () => {}
                    })
                }
            })
        }
    }
    
    canWatchAd() {
        const state = this.game.gameState.data
        return state.adWatchedCount < this.maxWatchCount
    }
    
    getRemainingCount() {
        const state = this.game.gameState.data
        return Math.max(0, this.maxWatchCount - state.adWatchedCount)
    }
    
    async showAd() {
        const state = this.game.gameState.data
        console.log('[showAd] 当前观看次数:', state.adWatchedCount, ', 最大次数:', this.maxWatchCount)
        
        if (state.adWatchedCount >= this.maxWatchCount) {
            console.log('[showAd] 次数已用完，显示弹窗')
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '本局次数已用完',
                content: '每局游戏最多观看3次广告\n重新开始游戏后可再次观看',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }
        
        if (!this.rewardedVideoAd) {
            this.showMockAd()
            return
        }
        
        try {
            await this.rewardedVideoAd.show()
        } catch (err) {
            console.error('广告显示失败:', err)
            try {
                await this.rewardedVideoAd.load()
                await this.rewardedVideoAd.show()
            } catch (loadErr) {
                console.error('广告加载失败:', loadErr)
                this.showMockAd()
            }
        }
    }
    
    showMockAd() {
        console.log('[showMockAd] canWatchAd:', this.canWatchAd())
        // 再次检查次数限制
        if (!this.canWatchAd()) {
            console.log('[showMockAd] 次数已用完，显示弹窗')
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '本局次数已用完',
                content: '每局游戏最多观看3次广告\n重新开始游戏后可再次观看',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '观看广告',
            content: `观看广告可获得${this.rewardAmount}金币\n（开发模式：直接获得奖励）`,
            confirmText: '获得奖励',
            onConfirm: () => {
                this.giveReward()
            },
            onCancel: () => {}
        })
    }
    
    giveReward() {
        const state = this.game.gameState.data
        console.log('[giveReward] 当前观看次数:', state.adWatchedCount, ', 最大次数:', this.maxWatchCount)
        
        // 再次检查次数限制，防止重复调用
        if (state.adWatchedCount >= this.maxWatchCount) {
            console.log('[giveReward] 次数已用完，显示弹窗')
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '本局次数已用完',
                content: `每局游戏最多观看${this.maxWatchCount}次广告\n重新开始游戏后可再次观看`,
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }
        
        state.money += this.rewardAmount
        state.adWatchedCount++
        console.log('[giveReward] 增加观看次数后:', state.adWatchedCount)
        this.game.gameState.save()
        
        this.game.gameState.addDelayedAnimation('increase', this.rewardAmount, 'money')
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '奖励已发放',
            content: `获得 ${this.rewardAmount} 金币！\n本局剩余次数: ${this.getRemainingCount()}/${this.maxWatchCount}`,
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {
                this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
            }
        })
    }
    
    resetDailyCount() {
        const state = this.game.gameState.data
        state.adWatchedCount = 0
        this.game.gameState.save()
    }
    
    getAdButtonText() {
        const remaining = this.getRemainingCount()
        return `看广告 +${this.rewardAmount}金币 (${remaining}/${this.maxWatchCount})`
    }
}