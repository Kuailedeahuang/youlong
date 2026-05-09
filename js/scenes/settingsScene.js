import imageManager from '../utils/imageManager.js'
import iconManager from '../components/IconManager.js'
import { restartGame } from '../utils/resetGame.js'

/**
 * 设置场景
 * 提供游戏设置、统计信息、缓存清理等功能
 * 遵循吉卜力赛璐璐风UI设计规范
 */
export default class SettingsScene {
    constructor(game) {
        this.game = game
        this.bgImage = null
        this.imageLoaded = false
        this.bgLoadingState = 'loading' // loading | loaded | error
        this.loadBackground()

        // 设置项配置
        this.settings = this.loadSettings()

        // 动画状态 - 吉卜力风格温柔动效
        this.switchAnimations = {
            sound: { progress: this.settings.soundEnabled ? 1 : 0, target: this.settings.soundEnabled ? 1 : 0 },
            vibration: { progress: this.settings.vibrationEnabled ? 1 : 0, target: this.settings.vibrationEnabled ? 1 : 0 }
        }

        // 按钮按压状态 - 用于视觉反馈
        this.buttonStates = {
            back: { pressed: false, hover: false },
            restart: { pressed: false, hover: false },
            stats: { pressed: false, hover: false },
            clear: { pressed: false, hover: false }
        }

        // 反馈提示
        this.feedbackToast = null
        this.feedbackTimer = 0
    }

    /**
     * 加载用户设置
     */
    loadSettings() {
        try {
            const saved = wx.getStorageSync('game_settings')
            if (saved) {
                return JSON.parse(saved)
            }
        } catch (e) {
            console.warn('[SettingsScene] 加载设置失败:', e)
        }
        // 默认设置
        return {
            soundEnabled: true,
            vibrationEnabled: true
        }
    }

    /**
     * 保存用户设置
     */
    saveSettings() {
        try {
            wx.setStorageSync('game_settings', JSON.stringify(this.settings))
        } catch (e) {
            console.warn('[SettingsScene] 保存设置失败:', e)
        }
    }

    async loadBackground() {
        this.bgLoadingState = 'loading'
        try {
            const cloudImage = await imageManager.loadImageFromCloud('ChuZuWu.png')
            if (cloudImage && cloudImage.image) {
                this.bgImage = cloudImage.image
                this.imageLoaded = true
                this.bgLoadingState = 'loaded'
                return
            }
        } catch (e) {
            console.warn('[SettingsScene] 从云端加载背景图失败:', e)
            this.bgLoadingState = 'error'
        }

        this.bgImage = wx.createImage()
        this.bgImage.onload = () => {
            this.imageLoaded = true
            this.bgLoadingState = 'loaded'
        }
        this.bgImage.onerror = () => {
            this.bgLoadingState = 'error'
        }
        this.bgImage.src = 'tupian/chuzuwu.png'
    }

    onEnter() {
        // 重新加载最新设置
        this.settings = this.loadSettings()
        // 同步动画状态
        this.switchAnimations.sound.target = this.settings.soundEnabled ? 1 : 0
        this.switchAnimations.sound.progress = this.settings.soundEnabled ? 1 : 0
        this.switchAnimations.vibration.target = this.settings.vibrationEnabled ? 1 : 0
        this.switchAnimations.vibration.progress = this.settings.vibrationEnabled ? 1 : 0
    }

    update(deltaTime) {
        // 吉卜力风格温柔动效 - 使用缓动函数
        const animateSpeed = 6 * deltaTime // 温柔的速度
        for (let key in this.switchAnimations) {
            const state = this.switchAnimations[key]
            const diff = state.target - state.progress
            state.progress += diff * Math.min(animateSpeed, 1)
            // 接近目标时直接设置，避免无限逼近
            if (Math.abs(diff) < 0.01) {
                state.progress = state.target
            }
        }

        // 反馈提示倒计时
        if (this.feedbackToast && this.feedbackTimer > 0) {
            this.feedbackTimer -= deltaTime
            this.feedbackToast.opacity = Math.max(0, this.feedbackTimer / 0.5)
            if (this.feedbackTimer <= 0) {
                this.feedbackToast = null
            }
        }
    }

    render(renderer) {
        const w = renderer.width
        const h = renderer.height

        this.game.uiManager.clear()

        // 绘制背景
        this.renderBackground(renderer, w, h)

        // 绘制设置面板
        this.renderSettingsPanel(renderer)

        // 绘制反馈提示
        this.renderFeedbackToast(renderer, w, h)
    }

    /**
     * 绘制背景
     */
    renderBackground(renderer, w, h) {
        if (this.imageLoaded && this.bgImage && this.bgImage.width > 0) {
            try {
                const ctx = renderer.ctx
                ctx.drawImage(this.bgImage, 0, 0, w, h)
            } catch (e) {
                console.warn('[SettingsScene] 绘制背景图失败:', e)
                renderer.clear('#E8E0D5')
            }
        } else {
            renderer.clear('#E8E0D5')
        }
    }

    /**
     * 绘制设置面板
     */
    renderSettingsPanel(renderer) {
        const w = renderer.width
        const h = renderer.height
        const ctx = renderer.ctx

        // 面板尺寸 - 使用8的倍数间距系统
        const padding = 24 // 从20增加到24（8的倍数）
        const panelW = Math.min(w - padding * 2, 360)
        const panelH = h - padding * 3 - 60
        const panelX = (w - panelW) / 2
        const panelY = padding + 60

        // 绘制柔和阴影 - 吉卜力风格低饱和投影
        this.drawSoftShadow(ctx, panelX, panelY, panelW, panelH, 16)

        // 面板背景 - 浅米木色平涂色块
        renderer.drawRect(panelX, panelY, panelW, panelH, '#FFF5E6', 16)

        // 1.5px 干净黑色轮廓线
        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        this.roundRectPath(ctx, panelX, panelY, panelW, panelH, 16)
        ctx.stroke()

        // 面板顶部装饰线 - 柔和水彩感
        ctx.beginPath()
        ctx.moveTo(panelX + 25, panelY + 3)
        ctx.lineTo(panelX + panelW - 25, panelY + 3)
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.25)'
        ctx.lineWidth = 2
        ctx.stroke()

        // 绘制标题
        this.renderTitle(renderer, w / 2, panelY - 30)

        // 绘制设置项 - 使用8的倍数间距
        let currentY = panelY + 32 // 从30增加到32
        const itemHeight = 56 // 保持56px高度（符合触摸目标）
        const itemSpacing = 16 // 从8增加到16（8的倍数），提供更好的视觉分隔

        // 音效开关
        this.renderToggleItem(renderer, panelX + 20, currentY, panelW - 40, itemHeight,
            'sound', '音效', this.switchAnimations.sound.progress,
            () => this.toggleSound())
        currentY += itemHeight + itemSpacing

        // 震动开关
        this.renderToggleItem(renderer, panelX + 20, currentY, panelW - 40, itemHeight,
            'vibration', '震动反馈', this.switchAnimations.vibration.progress,
            () => this.toggleVibration())
        currentY += itemHeight + itemSpacing + 16

        // 分隔线
        this.renderDivider(renderer, panelX + 30, currentY - 8, panelW - 60)

        // 游戏统计
        this.renderActionItem(renderer, panelX + 20, currentY, panelW - 40, itemHeight,
            'stats', '游戏统计', () => this.showStats(),
            this.buttonStates.stats)
        currentY += itemHeight + itemSpacing

        // 清除缓存
        this.renderActionItem(renderer, panelX + 20, currentY, panelW - 40, itemHeight,
            'clear', '清除缓存', () => this.clearCache(),
            this.buttonStates.clear)
        currentY += itemHeight + itemSpacing

        // 版本信息
        this.renderInfoItem(renderer, panelX + 20, currentY, panelW - 40, itemHeight,
            'version', '版本', 'v1.0.0')
        currentY += itemHeight + itemSpacing + 16

        // 分隔线
        this.renderDivider(renderer, panelX + 30, currentY - 8, panelW - 60)

        // 返回按钮
        this.renderBackButton(renderer, panelX + 20, panelY + panelH - 60, panelW - 40, 48)

        // 重新开始游戏（危险操作，放在最下方）
        this.renderDangerButton(renderer, panelX + 20, panelY + panelH - 110, panelW - 40, 40)
    }

    /**
     * 绘制柔和阴影 - 吉卜力风格
     */
    drawSoftShadow(ctx, x, y, width, height, radius) {
        ctx.save()
        ctx.shadowColor = 'rgba(139, 115, 85, 0.15)' // 低饱和同色系投影
        ctx.shadowBlur = 24 // 柔和模糊
        ctx.shadowOffsetY = 8
        ctx.shadowOffsetX = 0
        ctx.fillStyle = 'transparent'
        ctx.beginPath()
        this.roundRectPath(ctx, x, y, width, height, radius)
        ctx.fill()
        ctx.restore()
    }

    /**
     * 绘制标题
     */
    renderTitle(renderer, x, y) {
        const ctx = renderer.ctx

        // 标题背景 - 暖黄色强调色
        const titleW = 100
        const titleH = 36
        const titleX = x - titleW / 2
        const titleY = y - titleH / 2

        // 标题阴影
        this.drawSoftShadow(ctx, titleX, titleY, titleW, titleH, 18)

        renderer.drawRect(titleX, titleY, titleW, titleH, '#FFE080', 18)

        // 轮廓线
        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        this.roundRectPath(ctx, titleX, titleY, titleW, titleH, 18)
        ctx.stroke()

        // 标题文字 - 使用加深的主色，字号18px
        renderer.drawText('设置', x, y + 6, '#5A4A3A', 18, 'center')
    }

    /**
     * 绘制开关设置项
     * @param {number} animationProgress - 动画进度 0-1
     */
    renderToggleItem(renderer, x, y, w, h, iconKey, label, animationProgress, onToggle) {
        const ctx = renderer.ctx
        const isOn = animationProgress > 0.5

        // 背景 - 根据按压状态调整
        const bgAlpha = 0.6
        renderer.drawRect(x, y, w, h, `rgba(255, 255, 255, ${bgAlpha})`, 10)

        // 图标
        iconManager.draw(ctx, iconKey, x + 16, y + h / 2, { size: 20 })

        // 标签 - 字号15px，深木棕色
        renderer.drawText(label, x + 44, y + h / 2 + 5, '#5D4037', 15, 'left')

        // 开关按钮 - 增大触摸目标
        const switchW = 52 // 从48增加到52
        const switchH = 32 // 从26增加到32，符合最小触摸目标
        const switchX = x + w - switchW - 16
        const switchY = y + (h - switchH) / 2

        // 开关背景 - 使用动画进度实现颜色过渡
        const offColor = { r: 184, g: 184, b: 184 } // #B8B8B8
        const onColor = { r: 124, g: 184, b: 124 }  // #7CB87C
        const r = Math.round(offColor.r + (onColor.r - offColor.r) * animationProgress)
        const g = Math.round(offColor.g + (onColor.g - offColor.g) * animationProgress)
        const b = Math.round(offColor.b + (onColor.b - offColor.b) * animationProgress)
        const switchColor = `rgb(${r}, ${g}, ${b})`

        renderer.drawRect(switchX, switchY, switchW, switchH, switchColor, switchH / 2)

        // 开关圆点 - 使用动画进度实现位置过渡
        const dotRadius = 12 // 从10增加到12
        const dotX = switchX + dotRadius + 4 + (switchW - dotRadius * 2 - 8) * animationProgress
        const dotY = switchY + switchH / 2

        ctx.beginPath()
        ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()

        // 轮廓线
        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1
        ctx.beginPath()
        this.roundRectPath(ctx, switchX, switchY, switchW, switchH, switchH / 2)
        ctx.stroke()

        // 添加点击区域 - 扩展触摸目标到56px高度
        const hitAreaPadding = (56 - switchH) / 2
        this.game.uiManager.addButton(
            switchX - 10,
            switchY - hitAreaPadding,
            switchW + 20,
            56,
            '',
            onToggle,
            { bgColor: 'transparent' }
        )
    }

    /**
     * 绘制操作按钮项
     */
    renderActionItem(renderer, x, y, w, h, iconKey, label, onClick, buttonState = {}) {
        const ctx = renderer.ctx

        // 背景 - 吉卜力风格按压反馈：轻微颜色加深
        const baseAlpha = 0.6
        const pressAlpha = buttonState.pressed ? 0.75 : baseAlpha
        renderer.drawRect(x, y, w, h, `rgba(255, 255, 255, ${pressAlpha})`, 10)

        // 图标
        iconManager.draw(ctx, iconKey, x + 16, y + h / 2, { size: 20 })

        // 标签 - 字号15px
        renderer.drawText(label, x + 44, y + h / 2 + 5, '#5D4037', 15, 'left')

        // 箭头图标
        iconManager.draw(ctx, 'arrowRight', x + w - 28, y + h / 2, { size: 16 })

        // 添加点击区域
        this.game.uiManager.addButton(x, y, w, h, '', onClick, {
            bgColor: 'transparent'
        })
    }

    /**
     * 绘制信息展示项
     */
    renderInfoItem(renderer, x, y, w, h, iconKey, label, value) {
        const ctx = renderer.ctx

        // 背景
        renderer.drawRect(x, y, w, h, 'rgba(255, 255, 255, 0.6)', 10)

        // 图标
        iconManager.draw(ctx, iconKey, x + 16, y + h / 2, { size: 20 })

        // 标签 - 字号15px
        renderer.drawText(label, x + 44, y + h / 2 + 5, '#5D4037', 15, 'left')

        // 值 - 使用更深的颜色确保对比度，字号13px（最小可读）
        renderer.drawText(value, x + w - 16, y + h / 2 + 5, '#6B5344', 13, 'right')
    }

    /**
     * 绘制分隔线
     */
    renderDivider(renderer, x, y, w) {
        const ctx = renderer.ctx
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + w, y)
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.2)'
        ctx.lineWidth = 1
        ctx.stroke()
    }

    /**
     * 绘制返回按钮
     */
    renderBackButton(renderer, x, y, w, h) {
        const ctx = renderer.ctx
        const state = this.buttonStates.back

        // 吉卜力风格按压反馈：轻微缩放 + 颜色加深
        const scale = state.pressed ? 0.98 : 1.0
        const centerX = x + w / 2
        const centerY = y + h / 2
        const scaledW = w * scale
        const scaledH = h * scale
        const scaledX = centerX - scaledW / 2
        const scaledY = centerY - scaledH / 2

        // 按钮背景 - 浅天蓝色，按压时加深
        const baseColor = '#E0F0FF'
        const pressedColor = '#C8E0F5'
        const bgColor = state.pressed ? pressedColor : baseColor

        // 阴影
        this.drawSoftShadow(ctx, scaledX, scaledY, scaledW, scaledH, 10)

        renderer.drawRect(scaledX, scaledY, scaledW, scaledH, bgColor, 10)

        // 轮廓线
        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        this.roundRectPath(ctx, scaledX, scaledY, scaledW, scaledH, 10)
        ctx.stroke()

        // 图标
        iconManager.draw(ctx, 'back', scaledX + scaledW / 2 - 30, scaledY + scaledH / 2, { size: 18 })

        // 文字 - 字号15px
        renderer.drawText('返回游戏', scaledX + scaledW / 2 + 6, scaledY + scaledH / 2 + 5, '#5D4037', 15, 'center')

        // 添加点击区域
        this.game.uiManager.addButton(x, y, w, h, '', () => {
            this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
        }, {
            bgColor: 'transparent'
        })
    }

    /**
     * 绘制危险操作按钮（重新开始）
     */
    renderDangerButton(renderer, x, y, w, h) {
        const ctx = renderer.ctx
        const state = this.buttonStates.restart

        // 吉卜力风格按压反馈
        const scale = state.pressed ? 0.98 : 1.0
        const centerX = x + w / 2
        const centerY = y + h / 2
        const scaledW = w * scale
        const scaledH = h * scale
        const scaledX = centerX - scaledW / 2
        const scaledY = centerY - scaledH / 2

        // 按钮背景 - 增强视觉区分
        const baseColor = 'rgba(193, 123, 107, 0.2)' // 增加不透明度
        const pressedColor = 'rgba(193, 123, 107, 0.35)'
        const bgColor = state.pressed ? pressedColor : baseColor

        renderer.drawRect(scaledX, scaledY, scaledW, scaledH, bgColor, 10)

        // 轮廓线 - 增强可见性
        ctx.strokeStyle = 'rgba(193, 123, 107, 0.7)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        this.roundRectPath(ctx, scaledX, scaledY, scaledW, scaledH, 10)
        ctx.stroke()

        // 警告图标 + 重置图标组合
        iconManager.draw(ctx, 'warning', scaledX + scaledW / 2 - 50, scaledY + scaledH / 2, { size: 14, color: '#C17B6B' })
        iconManager.draw(ctx, 'reset', scaledX + scaledW / 2 - 30, scaledY + scaledH / 2, { size: 16 })

        // 文字 - 使用清晰的危险色
        renderer.drawText('重新开始游戏', scaledX + scaledW / 2 + 2, scaledY + scaledH / 2 + 5, '#B86B5B', 14, 'center')

        // 添加点击区域
        this.game.uiManager.addButton(x, y, w, h, '', () => {
            this.confirmRestart()
        }, {
            bgColor: 'transparent'
        })
    }

    /**
     * 绘制反馈提示
     */
    renderFeedbackToast(renderer, w, h) {
        if (!this.feedbackToast) return

        const ctx = renderer.ctx
        const toast = this.feedbackToast
        const padding = 16
        const textWidth = ctx.measureText ? ctx.measureText(toast.text).width : 100
        const toastW = textWidth + padding * 2
        const toastH = 40
        const toastX = (w - toastW) / 2
        const toastY = h * 0.7 // 在屏幕下方70%位置

        ctx.save()
        ctx.globalAlpha = toast.opacity

        // 背景
        renderer.drawRect(toastX, toastY, toastW, toastH, 'rgba(90, 74, 58, 0.9)', 20)

        // 文字
        renderer.drawText(toast.text, w / 2, toastY + toastH / 2 + 5, '#FFF5E6', 14, 'center')

        ctx.restore()
    }

    /**
     * 显示反馈提示
     */
    showFeedbackToast(text) {
        this.feedbackToast = {
            text: text,
            opacity: 1
        }
        this.feedbackTimer = 1.5 // 1.5秒消失
    }

    // ==================== 交互方法 ====================

    /**
     * 切换音效开关
     */
    toggleSound() {
        this.settings.soundEnabled = !this.settings.soundEnabled
        this.switchAnimations.sound.target = this.settings.soundEnabled ? 1 : 0
        this.saveSettings()

        // 视觉反馈
        this.showFeedbackToast(this.settings.soundEnabled ? '音效已开启' : '音效已关闭')

        // 震动反馈
        if (this.settings.vibrationEnabled) {
            wx.vibrateShort({ type: 'light' })
        }

        console.log('[SettingsScene] 音效:', this.settings.soundEnabled ? '开启' : '关闭')
    }

    /**
     * 切换震动开关
     */
    toggleVibration() {
        this.settings.vibrationEnabled = !this.settings.vibrationEnabled
        this.switchAnimations.vibration.target = this.settings.vibrationEnabled ? 1 : 0
        this.saveSettings()

        // 视觉反馈
        this.showFeedbackToast(this.settings.vibrationEnabled ? '震动反馈已开启' : '震动反馈已关闭')

        // 立即反馈
        if (this.settings.vibrationEnabled) {
            wx.vibrateShort({ type: 'light' })
        }

        console.log('[SettingsScene] 震动:', this.settings.vibrationEnabled ? '开启' : '关闭')
    }

    /**
     * 显示游戏统计
     */
    showStats() {
        const state = this.game.gameState.data

        // 计算统计数据
        const stats = {
            bankruptcyCount: state.bankruptcyCount || 0,
            currentDay: state.day,
            totalDays: state.totalDays,
            currentMoney: state.money,
            purchasedHouse: state.purchasedHouse,
            unlockedHouses: state.unlockedHouses ? state.unlockedHouses.length : 0
        }

        // 构建显示内容
        let content = `📊 游戏统计\n\n`
        content += `破产次数: ${stats.bankruptcyCount}\n`
        content += `当前天数: ${stats.currentDay} / ${stats.totalDays}\n`
        content += `当前金币: ${stats.currentMoney.toLocaleString()}\n`
        content += `已购房产: ${stats.purchasedHouse ? '是' : '否'}\n`
        content += `解锁房屋: ${stats.unlockedHouses} 种`

        this.game.uiManager.addModal({
            type: 'confirm',
            title: '游戏统计',
            content: content,
            confirmText: '知道了',
            singleButton: true,
            onConfirm: () => {}
        })
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '清除缓存',
            content: '确定要清除游戏缓存吗？\n这将删除本地保存的图片和临时数据，但不会影响游戏存档。',
            confirmText: '清除',
            cancelText: '取消',
            onConfirm: () => {
                try {
                    // 清除文件系统缓存
                    const fs = wx.getFileSystemManager()
                    const userPath = wx.env.USER_DATA_PATH

                    // 尝试清除缓存目录
                    try {
                        const files = fs.readdirSync(userPath)
                        files.forEach(file => {
                            if (file !== 'miniprogramLog') { // 保留日志目录
                                try {
                                    fs.unlinkSync(`${userPath}/${file}`)
                                } catch (e) {
                                    // 忽略删除失败
                                }
                            }
                        })
                    } catch (e) {
                        console.warn('[SettingsScene] 读取缓存目录失败:', e)
                    }

                    this.showFeedbackToast('缓存已清除')
                } catch (e) {
                    console.error('[SettingsScene] 清除缓存失败:', e)
                    this.showFeedbackToast('清除失败')
                }
            }
        })
    }

    /**
     * 确认重新开始游戏
     */
    confirmRestart() {
        this.game.uiManager.addModal({
            type: 'confirm',
            title: '重新开始',
            content: '⚠️ 警告：此操作将重置当前游戏进度！\n\n所有金币、属性、仓库物品将被清空，游戏将从第1天重新开始。\n\n已解锁的房屋会保留。',
            confirmText: '确认重置',
            cancelText: '取消',
            onConfirm: () => {
                // 执行重新开始
                restartGame(this.game.gameState)

                this.showFeedbackToast('游戏已重置')

                // 返回主页
                setTimeout(() => {
                    this.game.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
                }, 1500)
            }
        })
    }

    // ==================== 工具方法 ====================

    /**
     * 绘制圆角矩形路径
     */
    roundRectPath(ctx, x, y, width, height, radius) {
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + width - radius, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
        ctx.lineTo(x + width, y + height - radius)
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
        ctx.lineTo(x + radius, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
    }
}
