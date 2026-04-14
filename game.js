import './js/libs/weapp-adapter'
import { CLOUD_ENV_ID } from './js/config.js'

if (!wx.cloud) {
  console.warn('请使用 2.2.3 或以上的基础库以使用云能力')
} else {
  wx.cloud.init({
    env: CLOUD_ENV_ID,
    traceUser: true,
  })
}

import './js/main'
