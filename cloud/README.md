# 云开发数据库集合配置

## user_unlocked_houses 集合

### 集合说明
存储用户永久解锁的房屋列表，与用户账号绑定，跨游戏保留。

### 数据结构
```json
{
  "_id": "系统自动生成",
  "_openid": "系统自动添加（用户唯一标识）",
  "unlockedHouses": ["house_1", "house_2"],
  "createTime": "创建时间",
  "updateTime": "更新时间"
}
```

### 字段说明
| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | String | 记录唯一标识（系统自动生成） |
| _openid | String | 用户openid（系统自动添加） |
| unlockedHouses | Array | 解锁的房屋ID数组 |
| createTime | Date | 记录创建时间 |
| updateTime | Date | 记录更新时间 |

### 权限配置
- **读权限**：所有用户可读（true）
- **写权限**：仅创建者可写（doc._openid == auth.openid）

### 导入步骤
1. 登录微信开发者工具
2. 点击"云开发"按钮进入云开发控制台
3. 选择"数据库"标签
4. 点击"添加集合"，输入集合名称：`user_unlocked_houses`
5. 创建完成后，点击集合名称进入详情
6. 选择"权限设置"，将权限配置为：
   - 读：true
   - 写：doc._openid == auth.openid
7. 如需导入模板数据，点击"导入"，选择 `user_unlocked_houses.json` 文件

### 注意事项
- 该集合的数据与用户账号绑定，不同用户的解锁房屋互不影响
- 用户首次购房时会自动创建记录
- 重新安装小程序或更换设备后，只要使用同一微信账号登录，解锁记录会自动同步
