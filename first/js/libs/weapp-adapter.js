window.canvas = wx.createCanvas();
window.innerWidth = window.canvas.width;
window.innerHeight = window.canvas.height;

window.addEventListener = function(type, listener) {
    wx.onTouchStart(function(e) {
        if (type === 'touchstart') {
            listener(e);
        }
    });
    wx.onTouchMove(function(e) {
        if (type === 'touchmove') {
            listener(e);
        }
    });
    wx.onTouchEnd(function(e) {
        if (type === 'touchend') {
            listener(e);
        }
    });
};

window.setTimeout = setTimeout;
window.setInterval = setInterval;
window.clearTimeout = clearTimeout;
window.clearInterval = clearInterval;

window.requestAnimationFrame = function(callback) {
    return setTimeout(callback, 16);
};

window.cancelAnimationFrame = function(id) {
    clearTimeout(id);
};

window.screen = {
    width: window.innerWidth,
    height: window.innerHeight
};

window.devicePixelRatio = wx.getSystemInfoSync().pixelRatio;

const systemInfo = wx.getSystemInfoSync();
window.statusBarHeight = systemInfo.statusBarHeight || 20;
window.screenWidth = systemInfo.screenWidth;
window.screenHeight = systemInfo.screenHeight;
