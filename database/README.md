# 云开发数据库集合说明

## 集合列表

### 1. users（用户信息）
存储用户的基本信息，包括昵称、头像等。

**字段说明：**
- `_id`: 用户唯一标识
- `_openid`: 用户OpenID（微信云开发自动添加）
- `nickName`: 用户昵称
- `avatarUrl`: 用户头像URL
- `createTime`: 创建时间
- `updateTime`: 更新时间

### 2. gameProgress（游戏进度）
存储用户的游戏进度数据。

**字段说明：**
- `_id`: 记录唯一标识
- `_openid`: 用户OpenID
- `money`: 金币（默认：5000）
- `health`: 健康值（默认：100）
- `energy`: 精力值（默认：5）
- `maxEnergy`: 最大精力（默认：5）
- `mood`: 心情值（默认：100）
- `reputation`: 名誉值（默认：100）
- `day`: 当前天数（默认：1）
- `totalDays`: 总天数（默认：180）
- `bankLoan`: 银行贷款（默认：0）
- `bankDeposit`: 银行存款（默认：0）
- `privateLoan`: 私人借贷（默认：0）
- `overdueDays`: 逾期天数（默认：0）
- `warehouseCapacity`: 仓库容量（默认：20）
- `warehouse`: 仓库物品（对象）
- `jobLevel`: 工作等级（默认：1）
- `jobTitle`: 工作名称（默认：外卖/快递员）
- `yesterdayExpense`: 昨日开销（默认：0）
- `createTime`: 创建时间
- `updateTime`: 更新时间

### 3. items（商品数据）
存储游戏中的商品信息。

**字段说明：**
- `_id`: 商品唯一标识
- `name`: 商品名称
- `category`: 商品分类
- `basePrice`: 基础价格
- `naturalFluctuation`: 价格波动范围
- `description`: 商品描述
- `createTime`: 创建时间

### 4. events（事件记录）
存储游戏中发生的各种事件。

**字段说明：**
- `_id`: 事件唯一标识
- `_openid`: 用户OpenID
- `day`: 游戏天数
- `eventType`: 事件类型
- `eventText`: 事件内容
- `effects`: 事件影响（对象）
- `createTime`: 创建时间

### 5. transactions（交易记录）
存储用户的交易记录。

**字段说明：**
- `_id`: 交易唯一标识
- `_openid`: 用户OpenID
- `day`: 游戏天数
- `transactionType`: 交易类型（buy/sell/deposit/loan/repay/donation）
- `itemId`: 商品ID（商品交易时）
- `itemName`: 商品名称
- `quantity`: 数量
- `price`: 单价
- `totalAmount`: 总金额
- `createTime`: 创建时间

### 6. config（系统配置）
存储游戏的系统配置。

**字段说明：**
- `_id`: 配置唯一标识
- `key`: 配置键
- `value`: 配置值
- `description`: 配置描述
- `updateTime`: 更新时间

### 7. images（图片资源）⭐ 新增
存储游戏中的图片资源信息。

**字段说明：**
- `_id`: 图片唯一标识
- `name`: 图片名称（如：baozhi, chuzuwu, shichang）
- `type`: 图片类型（background/icon/item）
- `category`: 图片分类
- `fileID`: 云存储文件ID
- `url`: 图片访问URL
- `width`: 图片宽度
- `height`: 图片高度
- `size`: 文件大小（字节）
- `description`: 图片描述
- `version`: 版本号
- `isActive`: 是否启用（默认：true）
- `createTime`: 创建时间
- `updateTime`: 更新时间

**索引：**
- `type_index`: type 字段索引
- `category_index`: category 字段索引
- `name_index`: name 字段唯一索引

## 使用方法

### 1. 导入集合到云开发数据库

1. 打开微信开发者工具
2. 进入云开发控制台
3. 点击"数据库"
4. 点击"集合名称"旁的"+"号
5. 输入集合名称（如：users）
6. 点击"确定"
7. 重复步骤4-6，创建所有集合

### 2. 设置集合权限

在云开发控制台中，为每个集合设置权限：
- **users**: 仅创建者可读写
- **gameProgress**: 仅创建者可读写
- **items**: 所有用户可读，仅管理员可写
- **events**: 仅创建者可读写
- **transactions**: 仅创建者可读写
- **config**: 所有用户可读，仅管理员可写
- **images**: 所有用户可读，仅管理员可写

### 3. 初始化商品数据

在云开发控制台中，向 items 集合导入商品数据：

```javascript
// 示例商品数据
const items = [
  {
    name: "苹果",
    category: "农产品",
    basePrice: 10,
    naturalFluctuation: { min: -0.2, max: 0.2 },
    description: "新鲜苹果"
  },
  // ... 更多商品
];
```

### 4. 初始化图片数据

游戏启动时会自动初始化图片数据：

```javascript
// 自动上传默认图片
import imageManager from './js/utils/imageManager.js'
await imageManager.initDefaultImages()
```

默认图片包括：
- `baozhi.png` - 每日报纸背景图
- `chuzuwu.png` - 出租屋背景图
- `shichang.png` - 市场背景图

## 图片存储说明

### 存储位置

图片存储在微信云开发的**云存储**中，路径格式：
```
images/{type}/{name}_{timestamp}.png
```

### 访问方式

1. **通过 fileID 访问**：`cloud://env-id.xxx/xxx.png`
2. **通过 URL 访问**：临时URL（需定期刷新）

### 加载机制

1. 游戏启动时自动初始化默认图片
2. 场景加载时优先从云端获取图片
3. 云端获取失败时自动降级到本地图片
4. 加载成功的图片会缓存到内存中

### 管理工具

使用 `js/utils/imageManager.js` 管理图片：

```javascript
import imageManager from './js/utils/imageManager.js'

// 上传图片
await imageManager.uploadImage(filePath, name, type, category, description)

// 获取图片
const imageData = await imageManager.getImage(name)

// 获取某类型的所有图片
const images = await imageManager.getImageByType('background')

// 删除图片
await imageManager.deleteImage(name)

// 更新图片信息
await imageManager.updateImage(name, updateData)

// 从云端加载图片
const cloudImage = await imageManager.loadImageFromCloud(name)

// 清除缓存
imageManager.clearCache()
```

## 重置游戏进度

### 方法1：在游戏中重置
在游戏代码中调用：
```javascript
this.game.gameState.reset();
```

### 方法2：清除本地存储
在微信开发者工具的控制台中执行：
```javascript
wx.clearStorageSync();
```

### 方法3：重置云数据库
在云开发控制台中，删除 gameProgress 集合中的用户记录。

## 数据迁移

### 从本地存储迁移到云数据库

1. 获取本地存储数据：
```javascript
const localData = wx.getStorageSync('bigcitylife_save');
```

2. 上传到云数据库：
```javascript
wx.cloud.database().collection('gameProgress').add({
  data: localData
});
```

### 图片迁移

1. 上传本地图片到云存储：
```javascript
await imageManager.uploadImage(
  'tupian/image.png',
  'imagename',
  'background',
  'category',
  'description'
)
```

2. 图片信息会自动保存到 images 集合

## 注意事项

1. 确保云开发环境已开通
2. 确保数据库权限设置正确
3. 定期备份重要数据
4. 注意数据安全，避免敏感信息泄露
5. 图片文件大小建议控制在 500KB 以内
6. 定期清理不再使用的图片资源

## 相关文档

- [图片存储说明.md](../图片存储说明.md) - 详细的图片存储说明
- [云开发集成完成说明.md](../云开发集成完成说明.md) - 云开发集成说明
- [云开发测试指南.md](../云开发测试指南.md) - 云开发测试指南
