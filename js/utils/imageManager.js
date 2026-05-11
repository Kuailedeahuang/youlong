import { CLOUD_ENV_ID } from '../config.js'

class ImageManager {
  constructor() {
    this.imageCache = new Map()
    this._db = null
    this._loadIdCounter = 0
  }

  get db() {
    if (!this._db) {
      if (!wx.cloud) {
        console.error('云开发未初始化，请先调用 wx.cloud.init()')
        return null
      }
      this._db = wx.cloud.database({
        env: CLOUD_ENV_ID
      })
    }
    return this._db
  }

  async getImage(name) {
    try {
      if (this.imageCache.has(name)) {
        console.log(`[ImageManager] 使用缓存: ${name}`)
        return this.imageCache.get(name)
      }

      const database = this.db
      if (!database) {
        console.error('[ImageManager] 数据库初始化失败')
        return null
      }

      console.log(`[ImageManager] 查询数据库, name: "${name}"`)

      const res = await database.collection('images')
        .where({
          name: name
        })
        .limit(1)
        .get()

      console.log(`[ImageManager] 查询结果:`, JSON.stringify(res, null, 2))

      if (res.data && res.data.length > 0) {
        const imageData = res.data[0]
        console.log(`[ImageManager] 找到图片记录:`)
        console.log(`  - name: ${imageData.name}`)
        console.log(`  - fileID: ${imageData.fileID}`)
        console.log(`  - type: ${imageData.type}`)
        this.imageCache.set(name, imageData)
        return imageData
      }

      console.warn(`[ImageManager] 未找到匹配的图片: ${name}`)
      return null
    } catch (e) {
      console.error('[ImageManager] 获取图片失败:', e)
      return null
    }
  }

  async getImageByType(type) {
    try {
      const database = this.db
      if (!database) {
        console.error('数据库初始化失败')
        return []
      }

      const res = await database.collection('images')
        .where({
          type: type
        })
        .get()

      return res.data || []
    } catch (e) {
      console.error('获取图片列表失败:', e)
      return []
    }
  }

  async getAllImages() {
    try {
      const database = this.db
      if (!database) {
        console.error('数据库初始化失败')
        return []
      }

      const res = await database.collection('images')
        .get()

      return res.data || []
    } catch (e) {
      console.error('获取所有图片失败:', e)
      return []
    }
  }

  async loadImageFromCloud(name, timeout = 10000) {
    const loadId = ++this._loadIdCounter
    const startTime = Date.now()
    const log = (...args) => console.log(`[ImageManager #${loadId}]`, ...args)
    const warn = (...args) => console.warn(`[ImageManager #${loadId}]`, ...args)
    const error = (...args) => console.error(`[ImageManager #${loadId}]`, ...args)

    try {
      log(`开始加载云端图片: ${name}`)

      const imageData = await this.getImage(name)
      if (!imageData) {
        warn(`云存储中未找到图片: ${name}`)
        return null
      }

      if (!wx.cloud) {
        error('云开发未初始化')
        return null
      }

      let fileID = imageData.fileID
      if (!fileID && imageData.cloudPath) {
        fileID = imageData.cloudPath
        log(`fileID不存在，使用cloudPath: ${fileID}`)
      }

      log(`最终使用的fileID: ${fileID}`)

      if (!fileID) {
        error(`图片记录缺少fileID和cloudPath: ${name}`)
        return null
      }

      let tempURL = null

      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve(null), timeout)
      })

      const fetchTempURL = async () => {
        try {
          log(`通过客户端API获取临时URL: ${fileID}`)
          const clientRes = await wx.cloud.getTempFileURL({
            fileList: [fileID]
          })
          log(`客户端API响应:`, JSON.stringify(clientRes))
          if (clientRes.fileList && clientRes.fileList[0] && clientRes.fileList[0].tempFileURL) {
            return clientRes.fileList[0].tempFileURL
          }
          warn(`客户端API返回无效tempFileURL:`, JSON.stringify(clientRes.fileList && clientRes.fileList[0]))
        } catch (clientErr) {
          warn(`客户端获取临时URL异常，尝试云函数:`, clientErr)
        }

        try {
          log(`通过云函数获取临时URL: ${fileID}`)
          const res = await wx.cloud.callFunction({
            name: 'getTempFileURL',
            data: {
              fileList: [fileID]
            }
          })
          log(`云函数响应:`, JSON.stringify(res))
          if (res.result && res.result.fileList && res.result.fileList[0] && res.result.fileList[0].tempFileURL) {
            return res.result.fileList[0].tempFileURL
          }
          warn(`云函数返回无效tempFileURL:`, JSON.stringify(res.result))
        } catch (funcErr) {
          warn(`云函数获取临时URL异常:`, funcErr)
        }

        return null
      }

      tempURL = await Promise.race([fetchTempURL(), timeoutPromise])

      if (!tempURL) {
        error(`获取临时链接失败或超时 (已耗时${Date.now() - startTime}ms)`)
        return null
      }

      log(`获取临时URL成功 (已耗时${Date.now() - startTime}ms): ${tempURL}`)

      return await new Promise((resolve) => {
        const img = wx.createImage()
        const imgTimeout = setTimeout(() => {
          warn(`图片加载超时: ${name} (已耗时${Date.now() - startTime}ms)`)
          resolve(null)
        }, timeout)

        img.onload = () => {
          clearTimeout(imgTimeout)
          log(`图片加载成功: ${name} (总耗时${Date.now() - startTime}ms)`)
          resolve({
            image: img,
            data: imageData
          })
        }
        img.onerror = (err) => {
          clearTimeout(imgTimeout)
          error(`图片加载失败: ${name} (已耗时${Date.now() - startTime}ms)`, err)
          resolve(null)
        }
        img.src = tempURL
      })
    } catch (e) {
      error('从云端加载图片失败:', e)
      return null
    }
  }

  clearCache() {
    this.imageCache.clear()
    console.log('图片缓存已清除')
  }
}

const imageManager = new ImageManager()

export default imageManager

export async function getCloudImage(name) {
  return await imageManager.loadImageFromCloud(name)
}

export async function getAllCloudImages() {
  return await imageManager.getAllImages()
}
