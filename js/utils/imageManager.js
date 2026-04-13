const CLOUD_ENV_ID = 'cloud1-1glyk3ivc2fc740d'

class ImageManager {
  constructor() {
    this.imageCache = new Map()
    this.db = null
    this.init()
  }

  init() {
    if (wx.cloud) {
      this.db = wx.cloud.database({
        env: CLOUD_ENV_ID
      })
    }
  }

  async getImage(name) {
    try {
      if (this.imageCache.has(name)) {
        return this.imageCache.get(name)
      }

      const res = await this.db.collection('images')
        .where({
          name: name
        })
        .limit(1)
        .get()

      if (res.data && res.data.length > 0) {
        const imageData = res.data[0]
        this.imageCache.set(name, imageData)
        return imageData
      }

      return null
    } catch (e) {
      console.error('获取图片失败:', e)
      return null
    }
  }

  async getImageByType(type) {
    try {
      const res = await this.db.collection('images')
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
      const res = await this.db.collection('images')
        .get()

      return res.data || []
    } catch (e) {
      console.error('获取所有图片失败:', e)
      return []
    }
  }

  async loadImageFromCloud(name) {
    try {
      const imageData = await this.getImage(name)
      if (!imageData) {
        console.warn('云存储中未找到图片:', name)
        return null
      }

      const fileInfo = await wx.cloud.getTempFileURL({
        fileList: [imageData.fileID]
      })

      if (!fileInfo.fileList[0].tempFileURL) {
        console.error('获取图片临时链接失败:', name)
        return null
      }

      return new Promise((resolve, reject) => {
        const img = wx.createImage()
        img.onload = () => {
          console.log(`图片加载成功: ${name}`)
          resolve({
            image: img,
            data: imageData
          })
        }
        img.onerror = (err) => {
          console.error(`图片加载失败: ${name}`, err)
          reject(err)
        }
        img.src = fileInfo.fileList[0].tempFileURL
      })
    } catch (e) {
      console.error('从云端加载图片失败:', e)
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
