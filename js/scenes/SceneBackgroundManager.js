import imageManager from '../utils/imageManager.js'

export default class SceneBackgroundManager {
    constructor() {
        this.bgImage = null
        this.imageLoaded = false
        this.useCloudImage = false
        this.isLoadingScene = false
        this.loadRequestId = 0
        this.loadingStartTime = null
    }

    async loadBackground(sceneConfig) {
        if (!sceneConfig) {
            console.warn('[SceneBackgroundManager] 未找到场景配置')
            this.isLoadingScene = false
            return false
        }

        const requestId = ++this.loadRequestId
        this.isLoadingScene = true
        this.loadingStartTime = Date.now()
        const tag = `[SceneBackgroundManager #${requestId}]`

        const loadTimeout = new Promise((resolve) => {
            setTimeout(() => resolve('timeout'), 8000)
        })

        try {
            console.log(`${tag} 尝试从云端加载图片:`, sceneConfig.imageName)
            const cloudStart = Date.now()
            const cloudResult = await Promise.race([
                imageManager.loadImageFromCloud(sceneConfig.imageName),
                loadTimeout
            ])

            if (requestId !== this.loadRequestId) {
                console.warn(`${tag} 请求ID不匹配，跳过云端结果`)
                this.isLoadingScene = false
                return false
            }

            if (cloudResult === 'timeout') {
                console.warn(`${tag} 云端加载竞速超时(8s)，imageManager可能仍在后台加载 (已耗时${Date.now() - cloudStart}ms)`)
            } else if (cloudResult && cloudResult.image) {
                this.bgImage = cloudResult.image
                this.imageLoaded = true
                this.useCloudImage = true
                this.isLoadingScene = false
                console.log(`${tag} 使用云存储背景图: ${sceneConfig.imageName} (总耗时${Date.now() - cloudStart}ms)`)
                return true
            } else {
                console.warn(`${tag} 云端返回null: cloudResult=${cloudResult}`)
            }
        } catch (e) {
            console.warn(`${tag} 从云端加载背景图异常，使用本地图片:`, e)
            if (requestId !== this.loadRequestId) {
                this.isLoadingScene = false
                return false
            }
        }

        console.log(`${tag} 尝试从本地加载图片:`, sceneConfig.localPath)
        return await this.loadLocalImage(sceneConfig.localPath, requestId)
    }

    loadLocalImage(localPath, requestId) {
        return new Promise((resolve) => {
            const newBgImage = wx.createImage()

            const localImageTimeout = setTimeout(() => {
                console.error('[SceneBackgroundManager] 本地图片加载超时:', localPath)
                if (this.loadRequestId === requestId) {
                    this.isLoadingScene = false
                    this.imageLoaded = false
                    resolve(false)
                }
            }, 5000)

            newBgImage.onload = () => {
                clearTimeout(localImageTimeout)
                if (requestId !== this.loadRequestId) {
                    this.isLoadingScene = false
                    return
                }
                this.bgImage = newBgImage
                this.imageLoaded = true
                this.useCloudImage = false
                this.isLoadingScene = false
                console.log('[SceneBackgroundManager] 本地图片加载成功:', localPath)
                resolve(true)
            }

            newBgImage.onerror = () => {
                clearTimeout(localImageTimeout)
                console.error('[SceneBackgroundManager] 本地图片加载失败:', localPath)
                if (requestId === this.loadRequestId) {
                    this.imageLoaded = false
                    this.isLoadingScene = false
                    resolve(false)
                }
            }

            if (requestId !== this.loadRequestId) {
                clearTimeout(localImageTimeout)
                this.isLoadingScene = false
                resolve(false)
                return
            }
            newBgImage.src = localPath
        })
    }

    render(renderer) {
        const w = renderer.width
        const h = renderer.height

        if (this.imageLoaded && this.bgImage && this.bgImage.width > 0) {
            try {
                const ctx = renderer.ctx
                ctx.drawImage(this.bgImage, 0, 0, w, h)
            } catch (e) {
                console.warn('[SceneBackgroundManager] 绘制背景图失败:', e)
                renderer.clear('#16213e')
            }
        } else {
            renderer.clear('#16213e')
        }
    }

    renderLoadingIndicator(renderer) {
        const ctx = renderer.ctx
        const w = renderer.width
        const h = renderer.height

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
        ctx.fillRect(0, 0, w, h)

        ctx.fillStyle = '#ffffff'
        ctx.font = '18px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('加载中...', w / 2, h / 2)
    }

    isLoaded() {
        return this.imageLoaded && this.bgImage && this.bgImage.width > 0
    }

    isLoading() {
        return this.isLoadingScene
    }

    checkLoadingTimeout() {
        if (this.isLoadingScene && this.loadingStartTime) {
            const loadingTime = Date.now() - this.loadingStartTime
            if (loadingTime > 10000) {
                console.warn('[SceneBackgroundManager] 加载超时(10秒)，强制完成')
                this.isLoadingScene = false
                return true
            }
        }
        return false
    }

    reset() {
        this.bgImage = null
        this.imageLoaded = false
        this.useCloudImage = false
        this.isLoadingScene = false
        this.loadRequestId = 0
        this.loadingStartTime = null
    }
}
