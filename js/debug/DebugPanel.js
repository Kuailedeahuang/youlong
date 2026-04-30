/**
 * 调试面板 - 可视化编辑交互区域（支持 hitArea 和 labelArea 分离）
 * 触发方式：长按地图图标3秒
 */
export default class DebugPanel {
    static instance = null

    static getInstance(game) {
        if (!DebugPanel.instance) {
            DebugPanel.instance = new DebugPanel(game)
        }
        return DebugPanel.instance
    }

    constructor(game) {
        this.game = game
        this.isVisible = false
        this.areas = []
        this.selectedArea = null
        this.editMode = 'hitArea' // 'hitArea' 或 'labelArea'
        
        // 长按检测状态
        this.longPressTimer = null
        this.isLongPressing = false
        this.longPressStartTime = 0
        this.LONG_PRESS_DURATION = 3000
        
        // 编辑状态
        this.isDragging = false
        this.isResizing = false
        this.dragStartPos = { x: 0, y: 0 }
        this.resizeHandle = null
        this.resizeStartValues = null
        
        // 画布
        this.canvas = null
        this.ctx = null
        
        // 事件绑定
        this.handleTouchStart = this.handleTouchStart.bind(this)
        this.handleTouchMove = this.handleTouchMove.bind(this)
        this.handleTouchEnd = this.handleTouchEnd.bind(this)
        
        // 地图按钮位置
        this.mapButtonRect = null
        
        console.log('[DebugPanel] 调试面板已初始化，长按地图图标3秒开启/关闭')
    }
    
    /**
     * 设置地图按钮位置
     */
    setMapButtonRect(rect) {
        this.mapButtonRect = rect
    }
    
    /**
     * 检查点是否在地图按钮内
     */
    isPointInMapButton(x, y) {
        if (!this.mapButtonRect) return false
        const r = this.mapButtonRect
        return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height
    }
    
    /**
     * 处理地图按钮长按
     */
    handleMapButtonTouchStart(x, y) {
        if (!this.isPointInMapButton(x, y)) return false
        
        this.isLongPressing = true
        this.longPressStartTime = Date.now()
        
        this.longPressTimer = setTimeout(() => {
            if (this.isLongPressing) {
                this.toggle()
                if (wx.vibrateShort) {
                    wx.vibrateShort({ type: 'heavy' })
                }
            }
        }, this.LONG_PRESS_DURATION)
        
        return true
    }
    
    handleMapButtonTouchMove(x, y) {
        if (!this.isLongPressing) return false
        if (!this.isPointInMapButton(x, y)) {
            this.cancelLongPress()
        }
        return this.isLongPressing
    }
    
    handleMapButtonTouchEnd() {
        if (!this.isLongPressing) return false

        const wasLongPressing = this.isLongPressing
        this.cancelLongPress()
        
        if (this.isVisible) {
            return true
        }
        
        if (!wasLongPressing && Date.now() - this.longPressStartTime >= this.LONG_PRESS_DURATION) {
            return true
        }
        
        return false
    }
    
    cancelLongPress() {
        this.isLongPressing = false
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer)
            this.longPressTimer = null
        }
    }
    
    /**
     * 显示/隐藏调试面板
     */
    toggle() {
        if (this.isVisible) {
            this.hide()
        } else {
            this.show()
        }
    }
    
    show() {
        if (this.isVisible) return
        
        this.isVisible = true
        window.__DEBUG_MODE__ = true
        
        this.createOverlay()
        this.loadAreasFromStorage()
        
        wx.onTouchStart(this.handleTouchStart)
        wx.onTouchMove(this.handleTouchMove)
        wx.onTouchEnd(this.handleTouchEnd)
        
        console.log('[DebugPanel] 调试面板已显示')
        
        wx.showToast({
            title: '调试模式已开启',
            icon: 'none',
            duration: 2000
        })
    }
    
    hide() {
        if (!this.isVisible) return
        
        this.isVisible = false
        window.__DEBUG_MODE__ = false
        
        this.canvas = null
        this.ctx = null
        
        console.log('[DebugPanel] 调试面板已隐藏')
        
        wx.showToast({
            title: '调试模式已关闭',
            icon: 'none',
            duration: 2000
        })
    }
    
    createOverlay() {
        const renderer = this.game.renderer
        this.canvas = renderer.canvas
        this.ctx = renderer.ctx
    }
    
    loadAreasFromStorage() {
        try {
            const saved = wx.getStorageSync('debug_areas_v2')
            if (saved && saved.length > 0) {
                this.areas = saved
            } else {
                this.areas = []
            }
        } catch (e) {
            this.areas = []
        }
    }
    
    saveAreas() {
        try {
            wx.setStorageSync('debug_areas_v2', this.areas)
            
            if (this.game.sceneManager && this.game.sceneManager.currentScene) {
                const scene = this.game.sceneManager.scenes[this.game.sceneManager.currentScene]
                if (scene && scene.areaManager) {
                    scene.areaManager.unregisterAll()
                    this.areas.forEach(area => {
                        scene.areaManager.register(area.id, {
                            label: area.label,
                            action: area.action,
                            hitArea: area.hitArea,
                            labelArea: area.labelArea,
                            style: area.style
                        })
                    })
                }
            }
            
            wx.showToast({ title: '配置已保存', icon: 'success' })
        } catch (e) {
            console.error('[DebugPanel] 保存失败:', e)
            wx.showToast({ title: '保存失败', icon: 'none' })
        }
    }
    
    exportConfig() {
        const config = this.areas.map(area => ({
            id: area.id,
            label: area.label,
            hitArea: area.hitArea,
            labelArea: area.labelArea,
            style: area.style
        }))
        
        const jsonStr = JSON.stringify(config, null, 2)
        
        wx.showModal({
            title: '区域配置JSON',
            content: jsonStr.substring(0, 300) + (jsonStr.length > 300 ? '...' : ''),
            showCancel: true,
            confirmText: '复制',
            cancelText: '关闭',
            success: (res) => {
                if (res.confirm) {
                    wx.setClipboardData({
                        data: jsonStr,
                        success: () => {
                            wx.showToast({ title: '已复制到剪贴板', icon: 'success' })
                        }
                    })
                }
            }
        })
    }
    
    /**
     * 添加新区域
     */
    addArea() {
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        
        const newArea = {
            id: `area_${Date.now()}`,
            label: '新区域',
            hitArea: {
                xPercent: 0.3,
                yPercent: 0.3,
                widthPercent: 0.2,
                heightPercent: 0.15
            },
            labelArea: {
                xPercent: 0.35,
                yPercent: 0.25,
                height: 24,
                paddingX: 10
            },
            style: {
                hitAreaBgColor: 'transparent',
                hitAreaBorderColor: 'transparent',
                labelBgColor: 'rgba(255, 255, 255, 0.85)',
                labelBorderColor: 'rgba(0, 0, 0, 0.2)',
                textColor: '#000000',
                fontSize: 12
            }
        }
        
        this.areas.push(newArea)
        this.selectedArea = newArea
        this.editMode = 'hitArea'
        
        this.editAreaProperties(newArea)
        this.render()
    }
    
    deleteSelectedArea() {
        if (!this.selectedArea) {
            wx.showToast({ title: '请先选择区域', icon: 'none' })
            return
        }
        
        const index = this.areas.indexOf(this.selectedArea)
        if (index > -1) {
            this.areas.splice(index, 1)
            this.selectedArea = null
            this.render()
            wx.showToast({ title: '已删除', icon: 'success' })
        }
    }
    
    /**
     * 编辑区域属性
     */
    editAreaProperties(area) {
        // 第一步：编辑ID
        wx.showModal({
            title: '编辑区域ID',
            content: area.id,
            editable: true,
            placeholderText: '输入唯一标识（如：bed, computer）',
            success: (res) => {
                if (res.confirm && res.content) {
                    const existingArea = this.areas.find(a => a.id === res.content && a !== area)
                    if (existingArea) {
                        wx.showToast({ title: 'ID已存在', icon: 'none' })
                    } else {
                        area.id = res.content
                    }
                }
                
                // 第二步：编辑Label
                wx.showModal({
                    title: '编辑显示文字',
                    content: area.label,
                    editable: true,
                    placeholderText: '输入显示文字（如：床, 电脑）',
                    success: (res2) => {
                        if (res2.confirm && res2.content) {
                            area.label = res2.content
                        }
                        this.render()
                    }
                })
            }
        })
    }
    
    /**
     * 切换编辑模式
     */
    toggleEditMode() {
        if (!this.selectedArea) {
            wx.showToast({ title: '请先选择区域', icon: 'none' })
            return
        }
        
        this.editMode = this.editMode === 'hitArea' ? 'labelArea' : 'hitArea'
        this.render()
        
        wx.showToast({ 
            title: `编辑: ${this.editMode === 'hitArea' ? '点击区域' : '文字标签'}`, 
            icon: 'none',
            duration: 1000
        })
    }
    
    render() {
        if (!this.isVisible || !this.ctx) return
        
        const ctx = this.ctx
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        
        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.fillRect(0, 0, w, h)
        
        // 绘制所有区域
        this.areas.forEach(area => {
            this.drawArea(ctx, area, w, h)
        })
        
        // 绘制工具栏
        this.drawToolbar(ctx, w, h)
        
        // 绘制说明
        ctx.fillStyle = '#FFFFFF'
        ctx.font = '14px Arial'
        ctx.textAlign = 'left'
        ctx.fillText('长按地图图标3秒退出调试', 10, 30)
        ctx.fillText(`区域数: ${this.areas.length}`, 10, 50)
        
        if (this.selectedArea) {
            ctx.fillText(`选中: ${this.selectedArea.id}`, 10, 70)
            ctx.fillText(`编辑: ${this.editMode === 'hitArea' ? '点击区域' : '文字标签'}`, 10, 90)
        }
    }
    
    /**
     * 绘制单个区域
     */
    drawArea(ctx, area, screenW, screenH) {
        const isSelected = this.selectedArea === area
        
        // 1. 绘制 hitArea（红色边框表示）
        const hitX = screenW * area.hitArea.xPercent
        const hitY = screenH * area.hitArea.yPercent
        const hitW = screenW * area.hitArea.widthPercent
        const hitH = screenH * area.hitArea.heightPercent
        
        ctx.strokeStyle = isSelected && this.editMode === 'hitArea' ? '#FF0000' : 'rgba(255, 0, 0, 0.5)'
        ctx.lineWidth = isSelected && this.editMode === 'hitArea' ? 3 : 1
        ctx.setLineDash([5, 5])
        ctx.strokeRect(hitX, hitY, hitW, hitH)
        ctx.setLineDash([])
        
        // 绘制 hitArea 标签
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)'
        ctx.font = '10px Arial'
        ctx.textAlign = 'left'
        ctx.fillText('HIT', hitX + 2, hitY + 12)
        
        // 2. 绘制 labelArea（蓝色边框表示）
        const labelX = screenW * area.labelArea.xPercent
        const labelY = screenH * area.labelArea.yPercent
        const labelH = area.labelArea.height
        
        // 计算自适应宽度
        ctx.font = `${area.style.fontSize || 12}px Arial`
        const textWidth = ctx.measureText(area.label).width
        const labelW = textWidth + (area.labelArea.paddingX || 10) * 2
        
        // labelArea 背景
        ctx.fillStyle = area.style.labelBgColor
        ctx.fillRect(labelX, labelY, labelW, labelH)
        
        // labelArea 边框
        ctx.strokeStyle = isSelected && this.editMode === 'labelArea' ? '#0066FF' : 'rgba(0, 102, 255, 0.5)'
        ctx.lineWidth = isSelected && this.editMode === 'labelArea' ? 3 : 1
        ctx.strokeRect(labelX, labelY, labelW, labelH)
        
        // labelArea 文字
        ctx.fillStyle = area.style.textColor
        ctx.font = `${area.style.fontSize || 12}px Arial`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(area.label, labelX + labelW / 2, labelY + labelH / 2)
        
        // 绘制 labelArea 标签
        ctx.fillStyle = 'rgba(0, 102, 255, 0.8)'
        ctx.font = '10px Arial'
        ctx.textAlign = 'left'
        ctx.fillText('LABEL', labelX + 2, labelY - 5)
        
        // 3. 绘制选中状态的调整手柄
        if (isSelected) {
            if (this.editMode === 'hitArea') {
                this.drawResizeHandles(ctx, hitX, hitY, hitW, hitH, '#FF0000')
            } else {
                this.drawResizeHandles(ctx, labelX, labelY, labelW, labelH, '#0066FF')
            }
        }
    }
    
    drawResizeHandles(ctx, x, y, width, height, color) {
        const handleSize = 10
        ctx.fillStyle = color
        
        const handles = [
            { x: x - handleSize / 2, y: y - handleSize / 2 },
            { x: x + width - handleSize / 2, y: y - handleSize / 2 },
            { x: x - handleSize / 2, y: y + height - handleSize / 2 },
            { x: x + width - handleSize / 2, y: y + height - handleSize / 2 }
        ]
        
        handles.forEach(h => {
            ctx.fillRect(h.x, h.y, handleSize, handleSize)
        })
    }
    
    drawToolbar(ctx, w, h) {
        const toolbarH = 50
        const btnWidth = 65
        const btnHeight = 36
        const padding = 8
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.fillRect(0, h - toolbarH, w, toolbarH)
        
        const buttons = [
            { label: '新增', x: padding, action: 'add' },
            { label: '删除', x: padding + btnWidth + padding, action: 'delete' },
            { label: '切换', x: padding + (btnWidth + padding) * 2, action: 'toggle' },
            { label: '保存', x: padding + (btnWidth + padding) * 3, action: 'save' },
            { label: '导出', x: padding + (btnWidth + padding) * 4, action: 'export' }
        ]
        
        buttons.forEach(btn => {
            ctx.fillStyle = '#4CAF50'
            ctx.fillRect(btn.x, h - toolbarH + 7, btnWidth, btnHeight)
            
            ctx.fillStyle = '#FFFFFF'
            ctx.font = '12px Arial'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(btn.label, btn.x + btnWidth / 2, h - toolbarH + 7 + btnHeight / 2)
        })
        
        this.toolbarButtons = buttons
    }
    
    handleTouchStart(e) {
        if (!this.isVisible) return
        
        const touch = e.touches[0]
        const x = touch.clientX
        const y = touch.clientY
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        
        // 检查工具栏
        const toolbarH = 50
        if (y > h - toolbarH) {
            this.handleToolbarClick(x, y, w, h)
            return
        }
        
        // 查找点击的区域
        const clickedArea = this.findAreaAt(x, y, w, h)
        
        if (clickedArea) {
            this.selectedArea = clickedArea
            
            // 根据编辑模式获取对应的区域位置
            let areaX, areaY, areaW, areaH
            if (this.editMode === 'hitArea') {
                areaX = w * clickedArea.hitArea.xPercent
                areaY = h * clickedArea.hitArea.yPercent
                areaW = w * clickedArea.hitArea.widthPercent
                areaH = h * clickedArea.hitArea.heightPercent
            } else {
                areaX = w * clickedArea.labelArea.xPercent
                areaY = h * clickedArea.labelArea.yPercent
                areaH = clickedArea.labelArea.height
                // label 宽度需要计算
                this.ctx.font = `${clickedArea.style.fontSize || 12}px Arial`
                const textWidth = this.ctx.measureText(clickedArea.label).width
                areaW = textWidth + (clickedArea.labelArea.paddingX || 10) * 2
            }
            
            // 检查是否点击调整手柄
            const handle = this.getResizeHandleAt(x, y, areaX, areaY, areaW, areaH)
            if (handle) {
                this.isResizing = true
                this.resizeHandle = handle
                this.resizeStartValues = this.editMode === 'hitArea' ? {
                    xPercent: clickedArea.hitArea.xPercent,
                    yPercent: clickedArea.hitArea.yPercent,
                    widthPercent: clickedArea.hitArea.widthPercent,
                    heightPercent: clickedArea.hitArea.heightPercent
                } : {
                    xPercent: clickedArea.labelArea.xPercent,
                    yPercent: clickedArea.labelArea.yPercent
                }
            } else {
                this.isDragging = true
                this.dragStartPos = { x, y }
            }
        } else {
            this.selectedArea = null
        }
        
        this.render()
    }
    
    handleTouchMove(e) {
        if (!this.isVisible) return
        if (!this.selectedArea) return
        if (!this.isDragging && !this.isResizing) return
        
        const touch = e.touches[0]
        const x = touch.clientX
        const y = touch.clientY
        const w = this.game.renderer.width
        const h = this.game.renderer.height
        
        const area = this.selectedArea
        
        if (this.isDragging) {
            const dx = x - this.dragStartPos.x
            const dy = y - this.dragStartPos.y
            
            if (this.editMode === 'hitArea') {
                area.hitArea.xPercent += dx / w
                area.hitArea.yPercent += dy / h
                area.hitArea.xPercent = Math.max(0, Math.min(1 - area.hitArea.widthPercent, area.hitArea.xPercent))
                area.hitArea.yPercent = Math.max(0, Math.min(1 - area.hitArea.heightPercent, area.hitArea.yPercent))
            } else {
                area.labelArea.xPercent += dx / w
                area.labelArea.yPercent += dy / h
            }
            
            this.dragStartPos = { x, y }
        } else if (this.isResizing) {
            const start = this.resizeStartValues
            
            if (this.editMode === 'hitArea') {
                // hitArea 缩放逻辑
                const oldRight = (start.xPercent + start.widthPercent) * w
                const oldBottom = (start.yPercent + start.heightPercent) * h
                
                switch (this.resizeHandle) {
                    case 'se':
                        area.hitArea.widthPercent = Math.max(0.05, (x - start.xPercent * w) / w)
                        area.hitArea.heightPercent = Math.max(0.05, (y - start.yPercent * h) / h)
                        break
                    case 'ne':
                        area.hitArea.widthPercent = Math.max(0.05, (x - start.xPercent * w) / w)
                        const newH = oldBottom - y
                        if (newH > h * 0.05) {
                            area.hitArea.heightPercent = newH / h
                            area.hitArea.yPercent = y / h
                        }
                        break
                    case 'sw':
                        const newW = oldRight - x
                        if (newW > w * 0.05) {
                            area.hitArea.widthPercent = newW / w
                            area.hitArea.xPercent = x / w
                        }
                        area.hitArea.heightPercent = Math.max(0.05, (y - start.yPercent * h) / h)
                        break
                    case 'nw':
                        const newW2 = oldRight - x
                        const newH2 = oldBottom - y
                        if (newW2 > w * 0.05) {
                            area.hitArea.widthPercent = newW2 / w
                            area.hitArea.xPercent = x / w
                        }
                        if (newH2 > h * 0.05) {
                            area.hitArea.heightPercent = newH2 / h
                            area.hitArea.yPercent = y / h
                        }
                        break
                }
            }
            // labelArea 不支持缩放，只支持拖拽移动位置
        }
        
        this.render()
    }
    
    handleTouchEnd(e) {
        if (!this.isVisible) return
        
        this.isDragging = false
        this.isResizing = false
        this.resizeHandle = null
        this.resizeStartValues = null
    }
    
    findAreaAt(x, y, w, h) {
        for (let i = this.areas.length - 1; i >= 0; i--) {
            const area = this.areas[i]
            
            // 检查 hitArea
            const hitX = w * area.hitArea.xPercent
            const hitY = h * area.hitArea.yPercent
            const hitW = w * area.hitArea.widthPercent
            const hitH = h * area.hitArea.heightPercent
            
            if (x >= hitX && x <= hitX + hitW && y >= hitY && y <= hitY + hitH) {
                this.editMode = 'hitArea'
                return area
            }
            
            // 检查 labelArea
            const labelX = w * area.labelArea.xPercent
            const labelY = h * area.labelArea.yPercent
            const labelH = area.labelArea.height
            this.ctx.font = `${area.style.fontSize || 12}px Arial`
            const textWidth = this.ctx.measureText(area.label).width
            const labelW = textWidth + (area.labelArea.paddingX || 10) * 2
            
            if (x >= labelX && x <= labelX + labelW && y >= labelY && y <= labelY + labelH) {
                this.editMode = 'labelArea'
                return area
            }
        }
        return null
    }
    
    getResizeHandleAt(x, y, areaX, areaY, areaW, areaH) {
        const handleSize = 15
        
        const handles = [
            { name: 'nw', x: areaX, y: areaY },
            { name: 'ne', x: areaX + areaW, y: areaY },
            { name: 'sw', x: areaX, y: areaY + areaH },
            { name: 'se', x: areaX + areaW, y: areaY + areaH }
        ]
        
        for (const handle of handles) {
            if (Math.abs(x - handle.x) < handleSize && Math.abs(y - handle.y) < handleSize) {
                return handle.name
            }
        }
        return null
    }
    
    handleToolbarClick(x, y, w, h) {
        const toolbarH = 50
        const btnWidth = 65
        const padding = 8
        
        const buttons = [
            { label: '新增', x: padding, action: 'add' },
            { label: '删除', x: padding + btnWidth + padding, action: 'delete' },
            { label: '切换', x: padding + (btnWidth + padding) * 2, action: 'toggle' },
            { label: '保存', x: padding + (btnWidth + padding) * 3, action: 'save' },
            { label: '导出', x: padding + (btnWidth + padding) * 4, action: 'export' }
        ]
        
        for (const btn of buttons) {
            if (x >= btn.x && x <= btn.x + btnWidth && 
                y >= h - toolbarH + 7 && y <= h - toolbarH + 7 + 36) {
                
                switch (btn.action) {
                    case 'add':
                        this.addArea()
                        break
                    case 'delete':
                        this.deleteSelectedArea()
                        break
                    case 'toggle':
                        this.toggleEditMode()
                        break
                    case 'save':
                        this.saveAreas()
                        break
                    case 'export':
                        this.exportConfig()
                        break
                }
                break
            }
        }
    }
}
