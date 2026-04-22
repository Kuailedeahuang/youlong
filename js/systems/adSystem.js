// 广告系统
import animationManager from '../utils/animationManager.js'

export default class AdSystem {
    constructor(game) {
        this.game = game
        this.rewardedVideoAd = null
        this.adWatchedCount = 0
        this.maxWatchCount = 3
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
        
        if (state.adWatchedCount >= this.maxWatchCount) {
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
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '观看广告',
            content: '观看广告可获得5000金币\n（开发模式：直接获得奖励）',
            confirmText: '获得奖励',
            onConfirm: () => {
                this.giveReward()
            },
            onCancel: () => {}
        })
    }
    
    giveReward() {
        const state = this.game.gameState.data
        const rewardAmount = 5000
        
        state.money += rewardAmount
        state.adWatchedCount++
        this.game.gameState.save()
        
        this.game.gameState.addDelayedAnimation('increase', rewardAmount, 'money', '金币', '#f39c12')
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '奖励已发放',
            content: `获得 ${rewardAmount} 金币！\n本局剩余次数: ${this.getRemainingCount()}/3`,
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {
                this.game.sceneManager.switchTo('home')
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
        return `看广告 +5000金币 (${remaining}/3)`
    }
}