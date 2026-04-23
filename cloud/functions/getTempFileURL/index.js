// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const { fileList } = event
  
  if (!fileList || !Array.isArray(fileList) || fileList.length === 0) {
    return {
      success: false,
      error: 'fileList 参数不能为空'
    }
  }
  
  try {
    // 获取临时文件链接
    const result = await cloud.getTempFileURL({
      fileList: fileList
    })
    
    return {
      success: true,
      fileList: result.fileList
    }
  } catch (err) {
    console.error('获取临时文件链接失败:', err)
    return {
      success: false,
      error: err.message || '获取临时文件链接失败'
    }
  }
}
