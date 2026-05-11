import iconManager from '../components/IconManager.js'

export default class SceneUIRenderer {
    constructor(game) {
        this.game = game
        this._registeredActions = null
        this._actionHandler = null
    }

    renderTopBar(renderer, gameState) {
        const state = gameState.data
        const w = renderer.width
        const ctx = renderer.ctx
        const padding = 12
        const barH = 48

        renderer.drawRect(padding, 8, w - padding * 2, barH, '#FFF5E6', 12)

        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        renderer.beginRoundRectPath(padding, 8, w - padding * 2, barH, 12)
        ctx.stroke()

        iconManager.draw(ctx, 'calendar', padding + 22, 24, { size: 20 })
        renderer.drawText(`第${state.day}天 / ${state.totalDays}天`, padding + 42, 28, '#5D4037', 13, 'left')

        const rightX = w - padding - 15
        const moneyText = state.money.toLocaleString()
        iconManager.draw(ctx, 'coin', rightX - 85, 24, { size: 18 })
        renderer.drawText(moneyText, rightX, 28, '#D4A574', 15, 'right')
    }

    renderDialog(renderer, dialogData) {
        const { lines, speaker, visible, index } = dialogData
        
        if (!lines || lines.length === 0 || !visible) return

        const w = renderer.width
        const h = renderer.height
        const statsBarH = 124
        const dialogH = 150
        const dialogY = h - dialogH - statsBarH

        renderer.drawRect(0, dialogY, w, dialogH, 'rgba(0, 0, 0, 0.8)')
        renderer.drawRect(0, dialogY, w, 2, '#f39c12')

        if (speaker) {
            renderer.drawText(speaker, 20, dialogY + 25, '#f39c12', 14, 'left')
        }

        if (index < lines.length) {
            const text = lines[index]
            renderer.drawText(text, 20, dialogY + 60, '#ffffff', 13, 'left')

            if (index < lines.length - 1) {
                renderer.drawText('点击继续...', w - 20, dialogY + dialogH - 20, '#7f8c8d', 11, 'right')
            } else {
                renderer.drawText('点击关闭', w - 20, dialogY + dialogH - 20, '#7f8c8d', 11, 'right')
            }
        }
    }

    renderActions(renderer, actions, actionHandler) {
        if (!actions || actions.length === 0) return

        const w = renderer.width
        const h = renderer.height
        const statsBarH = 124
        const actionY = h - 70 - statsBarH
        const actionW = (w - 40) / actions.length
        const gap = 10

        if (this._registeredActions !== actions || this._actionHandler !== actionHandler) {
            this._registeredActions = actions
            this._actionHandler = actionHandler
            actions.forEach((action, index) => {
                const x = 20 + index * (actionW + gap)
                this.game.uiManager.addButton(x, actionY, actionW, 50, action.text, () => {
                    if (actionHandler) {
                        actionHandler(action.callback)
                    }
                }, { bgColor: '#3498db', fontSize: 13 })
            })
        }

        actions.forEach((action, index) => {
            const x = 20 + index * (actionW + gap)
            renderer.drawGhibliButton(x, actionY, actionW, 50, action.text, '#3498db', '#ffffff', 13)
        })
    }

    renderClickableAreas(renderer, clickableAreas) {
        if (!clickableAreas) return

        const w = renderer.width
        const h = renderer.height

        for (const area of clickableAreas) {
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
}
