# 图片数据导入指南

## 说明

由于图片文件需要上传到微信云存储，无法直接通过 JSON 文件导入完整的图片数据（包括 fileID 和 URL）。

本指南提供两种导入方式：

## 方式一：自动导入（推荐）

运行游戏时，系统会自动检测并上传图片。

### 步骤：
1. 确保 `tupian/` 目录下有图片文件：
   - `baozhi.png` - 报纸背景图
   - `chuzuwu.png` - 出租屋背景图
   - `shichang.png` - 市场背景图

2. 在微信开发者工具中运行游戏

3. 游戏启动时会自动执行：
   ```javascript
   import imageManager from './js/utils/imageManager.js'
   await imageManager.initDefaultImages()
   ```

4. 查看控制台输出，确认图片上传成功

## 方式二：手动导入 JSON

### 步骤 1：导入基础数据

1. 打开微信开发者工具
2. 进入云开发控制台 → 数据库
3. 选择 `images` 集合
4. 点击"添加记录"或"导入"
5. 选择 `images_import.json` 文件导入

### 步骤 2：上传图片文件

在微信开发者工具控制台执行：

```javascript
import('./js/utils/imageManager.js').then(async module => {
  const imageManager = module.default
  
  // 上传报纸背景图
  await imageManager.uploadImage(
    'tupian/baozhi.png',
    'baozhi',
    'background',
    'newspaper',
    '每日报纸背景图'
  )
  
  // 上传出租屋背景图
  await imageManager.uploadImage(
    'tupian/chuzuwu.png',
    'chuzuwu',
    'background',
    'home',
    '出租屋背景图'
  )
  
  // 上传市场背景图
  await imageManager.uploadImage(
    'tupian/shichang.png',
    'shichang',
    'background',
    'market',
    '市场背景图'
  )
  
  console.log('所有图片上传完成！')
})
```

### 步骤 3：验证导入

```javascript
import('./js/utils/imageManager.js').then(async module => {
  const imageManager = module.default
  
  // 查看所有图片
  const images = await imageManager.getAllImages()
  console.table(images)
  
  // 测试加载图片
  const baozhi = await imageManager.loadImageFromCloud('baozhi')
  console.log('报纸图片加载结果:', baozhi ? '成功' : '失败')
})
```

## 文件说明

### images_data.json
包含完整的图片数据结构，包括 fileID 和 URL 字段。这些值需要在图片实际上传到云存储后才能获得。

**注意**：直接导入此文件会导致 fileID 和 URL 无效，因为：
1. fileID 是云存储自动生成的
2. URL 是临时链接，会过期

### images_import.json
仅包含图片基础信息（name, type, category, description等），适合先导入到数据库，然后通过代码上传实际图片文件。

## 数据结构

### 完整数据结构
```json
{
  "name": "baozhi",
  "type": "background",
  "category": "newspaper",
  "fileID": "cloud://...",      // 云存储文件ID（上传后自动生成）
  "url": "https://...",          // 临时访问URL（上传后自动生成）
  "width": 750,
  "height": 1334,
  "size": 102400,
  "description": "每日报纸背景图",
  "version": "1.0.0",
  "isActive": true
}
```

### 简化数据结构
```json
{
  "name": "baozhi",
  "type": "background",
  "category": "newspaper",
  "description": "每日报纸背景图",
  "version": "1.0.0",
  "isActive": true
}
```

## 注意事项

1. **fileID 和 URL 是动态生成的**，不能直接写死在 JSON 中
2. **URL 是临时链接**，需要定期刷新
3. **图片实际上传后**，数据库记录会自动更新 fileID 和 URL
4. **建议使用方法一（自动导入）**，更简单可靠

## 常见问题

### Q: 为什么不能直接导入完整的图片数据？
A: 因为 fileID 和 URL 是云存储服务动态生成的，每次上传都会不同，且 URL 有有效期限制。

### Q: 导入后图片加载失败怎么办？
A: 检查以下几点：
1. 图片文件是否已上传到云存储
2. 数据库中的 fileID 和 URL 是否正确
3. 云存储权限是否设置正确（所有用户可读）

### Q: 如何更新已有图片？
A: 使用以下代码：
```javascript
// 先删除旧图片
await imageManager.deleteImage('baozhi')

// 再上传新图片
await imageManager.uploadImage(
  'tupian/baozhi_new.png',
  'baozhi',
  'background',
  'newspaper',
  '新的报纸背景图'
)
```

### Q: 如何批量导入多张图片？
A: 修改 `imageManager.js` 中的 `initDefaultImages()` 方法，添加更多图片配置：
```javascript
const defaultImages = [
  // 现有图片...
  {
    name: 'newimage',
    type: 'background',
    category: 'scene',
    description: '新场景背景图',
    localPath: 'tupian/newimage.png'
  }
]
```
