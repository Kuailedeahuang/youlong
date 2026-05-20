export default class TimeProvider {
    constructor() {
        this._lastTimestamp = 0
        this._deltaTime = 0
        this._elapsed = 0
        this._paused = false
        this._timeScale = 1.0
    }

    update(timestamp) {
        if (this._lastTimestamp === 0) {
            this._lastTimestamp = timestamp
            return
        }

        if (this._paused) {
            this._deltaTime = 0
            return
        }

        const rawDelta = (timestamp - this._lastTimestamp) / 1000
        this._deltaTime = rawDelta * this._timeScale
        this._elapsed += this._deltaTime
        this._lastTimestamp = timestamp
    }

    get deltaTime() {
        return this._deltaTime
    }

    get deltaTimeMs() {
        return this._deltaTime * 1000
    }

    get elapsed() {
        return this._elapsed
    }

    get normalizedDelta() {
        return this._deltaTime / (1 / 60)
    }

    pause() {
        this._paused = true
    }

    resume() {
        this._paused = false
        this._lastTimestamp = 0
    }

    setTimeScale(scale) {
        this._timeScale = Math.max(0, Math.min(2, scale))
    }

    reset() {
        this._elapsed = 0
        this._lastTimestamp = 0
        this._deltaTime = 0
    }
}
