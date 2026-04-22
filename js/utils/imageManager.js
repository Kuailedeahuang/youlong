import { CLOUD_ENV_ID } from '../config.js'

class ImageManager {
  constructor() {
    this.imageCache = new Map()
    this._db = null
  }

  get db() {
    if (!this._db) {
      if (!wx.cloud) {
        console.error('云开发未初始化，请先调用 wx.cloud.init()')
        return null
      }
      wx.cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true
      })
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

  async loadImageFromCloud(name) {
    try {
      console.log(`[ImageManager] 开始加载云端图片: ${name}`)

      const imageData = await this.getImage(name)
      if (!imageData) {
        console.warn(`[ImageManager] 云存储中未找到图片: ${name}`)
        return null
      }

      if (!wx.cloud) {
        console.error('[ImageManager] 云开发未初始化')
        return null
      }

      console.log(`[ImageManager] 通过云函数获取临时URL, fileID: ${imageData.fileID}`)

      const res = await wx.cloud.callFunction({
        name: 'getTempFileURL',
        data: {
          fileList: [imageData.fileID]
        }
      })

      console.log(`[ImageManager] 云函数返回:`, JSON.stringify(res, null, 2))

      if (!res.result) {
        console.error(`[ImageManager] 云函数调用失败, result 为空`)
        return null
      }

      if (!res.result.success) {
        console.error(`[ImageManager] 云函数获取临时链接失败: ${res.result.error}`)
        return null
      }

      const tempURL = res.result.fileList[0].tempFileURL
      if (!tempURL) {
        console.error(`[ImageManager] tempURL 为空, status: ${res.result.fileList[0].status}, errMsg: ${res.result.fileList[0].errMsg}`)
        return null
      }
      console.log(`[ImageManager] 临时URL: ${tempURL}`)

      return new Promise((resolve, reject) => {
        const img = wx.createImage()
        img.onload = () => {
          console.log(`[ImageManager] 图片加载成功: ${name}`)
          resolve({
            image: img,
            data: imageData
          })
        }
        img.onerror = (err) => {
          console.error(`[ImageManager] 图片加载失败: ${name}`, err)
          reject(err)
        }
        img.src = tempURL
      })
    } catch (e) {
      console.error('[ImageManager] 从云端加载图片失败:', e)
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
