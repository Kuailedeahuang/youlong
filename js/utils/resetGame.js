import { CLOUD_ENV_ID } from '../config.js'

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
    wx.clearStorageSync()
    console.log('本地存储已清除')
    
    if (wx.cloud) {
      const db = wx.cloud.database({
        env: CLOUD_ENV_ID
      })
      
      try {
        const res = await db.collection('gameProgress').where({
          _openid: '{openid}'
        }).get()
        
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

export async function restartGame(gameInstance = null) {
  console.log('重新开始游戏...')
  
  try {
    // 从云数据库获取用户的解锁房屋列表（永久保留）
    let unlockedHouses = []
    
    try {
      if (wx.cloud) {
        const db = wx.cloud.database({})
        const res = await db.collection('user_unlocked_houses')
          .limit(1)
          .get()
        
        if (res.data && res.data.length > 0) {
          unlockedHouses = res.data[0].unlockedHouses || []
          console.log('从云数据库获取解锁房屋:', unlockedHouses)
        }
      }
    } catch (e) {
      console.warn('从云数据库获取解锁房屋失败:', e)
      // 尝试从本地存储获取
      const currentData = wx.getStorageSync('bigcitylife_save')
      unlockedHouses = currentData && currentData.unlockedHouses ? currentData.unlockedHouses : []
    }
    
    // 清除本地存储
    wx.clearStorageSync()
    
    // 创建新的默认状态
    const defaultState = {
      money: 5000,
      health: 100,
      energy: 5,
      maxEnergy: 5,
      mood: 100,
      reputation: 100,
      day: 1,
      totalDays: 180,
      consecutiveGymDays: 0,
      bankLoan: 0,
      bankDeposit: 0,
      privateLoan: 0,
      overdueDays: 0,
      warehouseCapacity: 20,
      warehouse: {},
      purchasedHouse: null,
      unlockedHouses: unlockedHouses, // 保留解锁的房屋
      gameEnded: false,
      jobLevel: 1,
      jobTitle: '外卖/快递员',
      salaryDeduction: false,
      salaryDeductionDays: 0,
      unemployed: false,
      unemployedDays: 0,
      adWatchedCount: 0,
      housingType: 'suburban',
      bankruptcyCount: 0,
      currentScene: 'home',
      todayEvents: [],
      newspaperShown: false,
      yesterdayExpense: 0,
      marketEnteredToday: false
    }
    
    // 保存新状态
    wx.setStorageSync('bigcitylife_save', defaultState)
    
    // 如果提供了游戏实例，直接重置状态而不重启小程序
    if (gameInstance && gameInstance.gameState) {
      gameInstance.gameState.data = defaultState
      
      // 先保存解锁房屋到云端，确保不会丢失
      await gameInstance.gameState.saveUserUnlockedHouses()
      
      // 再保存游戏状态
      await gameInstance.gameState.save()
      
      // 重新从云端加载解锁房屋，确保数据一致
      await gameInstance.gameState.loadUserUnlockedHouses()
      
      wx.showModal({
        title: '游戏已重置',
        content: '游戏进度已重置，解锁的房屋已保留',
        showCancel: false,
        success: () => {
          // 切换到首页场景，不进入启动页
          gameInstance.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
        }
      })
      return true
    }
    
    // 如果没有游戏实例，使用原来的重启方式
    wx.showModal({
      title: '游戏已重置',
      content: '游戏进度已清除，点击确定重新开始游戏',
      showCancel: false,
      success: () => {
        wx.restartMiniProgram({
          success: () => {
            console.log('游戏重新开始')
          },
          fail: (err) => {
            console.error('重启失败:', err)
            wx.showModal({
              title: '请手动重启',
              content: '请关闭小程序后重新打开以开始新游戏',
              showCancel: false
            })
          }
        })
      }
    })
    
    return true
  } catch (e) {
    console.error('重置失败:', e)
    wx.showToast({
      title: '重置失败',
      icon: 'error'
    })
    return false
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