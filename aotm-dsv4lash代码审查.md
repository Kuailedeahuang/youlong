# 代码审查报告

> 项目名称：大鱼成长游戏（youlong）
> 审查时间：2025年（首次）/ 2026年5月（更新）
> 审查维度：代码复用、组件耦合、语法合规、变量风格、新增问题
> 审查方式：静态分析，未修改代码

---

## 一、代码复用

### 1.1 场景间大量绘图逻辑重复

**严重程度：⚠️ 中** | **状态：🔴 仍存在**

`loginScene.js` 与 `splashScene.js` 之间存在大量完全重复的绘图方法，代码几乎逐字复制：

| 重复方法 | loginScene.js | splashScene.js |
|---|---|---|
| `drawGhibliBackground()` | ✓ | ✓ |
| `drawBackgroundDetails()` | ✓ | ✓ |
| `drawClouds()` | ✓ | ✓ |
| `drawLogo()` | ✓ | ✓ |
| `drawPlaceholderLogo()` | ✓ | ✓ |
| `drawGhibliPanel()` | ✓ | ✓ |
| `drawRoundRectPath()` | ✓ | ✓ |
| `drawTextWithOutline()` | ✓ | ✓ |

此外，两文件还共享完全相同的 `this.colors` 配色对象（17 个颜色值完全一致）。

**解决方案**：

创建 `js/utils/GhibliRenderer.js` 公共模块：

```javascript
// js/utils/GhibliRenderer.js
export const GHIBLI_COLORS = {
    bgStart: '#B8D4E8', bgEnd: '#E8F0F8', bgLight: '#F5FAFF',
    bgMedium: '#C8E0F0', bgDark: '#A8C8E0', panel: '#FFF8F0',
    primary: '#FFD54F', primaryDark: '#FFB300', secondary: '#5A9FD4',
    accent: '#7ED957', warm: '#E8913A', textMain: '#4A3728',
    textSub: '#5A6A7A', textLight: '#8A9AAA', outline: '#3D3D3D',
    success: '#81C784', warning: '#FFD54F', error: '#E57373'
}

export function drawGhibliBackground(ctx, w, h, colors, cloudTime) { ... }
export function drawBackgroundDetails(ctx, w, h, colors) { ... }
export function drawClouds(ctx, w, h, cloudTime) { ... }
export function drawGhibliPanel(ctx, x, y, w, h, r, colors) { ... }
export function drawTextWithOutline(ctx, text, x, y, fontSize, fillColor, outlineColor) { ... }
export function drawRoundRectPath(ctx, x, y, w, h, r) { ... }
```

然后在 `loginScene.js` 和 `splashScene.js` 中 import 并调用，各自仅保留差异逻辑（如 loginScene 的登录按钮、splashScene 的加载条）。

---

### 1.2 圆角矩形绘制方法多处独立定义

**严重程度：⚠️ 中** | **状态：🔴 仍存在，且范围扩大**

`drawRoundRect` / `drawRoundRectPath` / `roundRectPath` 等相同功能的函数分散在以下文件中：

| 文件 | 方法名 | 实现方式 | 是否 beginPath |
|---|---|---|---|
| `loginScene.js` | `drawRoundRectPath()` | `quadraticCurveTo` | ✓ |
| `splashScene.js` | `drawRoundRectPath()` | `quadraticCurveTo` | ✓ |
| `svgIcons.js` | `roundRect()` | `quadraticCurveTo` | ✓ |
| `settingsScene.js` | `roundRectPath()` | `quadraticCurveTo` | ✗ |
| `InteractiveAreaManager.js` | `drawRoundRect()` | `quadraticCurveTo` | ✗ |
| `computerScene.js` | `roundRectPath()` | `arcTo` | ✓ |
| `houseScene.js` | 内联 `arcTo` | `arcTo` | ✓ |

**解决方案**：

在 `js/utils/CanvasUtils.js` 中统一一个方法，同时提供 `beginPath` 参数控制：

```javascript
// js/utils/CanvasUtils.js
export function roundRect(ctx, x, y, w, h, r, { beginPath = true, closePath = true } = {}) {
    const radius = Math.min(r, w / 2, h / 2)
    if (beginPath) ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + w - radius, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius)
    ctx.lineTo(x + w, y + h - radius)
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
    ctx.lineTo(x + radius, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    if (closePath) ctx.closePath()
}
```

选择 `quadraticCurveTo` 而非 `arcTo`，因为前者兼容性更好（原项目注释也说明了这一点）。各文件统一 import 此方法，删除本地实现。

---

### 1.3 模态弹窗创建模式重复

**严重程度：⚠️ 中** | **状态：🔴 仍存在，且范围扩大**

此类"标题 + 内容 + 知道了"弹窗在以下文件中累计出现 **25 次以上**：

| 文件 | 出现次数 | 典型场景 |
|---|---|---|
| `backgamemanger.js` | 8 | 精力不足、健康不足、健康已满、随机事件等 |
| `WorkSystem.js` | 3 | 失业中、精力不足、健康不足 |
| `GymSystem.js` | 2 | 精力不足、金币不足 |
| `HospitalSystem.js` | 2 | 精力不足、健康已满 |
| `houseSystem.js` | 2 | 精力不足、无法购买 |
| `computerScene.js` | 5 | 精力不足、金币不足、无需还款等 |
| `homeScene.js` | 3 | 精力不足、无需还款、金币不足 |
| `LoanSystem.js` | 1 | 无需还款 |
| `settingsScene.js` | 1 | 游戏统计 |

**解决方案**：

在 `uiManager.js` 中添加快捷方法：

```javascript
// uiManager.js 中添加
showInfoModal(title, content, onConfirm = () => {}) {
    this.addModal({
        type: 'confirm',
        title,
        content,
        confirmText: '知道了',
        singleButton: true,
        onConfirm
    })
}

showConfirmModal(title, content, onConfirm, onCancel = () => {}, { confirmText = '确定', cancelText = '取消' } = {}) {
    this.addModal({
        type: 'confirm',
        title,
        content,
        confirmText,
        cancelText,
        onConfirm,
        onCancel
    })
}
```

调用方从 7 行简化为 1 行：
```javascript
// 之前
this.game.uiManager.addModal({ type: 'confirm', title: '精力不足', content: '无法工作', confirmText: '知道了', singleButton: true, onConfirm: () => {} })
// 之后
this.game.uiManager.showInfoModal('精力不足', '无法工作')
```

---

### 1.4 属性颜色映射重复定义

**严重程度：🔴 低 → ⚠️ 中** | **状态：🔴 仍存在，且不一致性加剧**

颜色映射现分散在 **4 处**，且存在颜色值不一致的问题：

| 属性 | AnimationHelper | IconManager | homeScene | computerScene/addDelayedAnimation |
|---|---|---|---|---|
| money | `#D4A574` | `#D4A574`(map) | `#D4A574` | `#f39c12` / `#D4A574` |
| health | `#7CB87C` | `#7CB87C` | `#7CB87C` | `#27ae60` |
| energy | `#7BA3C9` | `#7BA3C9` | `#7BA3C9` | `#3498db` / `#7BA3C9` |
| mood | `#D49BA3` | `#D49BA3` | `#D49BA3` | `#e91e63` / `#D49BA3` |
| reputation | `#B8A3C9` | `#B8A3C9` | `#B8A3C9` | `#9b59b6` |

**关键问题**：`addDelayedAnimation` 调用中使用的颜色与 `AnimationHelper.getDefaultColor()` / `IconManager.iconRegistry` 不一致。例如 `energy` 在 AnimationHelper 中是 `#7BA3C9`（柔和蓝），但在 WorkSystem/GymSystem/HospitalSystem 中传的是 `#3498db`（亮蓝）。

**解决方案**：

创建 `js/data/StatConfig.js` 统一配置：

```javascript
// js/data/StatConfig.js
export const STAT_CONFIG = {
    money:      { label: '金币', color: '#D4A574', icon: 'coin' },
    health:     { label: '健康', color: '#7CB87C', icon: 'health' },
    energy:     { label: '精力', color: '#7BA3C9', icon: 'energy' },
    mood:       { label: '心情', color: '#D49BA3', icon: 'mood' },
    reputation: { label: '名誉', color: '#B8A3C9', icon: 'reputation' },
    privateLoan: { label: '私人贷款', color: '#C17B6B', icon: 'loanWarning' },
    bankLoan:    { label: '银行贷款', color: '#7BA3C9', icon: 'bank' },
    bankDeposit: { label: '银行存款', color: '#7CB87C', icon: 'bank' }
}

export function getStatLabel(statType) { return STAT_CONFIG[statType]?.label ?? statType }
export function getStatColor(statType) { return STAT_CONFIG[statType]?.color ?? '#5D4037' }
```

然后：
- `AnimationHelper.getDefaultColor()` 改为调用 `getStatColor()`
- `IconManager.iconRegistry` 中的 color 改为引用 `STAT_CONFIG`
- `homeScene.getDefaultColor()` 删除，改用 `AnimationHelper`
- 所有 `addDelayedAnimation` 调用不再手动传 label 和 color，改为自动从 `STAT_CONFIG` 获取

同时建议修改 `addDelayedAnimation` 签名，让 label 和 color 变为可选：
```javascript
addDelayedAnimation(type, value, statType, label = null, color = null) {
    const config = STAT_CONFIG[statType] || {}
    this.delayedAnimations.push({
        type, value, statType,
        label: label || config.label || statType,
        color: color || config.color || '#5D4037'
    })
}
```

---

### 1.5 触摸事件处理接口分散实现

**严重程度：🔴 低** | **状态：🔴 仍存在**

各场景均独立实现 `handleTouchStart(x, y)`、`handleTouchMove(x, y)`、`handleTouchEnd(x, y)` 方法，接口签名一致但实现差异较大。

**解决方案**：

创建 `js/core/TouchHandler.js` 基类：

```javascript
// js/core/TouchHandler.js
export default class TouchHandler {
    constructor() {
        this.pressedArea = null
        this.clickableAreas = []
    }

    handleTouchStart(x, y) { return false }
    handleTouchMove(x, y) {}
    handleTouchEnd(x, y) { return false }

    isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.w &&
               y >= rect.y && y <= rect.y + rect.h
    }

    findPressedArea(x, y) {
        for (const area of this.clickableAreas) {
            if (this.isPointInRect(x, y, area)) return area
        }
        return null
    }
}
```

各场景继承此基类，仅覆写差异逻辑。对于滑动检测（mapScene、houseScene），可扩展 `TouchHandler` 添加 `isSwipe()` / `isTap()` 判断方法。

---

## 二、组件耦合

### 2.1 场景与游戏核心对象紧耦合

**严重程度：🔴 严重** | **状态：🔴 仍存在**

所有场景类和系统类均通过 `this.game.xxx` 深度访问内部对象。当前依赖关系：

```
HomeScene → game.gameState, game.renderer, game.uiManager, game.sceneManager, game.animationManager
MapScene → game.gameState, game.renderer, game.uiManager, game.sceneManager
HouseScene → game.gameState, game.renderer, game.uiManager, game.sceneManager
ComputerScene → game.gameState, game.renderer, game.uiManager, game.sceneManager
sceneWithBackground → game.gameState, game.renderer, game.uiManager, game.sceneManager, game.animationManager
backgamemanger → game.gameState, game.uiManager, game.sceneManager
WorkSystem → game.gameState, game.uiManager
GymSystem → game.gameState, game.uiManager
BankSystem → game.gameState, game.uiManager
HospitalSystem → game.gameState, game.uiManager
LoanSystem → game.gameState, game.uiManager
```

**解决方案（渐进式）**：

**第一步：依赖注入** — 将 `game` 的子对象通过构造函数注入，而非直接访问 `game`：

```javascript
// 之前
class WorkSystem {
    constructor(game) { this.game = game }
    doWork() {
        const state = this.game.gameState.data
        this.game.uiManager.addModal(...)
        this.game.gameState.save()
    }
}

// 之后
class WorkSystem {
    constructor({ gameState, uiManager }) {
        this.state = gameState
        this.ui = uiManager
    }
    doWork() {
        const data = this.state.data
        this.ui.addModal(...)
        this.state.save()
    }
}
```

**第二步：引入事件总线** — System 类不再直接调用 `uiManager`，而是发出事件：

```javascript
// js/core/EventBus.js
export default class EventBus {
    constructor() { this.listeners = {} }
    on(event, callback) { ... }
    emit(event, data) { ... }
}

// WorkSystem 中
this.events.emit('modal:info', { title: '精力不足', content: '无法工作' })
this.events.emit('state:change', { stat: 'energy', delta: -1 })
this.events.emit('state:save')

// 场景层监听
this.events.on('modal:info', (data) => this.uiManager.showInfoModal(data.title, data.content))
```

**第三步（远期）**：引入 MVC 分层，将状态管理、UI 渲染、业务逻辑彻底分离。

---

### 2.2 场景切换依赖字符串标识

**严重程度：⚠️ 中** | **状态：🔴 仍存在**

场景切换使用字符串标识符，`sceneManager.js` 内部通过字符串查找场景类。

**解决方案**：

定义场景名称常量：

```javascript
// js/constants/SceneNames.js
export const SCENES = Object.freeze({
    LOGIN: 'login',
    SPLASH: 'splash',
    HOME: 'home',
    MARKET: 'market',
    HOUSE: 'house',
    SCENE_WITH_BG: 'sceneWithBackground',
    SETTINGS: 'settings',
    MAP: 'map',
    COMPUTER: 'computer'
})

export const LOCATIONS = Object.freeze({
    HOME: 'home',
    WORK: 'work',
    BANK: 'bank',
    HOSPITAL: 'hospital',
    GYM: 'gym',
    HOUSE: 'house',
    PRIVATE_LOAN: 'privateLoan'
})
```

所有 `switchTo()` 和 `goToLocation()` 调用改用常量：
```javascript
this.game.sceneManager.switchTo(SCENES.HOME)
this.game.sceneManager.goToLocation(LOCATIONS.BANK)
```

---

### 2.3 sceneWithBackground 存在职责过重

**严重程度：⚠️ 中** | **状态：🔴 仍存在**

`sceneWithBackground.js` 通过 `sceneName` 参数决定自身行为，内部使用 `if/else` 分支判断当前应渲染哪个场景的逻辑。

**解决方案**：

采用策略模式，将每个子场景的逻辑抽取为独立策略类：

```javascript
// js/scenes/strategies/HomeStrategy.js
export default class HomeStrategy {
    constructor(scene) { this.scene = scene }
    getDialogConfig() { return { visible: false, lines: [], speaker: '' } }
    getActions() { return [...] }
    getAreas() { return this.scene.areaManager }
}

// js/scenes/strategies/WorkStrategy.js
export default class WorkStrategy {
    constructor(scene) { this.scene = scene }
    getDialogConfig() { ... }
    getActions() { return [{ label: '上班', callback: 'startWork' }, ...] }
}

// sceneWithBackground.js
import strategies from './strategies/index.js'

class SceneWithBackground {
    loadBackground(sceneName) {
        this.strategy = strategies[sceneName]
        const dialogConfig = this.strategy.getDialogConfig()
        ...
    }
}
```

---

### 2.4 backgamemanger.js 为 God Class

**严重程度：🔴 严重** | **状态：🔴 仍存在**

`backgamemanger.js`（768 行）承担了过多职责，且与已有的 System 类存在大量重复逻辑。

**重复逻辑对照表**：

| 功能 | backgamemanger.js | 对应 System 类 | 差异 |
|---|---|---|---|
| 工作 | `showWorkModal()` + `doWork()` | `WorkSystem.js` | System 版有升职逻辑，manager 版无 |
| 健身房 | `doGym()` | `GymSystem.js` | System 版从 GAME_CONFIG 读取参数，manager 版硬编码 |
| 银行 | `showBankModal()` + `doDeposit/doLoan/doRepay` | `BankSystem.js` | 几乎完全重复 |
| 私人借贷 | `showLoanModal()` + `doPrivateLoan/doPrivateRepay` | `LoanSystem.js` | 几乎完全重复 |
| 医院 | `doHospital()` | `HospitalSystem.js` | 几乎完全重复 |
| 娱乐 | `doEntertainment()` | 无 | 仅 manager 有 |
| 公益 | `doCharity()` + `doDonation/doVolunteerWork` | 无 | 仅 manager 有 |
| 市场 | `enterMarket()` | 无 | 仅 manager 有 |
| 结束今日 | `endDay()` + `triggerRandomEventsDirect()` | 无 | 仅 manager 有 |

**解决方案**：

**第一步**：将 `backgamemanger.js` 中与 System 类重复的方法删除，改为委托调用：

```javascript
// backgamemanger.js 精简后
class BackGameManager {
    constructor(game) {
        this.game = game
        this.workSystem = new WorkSystem(game)
        this.gymSystem = new GymSystem(game)
        this.bankSystem = new BankSystem(game)
        this.hospitalSystem = new HospitalSystem(game)
        this.loanSystem = new LoanSystem(game)
    }

    showWorkModal() { this.workSystem.showWorkModal() }
    doGym() { this.gymSystem.showGymModal() }
    showBankModal() { this.bankSystem.showBankModal() }
    doHospital() { this.hospitalSystem.showHospitalModal() }
    showLoanModal() { this.loanSystem.showLoanModal() }

    // 仅保留本类独有的逻辑
    enterMarket() { ... }
    endDay() { ... }
    doEntertainment() { ... }
    doCharity() { ... }
}
```

**第二步**：将 `doEntertainment()` 和 `doCharity()` 抽取为 `EntertainmentSystem.js` 和 `CharitySystem.js`。

**第三步**：将 `endDay()` 和 `triggerRandomEventsDirect()` 移入 `DayCycleSystem.js`。

最终 `backgamemanger.js` 仅作为门面（Facade），委托各 System 执行，自身行数可降至 100 行以内。

---

### 2.5 System 类与 scene/manager 职责边界模糊

**严重程度：⚠️ 中** | **状态：🔴 仍存在**

系统类高度依赖 `game.uiManager` 来显示弹窗，业务逻辑与 UI 展示交错。

**解决方案**：

将 System 类拆分为两层：

```javascript
// 业务逻辑层（纯逻辑，可测试）
class WorkLogic {
    static canWork(state) { return !state.unemployed && state.energy >= 1 }
    static canOvertime(state) { return state.health >= 30 }
    static executeWork(state, isOvertime, salary) {
        state.energy -= 1
        state.money += salary
        if (isOvertime) state.health -= GAME_CONFIG.work.overtimeHealthCost
        // ... 计算名誉变化
        return { salary, reputationChange, reputationReason }
    }
}

// UI 层（调用逻辑层 + 显示弹窗）
class WorkSystem {
    showWorkModal(onComplete) {
        const state = this.game.gameState.data
        if (!WorkLogic.canWork(state)) {
            this.game.uiManager.showInfoModal('精力不足', '无法工作')
            return
        }
        // ... 显示弹窗
    }
    doWork(isOvertime, salary, onComplete) {
        const result = WorkLogic.executeWork(state, isOvertime, salary)
        this.game.gameState.save()
        // ... 显示结果弹窗
    }
}
```

---

## 三、语法合规

### 3.1 文件名拼写错误

**严重程度：🔴 低** | **状态：🔴 仍存在**

`js/managers/backgamemanger.js` 文件名中 `manger` 应为 `manager`。

**解决方案**：

1. 将文件重命名为 `backGameManager.js`
2. 更新所有 import 引用（`homeScene.js` 第 8 行）
3. 在项目根目录添加 `.gitignore` 规则或迁移脚本，确保旧文件名不再出现

```bash
# 重命名
git mv js/managers/backgamemanger.js js/managers/backGameManager.js
```

同时更新 `homeScene.js`：
```javascript
// 之前
import BackGameManager from '../managers/backgamemanger.js'
// 之后
import BackGameManager from '../managers/backGameManager.js'
```

---

### 3.2 分号使用不统一

**严重程度：🔴 低** | **状态：🔴 仍存在**

**解决方案**：

添加 ESLint 配置统一规范：

```javascript
// .eslintrc.js
module.exports = {
    env: { es6: true, node: true },
    parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
    rules: {
        'semi': ['error', 'always'],           // 统一使用分号
        'no-mixed-spaces-and-tabs': 'error',
        'eqeqeq': ['error', 'always'],         // 统一使用 ===
        'no-var': 'error',                     // 禁用 var
        'prefer-const': 'warn'                 // 优先 const
    }
}
```

运行 `npx eslint --fix js/` 自动修复分号和 `var` 问题。

---

### 3.3 相等运算符混用

**严重程度：🔴 低** | **状态：🟢 大部分已修复**

当前代码中仅发现 1 处使用 `!==`（`sceneManager.js:47`），属于合理使用。原报告中的 `== null` 问题已基本消除。

**解决方案**：通过上述 ESLint `eqeqeq` 规则自动约束，无需手动修改。

---

### 3.4 未使用的 import

**严重程度：🔴 低** | **状态：🟡 需验证**

`resetGame.js` 中导入了 `GAME_CONFIG`，经核实该模块在 `restartGame()` 函数中确实使用了 `GAME_CONFIG`（用于构建 `defaultState`），因此 **此问题不存在**，原报告有误。

**解决方案**：无需修改。建议添加 ESLint `no-unused-vars` 规则自动检测。

---

### 3.5 条件判断缺少必要检查

**严重程度：⚠️ 中** | **状态：🔴 仍存在**

多处代码直接访问 `this.game.gameState.data.xxx`，未对中间对象进行空值判断。

**解决方案**：

**方案 A（推荐）：防御性取值** — 在 `gameState` 中提供安全访问方法：

```javascript
// gameState.js
getData() {
    if (!this.data) {
        console.error('[GameState] data 未初始化')
        return null
    }
    return this.data
}

// 调用方
const state = this.game.gameState.getData()
if (!state) return
```

**方案 B：可选链** — 在支持的环境中使用可选链操作符：

```javascript
const state = this.game?.gameState?.data
if (!state) return
```

---

### 3.6 异步函数中使用 await 但不一致

**严重程度：🔴 低** | **状态：🔴 仍存在**

`resetGame.js` 中的 `restartGame()` 函数混用 `async/await` 和 `wx.showModal` 回调。`houseScene.js` 的 `restartGameWithUnlockedHouses()` 也有同样问题。

**解决方案**：

将 `wx.showModal` 封装为 Promise：

```javascript
// js/utils/wxPromise.js
export function showModal(options) {
    return new Promise(resolve => {
        wx.showModal({ ...options, success: resolve })
    })
}

// 使用
async restartGame(gameInstance) {
    ...
    const res = await showModal({
        title: '游戏已重置',
        content: '游戏进度已重置，解锁的房屋已保留',
        showCancel: false
    })
    gameInstance.sceneManager.switchToWithParams('sceneWithBackground', { sceneName: 'home' })
}
```

---

## 四、变量风格

### 4.1 命名风格整体良好，但存在局部不一致

**严重程度：🔴 低** | **状态：🔴 仍存在**

`gameConfig.js` 中存在 `snake_case` 属性名（如 `loan_limit_level1`），与项目整体 `camelCase` 风格不一致。

**解决方案**：将 `gameConfig.js` 中的 `snake_case` 属性名改为 `camelCase`，如 `loanLimitLevel1`。同时全局搜索替换所有引用点。

---

### 4.2 魔术字符串散落

**严重程度：⚠️ 中** | **状态：🔴 仍存在，且范围扩大**

`addDelayedAnimation` 调用散布在 **12 个文件、100+ 处**，每次都要传递属性名、中文标签、颜色三个参数。

**解决方案**：

结合 1.4 的 `STAT_CONFIG` 方案，修改 `addDelayedAnimation` 签名，让 label 和 color 自动从配置获取：

```javascript
// 之前（5 个参数，3 个是魔术字符串）
this.game.gameState.addDelayedAnimation('decrease', 1, 'energy', '精力', '#3498db')

// 之后（2 个参数，无魔术字符串）
this.game.gameState.addDelayedAnimation('decrease', 1, 'energy')
```

同时定义动画类型常量：
```javascript
export const ANIM_TYPE = Object.freeze({
    INCREASE: 'increase',
    DECREASE: 'decrease',
    LOAN: 'loan'
})
```

---

### 4.3 注释风格不统一

**严重程度：🔴 低** | **状态：🔴 仍存在**

**解决方案**：不强制统一（投入产出比低），但建议对 **public 方法** 添加 JSDoc 注释，特别是 System 类的入口方法。可通过 ESLint `require-jsdoc` 规则渐进约束。

---

### 4.4 颜色值硬编码

**严重程度：🔴 低 → ⚠️ 中** | **状态：🔴 仍存在，且不一致性加剧**

同一种属性在不同文件中使用不同颜色（详见 1.4 的对照表）。

**解决方案**：统一到 `STAT_CONFIG`（见 1.4）和 `GHIBLI_COLORS`（见 1.1），所有颜色引用改为从配置读取。

---

### 4.5 变量声明方式不统一

**严重程度：🔴 低 → ⚠️ 中** | **状态：🔴 仍存在，且问题严重**

`sceneTransitionManager.js` 单文件使用了 **205 处 `var`**，与项目其他文件的 `const/let` 风格严重不一致。

**解决方案**：

1. 对 `sceneTransitionManager.js` 执行批量替换：`var` → `const`（不可变）或 `let`（可变）
2. 全局添加 ESLint `no-var` 规则防止回退
3. 该文件顶部的 `var PI = Math.PI` 等数学快捷变量改为 `const`

---

### 4.6 部分函数参数过多

**严重程度：⚠️ 中** | **状态：🔴 仍存在**

**解决方案**：

改为对象参数解构：

```javascript
// 之前
drawTextWithOutline(ctx, text, x, y, fontSize, fillColor, outlineColor)

// 之后
drawTextWithOutline(ctx, { text, x, y, fontSize, fillColor, outlineColor = '#3D3D3D', outlineWidth = 3 })

// 调用
drawTextWithOutline(ctx, { text: '游龙市场为买房', x: w/2, y: titleY, fontSize: 26, fillColor: colors.textMain, outlineColor: colors.outline })
```

同样适用于 `addDelayedAnimation`（见 4.2 方案）。

---

## 五、新增问题

### 5.1 homeScene.js 与 computerScene.js 重复实现 System 业务逻辑

**严重程度：🔴 严重** | **状态：新增**

`homeScene.js` 和 `computerScene.js` 中存在大量与 System 类 / backgamemanger.js 重复的业务逻辑：

| 功能 | homeScene.js | computerScene.js | backgamemanger.js | System 类 |
|---|---|---|---|---|
| 私人借贷弹窗 | `showLoanModal()` (L541-567) | `showLoanModal()` (L268-294) | `showLoanModal()` (L401-427) | `LoanSystem.js` |
| 私人借贷执行 | `doPrivateLoan()` (L569-593) | `doPrivateLoan()` (L296-318) | `doPrivateLoan()` (L432-456) | `LoanSystem.js` |
| 私人还款执行 | `doPrivateRepay()` (L595-646) | `doPrivateRepay()` (L320-369) | `doPrivateRepay()` (L461-512) | `LoanSystem.js` |
| 银行存款 | — | `doDeposit()` (L392-416) | `doDeposit()` (L305-331) | `BankSystem.js` |
| 银行贷款 | — | `doLoan()` (L418-441) | `doLoan()` (L336-361) | `BankSystem.js` |
| 银行还款 | — | `doRepay()` (L443-470) | `doRepay()` (L366-395) | `BankSystem.js` |
| 娱乐 | `doEntertainment()` (委托) | `doBrowseVideos/doWatchLive/doPlayGames` | `doEntertainment()` | — |
| 进入市场 | `enterMarket()` (L481-502) | — | `enterMarket()` (L26-50) | — |
| 默认颜色 | `getDefaultColor()` (L249-262) | — | — | `AnimationHelper.js` |

**解决方案**：

1. `homeScene.js` 和 `computerScene.js` 中的借贷/银行逻辑应完全委托给 `LoanSystem` 和 `BankSystem`，删除本地实现
2. `homeScene.js` 的 `enterMarket()` 应委托给 `backgamemanger.enterMarket()`
3. `homeScene.js` 的 `getDefaultColor()` 和 `playDelayedAnimations()` 应委托给 `AnimationHelper`
4. `computerScene.js` 中的娱乐功能应抽取为 `EntertainmentSystem.js`

---

### 5.2 homeScene.js 与 sceneWithBackground.js 重复注册交互区域

**严重程度：⚠️ 中** | **状态：新增**

两个文件分别独立注册了完全相同的 `homeBed`、`homeComputer`、`homeSetting` 交互区域：

| 区域 ID | homeScene.js (L34-109) | sceneWithBackground.js (L46-120) |
|---|---|---|
| homeBed | xPercent: 0.589, yPercent: 0.445, ... | xPercent: 0.589, yPercent: 0.445, ... |
| homeComputer | xPercent: 0.358, yPercent: 0.432, ... | xPercent: 0.358, yPercent: 0.432, ... |
| homeSetting | xPercent: 0.159, yPercent: 0.395, ... | xPercent: 0.159, yPercent: 0.395, ... |

**解决方案**：

将交互区域配置抽取到 `js/data/AreaConfigs.js`：

```javascript
// js/data/AreaConfigs.js
export const HOME_AREAS = {
    homeBed: {
        label: '床',
        hitArea: { xPercent: 0.589, yPercent: 0.445, widthPercent: 0.320, heightPercent: 0.241 },
        labelArea: { xPercent: 0.65, yPercent: 0.42, height: 24, paddingX: 10 },
        style: { hitAreaBgColor: 'transparent', ... }
    },
    homeComputer: { ... },
    homeSetting: { ... }
}
```

两文件统一从此配置注册区域。

---

### 5.3 resetGame.js 与 houseScene.js 重复定义 defaultState

**严重程度：⚠️ 中** | **状态：新增**

`resetGame.js`（L128-164）和 `houseScene.js`（L782-818）中存在几乎完全相同的 `defaultState` 对象定义，共约 35 个字段。两处独立维护，极易在修改一处时遗漏另一处。

**解决方案**：

将 `defaultState` 抽取到 `js/data/gameConfig.js` 或新建 `js/data/DefaultState.js`：

```javascript
// js/data/DefaultState.js
import { GAME_CONFIG } from './gameConfig.js'

export function createDefaultState(unlockedHouses = []) {
    return {
        money: GAME_CONFIG.initial.money,
        health: GAME_CONFIG.initial.health,
        energy: GAME_CONFIG.initial.energy,
        maxEnergy: GAME_CONFIG.initial.maxEnergy,
        mood: GAME_CONFIG.initial.mood,
        reputation: GAME_CONFIG.initial.reputation,
        day: 1,
        totalDays: GAME_CONFIG.initial.totalDays,
        // ... 其余字段
        unlockedHouses
    }
}
```

`resetGame.js` 和 `houseScene.js` 统一调用 `createDefaultState()`。

---

### 5.4 addDelayedAnimation 颜色不一致

**严重程度：⚠️ 中** | **状态：新增**

不同文件对同一属性使用不同颜色调用 `addDelayedAnimation`：

| 属性 | backgamemanger / System 类 | computerScene |
|---|---|---|
| money | `#f39c12` | `#D4A574` |
| energy | `#3498db` | `#7BA3C9` |
| health | `#27ae60` | `#7CB87C` |
| mood | `#e91e63` | `#D49BA3` |
| reputation | `#9b59b6` | `#B8A3C9` |

System 类使用的是"高饱和度"颜色，computerScene 使用的是"吉卜力柔和"颜色。视觉上不统一。

**解决方案**：统一到 `STAT_CONFIG`（见 1.4），所有 `addDelayedAnimation` 调用不再手动传颜色。

---

### 5.5 sceneTransitionManager.js 大量使用 var

**严重程度：⚠️ 中** | **状态：新增**

`sceneTransitionManager.js` 单文件包含 **205 处 `var` 声明**，包括文件顶部的数学快捷变量和所有函数内的局部变量。这与项目其他文件统一使用 `const/let` 的风格严重不一致。

**解决方案**：批量替换 `var` → `const`/`let`，添加 ESLint `no-var` 规则。

---

## 六、综合评估与改进建议汇总

| 维度 | 评价 | 主要问题 | 变化 |
|---|---|---|---|
| **代码复用** | 🔴 需改进 | 绘图方法重复、弹窗模式重复、圆角矩形分散、业务逻辑多处重复 | ⬇️ 恶化（新增 homeScene/computerScene 重复） |
| **组件耦合** | 🔴 需重构 | 场景与 game 紧耦合、backgamemanger 职责过重、system 类与 UI 交错 | ➡️ 不变 |
| **语法合规** | ⚠️ 基本合规 | 分号不统一、文件名拼写错误、缺少空值检查、var 使用过多 | ⬆️ 改善（== 问题基本消除） |
| **变量风格** | ⚠️ 基本良好 | 魔术字符串散落、颜色值不一致、参数过多 | ⬇️ 恶化（颜色不一致加剧） |

### 优先级建议

1. **P0（建议立即改进）**：
   - 将 `backgamemanger.js` 中的重复逻辑委托给已有 System 类，降低至 100 行以内
   - 删除 `homeScene.js` 和 `computerScene.js` 中与 System 类重复的业务逻辑
   - 创建 `STAT_CONFIG` 统一属性配置，消除颜色不一致和魔术字符串
   - 重命名 `backgamemanger.js` → `backGameManager.js`

2. **P1（建议近期改进）**：
   - 抽取 `GhibliRenderer.js` 共享绘图模块，消除 `splashScene` 与 `loginScene` 的代码重复
   - 抽取 `CanvasUtils.js` 统一圆角矩形绘制方法
   - 在 `uiManager` 中添加 `showInfoModal` / `showConfirmModal` 快捷方法
   - 抽取 `createDefaultState()` 消除 resetGame.js 与 houseScene.js 的重复
   - 抽取 `HOME_AREAS` 配置消除 homeScene 与 sceneWithBackground 的重复
   - 修改 `addDelayedAnimation` 签名，让 label/color 自动从配置获取

3. **P2（建议远期优化）**：
   - 采用依赖注入 + 事件总线降低场景与 game 对象的耦合度
   - 将 System 类拆分为业务逻辑层和 UI 层
   - 将 `sceneWithBackground` 改为策略模式
   - 定义场景名称常量，消除字符串标识
   - 统一 `sceneTransitionManager.js` 的 `var` → `const/let`
   - 添加 ESLint 配置，自动约束代码风格

### 重构路线图

```
Phase 1 (P0): 消除重复 → 减少约 800 行重复代码
  ├── backgamemanger 委托化
  ├── homeScene/computerScene 去重
  ├── STAT_CONFIG 统一配置
  └── 文件重命名

Phase 2 (P1): 抽取公共模块 → 减少约 500 行重复代码
  ├── GhibliRenderer.js
  ├── CanvasUtils.js
  ├── uiManager 快捷方法
  ├── createDefaultState()
  └── HOME_AREAS 配置

Phase 3 (P2): 架构优化 → 提升可维护性
  ├── 依赖注入
  ├── 事件总线
  ├── 策略模式
  └── ESLint 规范
```

---

*本报告基于对项目 JavaScript 源代码的静态分析编写，分析维度为代码复用、组件耦合、语法合规、变量风格及新增问题。报告仅用于改进参考，不对业务逻辑正确性做判断。更新时间：2026年5月。*
