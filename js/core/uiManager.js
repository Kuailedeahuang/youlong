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
            for (const action of modal.actions || []) {
                if (this.hitTest(x, y, action)) {
                    if (action.callback) action.callback()
                    this.closeModal()
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
        
        ctx.fillStyle = '#1a1a2e'
        this.drawRoundRect(ctx, modalX, modalY, modalW, modalH, 12)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.lineWidth = 1
        ctx.stroke()
        
        renderer.drawText(modal.title, modalX + 15, modalY + 25, '#f39c12', 16, 'left')
        
        const lines = modal.content.split('\n')
        let lineY = modalY + 55
        for (const line of lines) {
            renderer.drawText(line, modalX + 15, lineY, '#bdc3c7', 12, 'left')
            lineY += 20
        }
        
        if (modal.type === 'confirm') {
            const btnY = modalY + modalH - 50
            const btnW = (modalW - 30) / 2
            
            modal.cancelBtn = { x: modalX + 10, y: btnY, w: btnW, h: 40 }
            modal.confirmBtn = { x: modalX + btnW + 20, y: btnY, w: btnW, h: 40 }
            
            renderer.drawButton(modal.cancelBtn.x, modal.cancelBtn.y, modal.cancelBtn.w, modal.cancelBtn.h, '取消', '#7f8c8d')
            renderer.drawButton(modal.confirmBtn.x, modal.confirmBtn.y, modal.confirmBtn.w, modal.confirmBtn.h, modal.confirmText || '确定', '#f39c12')
        } else if (modal.type === 'action') {
            const btnY = modalY + modalH - 50
            const btnW = (modalW - 20) / modal.actions.length - 5
            
            modal.actions.forEach((action, i) => {
                action.x = modalX + 10 + i * (btnW + 5)
                action.y = btnY
                action.w = btnW
                action.h = 40
                renderer.drawButton(action.x, action.y, action.w, action.h, action.text, action.color || '#3498db')
            })
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
            
            renderer.drawButton(modal.minusBtn.x, modal.minusBtn.y, modal.minusBtn.w, modal.minusBtn.h, '-', '#3498db')
            renderer.drawButton(modal.plusBtn.x, modal.plusBtn.y, modal.plusBtn.w, modal.plusBtn.h, '+', '#3498db')
            
            renderer.drawRect(qtyX + btnSize, qtyY - 15, qtyW, btnSize, 'rgba(255,255,255,0.1)', 6)
            renderer.drawText(`${modal.quantity}`, qtyX + btnSize + qtyW / 2, qtyY, '#ffffff', 14, 'center')
            
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
