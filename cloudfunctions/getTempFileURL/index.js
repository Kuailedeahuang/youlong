const tcb = require('@cloudbase/node-sdk')

const tcbApp = tcb.init({
  env: 'cloud1-1glyk3ivc2fc740d'
})

exports.main = async (event, context) => {
  const { fileList } = event

  if (!fileList || !Array.isArray(fileList)) {
    return {
      success: false,
      error: 'fileList 参数无效，需要传入数组'
    }
  }

  try {
    console.log('开始获取临时链接, fileList:', fileList)

    const result = await tcbApp.getTempFileURL({
      fileList: fileList
    })

    console.log('获取临时链接成功, result:', JSON.stringify(result))

    return {
      success: true,
      fileList: result.fileList
    }
  } catch (err) {
    console.error('获取临时链接失败, err:', err)
    return {
      success: false,
      error: err.message || String(err)
    }
  }
}