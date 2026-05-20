import WorkMiniGame from './WorkMiniGame.js'
import GymMiniGame from './GymMiniGame.js'

export default class MiniGameContext {
    static State = {
        IDLE: 'idle',
        ACTIVE: 'active',
        COMPLETED: 'completed'
    }

    constructor(game) {
        this.game = game
        this.state = MiniGameContext.State.IDLE
        this.activeMiniGame = null
        this.onCompleteCallback = null
        this.savedBackground = null
        this.miniGameType = null
    }

    isActive() {
        return this.state === MiniGameContext.State.ACTIVE
    }

    enter(miniGameType, config, onComplete) {
        if (this.state === MiniGameContext.State.ACTIVE) {
            console.warn('[MiniGameContext] 已有活跃小游戏，先退出')
            this.exit(0)
        }

        this._clearMainUI()
        this._saveCurrentBackground(miniGameType)
        this._createMiniGame(miniGameType, config)

        this.state = MiniGameContext.State.ACTIVE
        this.onCompleteCallback = onComplete
        this.miniGameType = miniGameType

        console.log(`[MiniGameContext] 进入小游戏: ${miniGameType}`)
    }

    _saveCurrentBackground(miniGameType) {
        const currentSceneName = this.game.sceneManager.currentScene
        const sceneInstance = this.game.sceneManager.scenes[currentSceneName]
        
        if (sceneInstance && sceneInstance.backgroundManager) {
            const bgManager = sceneInstance.backgroundManager
            if (bgManager.imageLoaded && bgManager.bgImage) {
                this.savedBackground = {
                    image: bgManager.bgImage,
                    type: miniGameType
                }
                console.log('[MiniGameContext] 已保存场景背景图')
            } else {
                console.warn('[MiniGameContext] 背景图未加载或不存在')
            }
        } else {
            console.warn('[MiniGameContext] 当前场景没有背景管理器或场景实例')
        }
    }

    _renderBackground(renderer) {
        const ctx = renderer.ctx
        const w = renderer.width
        const h = renderer.height

        if (this.savedBackground && this.savedBackground.image) {
            try {
                ctx.drawImage(this.savedBackground.image, 0, 0, w, h)
            } catch (e) {
                console.warn('[MiniGameContext] 绘制背景图失败:', e)
                renderer.clear('#16213e')
            }
        } else {
            renderer.clear('#16213e')
        }

        const overlayOpacity = this.activeMiniGame && this.activeMiniGame.overlayOpacity !== undefined 
            ? this.activeMiniGame.overlayOpacity 
            : 0.55
        ctx.fillStyle = `rgba(0, 0, 0, ${overlayOpacity})`
        ctx.fillRect(0, 0, w, h)
    }

    exit(successRate = 0) {
        this.state = MiniGameContext.State.COMPLETED

        this._destroyMiniGame()
        this.savedBackground = null
        this.miniGameType = null

        this.game.uiManager.closeAllModals()
        this.game.uiManager.clearAll()

        if (this.onCompleteCallback) {
            const callback = this.onCompleteCallback
            this.onCompleteCallback = null
            callback(successRate)
        }

        this.state = MiniGameContext.State.IDLE

        console.log(`[MiniGameContext] 退出小游戏, 成功率: ${successRate}`)
    }

    update() {
        if (this.state !== MiniGameContext.State.ACTIVE) return
        if (this.activeMiniGame) {
            this.activeMiniGame.update()
        }
    }

    render(renderer) {
        if (this.state !== MiniGameContext.State.ACTIVE) return
        
        this._renderBackground(renderer)
        
        if (this.activeMiniGame) {
            this.activeMiniGame.render(renderer)
        }
    }

    handleTouchStart(x, y) {
        if (this.state !== MiniGameContext.State.ACTIVE) return false
        if (this.activeMiniGame) {
            return this.activeMiniGame.handleTouch(x, y)
        }
        return false
    }

    handleTouchMove(x, y) {
        if (this.state !== MiniGameContext.State.ACTIVE) return
        if (this.activeMiniGame && this.activeMiniGame.handleTouchMove) {
            this.activeMiniGame.handleTouchMove(x, y)
        }
    }

    handleTouchEnd(x, y) {
        if (this.state !== MiniGameContext.State.ACTIVE) return false
        if (this.activeMiniGame && this.activeMiniGame.handleTouchEnd) {
            return this.activeMiniGame.handleTouchEnd(x, y)
        }
        return false
    }

    _clearMainUI() {
        this.game.uiManager.closeAllModals()
        this.game.uiManager.clearAll()
    }

    _createMiniGame(type, config) {
        const MiniGameFactory = {
            'work': WorkMiniGame,
            'gym': GymMiniGame
        }

        const MiniGameClass = MiniGameFactory[type]
        if (!MiniGameClass) {
            console.error(`[MiniGameContext] 未知小游戏类型: ${type}`)
            return
        }

        this.activeMiniGame = new MiniGameClass(
            this.game,
            this.game.timeProvider,
            (successRate) => this._onMiniGameComplete(successRate)
        )

        this.activeMiniGame.start(config)
    }

    _destroyMiniGame() {
        if (this.activeMiniGame) {
            this.activeMiniGame.destroy()
            this.activeMiniGame = null
        }
    }

    _onMiniGameComplete(successRate) {
        this.exit(successRate)
    }
}
