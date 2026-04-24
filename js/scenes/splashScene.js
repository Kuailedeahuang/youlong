import imageManager from '../utils/imageManager.js'
import { getAllHouses } from '../data/houses.js'

export default class SplashScene {
    constructor(game) {
        this.game = game
        this.logoImage = null
        this.imageLoaded = false
        this.loadingProgress = 0
        this.loadingDuration = 5000 // 5秒加载时间
        this.startTime = null
        this.houseImages = {} // 预加载的房屋图片
        this.houses = getAllHouses()
        this.loadLogo()
        this.preloadHouseImages() // 预加载房屋图片
    }
    
    async loadLogo() {
        try {
            // 尝试从云端加载logo图片
            const cloudImage = await imageManager.loadImageFromCloud('game_logo.png')
            if (cloudImage && cloudImage.image) {
                this.logoImage = cloudImage.image
                this.imageLoaded = true
                console.log('使用云存储Logo图片: game_logo.png')
                return
            }
        } catch (e) {
            console.warn('从云端加载Logo失败，使用本地图片:', e)
        }
        
        // 本地图片作为后备
        this.logoImage = wx.createImage()
        this.logoImage.onload = () => {
            this.imageLoaded = true
        }
        this.logoImage.onerror = () => {
            console.error('Logo图片加载失败')
        }
        this.logoImage.src = 'tupian/logo.png'
    }
    
    // 预加载房屋图片
    async preloadHouseImages() {
        try {
            console.log('开始预加载房屋图片...')
            console.log('房屋总数:', this.houses.length)
            
            for (const house of this.houses) {
                console.log(`处理房屋: ${house.name}, imageName: ${house.imageName}, id: ${house.id}`)
                if (house.imageName) {
                    const imageName = `${house.imageName}.png`
                    console.log(`尝试加载图片: ${imageName}`)
                    
                    try {
                        const cloudImage = await imageManager.loadImageFromCloud(imageName)
                        
                        if (cloudImage && cloudImage.image) {
                            this.houseImages[house.id] = cloudImage.image
                            console.log(`✓ 预加载成功: ${house.name} (id=${house.id})`)
                        } else {
                            console.warn(`✗ 预加载失败: ${house.name}, 未找到图片`)
                        }
                    } catch (e) {
                        console.warn(`✗ 预加载异常: ${house.name}`, e.message || e)
                    }
                } else {
                    console.warn(`✗ 房屋没有 imageName: ${house.name}`)
                }
            }
            
            console.log('房屋图片预加载完成，已加载:', Object.keys(this.houseImages).length, '张')
            console.log('已加载的房屋ID:', Object.keys(this.houseImages))
        } catch (e) {
            console.warn('预加载房屋图片失败:', e)
        }
    }
    
    onEnter() {
        this.startTime = Date.now()
        this.loadingProgress = 0
    }
    
    update(deltaTime) {
        if (!this.startTime) return
        
        const elapsed = Date.now() - this.startTime
        this.loadingProgress = Math.min(1, elapsed / this.loadingDuration)
        
        // 加载完成后切换到首页
        if (this.loadingProgress >= 1) {
            this.game.sceneManager.switchTo('home')
        }
    }
    
    render(renderer) {
        const w = renderer.width
        const h = renderer.height
        const ctx = renderer.ctx
        
        // 清空画布并绘制背景
        renderer.clear('#1a1a2e')
        
        // 绘制Logo（居中偏上）
        const logoSize = Math.min(w, h) * 0.3
        const logoX = (w - logoSize) / 2
        const logoY = h * 0.25
        
        if (this.imageLoaded && this.logoImage && this.logoImage.width > 0) {
            try {
                ctx.drawImage(this.logoImage, logoX, logoY, logoSize, logoSize)
            } catch (e) {
                console.warn('绘制Logo失败:', e)
                renderer.drawRect(logoX, logoY, logoSize, logoSize, '#2c3e50')
                renderer.drawText('游', logoX + logoSize / 2, logoY + logoSize / 2, '#f39c12', 48, 'center')
            }
        } else {
            // 图片未加载时显示占位符
            renderer.drawRect(logoX, logoY, logoSize, logoSize, '#2c3e50')
            renderer.drawText('游', logoX + logoSize / 2, logoY + logoSize / 2, '#f39c12', 48, 'center')
        }
        
        // 绘制游戏名称
        const titleY = logoY + logoSize + 40
        renderer.drawText('游龙市场为买房', w / 2, titleY, '#f39c12', 24, 'center')
        
        // 绘制加载条背景
        const barWidth = w * 0.6
        const barHeight = 8
        const barX = (w - barWidth) / 2
        const barY = titleY + 50
        
        renderer.drawRect(barX, barY, barWidth, barHeight, '#2c3e50', 4)
        
        // 绘制加载条进度
        const progressWidth = barWidth * this.loadingProgress
        renderer.drawRect(barX, barY, progressWidth, barHeight, '#f39c12', 4)
        
        // 绘制加载百分比
        const percentage = Math.floor(this.loadingProgress * 100)
        renderer.drawText(`${percentage}%`, w / 2, barY + 25, '#7f8c8d', 12, 'center')
        
        // 绘制加载提示文字
        const tips = [
            '正在加载游戏资源...',
            '正在连接服务器...',
            '正在初始化数据...',
            '即将进入游戏...'
        ]
        const tipIndex = Math.min(Math.floor(this.loadingProgress * tips.length), tips.length - 1)
        renderer.drawText(tips[tipIndex], w / 2, barY + 45, '#95a5a6', 11, 'center')
    }
    
    handleTouchStart(x, y) {
        // 点击跳过加载
        this.game.sceneManager.switchTo('home')
    }
    
    handleTouchMove(x, y) {}
    
    handleTouchEnd(x, y) {}
}
