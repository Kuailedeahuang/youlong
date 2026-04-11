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

  async uploadImage(filePath, name, type = 'background', category = '', description = '') {
    try {
      console.log(`开始上传图片: ${name}`)
      
      const cloudPath = `images/${type}/${name}_${Date.now()}.png`
      
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath: cloudPath,
        filePath: filePath
      })
      
      console.log('上传成功:', uploadRes.fileID)
      
      const fileInfo = await wx.cloud.getTempFileURL({
        fileList: [uploadRes.fileID]
      })
      
      const imageData = {
        name: name,
        type: type,
        category: category,
        fileID: uploadRes.fileID,
        url: fileInfo.fileList[0].tempFileURL,
        description: description,
        version: '1.0.0',
        isActive: true,
        createTime: this.db.serverDate(),
        updateTime: this.db.serverDate()
      }
      
      const addRes = await this.db.collection('images').add({
        data: imageData
      })
      
      console.log('图片信息保存到数据库成功:', addRes._id)
      
      return {
        success: true,
        fileID: uploadRes.fileID,
        url: fileInfo.fileList[0].tempFileURL,
        _id: addRes._id
      }
    } catch (e) {
      console.error('上传图片失败:', e)
      return {
        success: false,
        error: e.message
      }
    }
  }

  async getImage(name) {
    try {
      if (this.imageCache.has(name)) {
        return this.imageCache.get(name)
      }
      
      const res = await this.db.collection('images')
        .where({
          name: name,
          isActive: true
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
          type: type,
          isActive: true
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
        .where({
          isActive: true
        })
        .get()
      
      return res.data || []
    } catch (e) {
      console.error('获取所有图片失败:', e)
      return []
    }
  }

  async deleteImage(name) {
    try {
      const imageData = await this.getImage(name)
      if (!imageData) {
        console.warn('图片不存在:', name)
        return false
      }
      
      await wx.cloud.deleteFile({
        fileList: [imageData.fileID]
      })
      
      await this.db.collection('images').doc(imageData._id).update({
        data: {
          isActive: false,
          updateTime: this.db.serverDate()
        }
      })
      
      this.imageCache.delete(name)
      
      console.log('图片删除成功:', name)
      return true
    } catch (e) {
      console.error('删除图片失败:', e)
      return false
    }
  }

  async updateImage(name, updateData) {
    try {
      const imageData = await this.getImage(name)
      if (!imageData) {
        console.warn('图片不存在:', name)
        return false
      }
      
      await this.db.collection('images').doc(imageData._id).update({
        data: {
          ...updateData,
          updateTime: this.db.serverDate()
        }
      })
      
      this.imageCache.delete(name)
      
      console.log('图片更新成功:', name)
      return true
    } catch (e) {
      console.error('更新图片失败:', e)
      return false
    }
  }

  async initDefaultImages() {
    try {
      console.log('开始初始化默认图片...')
      
      const defaultImages = [
        {
          name: 'baozhi',
          type: 'background',
          category: 'newspaper',
          description: '每日报纸背景图',
          localPath: 'tupian/baozhi.png'
        },
        {
          name: 'chuzuwu',
          type: 'background',
          category: 'home',
          description: '出租屋背景图',
          localPath: 'tupian/chuzuwu.png'
        },
        {
          name: 'shichang',
          type: 'background',
          category: 'market',
          description: '市场背景图',
          localPath: 'tupian/shichang.png'
        }
      ]
      
      for (const imageInfo of defaultImages) {
        const existingImage = await this.getImage(imageInfo.name)
        if (existingImage) {
          console.log(`图片已存在，跳过: ${imageInfo.name}`)
          continue
        }
        
        console.log(`上传图片: ${imageInfo.name}`)
        
        const fs = wx.getFileSystemManager()
        try {
          fs.accessSync(imageInfo.localPath)
          
          const uploadRes = await this.uploadImage(
            imageInfo.localPath,
            imageInfo.name,
            imageInfo.type,
            imageInfo.category,
            imageInfo.description
          )
          
          if (uploadRes.success) {
            console.log(`图片上传成功: ${imageInfo.name}`)
          } else {
            console.error(`图片上传失败: ${imageInfo.name}`, uploadRes.error)
          }
        } catch (e) {
          console.warn(`本地图片不存在: ${imageInfo.localPath}`)
        }
      }
      
      console.log('默认图片初始化完成')
      return true
    } catch (e) {
      console.error('初始化默认图片失败:', e)
      return false
    }
  }

  async loadImageFromCloud(name) {
    try {
      const imageData = await this.getImage(name)
      if (!imageData) {
        console.warn('云存储中未找到图片:', name)
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
        img.src = imageData.url
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

export async function uploadGameImages() {
  return await imageManager.initDefaultImages()
}

export async function getCloudImage(name) {
  return await imageManager.loadImageFromCloud(name)
}

export async function getAllCloudImages() {
  return await imageManager.getAllImages()
}
