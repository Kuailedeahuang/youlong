import { checkCloudDatabase, initializeCloudDatabase } from './initCloud.js'
import { resetGameProgress, exportGameProgress } from './resetGame.js'

export async function testCloudFunctions() {
  console.log('=== 开始测试云开发功能 ===')
  
  console.log('\n1. 检查云开发环境...')
  if (!wx.cloud) {
    console.error('❌ 云开发未初始化')
    return false
  }
  console.log('✅ 云开发环境正常')
  
  console.log('\n2. 检查数据库集合...')
  const dbStatus = await checkCloudDatabase()
  if (!dbStatus) {
    console.error('❌ 数据库检查失败')
    return false
  }
  
  const collections = Object.keys(dbStatus)
  let allExists = true
  for (const collection of collections) {
    if (dbStatus[collection].exists) {
      console.log(`✅ ${collection}: ${dbStatus[collection].count} 条记录`)
    } else {
      console.log(`❌ ${collection}: 不存在`)
      allExists = false
    }
  }
  
  if (!allExists) {
    console.log('\n3. 初始化数据库...')
    const initResult = await initializeCloudDatabase()
    if (initResult) {
      console.log('✅ 数据库初始化成功')
    } else {
      console.error('❌ 数据库初始化失败')
      return false
    }
  }
  
  console.log('\n4. 测试游戏进度...')
  const progress = exportGameProgress()
  if (progress) {
    console.log('✅ 游戏进度读取成功')
    console.log('当前进度:', JSON.stringify(progress, null, 2))
  } else {
    console.log('ℹ️ 没有游戏进度数据')
  }
  
  console.log('\n=== 云开发功能测试完成 ===')
  return true
}

export function showCloudStatus() {
  console.log('=== 云开发状态 ===')
  console.log('环境ID: cloud1-1glyk3ivc2fc740d')
  console.log('云开发状态:', wx.cloud ? '已初始化' : '未初始化')
  
  if (wx.cloud) {
    console.log('\n可用的云开发API:')
    console.log('- wx.cloud.database()')
    console.log('- wx.cloud.callFunction()')
    console.log('- wx.cloud.uploadFile()')
    console.log('- wx.cloud.downloadFile()')
  }
  
  console.log('\n本地存储状态:')
  try {
    const keys = wx.getStorageInfoSync().keys
    console.log('存储的键:', keys)
    
    if (keys.includes('bigcitylife_save')) {
      const data = wx.getStorageSync('bigcitylife_save')
      console.log('游戏进度:', JSON.stringify(data, null, 2))
    }
  } catch (e) {
    console.error('读取本地存储失败:', e)
  }
}

export default {
  testCloudFunctions,
  showCloudStatus
}
