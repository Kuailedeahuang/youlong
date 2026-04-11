import ItemData from '../data/items.js'
import imageManager from './imageManager.js'

const CLOUD_ENV_ID = 'cloud1-1glyk3ivc2fc740d'

export async function initializeCloudDatabase() {
  if (!wx.cloud) {
    console.warn('云开发未初始化')
    return false
  }

  try {
    const db = wx.cloud.database({
      env: CLOUD_ENV_ID
    })

    console.log('开始初始化云数据库...')
    
    // 初始化图片
    console.log('开始初始化图片...')
    await imageManager.initDefaultImages()
    console.log('图片初始化完成')

    const configCount = await db.collection('config').count()
    if (configCount.total === 0) {
      console.log('初始化系统配置...')
      const configData = [
        {
          key: 'dailyExpenseBase',
          value: 80,
          description: '每日基础开销',
          updateTime: db.serverDate()
        },
        {
          key: 'dailyExpenseFluctuation',
          value: 5,
          description: '每日开销波动范围',
          updateTime: db.serverDate()
        },
        {
          key: 'bankDepositRate',
          value: 0.02,
          description: '银行存款利率（每6天）',
          updateTime: db.serverDate()
        },
        {
          key: 'bankLoanRate',
          value: 0.06,
          description: '银行贷款利率（每6天）',
          updateTime: db.serverDate()
        },
        {
          key: 'privateLoanRate',
          value: 0.025,
          description: '私人借贷日利率',
          updateTime: db.serverDate()
        }
      ]

      for (const config of configData) {
        await db.collection('config').add({ data: config })
      }
      console.log('系统配置初始化完成')
    } else {
      console.log('系统配置已存在，跳过初始化')
    }

    const itemsCount = await db.collection('items').count()
    if (itemsCount.total === 0) {
      console.log('初始化商品数据...')
      for (const item of ItemData) {
        await db.collection('items').add({
          data: {
            ...item,
            createTime: db.serverDate()
          }
        })
      }
      console.log('商品数据初始化完成')
    } else {
      console.log('商品数据已存在，跳过初始化')
    }

    console.log('云数据库初始化完成')
    return true
  } catch (e) {
    console.error('云数据库初始化失败:', e)
    return false
  }
}

export async function checkCloudDatabase() {
  if (!wx.cloud) {
    console.warn('云开发未初始化')
    return false
  }

  try {
    const db = wx.cloud.database({
      env: CLOUD_ENV_ID
    })

    const collections = ['users', 'gameProgress', 'items', 'events', 'transactions', 'config']
    const results = {}

    for (const collection of collections) {
      try {
        const count = await db.collection(collection).count()
        results[collection] = {
          exists: true,
          count: count.total
        }
      } catch (e) {
        results[collection] = {
          exists: false,
          count: 0
        }
      }
    }

    console.log('数据库检查结果:', results)
    return results
  } catch (e) {
    console.error('数据库检查失败:', e)
    return false
  }
}

export default {
  initializeCloudDatabase,
  checkCloudDatabase
}
