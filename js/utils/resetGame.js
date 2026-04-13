const CLOUD_ENV_ID = 'cloud1-1glyk3ivc2fc740d'

export function resetGameProgress() {
  try {
    wx.clearStorageSync()
    console.log('游戏进度已重置')
    return true
  } catch (e) {
    console.error('重置失败:', e)
    return false
  }
}

export async function resetGameProgressWithCloud() {
  try {
    // 1. 清除本地存储
    wx.clearStorageSync()
    console.log('本地存储已清除')
    
    // 2. 清除云数据库中的游戏进度
    if (wx.cloud) {
      const db = wx.cloud.database({
        env: CLOUD_ENV_ID
      })
      
      try {
        // 获取当前用户的游戏进度记录
        const res = await db.collection('gameProgress').where({
          _openid: '{openid}'
        }).get()
        
        // 删除所有记录
        if (res.data && res.data.length > 0) {
          for (const record of res.data) {
            await db.collection('gameProgress').doc(record._id).remove()
          }
          console.log('云数据库游戏进度已清除')
        }
      } catch (e) {
        console.warn('清除云数据库失败:', e)
      }
    }
    
    console.log('游戏进度已完全重置（本地+云端）')
    return true
  } catch (e) {
    console.error('重置失败:', e)
    return false
  }
}

export function exportGameProgress() {
  try {
    const data = wx.getStorageSync('bigcitylife_save')
    if (data) {
      console.log('游戏进度数据:', JSON.stringify(data, null, 2))
      return data
    } else {
      console.log('没有找到游戏进度数据')
      return null
    }
  } catch (e) {
    console.error('导出失败:', e)
    return null
  }
}

export function importGameProgress(data) {
  try {
    wx.setStorageSync('bigcitylife_save', data)
    console.log('游戏进度已导入')
    return true
  } catch (e) {
    console.error('导入失败:', e)
    return false
  }
}

export function migrateToCloud() {
  const localData = wx.getStorageSync('bigcitylife_save')
  if (!localData) {
    console.log('没有本地数据需要迁移')
    return
  }
  
  const db = wx.cloud.database()
  db.collection('gameProgress').add({
    data: {
      ...localData,
      updateTime: db.serverDate()
    }
  }).then(res => {
    console.log('数据迁移成功:', res)
  }).catch(err => {
    console.error('数据迁移失败:', err)
  })
}

export async function restartGame() {
  console.log('重新开始游戏...')
  
  // 1. 重置游戏进度
  const resetResult = await resetGameProgressWithCloud()
  
  if (resetResult) {
    console.log('游戏已重置，准备重新开始')
    
    // 2. 重新加载页面
    wx.showModal({
      title: '游戏已重置',
      content: '游戏进度已清除，点击确定重新开始游戏',
      showCancel: false,
      success: () => {
        // 重新启动游戏
        wx.restartMiniProgram({
          success: () => {
            console.log('游戏重新开始')
          },
          fail: (err) => {
            console.error('重启失败:', err)
            // 降级方案：提示用户手动重启
            wx.showModal({
              title: '请手动重启',
              content: '请关闭小程序后重新打开以开始新游戏',
              showCancel: false
            })
          }
        })
      }
    })
  } else {
    wx.showToast({
      title: '重置失败',
      icon: 'error'
    })
  }
}

export default {
  resetGameProgress,
  resetGameProgressWithCloud,
  exportGameProgress,
  importGameProgress,
  migrateToCloud,
  restartGame
}
