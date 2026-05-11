// 动画管理器 - 处理数值变化的动态效果

class AnimationManager {
    constructor() {
        this.animations = []
    }

    // 添加数值增加动画（从上方出现，向下汇入）
    addIncreaseAnimation(x, y, value, label, color = '#27ae60') {
        this.animations.push({
            type: 'increase',
            x,
            y,
            value,
            label,
            color,
            startTime: Date.now(),
            duration: 1500,
            phase: 'show' // show, move, merge
        })
    }

    // 添加数值减少动画（从总值分离，向上消失）
    addDecreaseAnimation(x, y, value, label, color = '#e74c3c') {
        this.animations.push({
            type: 'decrease',
            x,
            y,
            value,
            label,
            color,
            startTime: Date.now(),
            duration: 1500,
            phase: 'separate'
        })
    }

    // 添加贷款动画（从下方出现，向上汇入）
    addLoanAnimation(x, y, value, label, color = '#f39c12') {
        this.animations.push({
            type: 'loan',
            x,
            y,
            value,
            label,
            color,
            startTime: Date.now(),
            duration: 1500,
            phase: 'rise'
        })
    }

    // 更新和渲染所有动画
    updateAndRender(renderer) {
        if (this.animations.length === 0) return

        const now = Date.now()
        const ctx = renderer.ctx

        for (let i = this.animations.length - 1; i >= 0; i--) {
            const anim = this.animations[i]
            const elapsed = now - anim.startTime
            const progress = Math.min(1, elapsed / anim.duration)

            if (progress >= 1) {
                this.animations.splice(i, 1)
            } else {
                this.renderAnimation(ctx, anim, progress)
            }
        }
    }

    renderAnimation(ctx, anim, progress) {
        ctx.save()

        switch (anim.type) {
            case 'increase':
                this.renderIncreaseAnimation(ctx, anim, progress)
                break
            case 'decrease':
                this.renderDecreaseAnimation(ctx, anim, progress)
                break
            case 'loan':
                this.renderLoanAnimation(ctx, anim, progress)
                break
        }

        ctx.restore()
    }

    // 增加动画：从上方出现，向下移动，最后汇入
    renderIncreaseAnimation(ctx, anim, progress) {
        const { x, y, value, label, color } = anim

        // 动画分为三个阶段：
        // 0-0.3: 显示并停留
        // 0.3-0.8: 向下移动
        // 0.8-1.0: 汇入消失

        let currentY = y
        let alpha = 1
        let scale = 1

        if (progress < 0.3) {
            // 第一阶段：从上方淡入
            const phaseProgress = progress / 0.3
            currentY = y - 30 * (1 - phaseProgress)
            alpha = phaseProgress
        } else if (progress < 0.8) {
            // 第二阶段：向下移动
            const phaseProgress = (progress - 0.3) / 0.5
            currentY = y + 40 * phaseProgress
            alpha = 1
        } else {
            // 第三阶段：汇入消失
            const phaseProgress = (progress - 0.8) / 0.2
            currentY = y + 40 + 20 * phaseProgress
            alpha = 1 - phaseProgress
            scale = 1 - phaseProgress * 0.3
        }

        ctx.globalAlpha = alpha
        ctx.fillStyle = color
        ctx.font = `bold ${16 * scale}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // 绘制 + 号和数值
        const text = `+${value}`
        ctx.fillText(text, x, currentY)

        // 绘制标签
        ctx.font = `${10 * scale}px sans-serif`
        ctx.fillStyle = '#bdc3c7'
        ctx.fillText(label, x, currentY + 18)
    }

    // 减少动画：从总值分离，向上消失
    renderDecreaseAnimation(ctx, anim, progress) {
        const { x, y, value, label, color } = anim

        // 动画分为三个阶段：
        // 0-0.2: 从总值分离
        // 0.2-0.8: 向上移动
        // 0.8-1.0: 消失

        let currentY = y
        let alpha = 1
        let scale = 1

        if (progress < 0.2) {
            // 第一阶段：分离
            const phaseProgress = progress / 0.2
            currentY = y - 10 * phaseProgress
            alpha = phaseProgress
        } else if (progress < 0.8) {
            // 第二阶段：向上移动
            const phaseProgress = (progress - 0.2) / 0.6
            currentY = y - 10 - 50 * phaseProgress
            alpha = 1
        } else {
            // 第三阶段：消失
            const phaseProgress = (progress - 0.8) / 0.2
            currentY = y - 60 - 20 * phaseProgress
            alpha = 1 - phaseProgress
            scale = 1 - phaseProgress * 0.3
        }

        ctx.globalAlpha = alpha
        ctx.fillStyle = color
        ctx.font = `bold ${16 * scale}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // 绘制 - 号和数值
        const text = `-${value}`
        ctx.fillText(text, x, currentY)

        // 绘制标签
        ctx.font = `${10 * scale}px sans-serif`
        ctx.fillStyle = '#bdc3c7'
        ctx.fillText(label, x, currentY + 18)
    }

    // 贷款动画：从下方出现，向上汇入
    renderLoanAnimation(ctx, anim, progress) {
        const { x, y, value, label, color } = anim

        // 动画分为三个阶段：
        // 0-0.3: 从下方出现
        // 0.3-0.8: 向上移动
        // 0.8-1.0: 汇入消失

        let currentY = y
        let alpha = 1
        let scale = 1

        if (progress < 0.3) {
            // 第一阶段：从下方淡入
            const phaseProgress = progress / 0.3
            currentY = y + 50 * (1 - phaseProgress)
            alpha = phaseProgress
        } else if (progress < 0.8) {
            // 第二阶段：向上移动
            const phaseProgress = (progress - 0.3) / 0.5
            currentY = y - 40 * phaseProgress
            alpha = 1
        } else {
            // 第三阶段：汇入消失
            const phaseProgress = (progress - 0.8) / 0.2
            currentY = y - 40 - 20 * phaseProgress
            alpha = 1 - phaseProgress
            scale = 1 - phaseProgress * 0.3
        }

        ctx.globalAlpha = alpha
        ctx.fillStyle = color
        ctx.font = `bold ${16 * scale}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // 绘制 + 号和数值
        const text = `+${value}`
        ctx.fillText(text, x, currentY)

        // 绘制标签
        ctx.font = `${10 * scale}px sans-serif`
        ctx.fillStyle = '#bdc3c7'
        ctx.fillText(label, x, currentY + 18)
    }

    // 检查是否有正在进行的动画
    hasAnimations() {
        return this.animations.length > 0
    }

    // 清除所有动画
    clear() {
        this.animations = []
    }
}

const animationManager = new AnimationManager()
export default animationManager
