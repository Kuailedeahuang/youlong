const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  
  try {
    const openid = wxContext.OPENID
    const appid = wxContext.APPID
    const unionid = wxContext.UNIONID
    
    console.log('用户登录，openid:', openid)
    
    const userCollection = db.collection('users')
    
    const queryResult = await userCollection.where({
      openid: openid
    }).get()
    
    let userData = null
    
    if (queryResult.data.length > 0) {
      const userId = queryResult.data[0]._id
      
      await userCollection.doc(userId).update({
        data: {
          lastLoginTime: db.serverDate(),
          loginCount: db.command.inc(1),
          updateTime: db.serverDate()
        }
      })
      
      userData = {
        _id: userId,
        ...queryResult.data[0]
      }
      
      console.log('更新用户登录记录成功')
    } else {
      const addResult = await userCollection.add({
        data: {
          openid: openid,
          unionid: unionid || null,
          lastLoginTime: db.serverDate(),
          createTime: db.serverDate(),
          loginCount: 1,
          updateTime: db.serverDate()
        }
      })
      
      userData = {
        _id: addResult._id,
        openid: openid,
        unionid: unionid || null,
        loginCount: 1
      }
      
      console.log('创建用户登录记录成功')
    }
    
    return {
      success: true,
      openid: openid,
      appid: appid,
      unionid: unionid,
      userData: userData
    }
  } catch (err) {
    console.error('登录处理失败:', err)
    
    return {
      success: false,
      error: err.message,
      openid: wxContext.OPENID
    }
  }
}
