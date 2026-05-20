import animationManager from '../utils/animationManager.js'
import iconManager from '../components/IconManager.js'
import InteractiveAreaManager from '../components/InteractiveAreaManager.js'
import SceneConfigManager from './SceneConfigManager.js'
import SceneBackgroundManager from './SceneBackgroundManager.js'
import SceneUIRenderer from './SceneUIRenderer.js'
import WorkSystem from '../systems/WorkSystem.js'
import BankSystem from '../systems/BankSystem.js'
import HospitalSystem from '../systems/HospitalSystem.js'
import GymSystem from '../systems/GymSystem.js'
import LoanSystem from '../systems/LoanSystem.js'
import RandomEventManager from '../utils/RandomEventManager.js'
import AnimationHelper from '../utils/AnimationHelper.js'
import SleepTransitionManager from '../utils/sleepTransitionManager.js'

export default class SceneWithBackground {
    constructor(game) {
        this.game = game

        this.configManager = new SceneConfigManager()
        this.backgroundManager = new SceneBackgroundManager()
        this.uiRenderer = new SceneUIRenderer(game)
        this.workSystem = new WorkSystem(game)
        this.bankSystem = new BankSystem(game)
        this.hospitalSystem = new HospitalSystem(game)
        this.gymSystem = new GymSystem(game)
        this.loanSystem = new LoanSystem(game)
        this.randomEventManager = new RandomEventManager(game)
        this.animationHelper = new AnimationHelper(game)
        this.currentScene = null
        this.targetScene = null
        this.dialogLines = []
        this.dialogIndex = 0
        this.isTyping = false
        this.typingTimer = null
        this.displayedText = ''
        this.currentSpeaker = ''
        this.statAnimations = []
        this.dialogVisible = true
        this.areaManager = new InteractiveAreaManager(game)
        this.initHomeAreas()
    }

    initHomeAreas() {
        this.areaManager.register('homeBed', {
            label: '床',
            action: () => this.showEndDayModal(),
            hitArea: {
                xPercent: 0.589,
                yPercent: 0.445,
                widthPercent: 0.320,
                heightPercent: 0.241
            },
            labelArea: {
                xPercent: 0.65,
                yPercent: 0.42,
                height: 24,
                paddingX: 10
            },
            style: {
                hitAreaBgColor: 'transparent',
                hitAreaBorderColor: 'transparent',
                labelBgColor: 'rgba(255, 255, 255, 0.85)',
                labelBorderColor: 'transparent',
                textColor: '#000000',
                fontSize: 12
            }
        })

        this.areaManager.register('homeComputer', {
            label: '电脑',
            action: () => this.onComputerClick(),
            hitArea: {
                xPercent: 0.358,
                yPercent: 0.432,
                widthPercent: 0.223,
                heightPercent: 0.159
            },
            labelArea: {
                xPercent: 0.40,
                yPercent: 0.40,
                height: 24,
                paddingX: 10
            },
            style: {
                hitAreaBgColor: 'transparent',
                hitAreaBorderColor: 'transparent',
                labelBgColor: 'rgba(255, 255, 255, 0.85)',
                labelBorderColor: 'transparent',
                textColor: '#000000',
                fontSize: 12
            }
        })

        this.areaManager.register('homeSetting', {
            label: '设置',
            action: () => this.onSettingClick(),
            hitArea: {
                xPercent: 0.159,
                yPercent: 0.395,
                widthPercent: 0.202,
                heightPercent: 0.218
            },
            labelArea: {
                xPercent: 0.20,
                yPercent: 0.36,
                height: 24,
                paddingX: 10
            },
            style: {
                hitAreaBgColor: 'transparent',
                hitAreaBorderColor: 'transparent',
                labelBgColor: 'rgba(255, 255, 255, 0.85)',
                labelBorderColor: 'transparent',
                textColor: '#000000',
                fontSize: 12
            }
        })
    }

    onComputerClick() {
        console.log('[SceneWithBackground] 点击电脑')
        this.game.sceneManager.switchTo('computer')
    }

    onSettingClick() {
        this.game.sceneManager.switchTo('settings')
    }

    async onEnter(params) {
        console.log('[SceneWithBackground] onEnter() 开始, params:', params)

        this.dialogIndex = 0
        this.displayedText = ''
        this.isTyping = false
        this.previousScene = this.game.sceneManager.previousScene || this.currentScene

        if (this.typingTimer) {
            clearTimeout(this.typingTimer)
            this.typingTimer = null
        }

        if (params && params.sceneName) {
            console.log('[SceneWithBackground] 开始加载背景:', params.sceneName)
            await this.loadBackground(params.sceneName)
            console.log('[SceneWithBackground] 背景加载完成')
        } else {
            this.dialogVisible = false
        }

        this.animationHelper.playDelayedAnimations()
        console.log('[SceneWithBackground] onEnter() 完成')
    }

    async loadBackground(sceneName) {
        console.log('[SceneWithBackground] loadBackground() 开始, sceneName:', sceneName)
        const sceneConfig = this.configManager.getSceneConfig(sceneName)
        
        if (!sceneConfig) {
            console.warn('[SceneWithBackground] 未找到场景配置:', sceneName)
            return
        }

        this.targetScene = sceneName

        let newDialogLines = []
        let newSpeaker = ''
        let newDialogVisible = true

        if (sceneName === 'home') {
            newDialogVisible = false
        } else {
            const dialogData = this.configManager.getRandomDialog(sceneName)
            newDialogLines = dialogData.lines
            newSpeaker = dialogData.speaker
        }

        this.currentScene = sceneName
        this.dialogLines = newDialogLines
        this.dialogIndex = 0
        this.currentSpeaker = newSpeaker
        this.dialogVisible = newDialogVisible
        this.displayedText = ''
        this.targetScene = null

        const success = await this.backgroundManager.loadBackground(sceneConfig)
        if (success) {
            console.log('[SceneWithBackground] 场景背景加载成功:', sceneName)
        } else {
            console.warn('[SceneWithBackground] 场景背景加载失败，场景仍可正常运作:', sceneName)
        }
    }

    update(deltaTime) {
        if (this.sleepTransition) {
            this.sleepTransition.update(deltaTime)
        }
    }

    render(renderer, options = {}) {
        const w = renderer.width
        const h = renderer.height
        const registerButtons = options.registerButtons !== false

        this.game.uiManager.clear()

        const isLoading = this.backgroundManager.isLoading()

        if (isLoading) {
            if (this.backgroundManager.checkLoadingTimeout()) {
                console.warn('[SceneWithBackground] 加载超时，强制完成')
            } else {
                this.backgroundManager.renderLoadingIndicator(renderer)
                return
            }
        }

        this.backgroundManager.render(renderer)

        this.game.sceneManager.sceneReadyState['sceneWithBackground'] = true

        if (!isLoading) {
            if (this.currentScene === 'home' && !this.dialogVisible) {
                this.areaManager.render(renderer, { registerButtons })
            } else {
                const config = this.configManager.getSceneConfig(this.currentScene)
                if (config && config.clickableAreas) {
                    this.uiRenderer.renderClickableAreas(renderer, config.clickableAreas, registerButtons)
                }
            }

            this.uiRenderer.renderDialog(renderer, {
                lines: this.dialogLines,
                speaker: this.currentSpeaker,
                visible: this.dialogVisible,
                index: this.dialogIndex
            })

            if (registerButtons) {
                const actions = this.configManager.getActions(this.currentScene)
                if (actions.length > 0 && !this.dialogVisible) {
                    this.uiRenderer.renderActions(renderer, actions, (callback) => this.handleAction(callback))
                }
            }
        }

        this.uiRenderer.renderTopBar(renderer, this.game.gameState)
        renderer.renderStatsPanel(this.game, this.game.gameState.data)
        animationManager.updateAndRender(renderer)

        if (this.sleepTransition) {
            this.sleepTransition.render(renderer)
        }
    }

    handleAction(callback) {
        switch (callback) {
            case 'startWork':
                this.workSystem.showWorkModal(() => this.stayInScene())
                break
            case 'showBankModal':
                this.bankSystem.showBankModal(() => this.stayInScene())
                break
            case 'doHospital':
                this.hospitalSystem.showHospitalModal(() => this.stayInScene())
                break
            case 'doGym':
                this.gymSystem.showGymModal(() => this.stayInScene())
                break
            case 'showLoanModal':
                this.loanSystem.showLoanModal(() => this.stayInScene())
                break
        }
    }

    stayInScene() {
        this.dialogIndex = 0
        this.displayedText = ''

        if (this.currentScene === 'home') {
            this.dialogVisible = false
            this.dialogLines = []
            this.currentSpeaker = ''
        } else {
            const dialogData = this.configManager.getRandomDialog(this.currentScene)
            this.dialogVisible = true
            this.dialogLines = dialogData.lines
            this.currentSpeaker = dialogData.speaker
        }

        this.animationHelper.playDelayedAnimations()
    }

    handleTouchStart(x, y) {
        if (this.sleepTransition && this.sleepTransition.isActive()) {
            return this.sleepTransition.handleTouchStart(x, y)
        }

        if (y <= 64) {
            return false
        }
        const statsBarY = this.game.renderer.height - 112 - 12
        if (y >= statsBarY) {
            return false
        }

        if (this.dialogVisible) {
            if (this.dialogIndex < this.dialogLines.length - 1) {
                this.dialogIndex++
                return true
            } else {
                this.dialogVisible = false
                return true
            }
        }

        const config = this.configManager.getSceneConfig(this.currentScene)

        if (config && config.clickableAreas) {
            const renderer = this.game.renderer
            if (!renderer) return false

            for (const area of config.clickableAreas) {
                const areaX = area.x * renderer.width
                const areaY = area.y * renderer.height
                const areaW = area.width * renderer.width
                const areaH = area.height * renderer.height

                if (x >= areaX && x <= areaX + areaW && y >= areaY && y <= areaY + areaH) {
                    if (area.name === 'bed') {
                        this.showEndDayModal()
                        return true
                    }
                }
            }
        }

        return false
    }

    handleTouchEnd(x, y) {
        if (this.sleepTransition && this.sleepTransition.isActive()) {
            return this.sleepTransition.handleTouchEnd(x, y)
        }
        return false
    }

    showEndDayModal() {
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '休息',
            content: '确定结束今天吗?\n将自动扣除日常消费',
            confirmText: '休息',
            cancelText: '再想想',
            onConfirm: () => {
                this.startSleepTransition()
            }
        })
    }

    startSleepTransition() {
        const bedPos = this.getBedScreenPos()
        this.sleepTransition = new SleepTransitionManager(
            this.game, bedPos, () => {
                this.sleepTransition = null
                this.endDay()
            }
        )
        this.sleepTransition.start()
    }

    getBedScreenPos() {
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        const area = this.areaManager.get('homeBed')
        if (area) {
            const hit = area.hitArea
            return {
                x: w * (hit.xPercent + hit.widthPercent / 2),
                y: h * (hit.yPercent + hit.heightPercent / 2)
            }
        }
        return { x: w * 0.75, y: h * 0.56 }
    }

    endDay() {
        this.randomEventManager.triggerRandomEvent(() => {
            this.game.gameState.nextDay()
            this.game.dailyCheck()
            this.stayInScene()
        })
    }
}
