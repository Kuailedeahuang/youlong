import HomeScene from '../scenes/homeScene.js'
import MarketScene from '../scenes/marketScene.js'
import HouseScene from '../scenes/houseScene.js'
import SplashScene from '../scenes/splashScene.js'

export default class SceneManager {
    constructor(game) {
        this.game = game
        this.scenes = {
            splash: new SplashScene(game),
            home: new HomeScene(game),
            market: new MarketScene(game),
            house: new HouseScene(game)
        }
        this.currentScene = 'splash'
        this.isSwitching = false
        
        setTimeout(() => {
            this.scenes.splash.onEnter()
        }, 0)
    }
    
    switchTo(sceneName) {
        if (this.scenes[sceneName] && !this.isSwitching) {
            this.isSwitching = true
            this.game.uiManager.clearAll()
            this.currentScene = sceneName
            this.game.gameState.set('currentScene', sceneName)
            
            // 延迟执行场景进入，避免渲染冲突
            setTimeout(async () => {
                await this.scenes[sceneName].onEnter()
                this.isSwitching = false
            }, 50)
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
}