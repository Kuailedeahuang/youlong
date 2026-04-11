export default class UIManager {
    constructor(game) {
        this.game = game
        this.buttons = []
        this.modals = []
        this.pendingButtons = []
    }
    
    clear() {
        this.pendingButtons = []
    }
    
    clearAll() {
        this.buttons = []
        this.modals = []
        this.pendingButtons = []
    }
    
    addButton(x, y, w, h, text, callback, style = {}) {
        this.pendingButtons.push({
            x, y, w, h, text, callback,
            bgColor: style.bgColor || '#34495e',
            textColor: style.textColor || '#ffffff',
            fontSize: style.fontSize || 12,
            icon: style.icon || null
        })
    }
    
    commitButtons() {
        this.buttons = this.pendingButtons.slice()
    }
    
    addModal(modal) {
        this.modals.push(modal)
    }
    
    closeModal() {
        this.modals.pop()
    }
    
    closeAllModals() {
        this.modals = []
    }
    
    handleTouch(x, y) {
        if (this.modals.length > 0) {
            const modal = this.modals[this.modals.length - 1]
            this.handleModalTouch(modal, x, y)
            return
        }
        
        for (const btn of this.buttons) {
            if (x >= btn.x && x <= btn.x + btn.w &&
                y >= btn.y && y <= btn.y + btn.h) {
                if (btn.callback) {
                    btn.callback()
                }
                break
            }
        }
    }
    
    handleModalTouch(modal, x, y) {
        if (modal.type === 'confirm') {
            if (modal.confirmBtn && this.hitTest(x, y, modal.confirmBtn)) {
                if (modal.onConfirm) modal.onConfirm()
                this.closeModal()
            }
            if (modal.cancelBtn && this.hitTest(x, y, modal.cancelBtn)) {
                if (modal.onCancel) modal.onCancel()
                this.closeModal()
            }
        } else if (modal.type === 'action') {
            // 检查是否点击了取消按钮
            if (modal.cancelBtn && this.hitTest(x, y, modal.cancelBtn)) {
                this.closeModal()
                return
            }
            
            for (const action of modal.actions || []) {
                if (this.hitTest(x, y, action)) {
                    if (action.callback) action.callback()
                    // 注意：callback中可能会打开新弹窗，所以不自动关闭
                    break
                }
            }
        } else if (modal.type === 'trade') {
            if (modal.closeBtn && this.hitTest(x, y, modal.closeBtn)) {
                this.closeModal()
                return
            }
            if (modal.minusBtn && this.hitTest(x, y, modal.minusBtn)) {
                modal.quantity = Math.max(1, modal.quantity - 1)
                modal.total = modal.quantity * modal.price
            }
            if (modal.plusBtn && this.hitTest(x, y, modal.plusBtn)) {
                modal.quantity = Math.min(modal.maxQuantity, modal.quantity + 1)
                modal.total = modal.quantity * modal.price
            }
            if (modal.qtyInput && this.hitTest(x, y, modal.qtyInput)) {
                this.showQuantityInput(modal)
            }
            if (modal.confirmBtn && this.hitTest(x, y, modal.confirmBtn)) {
                if (modal.onConfirm) modal.onConfirm(modal.quantity, modal.total)
                this.closeModal()
            }
        }
    }
    
    hitTest(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.w &&
               y >= rect.y && y <= rect.y + rect.h
    }
    
    showQuantityInput(modal) {
        wx.showKeyboard({
            defaultValue: String(modal.quantity),
            maxLength: 10,
            multiple: false,
            confirmHold: false,
            confirmType: 'done',
            success: (res) => {
            },
            fail: (res) => {
                console.log('键盘弹出失败', res)
            }
        })
        
        wx.onKeyboardInput((res) => {
            const value = res.value.replace(/[^\d]/g, '')
            if (value) {
                let num = parseInt(value)
                if (num > modal.maxQuantity) {
                    num = modal.maxQuantity
                }
                if (num < 1) {
                    num = 1
                }
                modal.quantity = num
                modal.total = modal.quantity * modal.price
            }
        })
        
        wx.onKeyboardConfirm((res) => {
            const value = res.value.replace(/[^\d]/g, '')
            if (value) {
                let num = parseInt(value)
                if (num > modal.maxQuantity) {
                    num = modal.maxQuantity
                }
                if (num < 1) {
                    num = 1
                }
                modal.quantity = num
                modal.total = modal.quantity * modal.price
            }
            wx.hideKeyboard()
        })
        
        wx.onKeyboardComplete(() => {
            wx.offKeyboardInput()
            wx.offKeyboardConfirm()
            wx.offKeyboardComplete()
        })
    }
    
    drawRoundRect(ctx, x, y, w, h, r) {
        ctx.beginPath()
        ctx.moveTo(x + r, y)
        ctx.lineTo(x + w - r, y)
        ctx.arcTo(x + w, y, x + w, y + r, r)
        ctx.lineTo(x + w, y + h - r)
        ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
        ctx.lineTo(x + r, y + h)
        ctx.arcTo(x, y + h, x, y + h - r, r)
        ctx.lineTo(x, y + r)
        ctx.arcTo(x, y, x + r, y, r)
        ctx.closePath()
    }
    
    render(renderer) {
        for (const btn of this.pendingButtons) {
            renderer.drawButton(btn.x, btn.y, btn.w, btn.h, btn.text, btn.bgColor, btn.textColor, btn.fontSize)
        }
        
        for (const modal of this.modals) {
            this.renderModal(renderer, modal)
        }
        
        this.commitButtons()
    }
    
    renderModal(renderer, modal) {
        const ctx = renderer.ctx
        const w = renderer.width
        const h = renderer.height
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, w, h)
        
        const modalW = w * 0.85
        const modalH = modal.height || 180
        const modalX = (w - modalW) / 2
        const modalY = (h - modalH) / 2
        
        if (modal.backgroundImageLoaded && modal.backgroundImage) {
            ctx.save()
            this.drawRoundRect(ctx, modalX, modalY, modalW, modalH, 12)
            ctx.clip()
            
            const img = modal.backgroundImage
            const imgRatio = img.width / img.height
            const modalRatio = modalW / modalH
            
            let drawW, drawH, drawX, drawY
            
            // 使用 cover 模式，确保图片填满整个弹窗
            if (imgRatio > modalRatio) {
                // 图片更宽，以高度为基准，宽度溢出
                drawH = modalH
                drawW = drawH * imgRatio
                drawX = modalX - (drawW - modalW) / 2
                drawY = modalY
            } else {
                // 图片更高，以宽度为基准，高度溢出
                drawW = modalW
                drawH = drawW / imgRatio
                drawX = modalX
                drawY = modalY - (drawH - modalH) / 2
            }
            
            // 确保图片至少填满弹窗，可以更大
            const scale = Math.max(modalW / drawW, modalH / drawH)
            if (scale > 1) {
                drawW *= scale
                drawH *= scale
                drawX = modalX - (drawW - modalW) / 2
                drawY = modalY - (drawH - modalH) / 2
            }
            
            ctx.drawImage(img, drawX, drawY, drawW, drawH)
            ctx.restore()
            
            // 报纸弹窗不添加半透明底色，直接使用报纸背景
            // 只在非报纸弹窗时添加半透明遮罩
            if (!modal.isNewspaper) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
                this.drawRoundRect(ctx, modalX, modalY, modalW, modalH, 12)
                ctx.fill()
            }
        } else {
            ctx.fillStyle = '#1a1a2e'
            this.drawRoundRect(ctx, modalX, modalY, modalW, modalH, 12)
            ctx.fill()
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 1
        ctx.stroke()
        
        // 报纸弹窗使用深色文字以便在报纸背景上显示
        const titleColor = modal.isNewspaper ? '#1a1a2e' : '#f39c12'
        const contentColor = modal.isNewspaper ? '#2d3748' : '#bdc3c7'
        const titleY = modal.isNewspaper ? modalY + 35 : modalY + 25
        const contentStartY = modal.isNewspaper ? modalY + 70 : modalY + 55
        
        renderer.drawText(modal.title, modalX + 15, titleY, titleColor, 16, 'left')
        
        const lines = modal.content.split('\n')
        let lineY = contentStartY
        for (const line of lines) {
            renderer.drawText(line, modalX + 15, lineY, contentColor, 12, 'left')
            lineY += 20
        }
        
        if (modal.type === 'confirm') {
            const btnY = modalY + modalH - 45
            
            if (modal.singleButton) {
                // 按钮宽度调小并居中
                const btnW = 100
                modal.confirmBtn = { x: modalX + (modalW - btnW) / 2, y: btnY, w: btnW, h: 32 }
                renderer.drawButton(modal.confirmBtn.x, modal.confirmBtn.y, modal.confirmBtn.w, modal.confirmBtn.h, modal.confirmText || '确定', '#f39c12')
            } else {
                const btnW = (modalW - 30) / 2
                
                modal.cancelBtn = { x: modalX + 10, y: btnY, w: btnW, h: 40 }
                modal.confirmBtn = { x: modalX + btnW + 20, y: btnY, w: btnW, h: 40 }
                
                renderer.drawButton(modal.cancelBtn.x, modal.cancelBtn.y, modal.cancelBtn.w, modal.cancelBtn.h, '取消', '#7f8c8d')
                renderer.drawButton(modal.confirmBtn.x, modal.confirmBtn.y, modal.confirmBtn.w, modal.confirmBtn.h, modal.confirmText || '确定', '#f39c12')
            }
        } else if (modal.type === 'action') {
            const btnY = modalY + modalH - 50
            const hasCancel = modal.showCancel !== false // 默认显示取消按钮
            const actionCount = modal.actions.length + (hasCancel ? 1 : 0)
            const btnW = (modalW - 20) / actionCount - 5
            
            modal.actions.forEach((action, i) => {
                action.x = modalX + 10 + i * (btnW + 5)
                action.y = btnY
                action.w = btnW
                action.h = 40
                renderer.drawButton(action.x, action.y, action.w, action.h, action.text, action.color || '#3498db')
            })
            
            // 添加取消按钮
            if (hasCancel) {
                modal.cancelBtn = {
                    x: modalX + 10 + modal.actions.length * (btnW + 5),
                    y: btnY,
                    w: btnW,
                    h: 40
                }
                renderer.drawButton(modal.cancelBtn.x, modal.cancelBtn.y, modal.cancelBtn.w, modal.cancelBtn.h, '取消', '#7f8c8d')
            }
        } else if (modal.type === 'trade') {
            const infoY = modalY + 55
            renderer.drawText(`${modal.itemName}`, modalX + 15, infoY, '#ffffff', 14, 'left')
            renderer.drawText(`单价: ${modal.price}`, modalX + modalW - 15, infoY, '#f39c12', 12, 'right')
            
            const qtyY = infoY + 35
            renderer.drawText('数量:', modalX + 15, qtyY, '#7f8c8d', 12, 'left')
            
            const btnSize = 30
            const qtyW = 60
            const qtyX = modalX + modalW - 15 - qtyW - btnSize * 2
            
            modal.minusBtn = { x: qtyX, y: qtyY - 15, w: btnSize, h: btnSize }
            modal.plusBtn = { x: qtyX + btnSize + qtyW, y: qtyY - 15, w: btnSize, h: btnSize }
            modal.qtyInput = { x: qtyX + btnSize, y: qtyY - 15, w: qtyW, h: btnSize }
            
            renderer.drawButton(modal.minusBtn.x, modal.minusBtn.y, modal.minusBtn.w, modal.minusBtn.h, '-', '#3498db')
            renderer.drawButton(modal.plusBtn.x, modal.plusBtn.y, modal.plusBtn.w, modal.plusBtn.h, '+', '#3498db')
            
            renderer.drawRect(modal.qtyInput.x, modal.qtyInput.y, modal.qtyInput.w, modal.qtyInput.h, 'rgba(255,255,255,0.15)', 6)
            renderer.drawText(`${modal.quantity}`, modal.qtyInput.x + modal.qtyInput.w / 2, qtyY, '#ffffff', 14, 'center')
            
            const totalY = qtyY + 35
            renderer.drawRect(modalX + 10, totalY - 12, modalW - 20, 30, 'rgba(255,255,255,0.05)', 6)
            renderer.drawText('总价:', modalX + 20, totalY, '#7f8c8d', 12, 'left')
            renderer.drawText(`${modal.total}`, modalX + modalW - 20, totalY, '#f39c12', 14, 'right')
            
            const btnY = modalY + modalH - 50
            modal.closeBtn = { x: modalX + 10, y: btnY, w: 40, h: 40 }
            modal.confirmBtn = { x: modalX + modalW - 50, y: btnY, w: 40, h: 40 }
            
            renderer.drawButton(modal.closeBtn.x, modal.closeBtn.y, modal.closeBtn.w, modal.closeBtn.h, 'X', '#7f8c8d')
            renderer.drawButton(modal.confirmBtn.x, modal.confirmBtn.y, modal.confirmBtn.w, modal.confirmBtn.h, 'OK', modal.tradeType === 'buy' ? '#27ae60' : '#f39c12')
        }
    }
}
