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

      let fileID = imageData.fileID
      if (!fileID && imageData.cloudPath) {
        fileID = imageData.cloudPath
        console.log(`[ImageManager] fileID不存在，使用cloudPath: ${fileID}`)
      }

      if (!fileID) {
        console.error(`[ImageManager] 图片记录缺少fileID和cloudPath: ${name}`)
        return null
      }

      let tempURL = null

      try {
        console.log(`[ImageManager] 通过客户端API获取临时URL: ${fileID}`)
        const clientRes = await wx.cloud.getTempFileURL({
          fileList: [fileID]
        })
        if (clientRes.fileList && clientRes.fileList[0] && clientRes.fileList[0].tempFileURL) {
          tempURL = clientRes.fileList[0].tempFileURL
          console.log(`[ImageManager] 客户端获取临时URL成功: ${tempURL}`)
        }
      } catch (clientErr) {
        console.warn(`[ImageManager] 客户端获取临时URL失败，尝试云函数:`, clientErr)
      }

      if (!tempURL) {
        try {
          console.log(`[ImageManager] 通过云函数获取临时URL: ${fileID}`)
          const res = await wx.cloud.callFunction({
            name: 'getTempFileURL',
            data: {
              fileList: [fileID]
            }
          })

          if (res.result && res.result.fileList && res.result.fileList[0] && res.result.fileList[0].tempFileURL) {
            tempURL = res.result.fileList[0].tempFileURL
            console.log(`[ImageManager] 云函数获取临时URL成功: ${tempURL}`)
          }
        } catch (funcErr) {
          console.warn(`[ImageManager] 云函数获取临时URL失败:`, funcErr)
        }
      }

      if (!tempURL) {
        console.error(`[ImageManager] 所有方式获取临时链接均失败`)
        return null
      }

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
