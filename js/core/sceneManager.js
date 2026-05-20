import LoginScene from '../scenes/loginScene.js'
import HomeScene from '../scenes/homeScene.js'
import MarketScene from '../scenes/marketScene.js'
import HouseScene from '../scenes/houseScene.js'
import SplashScene from '../scenes/splashScene.js'
import SceneWithBackground from '../scenes/sceneWithBackground.js'
import SettingsScene from '../scenes/settingsScene.js'
import MapScene from '../scenes/mapScene.js'
import ComputerScene from '../scenes/computerScene.js'
import SceneTransitionManager from '../utils/sceneTransitionManager.js'

export default class SceneManager {
    constructor(game) {
        this.game = game
        this.isReady = false
        this.scenes = {
            login: new LoginScene(game),
            splash: new SplashScene(game),
            home: new HomeScene(game),
            market: new MarketScene(game),
            house: new HouseScene(game),
            sceneWithBackground: new SceneWithBackground(game),
            settings: new SettingsScene(game),
            map: new MapScene(game),
            computer: new ComputerScene(game)
        }
        this.currentScene = 'login'
        this.isSwitching = false
        this.switchRequestId = 0
        this.pendingScene = null
        this.sceneReadyState = {}
        this.previousScene = null
        this.transition = new SceneTransitionManager(game)
        
        Object.keys(this.scenes).forEach(key => {
            this.sceneReadyState[key] = true
        })
    }

    setReady() {
        this.isReady = true
        console.log('[SceneManager] 初始化完成，显示启动画面')
        this.switchTo('splash')
    }

    async switchTo(sceneName, params = null) {
        const hasParams = params !== null
        console.log(`[SceneManager] switchTo 被调用: ${sceneName}${hasParams ? ', params:' : ''}`, hasParams ? params : '')
        
        if (!this.scenes[sceneName]) {
            console.log(`[SceneManager] 无法切换场景: ${sceneName}, 场景不存在`)
            return
        }
        if (this.isSwitching) {
            console.log(`[SceneManager] 正在切换中，忽略请求: ${sceneName}`)
            return
        }

        if (!this.transition.isActive() && sceneName !== 'splash' && sceneName !== 'login') {
            const label = this.getTransitionLabel(sceneName, params)
            if (sceneName === 'map') {
                this.transition.startExpand()
            } else if (label) {
                this.transition.startTravel(sceneName, label)
            }
        }

        const requestId = ++this.switchRequestId
        console.log(`[SceneManager] 开始切换到场景: ${sceneName}${hasParams ? ' 带参数' : ''}, 请求ID: ${requestId}`)
        this.isSwitching = true
        this.game.uiManager.clearAll()

        this.previousScene = this.currentScene
        this.currentScene = sceneName
        this.sceneReadyState[sceneName] = false
        this.game.gameState.set('currentScene', sceneName)

        setTimeout(async () => {
            if (this.switchRequestId !== requestId) {
                console.log(`[SceneManager] 请求ID不匹配(${requestId} != ${this.switchRequestId})，跳过执行`)
                return
            }
            try {
                console.log(`[SceneManager] 调用 ${sceneName}.onEnter()${hasParams ? ' 带参数' : ''}`)
                const onEnterResult = hasParams 
                    ? this.scenes[sceneName].onEnter(params)
                    : this.scenes[sceneName].onEnter()
                if (onEnterResult instanceof Promise) {
                    await onEnterResult
                }
                console.log(`[SceneManager] ${sceneName}.onEnter() 完成`)
            } catch (e) {
                console.error(`[SceneManager] ${sceneName}.onEnter() 执行错误:`, e)
            } finally {
                if (this.switchRequestId === requestId) {
                    this.sceneReadyState[sceneName] = true
                    this.isSwitching = false
                }
            }
        }, 0)
    }

    switchToWithParams(sceneName, params) {
        return this.switchTo(sceneName, params)
    }
    
    getScene(sceneName) {
        return this.scenes[sceneName]
    }
    
    goToLocation(locationName) {
        const locationSceneMap = {
            'home': 'sceneWithBackground',
            'work': 'sceneWithBackground',
            'bank': 'sceneWithBackground',
            'hospital': 'sceneWithBackground',
            'gym': 'sceneWithBackground',
            'house': 'house',
            'privateLoan': 'sceneWithBackground'
        }
        
        const targetScene = locationSceneMap[locationName]
        
        if (targetScene === 'sceneWithBackground') {
            this.switchToWithParams('sceneWithBackground', { sceneName: locationName })
        } else if (targetScene === 'house') {
            this.switchTo('house', { sceneName: locationName })
        } else {
            console.warn(`[SceneManager] 未知地点: ${locationName}`)
        }
    }

    getTransitionLabel(sceneName, params) {
        if (sceneName === 'map') return ''

        if (params && params.sceneName) {
            const map = {
                home: '返回 家园...',
                work: '前往 工作...',
                bank: '前往 银行...',
                hospital: '前往 医院...',
                gym: '前往 健身房...',
                privateLoan: '前往 借贷...',
                house: '前往 售楼部...'
            }
            return map[params.sceneName] || `前往 ${params.sceneName}...`
        }

        const map = {
            house: '前往 售楼部...',
            market: '前往 市场...',
            computer: '打开 电脑...',
            settings: '打开 设置...',
            home: '返回 家园...'
        }
        return map[sceneName] || ''
    }
    
    update(deltaTime) {
        if (this.transition.isActive()) {
            this.transition.update(deltaTime)
        }
        const scene = this.scenes[this.currentScene]
        if (scene) {
            scene.update(deltaTime)
        }
    }
    
    render(renderer) {
        const scene = this.scenes[this.currentScene]
        const isReady = this.sceneReadyState[this.currentScene]
        
        if (isReady && scene) {
            scene.render(renderer)
        } else if (this.isSwitching && this.previousScene && this.scenes[this.previousScene]) {
            this.scenes[this.previousScene].render(renderer, { registerButtons: false })
        } else if (this.previousScene && this.scenes[this.previousScene]) {
            this.scenes[this.previousScene].render(renderer)
        } else {
            renderer.clear('#16213e')
        }

        if (this.transition) {
            this.transition.render(renderer)
        }
    }
    
    handleTouchStart(x, y) {
        if (this.transition && this.transition.isActive()) {
            return true
        }
        const scene = this.scenes[this.currentScene]
        console.log('[SceneManager] handleTouchStart, 当前场景:', this.currentScene)
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
        if (this.transition && this.transition.isActive()) {
            return false
        }
        const scene = this.scenes[this.currentScene]
        console.log('[SceneManager] handleTouchEnd, 当前场景:', this.currentScene)
        if (scene && scene.handleTouchEnd) {
            scene.handleTouchEnd(x, y)
        }
    }
}