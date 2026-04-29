import imageManager from '../utils/imageManager.js'
import iconManager from '../components/IconManager.js'
import { restartGame } from '../utils/resetGame.js'

/**
 * 设置场景
 * 提供游戏设置、统计信息、缓存清理等功能
 */
export default class SettingsScene {
    constructor(game) {
        this.game = game
        this.bgImage = null
        this.imageLoaded = false
        this.loadBackground()

        // 设置项配置
        this.settings = this.loadSettings()
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
        try {
            const cloudImage = await imageManager.loadImageFromCloud('ChuZuWu.png')
            if (cloudImage && cloudImage.image) {
                this.bgImage = cloudImage.image
                this.imageLoaded = true
                return
            }
        } catch (e) {
            console.warn('[SettingsScene] 从云端加载背景图失败:', e)
        }

        this.bgImage = wx.createImage()
        this.bgImage.onload = () => {
            this.imageLoaded = true
        }
        this.bgImage.src = 'tupian/chuzuwu.png'
    }

    onEnter() {
        // 重新加载最新设置
        this.settings = this.loadSettings()
    }

    update(deltaTime) {
        // 设置页面不需要特殊更新逻辑
    }

    render(renderer) {
        const w = renderer.width
        const h = renderer.height

        this.game.uiManager.clear()

        // 绘制背景
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

        // 绘制设置面板
        this.renderSettingsPanel(renderer)
    }

    /**
     * 绘制设置面板
     */
    renderSettingsPanel(renderer) {
        const w = renderer.width
        const h = renderer.height
        const ctx = renderer.ctx

        // 面板尺寸
        const padding = 20
        const panelW = Math.min(w - padding * 2, 360)
        const panelH = h - padding * 3 - 60 // 留出顶部标题空间
        const panelX = (w - panelW) / 2
        const panelY = padding + 60

        // 面板背景 - 浅米木色平涂色块
        renderer.drawRect(panelX, panelY, panelW, panelH, '#FFF5E6', 16)

        // 1.5px 干净黑色轮廓线
        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        this.roundRectPath(ctx, panelX, panelY, panelW, panelH, 16)
        ctx.stroke()

        // 面板顶部装饰线
        ctx.beginPath()
        ctx.moveTo(panelX + 25, panelY + 3)
        ctx.lineTo(panelX + panelW - 25, panelY + 3)
        ctx.strokeStyle = 'rgba(139, 115, 85, 0.3)'
        ctx.lineWidth = 2
        ctx.stroke()

        // 绘制标题
        this.renderTitle(renderer, w / 2, panelY - 30)

        // 绘制设置项
        let currentY = panelY + 30
        const itemHeight = 56
        const itemSpacing = 8

        // 音效开关
        this.renderToggleItem(renderer, panelX + 20, currentY, panelW - 40, itemHeight,
            'sound', '音效', this.settings.soundEnabled,
            () => this.toggleSound())
        currentY += itemHeight + itemSpacing

        // 震动开关
        this.renderToggleItem(renderer, panelX + 20, currentY, panelW - 40, itemHeight,
            'vibration', '震动反馈', this.settings.vibrationEnabled,
            () => this.toggleVibration())
        currentY += itemHeight + itemSpacing + 16

        // 分隔线
        this.renderDivider(renderer, panelX + 30, currentY - 8, panelW - 60)

        // 游戏统计
        this.renderActionItem(renderer, panelX + 20, currentY, panelW - 40, itemHeight,
            'stats', '游戏统计', () => this.showStats())
        currentY += itemHeight + itemSpacing

        // 清除缓存
        this.renderActionItem(renderer, panelX + 20, currentY, panelW - 40, itemHeight,
            'clear', '清除缓存', () => this.clearCache())
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
     * 绘制标题
     */
    renderTitle(renderer, x, y) {
        const ctx = renderer.ctx

        // 标题背景
        const titleW = 100
        const titleH = 36
        const titleX = x - titleW / 2
        const titleY = y - titleH / 2

        renderer.drawRect(titleX, titleY, titleW, titleH, '#FFE080', 18)

        // 轮廓线
        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        this.roundRectPath(ctx, titleX, titleY, titleW, titleH, 18)
        ctx.stroke()

        // 标题文字
        renderer.drawText('设置', x, y + 6, '#5D4037', 16, 'center')
    }

    /**
     * 绘制开关设置项
     */
    renderToggleItem(renderer, x, y, w, h, iconKey, label, isOn, onToggle) {
        const ctx = renderer.ctx

        // 背景
        renderer.drawRect(x, y, w, h, 'rgba(255, 255, 255, 0.6)', 10)

        // 图标
        iconManager.draw(ctx, iconKey, x + 16, y + h / 2, { size: 20 })

        // 标签
        renderer.drawText(label, x + 44, y + h / 2 + 5, '#5D4037', 14, 'left')

        // 开关按钮
        const switchW = 48
        const switchH = 26
        const switchX = x + w - switchW - 16
        const switchY = y + (h - switchH) / 2

        // 开关背景
        const switchColor = isOn ? '#7CB87C' : '#B8B8B8'
        renderer.drawRect(switchX, switchY, switchW, switchH, switchColor, switchH / 2)

        // 开关圆点
        const dotRadius = 10
        const dotX = isOn ? switchX + switchW - dotRadius - 3 : switchX + dotRadius + 3
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

        // 添加点击区域
        this.game.uiManager.addButton(switchX - 10, switchY - 10, switchW + 20, switchH + 20, '', onToggle, {
            bgColor: 'transparent'
        })
    }

    /**
     * 绘制操作按钮项
     */
    renderActionItem(renderer, x, y, w, h, iconKey, label, onClick) {
        const ctx = renderer.ctx

        // 背景
        renderer.drawRect(x, y, w, h, 'rgba(255, 255, 255, 0.6)', 10)

        // 图标
        iconManager.draw(ctx, iconKey, x + 16, y + h / 2, { size: 20 })

        // 标签
        renderer.drawText(label, x + 44, y + h / 2 + 5, '#5D4037', 14, 'left')

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

        // 标签
        renderer.drawText(label, x + 44, y + h / 2 + 5, '#5D4037', 14, 'left')

        // 值
        renderer.drawText(value, x + w - 16, y + h / 2 + 5, '#8B7355', 12, 'right')
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

        // 按钮背景 - 浅蓝色
        renderer.drawRect(x, y, w, h, '#E0F0FF', 10)

        // 轮廓线
        ctx.strokeStyle = '#2D3436'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        this.roundRectPath(ctx, x, y, w, h, 10)
        ctx.stroke()

        // 图标
        iconManager.draw(ctx, 'back', x + w / 2 - 30, y + h / 2, { size: 18 })

        // 文字
        renderer.drawText('返回游戏', x + w / 2 + 6, y + h / 2 + 5, '#5D4037', 14, 'center')

        // 添加点击区域
        this.game.uiManager.addButton(x, y, w, h, '', () => {
            this.game.sceneManager.switchTo('home')
        }, {
            bgColor: 'transparent'
        })
    }

    /**
     * 绘制危险操作按钮（重新开始）
     */
    renderDangerButton(renderer, x, y, w, h) {
        const ctx = renderer.ctx

        // 按钮背景 - 浅红色
        renderer.drawRect(x, y, w, h, 'rgba(193, 123, 107, 0.15)', 10)

        // 轮廓线 - 红色
        ctx.strokeStyle = 'rgba(193, 123, 107, 0.5)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        this.roundRectPath(ctx, x, y, w, h, 10)
        ctx.stroke()

        // 图标
        iconManager.draw(ctx, 'reset', x + w / 2 - 40, y + h / 2, { size: 16 })

        // 文字
        renderer.drawText('重新开始游戏', x + w / 2, y + h / 2 + 5, '#C17B6B', 13, 'center')

        // 添加点击区域
        this.game.uiManager.addButton(x, y, w, h, '', () => {
            this.confirmRestart()
        }, {
            bgColor: 'transparent'
        })
    }

    // ==================== 交互方法 ====================

    /**
     * 切换音效开关
     */
    toggleSound() {
        this.settings.soundEnabled = !this.settings.soundEnabled
        this.saveSettings()

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
        this.saveSettings()

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

                    wx.showToast({
                        title: '缓存已清除',
                        icon: 'success',
                        duration: 1500
                    })
                } catch (e) {
                    console.error('[SettingsScene] 清除缓存失败:', e)
                    wx.showToast({
                        title: '清除失败',
                        icon: 'none',
                        duration: 1500
                    })
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

                wx.showToast({
                    title: '游戏已重置',
                    icon: 'success',
                    duration: 1500
                })

                // 返回主页
                setTimeout(() => {
                    this.game.sceneManager.switchTo('home')
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
