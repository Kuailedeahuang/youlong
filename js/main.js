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

class Game {
    constructor() {
        this.canvas = window.canvas
        this.ctx = this.canvas.getContext('2d')
        this.width = window.screenWidth
        this.height = window.screenHeight
        this.dpr = window.devicePixelRatio
        
        this.canvas.width = this.width * this.dpr
        this.canvas.height = this.height * this.dpr
        this.ctx.scale(this.dpr, this.dpr)
        
        this.gameState = new GameState()
        this.renderer = new Renderer(this.ctx, this.width, this.height)
        this.uiManager = new UIManager(this)
        this.sceneManager = new SceneManager(this)
        
        // 初始化系统
        this.endingSystem = new EndingSystem(this)
        this.adSystem = new AdSystem(this)
        this.houseSystem = new HouseSystem(this)
        this.bankruptcySystem = new BankruptcySystem(this)
        
        this.lastTime = Date.now()
        this.deltaTime = 0
        
        this.initCloud()
        this.initEvents()
        this.loop()
    }
    
    async initCloud() {
        try {
            console.log('开始初始化云开发...')
            await initializeCloudDatabase()
            console.log('云开发初始化完成')
        } catch (e) {
          console.error('云开发初始化失败:', e)
        }
    }
    
    initEvents() {
        wx.onTouchStart((e) => {
            const touch = e.touches[0]
            const x = touch.clientX
            const y = touch.clientY
            this.uiManager.handleTouch(x, y)
        })
    }
    
    loop() {
        const now = Date.now()
        this.deltaTime = (now - this.lastTime) / 1000
        this.lastTime = now
        
        this.update()
        this.render()
        
        requestAnimationFrame(() => this.loop())
    }
    
    update() {
        this.sceneManager.update(this.deltaTime)
    }
    
    render() {
        this.ctx.clearRect(0, 0, this.width, this.height)
        this.sceneManager.render(this.renderer)
        this.uiManager.render(this.renderer)
    }
    
    // 重置游戏
    async resetGame() {
        console.log('重置游戏...')
        await restartGame()
    }
    
    // 每日检查
    dailyCheck() {
        // 检查破产
        if (this.bankruptcySystem.checkAndExecuteBankruptcy()) {
            return
        }
        
        // 检查结局
        if (this.endingSystem.dailyCheck()) {
            return
        }
        
        // 显示破产预警
        this.bankruptcySystem.showBankruptcyWarning()
    }
}

new Game()
