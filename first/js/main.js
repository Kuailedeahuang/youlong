import GameState from './core/gameState.js'
import Renderer from './core/renderer.js'
import UIManager from './core/uiManager.js'
import SceneManager from './core/sceneManager.js'
import ItemData from './data/items.js'

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
        
        this.lastTime = Date.now()
        this.deltaTime = 0
        
        this.initEvents()
        this.loop()
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
}

new Game()
