// 广告系统
export default class AdSystem {
    constructor(game) {
        this.game = game
        this.rewardedVideoAd = null
        this.adWatchedCount = 0
        this.maxWatchCount = 3
        this.initAd()
    }
    
    // 初始化广告
    initAd() {
        if (wx.createRewardedVideoAd) {
            this.rewardedVideoAd = wx.createRewardedVideoAd({
                adUnitId: 'adunit-xxxxxxxxxxxxxxxx' // 需要替换为实际的广告单元ID
            })
            
            this.rewardedVideoAd.onLoad(() => {
                console.log('激励视频广告加载成功')
            })
            
            this.rewardedVideoAd.onError((err) => {
                console.error('激励视频广告加载失败:', err)
            })
            
            this.rewardedVideoAd.onClose((res) => {
                if (res && res.isEnded) {
                    // 用户完整观看了广告，发放奖励
                    this.giveReward()
                } else {
                    // 用户提前关闭广告
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
    
    // 检查是否可以观看广告
    canWatchAd() {
        const state = this.game.gameState.data
        return state.adWatchedCount < this.maxWatchCount
    }
    
    // 获取剩余次数
    getRemainingCount() {
        const state = this.game.gameState.data
        return this.maxWatchCount - state.adWatchedCount
    }
    
    // 显示广告
    async showAd() {
        const state = this.game.gameState.data
        
        // 检查是否已达上限
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
        
        // 检查广告是否初始化
        if (!this.rewardedVideoAd) {
            // 降级方案：直接给予奖励（开发测试模式）
            this.showMockAd()
            return
        }
        
        try {
            await this.rewardedVideoAd.show()
        } catch (err) {
            console.error('广告显示失败:', err)
            // 加载后重试
            try {
                await this.rewardedVideoAd.load()
                await this.rewardedVideoAd.show()
            } catch (loadErr) {
                console.error('广告加载失败:', loadErr)
                this.showMockAd()
            }
        }
    }
    
    // 模拟广告（开发测试用）
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
    
    // 发放奖励
    giveReward() {
        const state = this.game.gameState.data
        const rewardAmount = 5000
        
        state.money += rewardAmount
        state.adWatchedCount++
        this.game.gameState.save()
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '奖励已发放',
            content: `获得 ${rewardAmount} 金币！\n本局剩余次数: ${this.getRemainingCount()}/3`,
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {}
        })
    }
    
    // 重置每日次数
    resetDailyCount() {
        const state = this.game.gameState.data
        state.adWatchedCount = 0
        this.game.gameState.save()
    }
    
    // 获取广告按钮文本
    getAdButtonText() {
        const remaining = this.getRemainingCount()
        return `看广告 +5000金币 (${remaining}/3)`
    }
}
