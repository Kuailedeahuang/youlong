import iconManager from '../components/IconManager.js'
import animationManager from '../utils/animationManager.js'
import ItemData from '../data/items.js'
import { GAME_CONFIG } from '../data/gameConfig.js'
import LoanSystem from '../systems/LoanSystem.js'
import BankSystem from '../systems/BankSystem.js'

export default class ComputerScene {
    constructor(game) {
        this.game = game
        this.name = 'computer'
        this.clickableAreas = []
        this.loanSystem = new LoanSystem(game)
        this.bankSystem = new BankSystem(game)
    }

    onEnter() {
        this.game.uiManager.clearAll()
    }

    update(deltaTime) {
        animationManager.updateAndRender(this.game.renderer)
    }

    render(renderer) {
        const w = renderer.width
        const h = renderer.height
        const ctx = renderer.ctx

        this.game.uiManager.clear()
        this.clickableAreas = []

        this.renderHomeBackground(renderer)

        this.renderComputerWindow(renderer)

        animationManager.updateAndRender(renderer)
    }

    renderHomeBackground(renderer) {
        if (this.game.sceneManager.scenes.home) {
            const homeScene = this.game.sceneManager.scenes.home
            if (homeScene.imageLoaded && homeScene.bgImage && homeScene.bgImage.width > 0) {
                try {
                    const ctx = renderer.ctx
                    ctx.drawImage(homeScene.bgImage, 0, 0, renderer.width, renderer.height)
                    return
                } catch (e) {
                    console.warn('绘制背景图失败:', e)
                }
            }
        }

        renderer.clear('#1a1a2e')
    }

    renderComputerWindow(renderer) {
        const w = renderer.width
        const h = renderer.height
        const ctx = renderer.ctx

        const windowW = Math.min(360, w * 0.9)
        const windowH = 340
        const windowX = (w - windowW) / 2
        const windowY = (h - windowH) / 2 - 20

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(0, 0, w, h)

        this.renderWindowContent(renderer, windowX, windowY, windowW, windowH)
    }

    renderWindowContent(renderer, x, y, w, h) {
        const ctx = renderer.ctx

        const titleBarH = 40
        const padding = 12
        const iconSize = 60
        const iconBgH = iconSize + 12
        const labelBgH = 20
        const iconAreaY = y + titleBarH + 35

        ctx.fillStyle = '#FFF5E6'
        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 2
        this.roundRectPath(ctx, x, y, w, h, 16)
        ctx.fill()
        ctx.stroke()

        ctx.fillStyle = '#5D4037'
        ctx.fillRect(x, y, w, titleBarH)

        ctx.font = 'bold 14px sans-serif'
        ctx.fillStyle = '#FFE080'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('电脑', x + w / 2, y + titleBarH / 2)

        const closeBtnX = x + w - 35
        const closeBtnY = y + 8
        const closeBtnW = 24
        const closeBtnH = 24

        ctx.fillStyle = '#C17B6B'
        this.roundRectPath(ctx, closeBtnX, closeBtnY, closeBtnW, closeBtnH, 6)
        ctx.fill()
        ctx.strokeStyle = '#5D4037'
        ctx.lineWidth = 1
        ctx.stroke()

        ctx.font = 'bold 14px sans-serif'
        ctx.fillStyle = '#FFFFFF'
        ctx.textAlign = 'center'
        ctx.fillText('×', closeBtnX + closeBtnW / 2, closeBtnY + closeBtnH / 2)

        this.game.uiManager.addButton(closeBtnX, closeBtnY, closeBtnW, closeBtnH, '', () => {
            this.goBack()
        }, { bgColor: 'transparent' })
        this.clickableAreas.push({ x: closeBtnX, y: closeBtnY, w: closeBtnW, h: closeBtnH, action: () => this.goBack() })

        const state = this.game.gameState.data
        const moneyText = state.money.toLocaleString()
        iconManager.draw(ctx, 'coin', x + padding + 12, y + titleBarH + 12, { size: 14 })
        ctx.font = 'bold 12px sans-serif'
        ctx.fillStyle = '#D4A574'
        ctx.textAlign = 'left'
        ctx.fillText(moneyText, x + padding + 28, y + titleBarH + 16)

        const icons = [
            { id: 'news', label: '每日新闻', icon: 'stats', color: '#D4A574' },
            { id: 'loan', label: '个人借贷', icon: 'loanWarning', color: '#C17B6B' },
            { id: 'bank', label: '网上银行', icon: 'bank', color: '#7BA3C9' },
            { id: 'entertainment', label: '娱乐中心', icon: 'mood', color: '#D49BA3' }
        ]

        const iconCount = icons.length
        const iconSpacing = (w - padding * 2) / iconCount
        const iconStartX = x + padding

        icons.forEach((iconData, index) => {
            const iconX = iconStartX + index * iconSpacing + iconSpacing / 2
            const iconY = iconAreaY

            this.renderIcon(ctx, renderer, iconX - iconSize / 2, iconY, iconSize, iconData)
        })
    }

    renderIcon(ctx, renderer, x, y, size, iconData) {
        const iconBgW = size + 12
        const iconBgH = size + 12
        const labelBgH = 20
        const totalBgW = iconBgW
        const totalBgH = iconBgH + labelBgH
        const bgX = x - 6
        const bgY = y - 6

        ctx.fillStyle = 'rgba(224, 240, 255, 0.9)'
        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        this.roundRectPath(ctx, bgX, bgY, totalBgW, totalBgH, 10)
        ctx.fill()
        ctx.stroke()

        const iconX = x + size / 2
        const iconY = y + size / 2 - 2
        iconManager.draw(ctx, iconData.icon, iconX, iconY, { size: 28, color: iconData.color })

        const labelY = bgY + iconBgH + labelBgH / 2
        ctx.font = '10px sans-serif'
        ctx.fillStyle = '#5D4037'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(iconData.label, x + size / 2, labelY, size)

        const hitArea = {
            x: bgX,
            y: bgY,
            w: totalBgW,
            h: totalBgH
        }

        this.game.uiManager.addButton(hitArea.x, hitArea.y, hitArea.w, hitArea.h, '', () => {
            this.onIconClick(iconData.id)
        }, { bgColor: 'transparent' })
        this.clickableAreas.push({ x: hitArea.x, y: hitArea.y, w: hitArea.w, h: hitArea.h, action: () => this.onIconClick(iconData.id) })
    }

    onIconClick(iconId) {
        switch (iconId) {
            case 'news':
                this.showNewsModal()
                break
            case 'loan':
                this.loanSystem.showLoanModal(() => {})
                break
            case 'bank':
                this.bankSystem.showBankModal(() => {})
                break
            case 'entertainment':
                this.showEntertainmentModal()
                break
        }
    }

    showNewsModal() {
        const state = this.game.gameState.data
        const newspaperData = state.todayNewspaper || []

        let content = ''
        if (newspaperData.length > 0) {
            content = newspaperData.map(news => `【${news.title}】\n${news.content}`).join('\n\n')
        }

        const topItems = this.getTopChangeItems()
        if (topItems.length > 0) {
            if (content) content += '\n\n'
            content += `【今日热点】\n`
            topItems.forEach(item => {
                const changeSign = item.change >= 0 ? '+' : ''
                content += `${item.name}: ${changeSign}${item.change}%\n`
            })
        }

        const rawLines = content.split('\n')
        const estimatedCharsPerLine = 16
        let totalWrappedLines = 0
        let emptyCount = 0
        let headingCount = 0
        rawLines.forEach(line => {
            if (line === '') {
                emptyCount++
            } else {
                const wrapped = Math.max(1, Math.ceil(line.length / estimatedCharsPerLine))
                totalWrappedLines += wrapped
                if (/^【.+】$/.test(line)) {
                    headingCount++
                }
            }
        })
        const contentHeight = 70 + totalWrappedLines * 22 + emptyCount * 14 + headingCount * 6 + 55
        const modalHeight = Math.max(280, Math.min(650, contentHeight))

        this.game.uiManager.addModal({
            type: 'confirm',
            title: `第${state.day}天 市场日报`,
            content: content,
            confirmText: '知道了',
            singleButton: true,
            height: modalHeight,
            isNewspaper: true
        })
    }

    getTopChangeItems() {
        const state = this.game.gameState.data
        const itemsWithChange = ItemData.map(item => {
            const priceData = state.itemPrices && state.itemPrices[item.id]
            const change = priceData ? priceData.totalChange : 0
            return {
                name: item.name,
                change: change
            }
        }).filter(item => item.change !== 0)

        itemsWithChange.sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
        return itemsWithChange.slice(0, 3)
    }

    showEntertainmentModal() {
        const state = this.game.gameState.data

        const actions = [
            { text: '刷视频', callback: () => this.doBrowseVideos(), color: '#D49BA3' },
            { text: '看直播', callback: () => this.doWatchLive(), color: '#9B59B6' },
            { text: '玩游戏', callback: () => this.doPlayGames(), color: '#7CB87C' }
        ]

        this.game.uiManager.addModal({
            type: 'action',
            title: '娱乐中心',
            content: `精力: ${state.energy}/${state.maxEnergy}\n金币: ${state.money.toLocaleString()}\n\n选择娱乐方式`,
            actions: actions,
            height: 220
        })
    }

    doBrowseVideos() {
        const state = this.game.gameState.data
        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法刷视频',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }

        state.energy -= 1
        const moodGain = 8 + Math.floor(Math.random() * 10)
        state.mood = Math.min(100, state.mood + moodGain)
        this.game.gameState.save()

        this.game.gameState.addDelayedAnimation('decrease', 1, 'energy')
        this.game.gameState.addDelayedAnimation('increase', moodGain, 'mood')

        this.game.uiManager.addModal({
            type: 'confirm',
            title: '刷完视频',
            content: `时间过得真快！\n心情 +${moodGain}`,
            confirmText: '哈哈',
            singleButton: true,
            onConfirm: () => {}
        })
    }

    doWatchLive() {
        const state = this.game.gameState.data
        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法看直播',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }

        if (state.money < 20) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '金币不足',
                content: '看直播需要20金币买礼物',
                confirmText: '好吧',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }

        state.energy -= 1
        state.money -= 20

        if (Math.random() < 0.15) {
            const refund = 30
            state.money += refund
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '运气爆棚！',
                content: `主播看你可爱，回赠了你！\n获得 ${refund} 金币`,
                confirmText: '开心',
                singleButton: true,
                onConfirm: () => {}
            })
            this.game.gameState.addDelayedAnimation('increase', refund, 'money')
        } else {
            const moodGain = 15 + Math.floor(Math.random() * 10)
            state.mood = Math.min(100, state.mood + moodGain)
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '直播真有趣',
                content: `打赏了20金币给主播\n心情 +${moodGain}`,
                confirmText: '开心',
                singleButton: true,
                onConfirm: () => {}
            })
            this.game.gameState.addDelayedAnimation('increase', moodGain, 'mood')
        }

        this.game.gameState.save()
        this.game.gameState.addDelayedAnimation('decrease', 1, 'energy')
        this.game.gameState.addDelayedAnimation('decrease', 20, 'money')
    }

    doPlayGames() {
        const state = this.game.gameState.data
        if (state.energy < 1) {
            this.game.uiManager.addModal({
                type: 'confirm',
                title: '精力不足',
                content: '无法玩游戏',
                confirmText: '知道了',
                singleButton: true,
                onConfirm: () => {}
            })
            return
        }

        state.energy -= 1

        const rand = Math.random()
        if (rand < 0.3) {
            const moneyGain = 20 + Math.floor(Math.random() * 30)
            state.money += moneyGain
            state.mood = Math.min(100, state.mood + 10)
            this.game.gameState.addDelayedAnimation('increase', moneyGain, 'money')
            this.game.gameState.addDelayedAnimation('increase', 10, 'mood')

            this.game.uiManager.addModal({
                type: 'confirm',
                title: '游戏获胜！',
                content: `排位赛赢了！\n金币 +${moneyGain}\n心情 +10`,
                confirmText: '太棒了',
                singleButton: true,
                onConfirm: () => {}
            })
        } else if (rand < 0.6) {
            state.mood = Math.min(100, state.mood + 8)
            this.game.gameState.addDelayedAnimation('increase', 8, 'mood')

            this.game.uiManager.addModal({
                type: 'confirm',
                title: '游戏时间',
                content: '玩得很开心！\n心情 +8',
                confirmText: '不错',
                singleButton: true,
                onConfirm: () => {}
            })
        } else {
            state.mood = Math.max(0, state.mood - 5)
            this.game.gameState.addDelayedAnimation('decrease', 5, 'mood')

            this.game.uiManager.addModal({
                type: 'confirm',
                title: '游戏连跪',
                content: '连跪三把，心态崩了...\n心情 -5',
                confirmText: '难受',
                singleButton: true,
                onConfirm: () => {}
            })
        }

        this.game.gameState.save()
        this.game.gameState.addDelayedAnimation('decrease', 1, 'energy')
    }

    goBack() {
        this.game.sceneManager.goToLocation('home')
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

    handleTouchStart(x, y) {
        for (const area of this.clickableAreas) {
            if (x >= area.x && x <= area.x + area.w &&
                y >= area.y && y <= area.y + area.h) {
                if (area.action) area.action()
                return true
            }
        }
        return false
    }

    handleTouchMove(x, y) {
    }

    handleTouchEnd(x, y) {
    }
}
