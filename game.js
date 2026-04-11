import './js/libs/weapp-adapter'

if (!wx.cloud) {
  console.warn('请使用 2.2.3 或以上的基础库以使用云能力')
} else {
  wx.cloud.init({
    env: 'cloud1-1glyk3ivc2fc740d',
    traceUser: true,
  })
}

import './js/main'
