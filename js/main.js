import GameState from './core/gameState.js'
import Renderer from './core/renderer.js'
import UIManager from './core/uiManager.js'
import SceneManager from './core/sceneManager.js'
import ItemData from './data/items.js'
import { initializeCloudDatabase } from './utils/initCloud.js'
import EndingSystem from './systems/endingSystem.js'
import AdSystem from './systems/adSystem.js'
import HouseSystem from './systems/houseSystem.js'
import BankruptcySystem from './systems/bankruptcySystem.js'
import { restartGame } from './utils/resetGame.js'
import DebugPanel from './debug/DebugPanel.js'
import TimeProvider from './utils/TimeProvider.js'
import MiniGameContext from './miniGames/MiniGameContext.js'

class Game {
    constructor() {
        this.canvas = window.canvas
        this.ctx = this.canvas.getContext('2d')
        this.width = window.screenWidth
        this.height = window.screenHeight
        this.dpr = window.devicePixelRatio
        this.ready = false

        this.canvas.width = this.width * this.dpr
        this.canvas.height = this.height * this.dpr
        this.ctx.scale(this.dpr, this.dpr)

        this.initGame()
    }

    async initGame() {
        console.log('[Game] 开始初始化...')

        try {
            console.log('[Game] 初始化云开发...')
            await initializeCloudDatabase()
            console.log('[Game] 云开发初始化完成')
        } catch (e) {
            console.error('[Game] 云开发初始化失败:', e)
        }

        this.timeProvider = new TimeProvider()
        this.gameState = new GameState()
        this.renderer = new Renderer(this.ctx, this.width, this.height)
        this.uiManager = new UIManager(this)
        this.sceneManager = new SceneManager(this)
        this.miniGameContext = new MiniGameContext(this)

        this.endingSystem = new EndingSystem(this)
        this.adSystem = new AdSystem(this)
        this.houseSystem = new HouseSystem(this)
        this.bankruptcySystem = new BankruptcySystem(this)

        this.debugPanel = DebugPanel.getInstance(this)

        this.lastTime = Date.now()
        this.deltaTime = 0

        console.log('[Game] 通知场景管理器就绪')
        this.sceneManager.setReady()
        this.ready = true

        this.initEvents()
        this.loop()
        console.log('[Game] 初始化完成')
    }

    startMiniGame(type, config, onComplete) {
        this.miniGameContext.enter(type, config, onComplete)
    }

    initEvents() {
        wx.onTouchStart((e) => {
            const touch = e.touches[0]
            const x = touch.clientX
            const y = touch.clientY

            if (this.debugPanel && this.debugPanel.handleMapButtonTouchStart(x, y)) {
                return
            }

            if (this.miniGameContext.isActive()) {
                if (this.miniGameContext.handleTouchStart(x, y)) {
                    return
                }
            }

            if (this.uiManager.modals.length > 0) {
                this.uiManager.handleTouch(x, y)
                return
            }

            if (this.sceneManager.handleTouchStart(x, y)) {
                return
            }

            this.uiManager.handleTouch(x, y)
        })

        wx.onTouchMove((e) => {
            const touch = e.touches[0]
            const x = touch.clientX
            const y = touch.clientY

            if (this.debugPanel && this.debugPanel.handleMapButtonTouchMove(x, y)) {
                return
            }

            if (this.miniGameContext.isActive()) {
                this.miniGameContext.handleTouchMove(x, y)
                return
            }

            this.sceneManager.handleTouchMove(x, y)
        })

        wx.onTouchEnd((e) => {
            const touch = e.changedTouches[0]
            const x = touch.clientX
            const y = touch.clientY

            if (this.debugPanel && this.debugPanel.handleMapButtonTouchEnd()) {
                return
            }

            if (this.miniGameContext.isActive()) {
                this.miniGameContext.handleTouchEnd(x, y)
                return
            }

            if (this.uiManager.modals.length > 0) {
                return
            }

            this.sceneManager.handleTouchEnd(x, y)
        })
    }

    loop(timestamp) {
        try {
            this.timeProvider.update(timestamp || Date.now())
            this.deltaTime = this.timeProvider.deltaTime
            this.lastTime = Date.now()

            this.update()

            if (this.miniGameContext.isActive()) {
                this.miniGameContext.update()
            }

            this.render()
        } catch (e) {
            console.error('渲染循环错误:', e)
        }

        requestAnimationFrame((ts) => this.loop(ts))
    }

    update() {
        this.sceneManager.update(this.deltaTime)
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height)

        if (this.miniGameContext.isActive()) {
            this.miniGameContext.render(this.renderer)
        } else {
            this.sceneManager.render(this.renderer)
            this.uiManager.render(this.renderer)
        }

        if (this.debugPanel && this.debugPanel.isVisible) {
            this.debugPanel.render()
        }
    }

    async resetGame() {
        console.log('重置游戏...')
        await restartGame()
    }

    dailyCheck() {
        if (this.bankruptcySystem.checkAndExecuteBankruptcy()) {
            return
        }

        if (this.endingSystem.dailyCheck()) {
            return
        }

        this.bankruptcySystem.showBankruptcyWarning()
    }
}

new Game()
