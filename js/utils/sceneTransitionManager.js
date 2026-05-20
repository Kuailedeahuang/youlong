import iconManager from '../components/IconManager.js'

const PI = Math.PI
const TWO_PI = PI * 2
const sin = Math.sin
const cos = Math.cos
const abs = Math.abs
const pow = Math.pow
const sqrt = Math.sqrt
const random = Math.random
const min = Math.min
const max = Math.max
const round = Math.round

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v }

function lerp(a, b, t) { return a + (b - a) * t }

function easeOutCubic(t) {
    return 1 - pow(1 - t, 3)
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2
}

function easeOutBack(t) {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * pow(t - 1, 3) + c1 * pow(t - 1, 2)
}

function easeOutElastic(t) {
    if (t === 0 || t === 1) return t
    return pow(2, -10 * t) * sin((t * 10 - 0.75) * TWO_PI / 3) + 1
}

function pointOnCubic(t, p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
    var u = 1 - t
    var uu = u * u
    var uuu = uu * u
    var tt = t * t
    var ttt = tt * t
    return {
        x: uuu * p0x + 3 * uu * t * p1x + 3 * u * tt * p2x + ttt * p3x,
        y: uuu * p0y + 3 * uu * t * p1y + 3 * u * tt * p2y + ttt * p3y
    }
}

function tangentOnCubic(t, p0x, p0y, p1x, p1y, p2x, p2y, p3x, p3y) {
    var u = 1 - t
    var uu = u * u
    var tt = t * t
    var dx = 3 * uu * (p1x - p0x) + 6 * u * t * (p2x - p1x) + 3 * tt * (p3x - p2x)
    var dy = 3 * uu * (p1y - p0y) + 6 * u * t * (p2y - p1y) + 3 * tt * (p3y - p2y)
    return { x: dx, y: dy }
}

function dist(x1, y1, x2, y2) {
    var dx = x2 - x1
    var dy = y2 - y1
    return sqrt(dx * dx + dy * dy)
}

export default class SceneTransitionManager {
    constructor(game) {
        this.game = game
        this.active = false
        this.elapsed = 0
        this.style = 'travel'
        this.label = ''
        this.targetScene = ''
        this.overlayAlpha = 0
        this.phase = 'idle'

        this.fadeInDuration = 0.2
        this.minHoldDuration = 0.6
        this.fadeOutDuration = 0.3
        this.fadeOutStart = -1

        this._initTravelState()
        this._initExpandState()
    }

    _initTravelState() {
        this.travelClouds = []
        this.travelBuildings = []
        this.travelRoadBezier = null
        this.travelRoadMarkers = []
        this.travelCharProgress = 0
        this.travelFootprints = []
        this.travelBurstParticles = []
        this.travelDestinationIcon = null
        this.travelCharBobPhase = 0
        this.travelLabelChars = []
    }

    _initExpandState() {
        this.expandCreaseLines = []
        this.expandMapGridLines = []
        this.expandMapZones = []
        this.expandMapRiverPoints = null
        this.expandMapIcons = []
        this.expandCompassAngle = 0
        this.expandLocationPulse = 0
        this.expandFoldProgress = 0
        this.expandContentPhase = 0
    }

    // ==================== TRAVEL SETUP ====================

    startTravel(targetScene, label) {
        this.active = true
        this.elapsed = 0
        this.style = 'travel'
        this.targetScene = targetScene
        this.label = label
        this.overlayAlpha = 0
        this.phase = 'fadeIn'
        this.fadeOutStart = -1

        var w = this.game.renderer.width
        var h = this.game.renderer.height

        this._setupTravelClouds(w, h)
        this._setupTravelSkyline(w, h)
        this._setupTravelRoad(w, h)
        this._setupTravelCharacter()
        this._setupTravelLabel()
    }

    _setupTravelClouds(w, h) {
        this.travelClouds = []
        for (var i = 0; i < 4; i++) {
            this.travelClouds.push({
                x: w * 0.05 + random() * w * 0.9,
                y: h * 0.06 + i * h * 0.08 + random() * h * 0.04,
                scale: 0.5 + random() * 0.8,
                speed: 0.12 + random() * 0.2,
                opacity: 0.25 + random() * 0.25,
                bubbles: (function () {
                    var count = 3 + round(random() * 3)
                    var arr = []
                    for (var j = 0; j < count; j++) {
                        arr.push({
                            rx: 18 + random() * 28,
                            ry: 10 + random() * 14,
                            ox: (random() - 0.5) * 35,
                            oy: (random() - 0.5) * 8
                        })
                    }
                    return arr
                })()
            })
        }
    }

    _setupTravelSkyline(w, h) {
        this.travelBuildings = []
        var bx = w * 0.0
        var buildingColors = [
            'rgba(45,52,54,0.14)',
            'rgba(55,62,64,0.12)',
            'rgba(40,48,50,0.15)',
            'rgba(50,58,60,0.11)',
            'rgba(42,50,52,0.13)'
        ]
        while (bx < w) {
            var bw = 22 + random() * 50
            var bh = h * 0.08 + random() * h * 0.13
            var roofType = random() < 0.4 ? 'triangle' : random() < 0.3 ? 'flat' : 'flat'
            var hasAntenna = random() < 0.15
            var color = buildingColors[round(random() * (buildingColors.length - 1))]
            this.travelBuildings.push({
                x: bx,
                w: bw,
                h: bh,
                roofType: roofType,
                hasAntenna: hasAntenna,
                color: color,
                windowRows: 1 + round(random() * 2),
                windowCols: 1 + round(random() * 2)
            })
            bx += bw + random() * 8
        }
        this.travelBuildings[this.travelBuildings.length - 1].w = w - this.travelBuildings[this.travelBuildings.length - 1].x
    }

    _setupTravelRoad(w, h) {
        var margin = w * 0.06
        this.travelRoadBezier = {
            p0x: margin,
            p0y: h * 0.74,
            p1x: w * 0.2,
            p1y: h * 0.6,
            p2x: w * 0.6,
            p2y: h * 0.78,
            p3x: w - margin * 1.5,
            p3y: h * 0.7
        }

        this.travelRoadMarkers = []
        for (var i = 0; i < 7; i++) {
            var t = i / 6
            var p = pointOnCubic(t,
                this.travelRoadBezier.p0x, this.travelRoadBezier.p0y,
                this.travelRoadBezier.p1x, this.travelRoadBezier.p1y,
                this.travelRoadBezier.p2x, this.travelRoadBezier.p2y,
                this.travelRoadBezier.p3x, this.travelRoadBezier.p3y
            )
            this.travelRoadMarkers.push({
                x: p.x, y: p.y,
                phase: random() * TWO_PI,
                size: 1.5 + random() * 1.5
            })
        }

        this.travelDestinationIcon = {
            x: this.travelRoadBezier.p3x,
            y: this.travelRoadBezier.p3y - 18
        }
    }

    _setupTravelCharacter() {
        var bz = this.travelRoadBezier
        var startP = pointOnCubic(0, bz.p0x, bz.p0y, bz.p1x, bz.p1y, bz.p2x, bz.p2y, bz.p3x, bz.p3y)
        this.travelCharProgress = 0
        this.travelCharBobPhase = random() * TWO_PI
        this.travelCharPos = { x: startP.x, y: startP.y }
        this.travelFootprints = []
        this.travelBurstParticles = []
    }

    _setupTravelLabel() {
        this.travelLabelChars = []
        if (!this.label) return
        var displayText = this.label.replace('...', '')
        for (var i = 0; i < displayText.length; i++) {
            this.travelLabelChars.push({
                char: displayText[i],
                delay: i * 0.04,
                baseY: 0,
                opacity: 0
            })
        }
    }

    // ==================== EXPAND SETUP ====================

    startExpand() {
        this.active = true
        this.elapsed = 0
        this.style = 'expand'
        this.targetScene = 'map'
        this.label = ''
        this.overlayAlpha = 0
        this.phase = 'fadeIn'
        this.fadeOutStart = -1

        var w = this.game.renderer.width
        var h = this.game.renderer.height

        this._setupExpandCreaseLines(w, h)
        this._setupExpandMap(w, h)
        this.expandFoldProgress = 0
        this.expandContentPhase = 0
        this.expandCompassAngle = random() * TWO_PI
        this.expandLocationPulse = 0
    }

    _setupExpandCreaseLines(w, h) {
        this.expandCreaseLines = []
        var cx = w / 2
        var cy = h * 0.42
        var pw = w * 0.52
        var ph = pw * 0.75
        var left = cx - pw / 2
        var right = cx + pw / 2
        var top = cy - ph / 2
        var bottom = cy + ph / 2

        this.expandCreaseLines.push({
            x1: left, y1: cy, x2: right, y2: cy,
            label: 'horizontal'
        })
        this.expandCreaseLines.push({
            x1: left + pw * 0.3, y1: top, x2: left + pw * 0.3, y2: bottom,
            label: 'vertical1'
        })
        this.expandCreaseLines.push({
            x1: left + pw * 0.7, y1: top, x2: left + pw * 0.7, y2: bottom,
            label: 'vertical2'
        })

        this.expandPanelBounds = { x: left, y: top, w: pw, h: ph, cx: cx, cy: cy }
    }

    _setupExpandMap(w, h) {
        var pb = this.expandPanelBounds
        var margin = 14
        var innerX = pb.x + margin
        var innerY = pb.y + margin
        var innerW = pb.w - margin * 2
        var innerH = pb.h - margin * 2

        this.expandMapGridLines = []
        var rows = 3, cols = 3
        for (var r = 1; r < rows; r++) {
            var y = innerY + (innerH / rows) * r
            this.expandMapGridLines.push({ x1: innerX, y1: y, x2: innerX + innerW, y2: y, delay: 0.04 * r })
        }
        for (var c = 1; c < cols; c++) {
            var x = innerX + (innerW / cols) * c
            this.expandMapGridLines.push({ x1: x, y1: innerY, x2: x, y2: innerY + innerH, delay: 0.04 * c })
        }

        var cellW = innerW / cols
        var cellH = innerH / rows
        this.expandMapZones = [
            { col: 0, row: 0, colSpan: 2, rowSpan: 1, color: 'rgba(144,190,109,0.22)', label: '住宅', delay: 0.08 },
            { col: 2, row: 0, colSpan: 1, rowSpan: 1, color: 'rgba(100,175,210,0.22)', label: '商业', delay: 0.14 },
            { col: 0, row: 2, colSpan: 1, rowSpan: 1, color: 'rgba(155,145,135,0.22)', label: '工业', delay: 0.2 },
            { col: 1, row: 1, colSpan: 2, rowSpan: 2, color: 'rgba(100,175,210,0.18)', label: '市中心', delay: 0.26 }
        ]

        var zoneInnerX = innerX, zoneInnerY = innerY

        this.expandMapRiverControl = {
            startX: zoneInnerX + innerW * 0.05,
            startY: zoneInnerY + innerH * 0.6,
            cp1x: zoneInnerX + innerW * 0.35,
            cp1y: zoneInnerY + innerH * 0.75,
            cp2x: zoneInnerX + innerW * 0.55,
            cp2y: zoneInnerY + innerH * 0.35,
            endX: zoneInnerX + innerW * 0.92,
            endY: zoneInnerY + innerH * 0.55
        }

        this.expandMapIcons = []
        var iconDefs = [
            { name: 'home', icon: 'health', col: 0.5, row: 0.5, delay: 0.3, color: '#7CB87C', label: '家园' },
            { name: 'market', icon: 'coin', col: 2.5, row: 0.5, delay: 0.36, color: '#FFE080', label: '市场' },
            { name: 'bank', icon: 'bank', col: 2.5, row: 2, delay: 0.42, color: '#D4A574', label: '银行' },
            { name: 'hospital', icon: 'energy', col: 0.5, row: 2.5, delay: 0.48, color: '#7BA3C9', label: '医院' },
            { name: 'gym', icon: 'mood', col: 1.5, row: 1.5, delay: 0.54, color: '#D49BA3', label: '健身房' }
        ]
        for (var i = 0; i < iconDefs.length; i++) {
            var def = iconDefs[i]
            this.expandMapIcons.push({
                name: def.name,
                icon: def.icon,
                x: zoneInnerX + def.col * cellW,
                y: zoneInnerY + def.row * cellH,
                delay: def.delay,
                color: def.color,
                label: def.label,
                bounceStart: -1,
                bounceDone: false,
                scale: 0
            })
        }

        this.expandLocationMarker = {
            x: zoneInnerX + innerW * 0.5,
            y: zoneInnerY + innerH * 0.55
        }
        this.expandCompassPos = {
            x: zoneInnerX + innerW - 16,
            y: zoneInnerY + 16
        }
    }

    // ==================== RUNTIME ====================

    isTargetReady() {
        var sm = this.game.sceneManager
        if (!sm) return true
        return sm.sceneReadyState && sm.sceneReadyState[this.targetScene] !== false
    }

    isActive() {
        return this.active
    }

    update(dt) {
        if (!this.active) return
        this.elapsed += dt

        if (this.phase === 'fadeIn') {
            this.overlayAlpha = min(1, this.elapsed / this.fadeInDuration)
            if (this.elapsed >= this.fadeInDuration) {
                this.phase = 'hold'
                this.elapsed = this.fadeInDuration
                this.overlayAlpha = 1
            }
        } else if (this.phase === 'hold') {
            var holdElapsed = this.elapsed - this.fadeInDuration
            if (holdElapsed >= this.minHoldDuration && this.isTargetReady()) {
                this.phase = 'fadeOut'
                this.fadeOutStart = this.elapsed
            }
        } else if (this.phase === 'fadeOut') {
            var foElapsed = this.elapsed - this.fadeOutStart
            this.overlayAlpha = max(0, 1 - foElapsed / this.fadeOutDuration)
            if (foElapsed >= this.fadeOutDuration) {
                this.overlayAlpha = 0
                this.active = false
                this.phase = 'idle'
            }
        }

        if (this.style === 'travel') {
            this._updateTravel()
        } else if (this.style === 'expand') {
            this._updateExpand()
        }
    }

    _updateTravel() {
        var holdElapsed = this.elapsed - this.fadeInDuration
        var holdDuration = this.minHoldDuration
        if (holdElapsed < 0) holdElapsed = 0

        var progress = clamp(holdElapsed / max(holdDuration, 0.01), 0, 1)
        var easedProgress = easeInOutCubic(progress)
        this.travelCharProgress = easedProgress

        var bz = this.travelRoadBezier
        var pos = pointOnCubic(easedProgress, bz.p0x, bz.p0y, bz.p1x, bz.p1y, bz.p2x, bz.p2y, bz.p3x, bz.p3y)
        var tan = tangentOnCubic(easedProgress, bz.p0x, bz.p0y, bz.p1x, bz.p1y, bz.p2x, bz.p2y, bz.p3x, bz.p3y)
        this.travelCharAngle = Math.atan2(tan.y, tan.x)
        this.travelCharBobPhase += 0.15
        var bob = sin(this.travelCharBobPhase * 8) * 2
        this.travelCharPos = { x: pos.x, y: pos.y + bob }

        if (this.travelCharProgress >= 0.98 && this.travelBurstParticles.length === 0) {
            this._spawnBurstParticles(pos.x, pos.y - 10)
        }

        for (var i = this.travelBurstParticles.length - 1; i >= 0; i--) {
            var bp = this.travelBurstParticles[i]
            bp.life -= 0.02
            bp.x += bp.vx
            bp.y += bp.vy
            bp.vy += 0.05
            if (bp.life <= 0) {
                this.travelBurstParticles.splice(i, 1)
            }
        }

        if (this.travelCharProgress > 0.02) {
            if (this.travelFootprints.length === 0 ||
                dist(pos.x, pos.y, this.travelFootprints[this.travelFootprints.length - 1].x,
                    this.travelFootprints[this.travelFootprints.length - 1].y) > 14) {
                this.travelFootprints.push({ x: pos.x, y: pos.y + 6, alpha: 0.6, life: 1 })
            }
        }
        for (var j = this.travelFootprints.length - 1; j >= 0; j--) {
            var fp = this.travelFootprints[j]
            fp.life -= 0.012
            fp.alpha = fp.life * 0.6
            if (fp.life <= 0) {
                this.travelFootprints.splice(j, 1)
            }
        }

        if (this.travelFootprints.length > 8) {
            this.travelFootprints.splice(0, this.travelFootprints.length - 8)
        }

        for (var k = 0; k < this.travelClouds.length; k++) {
            this.travelClouds[k].x += this.travelClouds[k].speed * 0.15
            if (this.travelClouds[k].x > this.game.renderer.width + 60) {
                this.travelClouds[k].x = -60
            }
        }
    }

    _spawnBurstParticles(x, y) {
        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * TWO_PI + random() * 0.3
            var speed = 0.8 + random() * 1.2
            this.travelBurstParticles.push({
                x: x, y: y,
                vx: cos(angle) * speed,
                vy: sin(angle) * speed - 0.5,
                life: 1,
                size: 2 + random() * 2
            })
        }
    }

    _updateExpand() {
        var holdElapsed = this.elapsed - this.fadeInDuration
        if (holdElapsed < 0) holdElapsed = 0

        this.expandFoldProgress = clamp(holdElapsed / 0.2, 0, 1)
        this.expandContentPhase = clamp((holdElapsed - 0.1) / 0.4, 0, 1)

        this.expandCompassAngle += 0.005
        this.expandLocationPulse += 0.04

        for (var i = 0; i < this.expandMapIcons.length; i++) {
            var icon = this.expandMapIcons[i]
            if (this.elapsed >= icon.delay && !icon.bounceDone) {
                if (icon.bounceStart < 0) {
                    icon.bounceStart = this.elapsed
                }
                var bt = clamp((this.elapsed - icon.bounceStart) / 0.25, 0, 1)
                if (bt >= 1) {
                    icon.scale = 1
                    icon.bounceDone = true
                } else {
                    icon.scale = easeOutBack(bt)
                }
            }
        }
    }

    render(renderer) {
        if (!this.active) return
        var ctx = renderer.ctx
        var w = renderer.width
        var h = renderer.height

        ctx.save()
        ctx.globalAlpha = this.overlayAlpha

        if (this.style === 'travel') {
            this._renderTravel(ctx, w, h)
        } else if (this.style === 'expand') {
            this._renderExpand(ctx, w, h)
        }

        ctx.restore()
    }

    complete() {
        this.active = false
        this.phase = 'idle'
        this.elapsed = 0
        this.overlayAlpha = 0
    }

    // ==================== TRAVEL RENDER ====================

    _renderTravel(ctx, w, h) {
        this._renderTravelL1_Sky(ctx, w, h)
        this._renderTravelL2_Skyline(ctx, w, h)
        this._renderTravelL3_Road(ctx, w, h)
        this._renderTravelL4_Character(ctx, w, h)
        this._renderTravelL5_Label(ctx, w, h)
    }

    _renderTravelL1_Sky(ctx, w, h) {
        var gradient = ctx.createLinearGradient(0, 0, 0, h * 0.75)
        gradient.addColorStop(0, '#87CEEB')
        gradient.addColorStop(0.45, '#B0D4E8')
        gradient.addColorStop(0.75, '#E8C9A0')
        gradient.addColorStop(1, '#F0D8B0')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, w, h)

        for (var i = 0; i < this.travelClouds.length; i++) {
            var c = this.travelClouds[i]
            ctx.save()
            ctx.globalAlpha = c.opacity * ctx.globalAlpha
            ctx.fillStyle = '#FFFFFF'
            for (var j = 0; j < c.bubbles.length; j++) {
                var b = c.bubbles[j]
                ctx.beginPath()
                ctx.ellipse(c.x + b.ox * c.scale, c.y + b.oy * c.scale, b.rx * c.scale, b.ry * c.scale, 0, 0, TWO_PI)
                ctx.fill()
            }
            ctx.restore()
        }

        var time = this.elapsed
        for (var s = 0; s < 5; s++) {
            var sx = (s * w * 0.18 + 30) % w
            var sy = h * 0.08 + (s * h * 0.06) % (h * 0.15)
            var sAlpha = 0.3 + sin(time * 3 + s) * 0.25
            ctx.save()
            ctx.globalAlpha = sAlpha * ctx.globalAlpha
            ctx.fillStyle = '#FFFFFF'
            ctx.beginPath()
            ctx.arc(sx, sy, 1.2, 0, TWO_PI)
            ctx.fill()
            ctx.restore()
        }
    }

    _renderTravelL2_Skyline(ctx, w, h) {
        var baseY = h
        for (var i = 0; i < this.travelBuildings.length; i++) {
            var b = this.travelBuildings[i]
            var bx = b.x
            var bw = b.w
            var bh = b.h
            var by = baseY - bh

            ctx.fillStyle = b.color
            ctx.fillRect(bx, by, bw, bh)

            if (b.roofType === 'triangle') {
                ctx.beginPath()
                ctx.moveTo(bx - 2, by)
                ctx.lineTo(bx + bw / 2, by - bw * 0.3)
                ctx.lineTo(bx + bw + 2, by)
                ctx.closePath()
                ctx.fill()
            }

            if (b.hasAntenna) {
                ctx.strokeStyle = 'rgba(60,60,60,0.3)'
                ctx.lineWidth = 0.8
                ctx.beginPath()
                ctx.moveTo(bx + bw / 2, by - (b.roofType === 'triangle' ? bw * 0.3 : 0))
                ctx.lineTo(bx + bw / 2, by - 14)
                ctx.stroke()
            }

            var winW = bw / (b.windowCols + 1)
            var winH = bh / (b.windowRows + 2)
            for (var wr = 0; wr < b.windowRows; wr++) {
                for (var wc = 0; wc < b.windowCols; wc++) {
                    var wx = bx + winW * (wc + 1) - winW * 0.35
                    var wy = by + winH * (wr + 1)
                    ctx.fillStyle = 'rgba(255,240,180,0.25)'
                    ctx.fillRect(wx, wy, winW * 0.7, winH * 0.4)
                }
            }
        }
    }

    _renderTravelL3_Road(ctx, w, h) {
        var bz = this.travelRoadBezier
        var roadWidth = 10

        var offset = this.elapsed * 20
        ctx.save()
        ctx.strokeStyle = 'rgba(120,100,70,0.45)'
        ctx.lineWidth = roadWidth
        ctx.beginPath()
        ctx.moveTo(bz.p0x, bz.p0y)
        ctx.bezierCurveTo(bz.p1x, bz.p1y, bz.p2x, bz.p2y, bz.p3x, bz.p3y)
        ctx.stroke()

        ctx.strokeStyle = 'rgba(255,255,255,0.35)'
        ctx.lineWidth = 1.8
        ctx.setLineDash([8, 12])
        ctx.lineDashOffset = -offset
        ctx.beginPath()
        ctx.moveTo(bz.p0x, bz.p0y)
        ctx.bezierCurveTo(bz.p1x, bz.p1y, bz.p2x, bz.p2y, bz.p3x, bz.p3y)
        ctx.stroke()
        ctx.setLineDash([])
        ctx.restore()

        ctx.save()
        ctx.fillStyle = '#E8D5A0'
        ctx.strokeStyle = 'rgba(100,80,60,0.4)'
        ctx.lineWidth = 1.2
        var houseMargin = this.game.renderer.width * 0.06
        this._drawSmallHouse(ctx, houseMargin, bz.p0y - 10, 12)
        ctx.restore()

        var destX = this.travelDestinationIcon.x
        var destY = this.travelDestinationIcon.y
        ctx.save()
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.strokeStyle = 'rgba(180,140,80,0.5)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(destX, destY, 7, 0, TWO_PI)
        ctx.fill()
        ctx.stroke()
        var pulseR = 7 + sin(this.elapsed * 8) * 3
        ctx.globalAlpha = (0.35 - sin(this.elapsed * 8) * 0.15) * ctx.globalAlpha
        ctx.strokeStyle = 'rgba(200,160,100,0.5)'
        ctx.beginPath()
        ctx.arc(destX, destY, pulseR, 0, TWO_PI)
        ctx.stroke()
        ctx.restore()

        for (var m = 0; m < this.travelRoadMarkers.length; m++) {
            var mk = this.travelRoadMarkers[m]
            var mkAlpha = 0.25 + sin(this.elapsed * 4 + mk.phase) * 0.15
            ctx.save()
            ctx.globalAlpha = mkAlpha * ctx.globalAlpha
            ctx.fillStyle = '#FFD700'
            ctx.beginPath()
            ctx.moveTo(mk.x, mk.y - mk.size * 2)
            ctx.lineTo(mk.x - mk.size, mk.y)
            ctx.lineTo(mk.x + mk.size, mk.y)
            ctx.closePath()
            ctx.fill()
            ctx.restore()
        }
    }

    _drawSmallHouse(ctx, x, y, size) {
        var hw = size * 0.5
        var hh = size * 0.45
        ctx.fillRect(x - hw, y - hh, hw * 2, hh)
        ctx.beginPath()
        ctx.moveTo(x - hw - 2, y - hh)
        ctx.lineTo(x, y - hh - size * 0.35)
        ctx.lineTo(x + hw + 2, y - hh)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
    }

    _renderTravelL4_Character(ctx, w, h) {
        var pos = this.travelCharPos
        var bz = this.travelRoadBezier

        for (var i = 0; i < this.travelFootprints.length; i++) {
            var fp = this.travelFootprints[i]
            ctx.save()
            ctx.globalAlpha = fp.alpha * ctx.globalAlpha
            ctx.fillStyle = 'rgba(180,150,120,0.7)'
            ctx.beginPath()
            ctx.ellipse(fp.x, fp.y, 3, 1.2, 0, 0, TWO_PI)
            ctx.fill()
            ctx.restore()
        }

        ctx.save()
        ctx.translate(pos.x, pos.y)

        var bodyColor = 'rgba(60,50,40,0.8)'
        var headR = 4.5
        ctx.fillStyle = bodyColor
        ctx.beginPath()
        ctx.arc(0, -14, headR, 0, TWO_PI)
        ctx.fill()

        ctx.beginPath()
        ctx.moveTo(-4, -9.5)
        ctx.lineTo(4, -9.5)
        ctx.lineTo(5.5, -2)
        ctx.lineTo(-5.5, -2)
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = bodyColor
        ctx.fillRect(-4.5, -2, 2.5, 6)
        ctx.fillRect(2, -2, 2.5, 6)

        ctx.fillStyle = 'rgba(180,150,120,0.5)'
        ctx.beginPath()
        ctx.arc(0, headR - 16, 1.5, 0, TWO_PI)
        ctx.fill()

        ctx.restore()

        for (var j = 0; j < this.travelBurstParticles.length; j++) {
            var bp = this.travelBurstParticles[j]
            ctx.save()
            ctx.globalAlpha = bp.life * 0.7 * ctx.globalAlpha
            ctx.fillStyle = '#FFD700'
            ctx.beginPath()
            ctx.arc(bp.x, bp.y, bp.size, 0, TWO_PI)
            ctx.fill()
            ctx.restore()
        }
    }

    _renderTravelL5_Label(ctx, w, h) {
        if (!this.label || this.travelLabelChars.length === 0) return

        ctx.save()
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        var baseX = w / 2 - (this.travelLabelChars.length * 11) / 2 + 5.5
        var baseY = h * 0.18

        for (var i = 0; i < this.travelLabelChars.length; i++) {
            var ch = this.travelLabelChars[i]
            var charElapsed = this.elapsed - ch.delay
            if (charElapsed < 0) continue
            var bounce = sin(max(charElapsed, 0) * 12) * 3
            var alpha = clamp(charElapsed / 0.15, 0, 1)

            ctx.save()
            ctx.globalAlpha = alpha * ctx.globalAlpha
            ctx.fillStyle = '#3E3028'
            ctx.font = 'bold 14px sans-serif'
            ctx.fillText(ch.char, baseX + i * 13, baseY + bounce)
            ctx.restore()
        }

        var progressBarY = baseY + 22
        var barW = w * 0.3
        var barH = 3
        var barX = w / 2 - barW / 2

        ctx.fillStyle = 'rgba(180,160,140,0.25)'
        ctx.fillRect(barX, progressBarY, barW, barH)

        ctx.fillStyle = 'rgba(140,110,70,0.6)'
        ctx.fillRect(barX, progressBarY, barW * this.travelCharProgress, barH)

        ctx.restore()
    }

    // ==================== EXPAND RENDER ====================

    _renderExpand(ctx, w, h) {
        this._renderExpandL1_Paper(ctx, w, h)
        this._renderExpandL2_Creases(ctx, w, h)
        this._renderExpandL3_Map(ctx, w, h)
        this._renderExpandL4_Icons(ctx, w, h)
    }

    _renderExpandL1_Paper(ctx, w, h) {
        ctx.fillStyle = '#F5ECD7'
        ctx.fillRect(0, 0, w, h)

        ctx.save()
        ctx.globalAlpha = 0.03 * ctx.globalAlpha
        ctx.strokeStyle = '#8B7355'
        ctx.lineWidth = 0.6
        for (var i = 0; i < 5; i++) {
            var fy = h * 0.1 + (i * h * 0.18)
            ctx.beginPath()
            ctx.moveTo(w * 0.05, fy)
            var cx1 = w * 0.3 + (i % 3) * w * 0.08
            var cx2 = w * 0.6 + (i % 2) * w * 0.12
            ctx.bezierCurveTo(cx1, fy - 8, cx2, fy + 6, w * 0.95, fy + (i % 2 === 0 ? -4 : 4))
            ctx.stroke()
        }
        ctx.restore()
    }

    _renderExpandL2_Creases(ctx, w, h) {
        var fp = this.expandFoldProgress
        var pb = this.expandPanelBounds

        var scaleY = easeOutBack(min(fp, 1))
        var scaleX = lerp(0.3, 1, easeOutCubic(min(fp, 1)))

        var creaseAlpha = fp < 1 ? lerp(0.4, 0, fp) : 0

        ctx.save()
        ctx.translate(pb.cx, pb.cy)
        ctx.scale(scaleX, scaleY)
        ctx.translate(-pb.cx, -pb.cy)

        ctx.fillStyle = '#FDF6E8'
        ctx.strokeStyle = 'rgba(139,115,85,0.3)'
        ctx.lineWidth = 1.5

        var radius = 6
        ctx.beginPath()
        ctx.moveTo(pb.x + radius, pb.y)
        ctx.lineTo(pb.x + pb.w - radius, pb.y)
        ctx.arcTo(pb.x + pb.w, pb.y, pb.x + pb.w, pb.y + radius, radius)
        ctx.lineTo(pb.x + pb.w, pb.y + pb.h - radius)
        ctx.arcTo(pb.x + pb.w, pb.y + pb.h, pb.x + pb.w - radius, pb.y + pb.h, radius)
        ctx.lineTo(pb.x + radius, pb.y + pb.h)
        ctx.arcTo(pb.x, pb.y + pb.h, pb.x, pb.y + pb.h - radius, radius)
        ctx.lineTo(pb.x, pb.y + radius)
        ctx.arcTo(pb.x, pb.y, pb.x + radius, pb.y, radius)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()

        if (creaseAlpha > 0.01) {
            for (var c = 0; c < this.expandCreaseLines.length; c++) {
                var cl = this.expandCreaseLines[c]
                var lx1 = cl.x1, ly1 = cl.y1, lx2 = cl.x2, ly2 = cl.y2

                ctx.beginPath()
                ctx.strokeStyle = 'rgba(100,80,60,' + (creaseAlpha * 0.7) + ')'
                ctx.lineWidth = 1
                ctx.moveTo(lx1, ly1)
                ctx.lineTo(lx2, ly2)
                ctx.stroke()

                var nx = -(ly2 - ly1), ny = lx2 - lx1
                var len = sqrt(nx * nx + ny * ny)
                if (len > 0) { nx /= len; ny /= len }
                ctx.beginPath()
                ctx.strokeStyle = 'rgba(255,250,240,' + (creaseAlpha * 0.5) + ')'
                ctx.lineWidth = 0.8
                ctx.moveTo(lx1 + nx * 1.2, ly1 + ny * 1.2)
                ctx.lineTo(lx2 + nx * 1.2, ly2 + ny * 1.2)
                ctx.stroke()
            }
        }

        ctx.restore()
    }

    _renderExpandL3_Map(ctx, w, h) {
        var pb = this.expandPanelBounds
        var fp = min(this.expandFoldProgress, 1)
        if (fp < 0.6) return

        var scaleY = easeOutBack(fp)
        var scaleX = lerp(0.3, 1, easeOutCubic(fp))

        ctx.save()
        ctx.translate(pb.cx, pb.cy)
        ctx.scale(scaleX, scaleY)
        ctx.translate(-pb.cx, -pb.cy)

        var mapAlpha = clamp((fp - 0.6) / 0.4, 0, 1)
        var parentAlpha = ctx.globalAlpha

        ctx.save()
        ctx.globalAlpha = mapAlpha * parentAlpha
        ctx.strokeStyle = 'rgba(180,160,140,0.25)'
        ctx.lineWidth = 0.8

        var cp = this.expandContentPhase
        for (var i = 0; i < this.expandMapGridLines.length; i++) {
            var gl = this.expandMapGridLines[i]
            if (cp < gl.delay) continue
            var lineProgress = clamp((cp - gl.delay) / 0.15, 0, 1)
            var ex = lerp(gl.x1, gl.x2, lineProgress)
            var ey = lerp(gl.y1, gl.y2, lineProgress)
            ctx.beginPath()
            ctx.moveTo(gl.x1, gl.y1)
            ctx.lineTo(ex, ey)
            ctx.stroke()
        }

        for (var z = 0; z < this.expandMapZones.length; z++) {
            var zone = this.expandMapZones[z]
            if (cp < zone.delay) continue
            var zoneAlpha = clamp((cp - zone.delay) / 0.2, 0, 1)

            var margin = 14
            var innerX = pb.x + margin
            var innerY = pb.y + margin
            var innerW = pb.w - margin * 2
            var innerH = pb.h - margin * 2
            var cellW = innerW / 3
            var cellH = innerH / 3

            var zx = innerX + zone.col * cellW + 2
            var zy = innerY + zone.row * cellH + 2
            var zw = zone.colSpan * cellW - 4
            var zh = zone.rowSpan * cellH - 4

            ctx.save()
            ctx.globalAlpha = zoneAlpha * mapAlpha * parentAlpha
            ctx.fillStyle = zone.color
            var zr = 4
            ctx.beginPath()
            ctx.moveTo(zx + zr, zy)
            ctx.lineTo(zx + zw - zr, zy)
            ctx.arcTo(zx + zw, zy, zx + zw, zy + zr, zr)
            ctx.lineTo(zx + zw, zy + zh - zr)
            ctx.arcTo(zx + zw, zy + zh, zx + zw - zr, zy + zh, zr)
            ctx.lineTo(zx + zr, zy + zh)
            ctx.arcTo(zx, zy + zh, zx, zy + zh - zr, zr)
            ctx.lineTo(zx, zy + zr)
            ctx.arcTo(zx, zy, zx + zr, zy, zr)
            ctx.closePath()
            ctx.fill()
            ctx.restore()
        }

        if (cp > 0.35) {
            var rc = this.expandMapRiverControl
            ctx.save()
            ctx.globalAlpha = clamp((cp - 0.35) / 0.25, 0, 1) * mapAlpha * parentAlpha
            ctx.strokeStyle = 'rgba(130,180,210,0.45)'
            ctx.lineWidth = 3.5
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(rc.startX, rc.startY)
            ctx.bezierCurveTo(rc.cp1x, rc.cp1y, rc.cp2x, rc.cp2y, rc.endX, rc.endY)
            ctx.stroke()
            ctx.restore()
        }

        ctx.restore()
        ctx.restore()
    }

    _renderExpandL4_Icons(ctx, w, h) {
        var pb = this.expandPanelBounds
        var fp = min(this.expandFoldProgress, 1)
        if (fp < 0.8) return

        var scaleY = easeOutBack(fp)
        var scaleX = lerp(0.3, 1, easeOutCubic(fp))

        ctx.save()
        ctx.translate(pb.cx, pb.cy)
        ctx.scale(scaleX, scaleY)
        ctx.translate(-pb.cx, -pb.cy)

        for (var i = 0; i < this.expandMapIcons.length; i++) {
            var icon = this.expandMapIcons[i]
            if (!icon.bounceDone && icon.scale < 0.01) continue

            ctx.save()
            ctx.globalAlpha = (icon.bounceDone ? 1 : clamp(icon.scale, 0, 1)) * ctx.globalAlpha
            ctx.translate(icon.x, icon.y)
            ctx.scale(icon.scale, icon.scale)
            iconManager.draw(ctx, icon.icon, 0, 0, { size: 'xs' })
            ctx.restore()

            if (icon.bounceDone) {
                ctx.save()
                ctx.globalAlpha = 0.7 * ctx.globalAlpha
                ctx.fillStyle = '#5C4A3A'
                ctx.font = '8px sans-serif'
                ctx.textAlign = 'center'
                ctx.textBaseline = 'top'
                ctx.fillText(icon.label, icon.x, icon.y + 8)
                ctx.restore()
            }
        }

        var lm = this.expandLocationMarker
        var pulse = sin(this.expandLocationPulse * 3) * 0.4 + 0.6
        ctx.save()
        ctx.fillStyle = 'rgba(200,70,50,0.8)'
        ctx.beginPath()
        ctx.arc(lm.x, lm.y, 2.5, 0, TWO_PI)
        ctx.fill()
        ctx.strokeStyle = 'rgba(200,70,50,' + (pulse * 0.4) + ')'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.arc(lm.x, lm.y, 4.5 + pulse * 3, 0, TWO_PI)
        ctx.stroke()
        ctx.restore()

        var cp = this.expandCompassPos
        var ca = this.expandCompassAngle
        ctx.save()
        ctx.translate(cp.x, cp.y)
        ctx.strokeStyle = 'rgba(120,100,70,0.5)'
        ctx.lineWidth = 0.8
        ctx.beginPath()
        ctx.arc(0, 0, 7, 0, TWO_PI)
        ctx.stroke()
        ctx.fillStyle = '#C17B6B'
        ctx.beginPath()
        ctx.moveTo(0, -5)
        ctx.lineTo(-2, 3)
        ctx.lineTo(2, 3)
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#7BA3C9'
        ctx.beginPath()
        ctx.moveTo(0, 5)
        ctx.lineTo(-2, -3)
        ctx.lineTo(2, -3)
        ctx.closePath()
        ctx.fill()
        ctx.restore()

        ctx.restore()
    }
}