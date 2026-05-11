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
        console.log(`[UIManager] handleTouch: x=${x}, y=${y}`)
        if (this.modals.length > 0) {
            const modal = this.modals[this.modals.length - 1]
            this.handleModalTouch(modal, x, y)
            return
        }
        
        for (const btn of this.buttons) {
            console.log(`[UIManager] 检查按钮: ${btn.text}, 区域: (${btn.x}, ${btn.y}, ${btn.w}, ${btn.h})`)
            if (x >= btn.x && x <= btn.x + btn.w &&
                y >= btn.y && y <= btn.y + btn.h) {
                console.log(`[UIManager] 按钮被点击: ${btn.text}`)
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
                this.closeModal()
                if (modal.onConfirm) modal.onConfirm()
            }
            if (modal.cancelBtn && this.hitTest(x, y, modal.cancelBtn)) {
                this.closeModal()
                if (modal.onCancel) modal.onCancel()
            }
        } else if (modal.type === 'action') {
            if (modal.cancelBtn && this.hitTest(x, y, modal.cancelBtn)) {
                this.closeModal()
                return
            }
            
            for (const action of modal.actions || []) {
                if (this.hitTest(x, y, action)) {
                    if (action.callback) action.callback()
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
        // 使用 wx.showModal 替代 wx.showKeyboard，因为后者在小游戏环境中不被支持
        wx.showModal({
            title: '输入数量',
            content: `当前: ${modal.quantity}`,
            editable: true,
            placeholderText: '请输入数量',
            success: (res) => {
                if (res.confirm && res.content) {
                    const value = res.content.replace(/[^\d]/g, '')
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
                }
            }
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
        this.commitButtons()

        for (const btn of this.buttons) {
            renderer.drawButton(btn.x, btn.y, btn.w, btn.h, btn.text, btn.bgColor, btn.textColor, btn.fontSize)
        }
        
        for (const modal of this.modals) {
            this.renderModal(renderer, modal)
        }
    }
    
    wrapText(ctx, text, maxWidth) {
        const lines = []
        const paragraphs = text.split('\n')
        for (const paragraph of paragraphs) {
            if (paragraph === '') {
                lines.push({ text: '', type: 'empty' })
                continue
            }
            const isHeading = /^【.+】$/.test(paragraph)
            const type = isHeading ? 'heading' : 'body'
            let currentLine = ''
            for (let i = 0; i < paragraph.length; i++) {
                const testLine = currentLine + paragraph[i]
                const metrics = ctx.measureText(testLine)
                if (metrics.width > maxWidth && currentLine !== '') {
                    lines.push({ text: currentLine, type })
                    currentLine = paragraph[i]
                } else {
                    currentLine = testLine
                }
            }
            if (currentLine) {
                lines.push({ text: currentLine, type })
            }
        }
        return lines
    }
    
    renderModal(renderer, modal) {
        const ctx = renderer.ctx
        const w = renderer.width
        const h = renderer.height
        
        ctx.fillStyle = 'rgba(180, 195, 210, 0.45)'
        ctx.fillRect(0, 0, w, h)
        
        const modalW = w * 0.85
        const modalH = modal.height || 180
        const modalX = (w - modalW) / 2
        const modalY = (h - modalH) / 2
        
        const radius = modal.isNewspaper ? 16 : Math.max(modalH * 0.15, 15)
        
        ctx.save()
        ctx.fillStyle = modal.isNewspaper ? '#FFF8F0' : '#FFF5E6'
        ctx.strokeStyle = '#2D2D2D'
        ctx.lineWidth = 2
        
        this.drawRoundRect(ctx, modalX, modalY, modalW, modalH, radius)
        ctx.fill()
        ctx.stroke()
        
        if (modal.isNewspaper && modal.backgroundImageLoaded && modal.backgroundImage) {
            ctx.save()
            this.drawRoundRect(ctx, modalX, modalY, modalW, modalH, radius)
            ctx.clip()
            ctx.globalAlpha = 0.15
            const img = modal.backgroundImage
            const imgRatio = img.width / img.height
            const modalRatio = modalW / modalH
            let drawW, drawH, drawX, drawY
            if (imgRatio > modalRatio) {
                drawH = modalH
                drawW = modalH * imgRatio
                drawX = modalX - (drawW - modalW) / 2
                drawY = modalY
            } else {
                drawW = modalW
                drawH = modalW / imgRatio
                drawX = modalX
                drawY = modalY - (drawH - modalH) / 2
            }
            ctx.drawImage(img, drawX, drawY, drawW, drawH)
            ctx.restore()
        }
        
        ctx.shadowColor = 'rgba(93, 64, 55, 0.15)'
        ctx.shadowBlur = 12
        ctx.shadowOffsetY = 4
        ctx.fill()
        ctx.restore()
        
        ctx.strokeStyle = '#2D2D2D'
        ctx.lineWidth = 1.5
        this.drawRoundRect(ctx, modalX, modalY, modalW, modalH, radius)
        ctx.stroke()
        
        const titleColor = '#5D4037'
        const contentColor = '#4A5568'
        const titleY = modal.isNewspaper ? modalY + 35 : modalY + 30
        const contentStartY = modal.isNewspaper ? modalY + 70 : modalY + 65
        
        if (modal.isNewspaper) {
            renderer.drawText(modal.title, modalX + modalW / 2, titleY, titleColor, 18, 'center')
            
            const decorLineY = titleY + 14
            const decorLineW = modalW * 0.5
            const decorLineX = modalX + (modalW - decorLineW) / 2
            ctx.strokeStyle = 'rgba(93, 64, 55, 0.3)'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(decorLineX, decorLineY)
            ctx.lineTo(decorLineX + decorLineW, decorLineY)
            ctx.stroke()
        } else {
            ctx.font = 'bold 16px sans-serif'
            ctx.fillStyle = titleColor
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.fillText(modal.title, modalX + 20, titleY)
        }
        
        const contentFontSize = modal.isNewspaper ? 14 : 13
        const contentPadding = modal.isNewspaper ? 30 : 20
        const maxTextWidth = modalW - contentPadding * 2
        ctx.font = `${contentFontSize}px sans-serif`
        const wrappedLines = this.wrapText(ctx, modal.content, maxTextWidth)
        
        const maxContentY = modalY + modalH - 60
        let lineY = contentStartY
        let prevType = null
        for (const lineObj of wrappedLines) {
            if (lineY > maxContentY) break
            if (lineObj.type === 'empty') {
                if (prevType === 'body') {
                    lineY += 6
                }
                lineY += 8
                prevType = 'empty'
                continue
            }
            if (lineObj.type === 'heading' && prevType && prevType !== 'empty') {
                lineY += 6
            }
            if (modal.isNewspaper) {
                if (lineObj.type === 'heading') {
                    ctx.font = `bold ${contentFontSize}px sans-serif`
                    renderer.drawText(lineObj.text, modalX + contentPadding, lineY, '#5D4037', contentFontSize, 'left')
                    ctx.font = `${contentFontSize}px sans-serif`
                } else {
                    const hotMatch = lineObj.text.match(/^(.+?)([+-]\d+%)$/)
                    if (hotMatch) {
                        renderer.drawText(hotMatch[1], modalX + contentPadding, lineY, contentColor, contentFontSize, 'left')
                        ctx.font = `${contentFontSize}px sans-serif`
                        const labelWidth = ctx.measureText(hotMatch[1]).width
                        const changeColor = hotMatch[2].startsWith('+') ? '#C0392B' : '#2980B9'
                        renderer.drawText(hotMatch[2], modalX + contentPadding + labelWidth, lineY, changeColor, contentFontSize, 'left')
                    } else {
                        renderer.drawText(lineObj.text, modalX + contentPadding, lineY, contentColor, contentFontSize, 'left')
                    }
                }
            } else {
                renderer.drawText(lineObj.text, modalX + contentPadding, lineY, contentColor, contentFontSize, 'left')
            }
            lineY += 22
            prevType = lineObj.type
        }
        
        if (modal.type === 'confirm') {
            const btnY = modalY + modalH - 55
            const btnH = 38
            const btnRadius = btnH * 0.2
            
            if (modal.singleButton) {
                const btnW = 100
                modal.confirmBtn = { x: modalX + (modalW - btnW) / 2, y: btnY, w: btnW, h: btnH }
                this.drawGhibliButton(ctx, modal.confirmBtn.x, modal.confirmBtn.y, modal.confirmBtn.w, modal.confirmBtn.h, modal.confirmText || '确定', '#FFE080', '#5D4037', btnRadius)
            } else {
                const btnW = (modalW - 40) / 2
                
                modal.cancelBtn = { x: modalX + 15, y: btnY, w: btnW, h: btnH }
                modal.confirmBtn = { x: modalX + modalW - btnW - 15, y: btnY, w: btnW, h: btnH }
                
                this.drawGhibliButton(ctx, modal.cancelBtn.x, modal.cancelBtn.y, modal.cancelBtn.w, modal.cancelBtn.h, '取消', '#D4C4B0', '#5D4037', btnRadius)
                this.drawGhibliButton(ctx, modal.confirmBtn.x, modal.confirmBtn.y, modal.confirmBtn.w, modal.confirmBtn.h, modal.confirmText || '确定', '#FFE080', '#5D4037', btnRadius)
            }
        } else if (modal.type === 'action') {
            const btnY = modalY + modalH - 55
            const btnH = 38
            const btnRadius = btnH * 0.2
            const hasCancel = modal.showCancel !== false
            const actionCount = modal.actions.length + (hasCancel ? 1 : 0)
            const btnW = (modalW - 30) / actionCount - 8
            const startX = modalX + 15
            
            modal.actions.forEach((action, i) => {
                action.x = startX + i * (btnW + 8)
                action.y = btnY
                action.w = btnW
                action.h = btnH
                this.drawGhibliButton(ctx, action.x, action.y, action.w, action.h, action.text, action.color || '#FFE080', '#5D4037', btnRadius)
            })
            
            if (hasCancel) {
                modal.cancelBtn = {
                    x: startX + modal.actions.length * (btnW + 8),
                    y: btnY,
                    w: btnW,
                    h: btnH
                }
                this.drawGhibliButton(ctx, modal.cancelBtn.x, modal.cancelBtn.y, modal.cancelBtn.w, modal.cancelBtn.h, '取消', '#D4C4B0', '#5D4037', btnRadius)
            }
        } else if (modal.type === 'trade') {
            const infoY = modalY + 55
            ctx.font = 'bold 15px sans-serif'
            ctx.fillStyle = '#5D4037'
            ctx.textAlign = 'left'
            ctx.textBaseline = 'middle'
            ctx.fillText(modal.itemName, modalX + 20, infoY)
            
            ctx.font = '14px sans-serif'
            ctx.fillStyle = '#E6C966'
            ctx.textAlign = 'right'
            ctx.fillText(`单价: ${modal.price}`, modalX + modalW - 20, infoY)
            
            const qtyY = infoY + 40
            ctx.font = '13px sans-serif'
            ctx.fillStyle = '#4A5568'
            ctx.textAlign = 'left'
            ctx.fillText('数量:', modalX + 20, qtyY)
            
            const btnSize = 34
            const qtyW = 70
            const qtyX = modalX + modalW - 20 - qtyW - btnSize * 2
            
            modal.minusBtn = { x: qtyX, y: qtyY - 17, w: btnSize, h: btnSize }
            modal.plusBtn = { x: qtyX + btnSize + qtyW, y: qtyY - 17, w: btnSize, h: btnSize }
            modal.qtyInput = { x: qtyX + btnSize, y: qtyY - 17, w: qtyW, h: btnSize }
            
            this.drawGhibliButton(ctx, modal.minusBtn.x, modal.minusBtn.y, modal.minusBtn.w, modal.minusBtn.h, '-', '#FFE080', '#5D4037', btnSize * 0.2)
            this.drawGhibliButton(ctx, modal.plusBtn.x, modal.plusBtn.y, modal.plusBtn.w, modal.plusBtn.h, '+', '#FFE080', '#5D4037', btnSize * 0.2)
            
            ctx.fillStyle = 'rgba(255, 245, 230, 0.9)'
            ctx.strokeStyle = '#2D2D2D'
            ctx.lineWidth = 1.5
            this.drawRoundRect(ctx, modal.qtyInput.x, modal.qtyInput.y, modal.qtyInput.w, modal.qtyInput.h, 8)
            ctx.fill()
            ctx.stroke()
            
            ctx.font = 'bold 14px sans-serif'
            ctx.fillStyle = '#5D4037'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(`${modal.quantity}`, modal.qtyInput.x + modal.qtyInput.w / 2, modal.qtyInput.y + modal.qtyInput.h / 2)
            
            const totalY = qtyY + 40
            ctx.fillStyle = 'rgba(255, 224, 128, 0.3)'
            ctx.strokeStyle = '#2D2D2D'
            ctx.lineWidth = 1
            this.drawRoundRect(ctx, modalX + 15, totalY - 15, modalW - 30, 34, 8)
            ctx.fill()
            ctx.stroke()
            
            ctx.font = 'bold 13px sans-serif'
            ctx.fillStyle = '#4A5568'
            ctx.textAlign = 'left'
            ctx.fillText('总价:', modalX + 25, totalY)
            
            ctx.font = 'bold 16px sans-serif'
            ctx.fillStyle = '#5D4037'
            ctx.textAlign = 'right'
            ctx.fillText(`${modal.total}`, modalX + modalW - 25, totalY)
            
            const btnY = modalY + modalH - 55
            const smallBtnW = 50
            const smallBtnH = 38
            const smallBtnRadius = smallBtnH * 0.2
            
            modal.closeBtn = { x: modalX + 15, y: btnY, w: smallBtnW, h: smallBtnH }
            modal.confirmBtn = { x: modalX + modalW - smallBtnW - 15, y: btnY, w: smallBtnW, h: smallBtnH }
            
            this.drawGhibliButton(ctx, modal.closeBtn.x, modal.closeBtn.y, modal.closeBtn.w, modal.closeBtn.h, '✕', '#D4C4B0', '#5D4037', smallBtnRadius)
            this.drawGhibliButton(ctx, modal.confirmBtn.x, modal.confirmBtn.y, modal.confirmBtn.w, modal.confirmBtn.h, '✓', modal.tradeType === 'buy' ? '#81C784' : '#FFE080', '#5D4037', smallBtnRadius)
        }
    }
    
    drawGhibliButton(ctx, x, y, w, h, text, bgColor, textColor, radius) {
        ctx.save()
        ctx.fillStyle = bgColor
        ctx.strokeStyle = '#2D2D2D'
        ctx.lineWidth = 1.5
        
        this.drawRoundRect(ctx, x, y, w, h, radius)
        ctx.fill()
        ctx.stroke()
        
        ctx.fillStyle = textColor
        ctx.font = `bold 13px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, x + w / 2, y + h / 2)
        
        ctx.restore()
    }
}