import imageManager from '../utils/imageManager.js'
import animationManager from '../utils/animationManager.js'
import { GAME_CONFIG, getJobByLevel, getNextJob } from '../data/gameConfig.js'
import iconManager from '../components/IconManager.js'
import InteractiveAreaManager from '../components/InteractiveAreaManager.js'

export default class SceneWithBackground {
    constructor(game) {
        this.game = game
        this.bgImage = null
        this.imageLoaded = false
        this.useCloudImage = false
        this.currentScene = null
        this.dialogLines = []
        this.dialogIndex = 0
        this.isTyping = false
        this.typingTimer = null
        this.displayedText = ''
        this.nextSceneName = null
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
                labelBorderColor: 'rgba(0, 0, 0, 0.2)',
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
                labelBorderColor: 'rgba(0, 0, 0, 0.2)',
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
                labelBorderColor: 'rgba(0, 0, 0, 0.2)',
                textColor: '#000000',
                fontSize: 12
            }
        })
    }
    
    onComputerClick() {
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '电脑',
            content: '这是你的电脑，可以上网、工作或玩游戏',
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {}
        })
    }
    
    onSettingClick() {
        this.game.sceneManager.switchTo('settings')
    }
    
    async loadBackground(sceneName) {
        const sceneConfig = this.getSceneConfig(sceneName)
        if (!sceneConfig) {
            console.warn('未找到场景配置:', sceneName)
            return
        }
        
        this.nextSceneName = sceneName
        
        let newDialogLines = []
        let newSpeaker = ''
        let newDialogVisible = true
        if (sceneName === 'home') {
            newDialogVisible = false
        } else if (sceneConfig.dialogPools && sceneConfig.dialogPools.length > 0) {
            const pool = sceneConfig.dialogPools[Math.floor(Math.random() * sceneConfig.dialogPools.length)]
            newDialogLines = pool.lines || []
            newSpeaker = pool.speaker || ''
        }
        
        try {
            const cloudImage = await imageManager.loadImageFromCloud(sceneConfig.imageName)
            if (cloudImage && cloudImage.image && this.nextSceneName === sceneName) {
                this.bgImage = cloudImage.image
                this.imageLoaded = true
                this.useCloudImage = true
                this.currentScene = sceneName
                this.dialogLines = newDialogLines
                this.dialogIndex = 0
                this.currentSpeaker = newSpeaker
                this.dialogVisible = newDialogVisible
                this.displayedText = ''
                this.nextSceneName = null
                console.log('使用云存储背景图:', sceneConfig.imageName)
                return
            }
        } catch (e) {
            console.warn('从云端加载背景图失败，使用本地图片:', e)
        }
        
        if (this.nextSceneName !== sceneName) return
        
        const newBgImage = wx.createImage()
        newBgImage.onload = () => {
            if (this.nextSceneName === sceneName) {
                this.bgImage = newBgImage
                this.imageLoaded = true
                this.currentScene = sceneName
                this.dialogLines = newDialogLines
                this.dialogIndex = 0
                this.currentSpeaker = newSpeaker
                this.dialogVisible = newDialogVisible
                this.displayedText = ''
                this.nextSceneName = null
            }
        }
        newBgImage.src = sceneConfig.localPath
    }
    
    getSceneConfig(sceneName) {
        const configs = {
            home: {
                imageName: 'chuzuwu',
                localPath: 'tuer/chuzuwu.png',
                displayName: '出租屋',
                dialogPools: [
                    { speaker: '我', lines: ['终于回来了...虽然只是个出租屋，但好歹是个家。'] },
                    { speaker: '我', lines: ['今天又是辛苦的一天，回来歇歇吧。'] },
                    { speaker: '我', lines: ['这间小屋虽然简陋，但至少是我在这个城市的避风港。'] },
                    { speaker: '我', lines: ['躺在床上的感觉真好...要不要休息一下？'] },
                    { speaker: '我', lines: ['窗外车水马龙，我什么时候才能在这座城市真正立足呢？'] }
                ],
                actions: []
            },
            work: {
                imageName: 'yinhang',
                localPath: 'tuer/yinhang.png',
                displayName: '工作',
                dialogPools: [
                    { speaker: '主管', lines: ['嘿，又来上班了？今天好好干，工资少不了你的。'] },
                    { speaker: '主管', lines: ['你来得正好，今天活多，加班费翻倍！'] },
                    { speaker: '同事', lines: ['早啊！今天又是元气满满的一天呢...大概吧。'] },
                    { speaker: '我', lines: ['又是新的一天，为了梦想，加油！'] },
                    { speaker: '主管', lines: ['最近表现不错，继续保持，升职有望！'] },
                    { speaker: '我', lines: ['看着打卡机，心里默默叹了口气...但还是要微笑面对。'] }
                ],
                actions: [
                    { text: '开始工作', callback: 'startWork' }
                ]
            },
            bank: {
                imageName: 'yinhang',
                localPath: 'tuer/yinhang.png',
                displayName: '银行',
                dialogPools: [
                    { speaker: '银行柜员', lines: ['您好，欢迎光临！请问需要办理什么业务？'] },
                    { speaker: '银行柜员', lines: ['今天的存款利率很优惠哦，要考虑一下吗？'] },
                    { speaker: '我', lines: ['银行的冷气总是开得很足，让人清醒地面对自己的财务状况。'] },
                    { speaker: '银行柜员', lines: ['您的信用记录良好，可以享受更优惠的贷款利率。'] },
                    { speaker: '我', lines: ['看着存折上的数字，离买房又近了一步...吧？'] }
                ],
                actions: [
                    { text: '办理业务', callback: 'showBankModal' }
                ]
            },
            hospital: {
                imageName: 'yiyuan',
                localPath: 'tuer/yiyuan.png',
                displayName: '医院',
                dialogPools: [
                    { speaker: '医生', lines: ['来，让我看看你的情况。身体是革命的本钱，别太拼命了。'] },
                    { speaker: '护士', lines: ['又来了？年轻人要注意身体啊，别老熬夜。'] },
                    { speaker: '我', lines: ['医院的消毒水味让人不安...希望只是小毛病。'] },
                    { speaker: '医生', lines: ['你的健康指标不太理想，建议多休息，少加班。'] },
                    { speaker: '我', lines: ['看着挂号费，心疼钱包更心疼身体。'] }
                ],
                actions: [
                    { text: '接受治疗', callback: 'doHospital' }
                ]
            },
            gym: {
                imageName: 'jianshenfang',
                localPath: 'tuer/jianshenfang.png',
                displayName: '健身房',
                dialogPools: [
                    { speaker: '健身教练', lines: ['欢迎来健身！让我带你练起来！坚持锻炼，身体会越来越好的！'] },
                    { speaker: '健身教练', lines: ['连续来三天，我帮你提升精力上限！来吧，动起来！'] },
                    { speaker: '我', lines: ['看着镜子里日渐壮实的自己，感觉还不错！'] },
                    { speaker: '我', lines: ['虽然每次练完都累得要死，但出汗的感觉真爽。'] },
                    { speaker: '健身教练', lines: ['今天状态不错！再加把劲，突破极限！'] }
                ],
                actions: [
                    { text: '开始锻炼', callback: 'doGym' }
                ]
            },
            house: {
                imageName: 'shouloubu',
                localPath: 'tuer/shouloubu.png',
                displayName: '售楼部',
                dialogPools: [
                    { speaker: '售楼小姐', lines: ['您好呀！欢迎来看房~我们这里有各种户型，总有一款适合您！'] },
                    { speaker: '售楼小姐', lines: ['最近新开了一个楼盘，位置绝佳，先到先得哦~'] },
                    { speaker: '我', lines: ['看着沙盘上精致的模型，心里满是向往...'] },
                    { speaker: '售楼小姐', lines: ['这套房性价比超高，错过了就没有了！'] },
                    { speaker: '我', lines: ['房价好贵...但为了未来的家，值得拼一把！'] }
                ],
                actions: [
                    { text: '查看房源', callback: 'goToHouseScene' }
                ]
            },
            privateLoan: {
                imageName: 'gerenjiedai',
                localPath: 'tuer/gerenjiedai.png',
                displayName: '个人借贷',
                dialogPools: [
                    { speaker: '借贷人', lines: ['兄弟，手头紧了吧？我这里放款快，不过利息嘛...你懂的。'] },
                    { speaker: '借贷人', lines: ['老规矩，日利率2.5%，逾期后果很严重哦。想好了再借。'] },
                    { speaker: '我', lines: ['这个地方让人不安...但有时候真的别无选择。'] },
                    { speaker: '借贷人', lines: ['放心，我们很讲信用的。按时还款，大家都是朋友。'] },
                    { speaker: '我', lines: ['高利贷就像深渊，一旦踏入就很难回头...'] }
                ],
                actions: [
                    { text: '借贷', callback: 'showLoanModal' }
                ]
            }
        }
        
        return configs[sceneName]
    }
    
    onEnter(params) {
        this.dialogIndex = 0
        this.displayedText = ''
        this.isTyping = false
        
        if (this.typingTimer) {
            clearTimeout(this.typingTimer)
            this.typingTimer = null
        }
        
        if (params && params.sceneName) {
            this.loadBackground(params.sceneName)
        } else {
            this.dialogVisible = false
        }
        
        this.playDelayedAnimations()
    }
    
    update(deltaTime) {
        
    }
    
    render(renderer) {
        const w = renderer.width
        const h = renderer.height
        
        this.game.uiManager.clear()
        
        const isLoading = this.nextSceneName !== null && this.nextSceneName !== this.currentScene
        
        if (!isLoading && this.imageLoaded && this.bgImage && this.bgImage.width > 0) {
            try {
                const ctx = renderer.ctx
                ctx.drawImage(this.bgImage, 0, 0, w, h)
            } catch (e) {
                console.warn('绘制背景图失败:', e)
                renderer.clear('#16213e')
            }
        } else {
            renderer.clear('#16213e')
        }
        
        if (!isLoading) {
            if (this.currentScene === 'home' && !this.dialogVisible) {
                this.areaManager.render(renderer)
            } else {
                this.renderClickableAreas(renderer)
            }
            this.renderDialog(renderer)
            this.renderActions(renderer)
        }
        
        this.renderTopBar(renderer)
        this.renderStats(renderer)
        animationManager.updateAndRender(renderer)
    }
    
    renderTopBar(renderer) {
        const state = this.game.gameState.data
        const w = renderer.width
        const ctx = renderer.ctx
        const padding = 12
        const barH = 48

        renderer.drawRect(padding, 8, w - padding * 2, barH, '#FFF5E6', 12)

        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        this.roundRectPath(ctx, padding, 8, w - padding * 2, barH, 12)
        ctx.stroke()

        iconManager.draw(ctx, 'calendar', padding + 22, 24, { size: 20 })
        renderer.drawText(`第${state.day}天 / ${state.totalDays}天`, padding + 42, 28, '#5D4037', 13, 'left')

        const rightX = w - padding - 15
        const moneyText = state.money.toLocaleString()
        iconManager.draw(ctx, 'coin', rightX - 85, 24, { size: 18 })
        renderer.drawText(moneyText, rightX, 28, '#D4A574', 15, 'right')
    }
    
    renderStats(renderer) {
        const state = this.game.gameState.data
        const w = renderer.width
        const h = renderer.height
        const padding = 12
        const panelH = 100
        const panelY = h - panelH - padding
        const centerBtnSize = 56
        const ctx = renderer.ctx

        renderer.drawRect(padding, panelY, w - padding * 2, panelH, '#E0F0FF', 16)

        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        this.roundRectPath(ctx, padding, panelY, w - padding * 2, panelH, 16)
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(padding + 25, panelY + 3)
        ctx.lineTo(w - padding - 25, panelY + 3)
        ctx.strokeStyle = 'rgba(135, 160, 180, 0.3)'
        ctx.lineWidth = 2
        ctx.stroke()

        const centerX = w / 2
        const leftSectionX = padding + 35
        const rightSectionX = w - padding - 35
        const topRowY = panelY + 30
        const bottomRowY = panelY + panelH - 30

        this.renderStatItem(renderer, leftSectionX, topRowY, 'health', state.health, 100, '#7CB87C')
        this.renderStatItem(renderer, rightSectionX, topRowY, 'energy', state.energy, state.maxEnergy, '#7BA3C9', true)
        this.renderStatItem(renderer, leftSectionX, bottomRowY, 'mood', state.mood, 100, '#D49BA3')
        this.renderStatItem(renderer, rightSectionX, bottomRowY, 'reputation', state.reputation, 100, '#B8A3C9', true)

        this.renderCenterButton(renderer, centerX, panelY + panelH / 2, centerBtnSize)
    }

    renderStatItem(renderer, x, y, statType, value, max, color, isRight = false) {
        const progress = value / max
        let valueColor = color
        if (progress < 0.3) valueColor = '#C17B6B'
        else if (progress < 0.5) valueColor = '#D4A574'

        const ctx = renderer.ctx
        const labelColor = '#5A6B7A'

        const labelMap = {
            health: '健康',
            energy: '精力',
            mood: '心情',
            reputation: '名誉'
        }
        const label = labelMap[statType] || statType

        if (isRight) {
            iconManager.draw(ctx, statType, x - 75, y, { size: 22 })
            renderer.drawText(label, x - 45, y - 6, labelColor, 12, 'left')
            renderer.drawText(`${value}/${max}`, x - 45, y + 10, valueColor, 13, 'left')
        } else {
            iconManager.draw(ctx, statType, x + 12, y, { size: 22 })
            renderer.drawText(label, x + 38, y - 1, labelColor, 12, 'left')
            renderer.drawText(`${value}/${max}`, x + 38, y + 14, valueColor, 13, 'left')
        }
    }

    renderCenterButton(renderer, x, y, size) {
        const ctx = renderer.ctx
        const radius = size / 2

        ctx.beginPath()
        ctx.arc(x, y + 3, radius, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(139, 115, 85, 0.15)'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = '#FFE080'
        ctx.fill()

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(x, y, radius - 5, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(212, 165, 116, 0.4)'
        ctx.lineWidth = 1
        ctx.stroke()

        iconManager.draw(ctx, 'map', x, y, { size: 32 })

        const ui = this.game.uiManager
        ui.addButton(x - radius, y - radius, size, size, '', () => {
            this.game.sceneManager.switchTo('map')
        }, { bgColor: 'transparent' })
    }

    roundRectPath(ctx, x, y, w, h, r) {
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.arcTo(x + w, y, x + w, y + r, r)
        ctx.lineTo(x + w, y + h - r)
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
        ctx.lineTo(x + r, y + h)
        ctx.arcTo(x, y + h, x, y + h - r, r)
        ctx.lineTo(x, y + r)
        ctx.arcTo(x, y, x + r, y, r)
        ctx.closePath()
    }
    
    renderClickableAreas(renderer) {
        const config = this.getSceneConfig(this.currentScene)
        if (!config || !config.clickableAreas) return
        
        const w = renderer.width
        const h = renderer.height
        
        for (const area of config.clickableAreas) {
            const areaX = area.x * w
            const areaY = area.y * h
            const areaW = area.width * w
            const areaH = area.height * h
            
            renderer.drawRect(areaX, areaY, areaW, areaH, 'rgba(255, 255, 255, 0.1)')
            renderer.drawRect(areaX, areaY, areaW, 2, 'rgba(255, 255, 255, 0.3)')
            
            if (area.hint) {
                renderer.drawText(area.hint, areaX + areaW / 2, areaY + areaH / 2, 'rgba(255, 255, 255, 0.6)', 12, 'center')
            }
        }
    }
    
    renderDialog(renderer) {
        if (this.dialogLines.length === 0 || !this.dialogVisible) return
        
        const w = renderer.width
        const h = renderer.height
        const statsBarH = 124
        const dialogH = 150
        const dialogY = h - dialogH - statsBarH
        
        renderer.drawRect(0, dialogY, w, dialogH, 'rgba(0, 0, 0, 0.8)')
        renderer.drawRect(0, dialogY, w, 2, '#f39c12')
        
        if (this.currentSpeaker) {
            renderer.drawText(this.currentSpeaker, 20, dialogY + 25, '#f39c12', 14, 'left')
        }
        
        if (this.dialogIndex < this.dialogLines.length) {
            const text = this.dialogLines[this.dialogIndex]
            renderer.drawText(text, 20, dialogY + 60, '#ffffff', 13, 'left')
            
            if (this.dialogIndex < this.dialogLines.length - 1) {
                renderer.drawText('点击继续...', w - 20, dialogY + dialogH - 20, '#7f8c8d', 11, 'right')
            } else {
                renderer.drawText('点击关闭', w - 20, dialogY + dialogH - 20, '#7f8c8d', 11, 'right')
            }
        }
    }
    
    renderActions(renderer) {
        const config = this.getSceneConfig(this.currentScene)
        if (!config || !config.actions || this.dialogVisible) return
        
        const w = renderer.width
        const h = renderer.height
        const statsBarH = 124
        const actionY = h - 70 - statsBarH
        const actionW = (w - 40) / config.actions.length
        const gap = 10
        
        config.actions.forEach((action, index) => {
            const x = 20 + index * (actionW + gap)
            const ui = this.game.uiManager
            
            ui.addButton(x, actionY, actionW, 50, action.text, () => {
                this.handleAction(action.callback)
            }, { bgColor: '#3498db', fontSize: 13 })
        })
    }
    
    handleAction(callback) {
        switch (callback) {
            case 'startWork':
                this.showWorkModal()
                break
            case 'showBankModal':
                this.showBankModal()
                break
            case 'doHospital':
                this.doHospital()
                break
            case 'doGym':
                this.doGym()
                break
            case 'goToHouseScene':
                this.game.sceneManager.switchTo('house')
                break
            case 'showLoanModal':
                this.showLoanModal()
                break
        }
    }
    
    stayInScene() {
        this.dialogIndex = 0
        this.displayedText = ''
        const config = this.getSceneConfig(this.currentScene)
        if (this.currentScene === 'home') {
            this.dialogVisible = false
            this.dialogLines = []
            this.currentSpeaker = ''
        } else if (config && config.dialogPools && config.dialogPools.length > 0) {
            this.dialogVisible = true
            const pool = config.dialogPools[Math.floor(Math.random() * config.dialogPools.length)]
            this.dialogLines = pool.lines || []
            this.currentSpeaker = pool.speaker || ''
        }
        this.playDelayedAnimations()
    }
    
    getStatPositions() {
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        const padding = 12
        const panelH = 100
        const panelY = h - panelH - padding
        const leftSectionX = padding + 35
        const rightSectionX = w - padding - 35
        const topRowY = panelY + 30
        const bottomRowY = panelY + panelH - 30

        return {
            health: { x: leftSectionX + 38, y: topRowY },
            energy: { x: rightSectionX - 45, y: topRowY },
            mood: { x: leftSectionX + 38, y: bottomRowY },
            reputation: { x: rightSectionX - 45, y: bottomRowY },
            money: { x: w - 80, y: 20 },
            privateLoan: { x: w - 80, y: 50 },
            bankLoan: { x: w - 80, y: 35 },
            bankDeposit: { x: w - 80, y: 35 }
        }
    }
    
    playDelayedAnimations() {
        const anims = this.game.gameState.getAndClearDelayedAnimations()
        if (anims.length === 0) return

        const positions = this.getStatPositions()

        anims.forEach((anim, index) => {
            setTimeout(() => {
                const pos = positions[anim.statType]
                if (pos) {
                    const color = anim.color || this.getDefaultColor(anim.statType)
                    if (anim.type === 'increase') {
                        animationManager.addIncreaseAnimation(pos.x, pos.y, anim.value, anim.label, color)
                    } else if (anim.type === 'decrease') {
                        animationManager.addDecreaseAnimation(pos.x, pos.y, anim.value, anim.label, color)
                    } else if (anim.type === 'loan') {
                        animationManager.addLoanAnimation(pos.x, pos.y, anim.value, anim.label, color)
                    }
                }
            }, index * 200)
        })
    }
    
    getDefaultColor(statType) {
        const colorMap = {
            money: '#D4A574',
            health: '#7CB87C',
            energy: '#7BA3C9',
            mood: '#D49BA3',
            reputation: '#B8A3C9',
            privateLoan: '#C17B6B',
            bankLoan: '#7BA3C9',
            bankDeposit: '#7CB87C'
        }
        return colorMap[statType] || '#5D4037'
    }
    
    goBackToThis() {
        this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: this.currentScene })
    }
    
    showWorkModal() {
        const state = this.game.gameState.data
        
        if (state.unemployed) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '失业中',
                content: `剩余${state.unemployedDays}天无法工作`,
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法工作',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        const jobs = GAME_CONFIG.jobs
        const job = jobs[state.jobLevel - 1]
        let baseSalary = job.baseSalary
        let overtimeSalary = job.overtimeSalary
        
        if (state.salaryDeduction) {
            baseSalary = Math.floor(baseSalary * 0.8)
            overtimeSalary = Math.floor(overtimeSalary * 0.8)
        }
        
        const nextJob = jobs[state.jobLevel]
        let nextLevelInfo = ''
        if (nextJob) {
            nextLevelInfo = `\n\n【下一级】\nLv.${nextJob.level} ${nextJob.title}\n日薪: ${nextJob.baseSalary}金币`
        }
        
        const lineCount = 6 + (nextJob ? 3 : 0)
        const contentHeight = 55 + lineCount * 22 + 80
        
        this.game.uiManager.addModal({
            type: 'action',
            title: `工作 - ${state.jobTitle}`,
            content: `【当前岗位】\nLv.${job.level} ${job.title}\n\n上班: ${baseSalary}金币 (消耗1精力)\n加班: ${overtimeSalary}金币 (消耗1精力,健康-5)${nextLevelInfo}`,
            actions: [
                { text: '上班', callback: () => this.doWork(false, baseSalary) },
                { text: '加班', callback: () => this.doWork(true, overtimeSalary) }
            ],
            height: Math.max(350, contentHeight)
        })
    }
    
    doWork(isOvertime, salary) {
        const state = this.game.gameState.data
        
        if (isOvertime && state.health < 30) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '健康不足',
                content: '无法加班',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        state.energy = Math.max(0, state.energy - 1)
        state.money += salary
        
        if (isOvertime) {
            state.health = Math.max(0, state.health - 5)
        }
        
        let reputationChange = 0
        let reputationReason = ''
        
        if (state.health >= 80 && state.mood >= 60) {
            reputationChange = 2
            reputationReason = '工作表现出色'
        } else if (state.health < 40 || state.mood < 30) {
            reputationChange = -2
            reputationReason = '工作状态不佳'
        }
        
        if (reputationChange !== 0) {
            state.reputation = Math.min(100, Math.max(-100, state.reputation + reputationChange))
            this.game.gameState.addEvent(`${reputationReason}，名誉${reputationChange > 0 ? '+' : ''}${reputationChange}`)
            if (reputationChange > 0) {
                this.game.gameState.addDelayedAnimation('increase', reputationChange, 'reputation', '名誉', '#9b59b6')
            } else {
                this.game.gameState.addDelayedAnimation('decrease', Math.abs(reputationChange), 'reputation', '名誉', '#9b59b6')
            }
        }
        
        this.game.gameState.save()
        
        state.daysWorked++
        
        this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
        this.game.gameState.addDelayedAnimation('increase', salary, 'money', '金币', '#f39c12')
        
        if (isOvertime) {
            this.game.gameState.addDelayedAnimation('decrease', 5, 'health', '健康', '#27ae60')
        }
        
        let workResultContent = `获得 ${salary} 金币！`
        if (reputationChange !== 0) {
            workResultContent += `\n${reputationReason}，名誉${reputationChange > 0 ? '+' : ''}${reputationChange}`
        }
        
        const promotionConfig = GAME_CONFIG.promotion
        const nextJob = GAME_CONFIG.jobs[state.jobLevel]
        const canPromote = nextJob && 
            state.reputation >= promotionConfig.reputationRequired &&
            state.daysWorked >= promotionConfig.daysWorkedRequired &&
            state.health >= promotionConfig.healthRequired
        
        if (canPromote) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '工作完成',
                content: workResultContent + `\n\n恭喜！您符合升职条件！\n可以升职为 ${nextJob.title}`,
                confirmText: '升职',
                cancelText: '暂不',
                onConfirm: () => {
                    this.promote()
                },
                onCancel: () => {
                    this.stayInScene()
                }
            })
        } else {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '工作完成',
                content: workResultContent,
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {
                    this.stayInScene()
                }
            })
        }
    }
    
    promote() {
        const state = this.game.gameState.data
        const nextJob = GAME_CONFIG.jobs[state.jobLevel]
        
        if (!nextJob) return
        
        state.jobLevel = nextJob.level
        state.jobTitle = nextJob.title
        this.game.gameState.save()
        
        this.game.gameState.addEvent(`恭喜升职为${nextJob.title}！`)
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '升职成功！',
            content: `您已升职为 ${nextJob.title}！\n日薪: ${nextJob.baseSalary}金币\n加班费: ${nextJob.overtimeSalary}金币`,
            confirmText: '太好了',
            singleButton: true,
            onConfirm: () => {
                this.stayInScene()
            }
        })
    }
    
    showBankModal() {
        const state = this.game.gameState.data
        
        const jobLoanInfo = GAME_CONFIG.jobs.map(job => ({
            level: job.level,
            title: job.title,
            loanLimit: job.level >= 3 ? GAME_CONFIG.bank.loanLimitLevel3 : GAME_CONFIG.bank.loanLimitLevel1
        }))
        
        let jobContent = '【岗位借款额度】\n'
        jobLoanInfo.forEach(job => {
            const isCurrent = state.jobLevel === job.level
            const marker = isCurrent ? '★' : '  '
            jobContent += `${marker}Lv.${job.level} ${job.title}: ${job.loanLimit.toLocaleString()}金币\n`
        })
        
        const actions = [
            { text: '存款', callback: () => this.doDeposit() },
            { text: '贷款', callback: () => this.doLoan() }
        ]
        
        if (state.bankLoan > 0) {
            actions.push({ text: '还款', callback: () => this.doRepay() })
        }
        
        this.game.uiManager.addModal({
            type: 'action',
            title: '银行',
            content: `存款利率: 每${GAME_CONFIG.bank.depositInterestDays}天${GAME_CONFIG.bank.depositInterestRate * 100}%  |  贷款利率: 每${GAME_CONFIG.bank.loanInterestDays}天${GAME_CONFIG.bank.loanInterestRate * 100}%\n当前欠款: ${state.bankLoan.toLocaleString()} 金币\n\n${jobContent}`,
            actions: actions,
            height: 320
        })
    }
    
    doDeposit() {
        const state = this.game.gameState.data
        this.game.uiManager.addModal({
            type: 'trade',
            title: '存款',
            content: '',
            itemName: '存款金额',
            price: 1,
            quantity: 100,
            maxQuantity: state.money,
            total: 100,
            tradeType: 'deposit',
            height: 220,
            onConfirm: (qty) => {
                if (state.money >= qty) {
                    state.money -= qty
                    state.bankDeposit += qty
                    this.game.gameState.save()
                    
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('increase', qty, 'bankDeposit', '银行存款', '#27ae60')
                    
                    this.stayInScene()
                }
            }
        })
    }
    
    doLoan() {
        const state = this.game.gameState.data
        const maxLoan = state.jobLevel >= 3 ? GAME_CONFIG.bank.loanLimitLevel3 : GAME_CONFIG.bank.loanLimitLevel1
        this.game.uiManager.addModal({
            type: 'trade',
            title: '银行贷款',
            content: '',
            itemName: '贷款金额',
            price: 1,
            quantity: 1000,
            maxQuantity: maxLoan - state.bankLoan,
            total: 1000,
            tradeType: 'loan',
            height: 220,
            onConfirm: (qty) => {
                state.bankLoan += qty
                state.money += qty
                this.game.gameState.save()
                
                this.game.gameState.addDelayedAnimation('loan', qty, 'bankLoan', '银行贷款', '#e74c3c')
                this.game.gameState.addDelayedAnimation('increase', qty, 'money', '金币', '#f39c12')
                
                this.stayInScene()
            }
        })
    }
    
    doRepay() {
        const state = this.game.gameState.data
        if (state.bankLoan <= 0) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '无需还款',
                content: '您当前没有银行贷款',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }
        
        const maxRepay = Math.min(state.bankLoan, state.money)
        this.game.uiManager.addModal({
            type: 'trade',
            title: '银行还款',
            content: `当前欠款: ${state.bankLoan.toLocaleString()}金币`,
            itemName: '还款金额',
            price: 1,
            quantity: maxRepay,
            maxQuantity: maxRepay,
            total: maxRepay,
            tradeType: 'repay',
            height: 220,
            onConfirm: (qty) => {
                if (state.money >= qty && state.bankLoan >= qty) {
                    state.money -= qty
                    state.bankLoan -= qty
                    this.game.gameState.save()
                    
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'bankLoan', '银行贷款', '#27ae60')
                    
                    this.stayInScene()
                }
            }
        })
    }
    
    doHospital() {
        const state = this.game.gameState.data
        const config = GAME_CONFIG.hospital
        
        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法去医院',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        const maxHeal = Math.min(config.maxHeal, 100 - state.health)
        const cost = maxHeal * config.costPerHealth
        
        if (maxHeal <= 0) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '健康已满',
                content: '无需治疗',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '医院',
            content: `消耗1精力\n花费${cost}金币\n恢复健康+${maxHeal}`,
            confirmText: '治疗',
            onConfirm: () => {
                if (state.money >= cost) {
                    state.energy -= 1
                    state.money -= cost
                    state.health = Math.min(100, state.health + maxHeal)
                    this.game.gameState.save()
                    
                    this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')
                    this.game.gameState.addDelayedAnimation('decrease', cost, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('increase', maxHeal, 'health', '健康', '#27ae60')
                    
                    this.stayInScene()
                }
            }
        })
    }
    
    doGym() {
        const state = this.game.gameState.data
        const config = GAME_CONFIG.gym
        
        if (state.energy < config.energyCost) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法健身',
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        if (state.money < config.cost) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '金币不足',
                content: `需要${config.cost}金币`,
                confirmText: '知道了',
                onConfirm: () => {}
            })
            return
        }
        
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '健身房',
            content: `消耗${config.energyCost}精力，花费${config.cost}金币\n健康+${config.healthRecovery}，心情+${config.moodBonus || 0}\n连续健身可提升精力上限`,
            confirmText: '健身',
            onConfirm: () => {
                state.energy -= config.energyCost
                state.money -= config.cost
                state.health = Math.min(100, state.health + config.healthRecovery)
                if (config.moodBonus) {
                    state.mood = Math.min(100, state.mood + config.moodBonus)
                }
                state.consecutiveGymDays++
                
                if (state.consecutiveGymDays >= 3) {
                    state.maxEnergy = Math.min(15, state.maxEnergy + 1)
                }
                
                this.game.gameState.save()
                
                this.game.gameState.addDelayedAnimation('decrease', config.energyCost, 'energy', '精力', '#3498db')
                this.game.gameState.addDelayedAnimation('decrease', config.cost, 'money', '金币', '#f39c12')
                this.game.gameState.addDelayedAnimation('increase', config.healthRecovery, 'health', '健康', '#27ae60')
                if (config.moodBonus) {
                    this.game.gameState.addDelayedAnimation('increase', config.moodBonus, 'mood', '心情', '#e91e63')
                }
                
                this.stayInScene()
            }
        })
    }
    
    showLoanModal() {
        const state = this.game.gameState.data
        
        const actions = []
        
        actions.push({
            text: '借贷',
            callback: () => this.doPrivateLoan(),
            color: '#e74c3c'
        })
        
        if (state.privateLoan > 0) {
            actions.push({
                text: '还款',
                callback: () => this.doPrivateRepay(),
                color: '#27ae60'
            })
        }
        
        this.game.uiManager.addModal({
            type: 'action',
            title: '个人借贷',
            content: `日利率: 2.5%\n逾期惩罚严厉\n\n当前欠款: ${state.privateLoan} 金币`,
            actions: actions,
            height: 180
        })
    }
    
    doPrivateLoan() {
        const state = this.game.gameState.data
        this.game.uiManager.addModal({
            type: 'trade',
            title: '个人借贷',
            content: '日利率: 2.5%\n逾期惩罚严厉',
            itemName: '借贷金额',
            price: 1,
            quantity: 1000,
            maxQuantity: 120000,
            total: 1000,
            tradeType: 'loan',
            height: 240,
            onConfirm: (qty) => {
                state.privateLoan += qty
                state.money += qty
                this.game.gameState.save()
                
                this.game.gameState.addDelayedAnimation('loan', qty, 'privateLoan', '私人贷款', '#e74c3c')
                this.game.gameState.addDelayedAnimation('increase', qty, 'money', '金币', '#f39c12')
                
                this.stayInScene()
            }
        })
    }
    
    doPrivateRepay() {
        const state = this.game.gameState.data
        if (state.privateLoan <= 0) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '无需还款',
                content: '您当前没有私人贷款',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }
        
        const maxRepay = Math.min(state.privateLoan, state.money)
        this.game.uiManager.addModal({
            type: 'trade',
            title: '私人还款',
            content: `当前欠款: ${state.privateLoan}金币`,
            itemName: '还款金额',
            price: 1,
            quantity: maxRepay,
            maxQuantity: maxRepay,
            total: maxRepay,
            tradeType: 'repay',
            height: 240,
            onConfirm: (qty) => {
                if (state.money >= qty && state.privateLoan >= qty) {
                    state.money -= qty
                    state.privateLoan -= qty
                    this.game.gameState.save()
                    
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'money', '金币', '#f39c12')
                    this.game.gameState.addDelayedAnimation('decrease', qty, 'privateLoan', '私人贷款', '#27ae60')
                    
                    this.stayInScene()
                }
            }
        })
    }
    
    handleTouchStart(x, y) {
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
        
        const config = this.getSceneConfig(this.currentScene)
        
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
    
    showEndDayModal() {
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '休息',
            content: '确定结束今天吗?\n将自动扣除日常消费',
            confirmText: '休息',
            cancelText: '再想想',
            onConfirm: () => {
                this.endDay()
            }
        })
    }
    
    endDay() {
        this.triggerRandomEvents()
        
        this.game.gameState.nextDay()
        
        this.game.dailyCheck()
        
        this.stayInScene()
    }
    
    triggerRandomEvents() {
        const state = this.game.gameState.data
        const eventChance = Math.random()
        const config = GAME_CONFIG.randomEvent
        
        if (eventChance < config.probability) {
            const goodEvents = [
                { 
                    text: '路边捡到钱包，获得80金币', 
                    effect: () => { state.money += 80 },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 80, 'money', '金币', '#f39c12')
                },
                { 
                    text: '遇到好心人，心情+15', 
                    effect: () => { state.mood = Math.min(100, state.mood + 15) },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 15, 'mood', '心情', '#e91e63')
                },
                { 
                    text: '收到红包，获得150金币', 
                    effect: () => { state.money += 150 },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 150, 'money', '金币', '#f39c12')
                },
                { 
                    text: '帮助老人，名誉+8', 
                    effect: () => { state.reputation = Math.min(100, state.reputation + 8) },
                    anim: () => this.game.gameState.addDelayedAnimation('increase', 8, 'reputation', '名誉', '#9b59b6')
                },
                { 
                    text: '睡了个好觉，心情+10，健康+5', 
                    effect: () => { 
                        state.mood = Math.min(100, state.mood + 10)
                        state.health = Math.min(100, state.health + 5)
                    },
                    anim: () => {
                        this.game.gameState.addDelayedAnimation('increase', 10, 'mood', '心情', '#e91e63')
                        this.game.gameState.addDelayedAnimation('increase', 5, 'health', '健康', '#27ae60')
                    }
                }
            ]
            
            const badEvents = [
                { 
                    text: '不小心丢了钱包，损失40金币', 
                    effect: () => { state.money = Math.max(0, state.money - 40) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 40, 'money', '金币', '#f39c12')
                },
                { 
                    text: '被小偷偷了，损失30金币', 
                    effect: () => { state.money = Math.max(0, state.money - 30) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 30, 'money', '金币', '#f39c12')
                },
                { 
                    text: '身体不适，健康-8', 
                    effect: () => { state.health = Math.max(0, state.health - 8) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 8, 'health', '健康', '#27ae60')
                },
                { 
                    text: '被误解，名誉-8', 
                    effect: () => { state.reputation = Math.max(-100, state.reputation - 8) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 8, 'reputation', '名誉', '#9b59b6')
                },
                { 
                    text: '做噩梦了，心情-10', 
                    effect: () => { state.mood = Math.max(0, state.mood - 10) },
                    anim: () => this.game.gameState.addDelayedAnimation('decrease', 10, 'mood', '心情', '#e91e63')
                }
            ]
            
            const isGoodEvent = Math.random() < config.goodEventRatio
            const events = isGoodEvent ? goodEvents : badEvents
            const event = events[Math.floor(Math.random() * events.length)]
            
            event.effect()
            event.anim()
            
            setTimeout(() => {
                this.game.uiManager.addModal({
                    type: 'confirm',
                    title: isGoodEvent ? '好事发生' : '倒霉事',
                    content: event.text,
                    confirmText: '知道了',
                    singleButton: true,
                    onConfirm: () => {}
                })
            }, 500)
        }
    }
}
