/**
 * SVG 图标管理模块
 * 吉卜力风格手绘图标 - 干净轮廓 + 柔和色块
 */

const SVGIcons = {
    /**
     * 绘制日历图标 (天数)
     * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
     * @param {number} x - 中心点 X 坐标
     * @param {number} y - 中心点 Y 坐标
     * @param {number} size - 图标大小 (默认 24)
     * @param {Object} options - 可选配置
     */
    drawCalendar(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)
        
        // 日历外框
        ctx.fillStyle = '#FEF1DA'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.8
        this.roundRect(ctx, 14, 12, 36, 42, 7, true)
        
        // 挂环孔
        ctx.fillStyle = '#FEF1DA'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.5
        this.drawCircle(ctx, 23, 15, 2.2, true)
        this.drawCircle(ctx, 32, 15, 2.2, true)
        this.drawCircle(ctx, 41, 15, 2.2, true)
        
        // 顶部装饰线
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(16, 22)
        ctx.lineTo(48, 22)
        ctx.stroke()
        
        // 装饰小点
        ctx.fillStyle = '#D28F64'
        this.drawCircle(ctx, 21, 31, 1.5, false)
        this.drawCircle(ctx, 43, 31, 1.5, false)
        this.drawCircle(ctx, 32, 37, 1.5, false)
        
        ctx.restore()
    },

    /**
     * 绘制金币图标
     */
    drawCoin(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)
        
        // 外圆
        ctx.fillStyle = '#FFE2A4'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.9
        this.drawCircle(ctx, 32, 32, 20, true)
        
        // 内圆
        ctx.fillStyle = '#FFD580'
        ctx.lineWidth = 1.6
        this.drawCircle(ctx, 32, 32, 14, true)
        
        // 光晕小点
        ctx.fillStyle = '#FFFFFF'
        ctx.globalAlpha = 0.8
        this.drawCircle(ctx, 22, 22, 1.8, false)
        ctx.globalAlpha = 0.7
        this.drawCircle(ctx, 42, 24, 1.5, false)
        ctx.globalAlpha = 1
        
        ctx.restore()
    },

    /**
     * 绘制银行图标
     */
    drawBank(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)
        
        // 建筑主体
        ctx.fillStyle = '#DBEAD7'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.8
        this.roundRect(ctx, 12, 33, 40, 22, 4, true)
        
        // 三角形山墙
        ctx.fillStyle = '#CBE0CF'
        ctx.beginPath()
        ctx.moveTo(32, 12)
        ctx.lineTo(10, 33)
        ctx.lineTo(54, 33)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        
        // 圆柱
        ctx.fillStyle = '#E9F3E5'
        ctx.lineWidth = 1.6
        this.roundRect(ctx, 17, 35, 6, 20, 2, true)
        this.roundRect(ctx, 29, 35, 6, 20, 2, true)
        this.roundRect(ctx, 41, 35, 6, 20, 2, true)
        
        // 大门
        ctx.fillStyle = '#C0D2BB'
        ctx.lineWidth = 1.5
        this.roundRect(ctx, 26, 44, 12, 11, 3, true)
        
        // 门把手
        ctx.fillStyle = '#2C2418'
        this.drawCircle(ctx, 35, 50, 1, false)
        
        ctx.restore()
    },

    /**
     * 绘制警告图标
     */
    drawWarning(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)
        
        // 警示三角形
        ctx.fillStyle = '#FCE2C1'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.9
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(32, 10)
        ctx.lineTo(56, 52)
        ctx.lineTo(8, 52)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        
        // 感叹号
        ctx.fillStyle = '#D96C3B'
        this.roundRect(ctx, 29.5, 27, 5, 14, 2.5, false)
        this.drawCircle(ctx, 32, 47, 3, false)
        
        ctx.restore()
    },

    /**
     * 绘制私人借贷警示图标
     */
    drawLoanWarning(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)
        
        // 外圆背景
        ctx.fillStyle = '#FBDCDA'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.8
        this.drawCircle(ctx, 32, 32, 27, true)
        
        // 左侧人物
        ctx.fillStyle = '#FEE5CE'
        ctx.lineWidth = 1.7
        this.drawCircle(ctx, 20, 33, 6.5, true)
        ctx.fillStyle = '#EFDEC5'
        ctx.lineWidth = 1.6
        ctx.beginPath()
        ctx.moveTo(14, 44)
        ctx.quadraticCurveTo(20, 54, 26, 45)
        ctx.stroke()
        ctx.fill()
        
        // 右侧人物
        ctx.fillStyle = '#FEE5CE'
        this.drawCircle(ctx, 44, 33, 6.5, true)
        ctx.fillStyle = '#EFDEC5'
        ctx.beginPath()
        ctx.moveTo(50, 44)
        ctx.quadraticCurveTo(44, 54, 38, 45)
        ctx.stroke()
        ctx.fill()
        
        // 中间警示圆
        ctx.fillStyle = '#FFF0E8'
        ctx.lineWidth = 1.5
        this.drawCircle(ctx, 32, 22, 11, true)
        
        // 金币
        ctx.fillStyle = '#FFE6B3'
        ctx.lineWidth = 1.4
        this.drawCircle(ctx, 32, 48, 5.5, true)
        
        ctx.restore()
    },

    /**
     * 绘制健康图标 (心形)
     */
    drawHealth(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)
        
        // 心形
        ctx.fillStyle = '#FCC8D9'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.9
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(32, 48)
        ctx.bezierCurveTo(32, 48, 22, 40, 16, 34)
        ctx.bezierCurveTo(11, 29, 10, 22, 15, 17)
        ctx.bezierCurveTo(20, 12, 27, 13, 32, 20)
        ctx.bezierCurveTo(37, 13, 44, 12, 49, 17)
        ctx.bezierCurveTo(54, 22, 53, 29, 48, 34)
        ctx.bezierCurveTo(42, 40, 32, 48, 32, 48)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        
        // 心跳线
        ctx.strokeStyle = '#D95B7A'
        ctx.lineWidth = 2.2
        ctx.beginPath()
        ctx.moveTo(10, 28)
        ctx.lineTo(16, 28)
        ctx.lineTo(19, 32)
        ctx.lineTo(23, 24)
        ctx.lineTo(26, 31)
        ctx.lineTo(30, 28)
        ctx.lineTo(35, 28)
        ctx.stroke()
        
        ctx.restore()
    },

    /**
     * 绘制精力图标 (闪电)
     */
    drawEnergy(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)
        
        // 背景圆
        ctx.fillStyle = '#FDF2CF'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.7
        this.drawCircle(ctx, 32, 32, 26, true)
        
        // 闪电
        ctx.fillStyle = '#FFE081'
        ctx.lineWidth = 1.8
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(37, 12)
        ctx.lineTo(28, 30)
        ctx.lineTo(36, 30)
        ctx.lineTo(29, 54)
        ctx.lineTo(43, 32)
        ctx.lineTo(33, 32)
        ctx.lineTo(44, 16)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        
        // 小火花粒子
        ctx.fillStyle = '#FBCA48'
        this.drawCircle(ctx, 45, 19, 1.8, false)
        this.drawCircle(ctx, 48, 27, 1.5, false)
        this.drawCircle(ctx, 21, 46, 1.8, false)
        
        ctx.restore()
    },

    /**
     * 绘制心情图标 (笑脸)
     */
    drawMood(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)
        
        // 脸部
        ctx.fillStyle = '#FFF1D6'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.9
        this.drawCircle(ctx, 32, 32, 24, true)
        
        // 眼睛
        ctx.fillStyle = '#2C2418'
        this.drawCircle(ctx, 24, 28, 3.2, false)
        this.drawCircle(ctx, 40, 28, 3.2, false)
        
        // 微笑
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 2.2
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(22, 41)
        ctx.quadraticCurveTo(32, 51, 42, 41)
        ctx.stroke()
        
        // 腮红
        ctx.fillStyle = '#FFB7B2'
        ctx.globalAlpha = 0.9
        this.drawEllipse(ctx, 20, 36, 3, 2, false)
        this.drawEllipse(ctx, 44, 36, 3, 2, false)
        ctx.globalAlpha = 1
        
        ctx.restore()
    },

    /**
     * 绘制名誉图标 (星星奖章)
     */
    drawReputation(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)
        
        // 丝带底座
        ctx.fillStyle = '#E7DAC3'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.6
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(28, 52)
        ctx.lineTo(32, 44)
        ctx.lineTo(36, 52)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        
        ctx.fillStyle = '#D9C8AC'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(25, 56)
        ctx.lineTo(32, 49)
        ctx.lineTo(39, 56)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        
        // 星星
        ctx.fillStyle = '#F9E68C'
        ctx.lineWidth = 1.8
        this.drawStar(ctx, 32, 24, 5, 12, 5)
        
        // 光芒
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.4
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(32, 6)
        ctx.lineTo(32, 3)
        ctx.moveTo(51, 20)
        ctx.lineTo(54, 18)
        ctx.moveTo(13, 20)
        ctx.lineTo(10, 18)
        ctx.stroke()
        
        ctx.restore()
    },

    /**
     * 绘制地图图标 (定位标记风格)
     */
    drawMap(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)

        // 外圆背景 - 浅蓝色天空感
        ctx.fillStyle = '#E8F4F8'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.8
        this.drawCircle(ctx, 32, 32, 26, true)

        // 底部地面弧线
        ctx.strokeStyle = '#A8D5A2'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(32, 55, 18, Math.PI * 1.1, Math.PI * 1.9)
        ctx.stroke()

        // 定位标记外圈
        ctx.fillStyle = '#F5E6D3'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.8
        this.drawCircle(ctx, 32, 38, 10, true)

        // 定位标记指针（水滴形状）
        ctx.fillStyle = '#D4A574'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.8
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(32, 14)
        ctx.quadraticCurveTo(46, 22, 46, 36)
        ctx.quadraticCurveTo(46, 48, 32, 56)
        ctx.quadraticCurveTo(18, 48, 18, 36)
        ctx.quadraticCurveTo(18, 22, 32, 14)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // 定位标记内圆
        ctx.fillStyle = '#F5E6D3'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.5
        this.drawCircle(ctx, 32, 34, 6, true)

        // 中心小圆点
        ctx.fillStyle = '#D4A574'
        this.drawCircle(ctx, 32, 34, 2.5, false)

        // 高光点
        ctx.fillStyle = '#FFFFFF'
        ctx.globalAlpha = 0.6
        this.drawCircle(ctx, 28, 22, 2, false)
        ctx.globalAlpha = 1

        ctx.restore()
    },

    /**
     * 绘制音效图标
     */
    drawSound(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)

        // 喇叭主体
        ctx.fillStyle = '#E0F0FF'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.8
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(18, 24)
        ctx.lineTo(28, 16)
        ctx.lineTo(28, 48)
        ctx.lineTo(18, 40)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // 喇叭尾部
        ctx.fillStyle = '#D0E8F8'
        ctx.lineWidth = 1.6
        this.roundRect(ctx, 10, 26, 10, 12, 3, true)

        // 音波线
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(32, 32, 8, -Math.PI / 3, Math.PI / 3)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(32, 32, 14, -Math.PI / 4, Math.PI / 4)
        ctx.stroke()

        ctx.restore()
    },

    /**
     * 绘制震动图标
     */
    drawVibration(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)

        // 手机主体
        ctx.fillStyle = '#F5E6D3'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.8
        this.roundRect(ctx, 22, 8, 20, 48, 4, true)

        // 屏幕
        ctx.fillStyle = '#E8F4F8'
        ctx.lineWidth = 1.5
        this.roundRect(ctx, 25, 14, 14, 36, 2, true)

        // 震动波纹 - 左侧
        ctx.strokeStyle = '#7BA3C9'
        ctx.lineWidth = 1.8
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(12, 20)
        ctx.lineTo(6, 14)
        ctx.moveTo(12, 32)
        ctx.lineTo(4, 32)
        ctx.moveTo(12, 44)
        ctx.lineTo(6, 50)
        ctx.stroke()

        // 震动波纹 - 右侧
        ctx.beginPath()
        ctx.moveTo(52, 20)
        ctx.lineTo(58, 14)
        ctx.moveTo(52, 32)
        ctx.lineTo(60, 32)
        ctx.moveTo(52, 44)
        ctx.lineTo(58, 50)
        ctx.stroke()

        ctx.restore()
    },

    /**
     * 绘制统计图标
     */
    drawStats(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)

        // 背景圆
        ctx.fillStyle = '#F0E8D8'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.8
        this.drawCircle(ctx, 32, 32, 26, true)

        // 柱状图
        ctx.fillStyle = '#7CB87C'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.5
        this.roundRect(ctx, 16, 38, 8, 14, 2, true)

        ctx.fillStyle = '#D4A574'
        this.roundRect(ctx, 28, 28, 8, 24, 2, true)

        ctx.fillStyle = '#7BA3C9'
        this.roundRect(ctx, 40, 18, 8, 34, 2, true)

        ctx.restore()
    },

    /**
     * 绘制清除图标
     */
    drawClear(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)

        // 背景圆
        ctx.fillStyle = '#FBDCDA'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.8
        this.drawCircle(ctx, 32, 32, 26, true)

        // 垃圾桶
        ctx.fillStyle = '#E8E8E8'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.6
        this.roundRect(ctx, 20, 22, 24, 26, 3, true)

        // 垃圾桶盖
        ctx.fillStyle = '#D0D0D0'
        ctx.lineWidth = 1.5
        this.roundRect(ctx, 16, 18, 32, 6, 2, true)

        // 提手
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.8
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(26, 18)
        ctx.lineTo(26, 12)
        ctx.lineTo(38, 12)
        ctx.lineTo(38, 18)
        ctx.stroke()

        // 删除线
        ctx.strokeStyle = '#C17B6B'
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(24, 30)
        ctx.lineTo(40, 46)
        ctx.moveTo(40, 30)
        ctx.lineTo(24, 46)
        ctx.stroke()

        ctx.restore()
    },

    /**
     * 绘制版本图标
     */
    drawVersion(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)

        // 背景圆
        ctx.fillStyle = '#E8F4F8'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.8
        this.drawCircle(ctx, 32, 32, 26, true)

        // 标签主体
        ctx.fillStyle = '#D4A574'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.6
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(16, 22)
        ctx.lineTo(48, 22)
        ctx.lineTo(44, 42)
        ctx.lineTo(20, 42)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        // 标签孔
        ctx.fillStyle = '#E8F4F8'
        ctx.lineWidth = 1.4
        this.drawCircle(ctx, 32, 28, 4, true)

        // 绳子
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(32, 24)
        ctx.lineTo(32, 16)
        ctx.stroke()

        ctx.restore()
    },

    /**
     * 绘制返回图标
     */
    drawBack(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)

        // 箭头主体
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(40, 16)
        ctx.lineTo(20, 32)
        ctx.lineTo(40, 48)
        ctx.stroke()

        // 箭头装饰
        ctx.strokeStyle = '#7BA3C9'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(36, 14)
        ctx.lineTo(16, 32)
        ctx.lineTo(36, 50)
        ctx.stroke()

        ctx.restore()
    },

    /**
     * 绘制重置图标
     */
    drawReset(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)

        // 循环箭头
        ctx.strokeStyle = '#C17B6B'
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        // 左下半圆
        ctx.beginPath()
        ctx.arc(32, 32, 18, Math.PI * 0.6, Math.PI * 1.4)
        ctx.stroke()

        // 右上半圆
        ctx.beginPath()
        ctx.arc(32, 32, 18, Math.PI * 1.6, Math.PI * 0.4)
        ctx.stroke()

        // 左箭头
        ctx.fillStyle = '#C17B6B'
        ctx.beginPath()
        ctx.moveTo(18, 38)
        ctx.lineTo(12, 46)
        ctx.lineTo(22, 44)
        ctx.closePath()
        ctx.fill()

        // 右箭头
        ctx.beginPath()
        ctx.moveTo(46, 26)
        ctx.lineTo(52, 18)
        ctx.lineTo(42, 20)
        ctx.closePath()
        ctx.fill()

        ctx.restore()
    },

    /**
     * 绘制右箭头图标
     */
    drawArrowRight(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)

        ctx.strokeStyle = '#8B7355'
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(20, 20)
        ctx.lineTo(36, 32)
        ctx.lineTo(20, 44)
        ctx.stroke()

        ctx.restore()
    },

    /**
     * 绘制手机图标
     * 吉卜力风格 - 柔和色块 + 干净轮廓
     */
    drawPhone(ctx, x, y, size = 24, options = {}) {
        const s = size / 64
        ctx.save()
        ctx.translate(x - size / 2, y - size / 2)
        ctx.scale(s, s)

        // 手机主体 - 柔和米白色
        ctx.fillStyle = '#F5E6D3'
        ctx.strokeStyle = '#2C2418'
        ctx.lineWidth = 1.8
        this.roundRect(ctx, 20, 8, 24, 48, 6, true)

        // 屏幕 - 浅蓝色
        ctx.fillStyle = '#E8F4F8'
        ctx.lineWidth = 1.5
        this.roundRect(ctx, 24, 14, 16, 36, 3, true)

        // 听筒
        ctx.fillStyle = '#2C2418'
        this.roundRect(ctx, 28, 12, 8, 2, 1, false)

        // Home键
        ctx.fillStyle = '#D4A574'
        ctx.lineWidth = 1.4
        this.drawCircle(ctx, 32, 48, 3, true)

        // 屏幕反光高光
        ctx.fillStyle = '#FFFFFF'
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.moveTo(26, 16)
        ctx.lineTo(30, 16)
        ctx.lineTo(26, 24)
        ctx.closePath()
        ctx.fill()
        ctx.globalAlpha = 1

        // 信号波纹装饰（表示手机通讯）
        ctx.strokeStyle = '#7BA3C9'
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(48, 24, 4, -Math.PI / 2, Math.PI / 6)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(48, 24, 7, -Math.PI / 2, Math.PI / 4)
        ctx.stroke()

        ctx.restore()
    },

    // ============ 辅助绘制方法 ============

    /**
     * 绘制圆角矩形
     */
    roundRect(ctx, x, y, width, height, radius, stroke = false) {
        ctx.beginPath()
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + width - radius, y)
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
        ctx.lineTo(x + width, y + height - radius)
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
        ctx.lineTo(x + radius, y + height)
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
        ctx.fill()
        if (stroke) ctx.stroke()
    },

    /**
     * 绘制圆形
     */
    drawCircle(ctx, x, y, radius, stroke = false) {
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
        if (stroke) ctx.stroke()
    },

    /**
     * 绘制椭圆
     */
    drawEllipse(ctx, x, y, rx, ry, stroke = false) {
        ctx.beginPath()
        ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
        ctx.fill()
        if (stroke) ctx.stroke()
    },

    /**
     * 绘制五角星
     */
    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3
        let x = cx
        let y = cy
        let step = Math.PI / spikes

        ctx.beginPath()
        ctx.moveTo(cx, cy - outerRadius)
        for (let i = 0; i < spikes; i++) {
            x = cx + Math.cos(rot) * outerRadius
            y = cy + Math.sin(rot) * outerRadius
            ctx.lineTo(x, y)
            rot += step

            x = cx + Math.cos(rot) * innerRadius
            y = cy + Math.sin(rot) * innerRadius
            ctx.lineTo(x, y)
            rot += step
        }
        ctx.lineTo(cx, cy - outerRadius)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
    }
}

export default SVGIcons
