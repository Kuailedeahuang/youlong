import LoginScene from '../scenes/loginScene.js'
import HomeScene from '../scenes/homeScene.js'
import MarketScene from '../scenes/marketScene.js'
import HouseScene from '../scenes/houseScene.js'
import SplashScene from '../scenes/splashScene.js'

export default class SceneManager {
    constructor(game) {
        this.game = game
        this.isReady = false
        this.scenes = {
            login: new LoginScene(game),
            splash: new SplashScene(game),
            home: new HomeScene(game),
            market: new MarketScene(game),
            house: new HouseScene(game)
        }
        this.currentScene = 'login'
        this.isSwitching = false
    }

    setReady() {
        this.isReady = true
        console.log('[SceneManager] 初始化完成，显示启动画面')
        this.switchTo('splash')
    }
    
    switchTo(sceneName) {
        console.log(`[SceneManager] switchTo 被调用: ${sceneName}`)
        if (this.scenes[sceneName] && !this.isSwitching) {
            console.log(`[SceneManager] 开始切换到场景: ${sceneName}`)
            this.isSwitching = true
            this.game.uiManager.clearAll()
            this.currentScene = sceneName
            this.game.gameState.set('currentScene', sceneName)
            
            // 延迟执行场景进入，避免渲染冲突
            setTimeout(async () => {
                console.log(`[SceneManager] 调用 ${sceneName}.onEnter()`)
                await this.scenes[sceneName].onEnter()
                console.log(`[SceneManager] ${sceneName}.onEnter() 完成`)
                this.isSwitching = false
            }, 50)
        } else {
            console.log(`[SceneManager] 无法切换场景: ${sceneName}, 场景存在: ${!!this.scenes[sceneName]}, 正在切换: ${this.isSwitching}`)
        }
    }
    
    update(deltaTime) {
        const scene = this.scenes[this.currentScene]
        if (scene) {
            scene.update(deltaTime)
        }
    }
    
    render(renderer) {
        const scene = this.scenes[this.currentScene]
        if (scene) {
            scene.render(renderer)
        }
    }
    
    handleTouchStart(x, y) {
        const scene = this.scenes[this.currentScene]
        if (scene && scene.handleTouchStart) {
            return scene.handleTouchStart(x, y)
        }
        return false
    }
    
    handleTouchMove(x, y) {
        const scene = this.scenes[this.currentScene]
        if (scene && scene.handleTouchMove) {
            scene.handleTouchMove(x, y)
        }
    }
    
    handleTouchEnd(x, y) {
        const scene = this.scenes[this.currentScene]
        if (scene && scene.handleTouchEnd) {
            scene.handleTouchEnd(x, y)
        }
    }
}