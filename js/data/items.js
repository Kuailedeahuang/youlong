export default [
    { id: 1, name: '大米', category: 'agricultural', basePrice: 10, naturalFluctuation: { min: -0.08, max: 0.08 } },
    { id: 2, name: '面粉', category: 'agricultural', basePrice: 12, naturalFluctuation: { min: -0.08, max: 0.08 } },
    { id: 3, name: '玉米', category: 'agricultural', basePrice: 8, naturalFluctuation: { min: -0.08, max: 0.08 } },
    { id: 4, name: '猪肉', category: 'agricultural', basePrice: 60, naturalFluctuation: { min: -0.08, max: 0.08 } },
    { id: 5, name: '牛肉', category: 'agricultural', basePrice: 90, naturalFluctuation: { min: -0.08, max: 0.08 } },
    { id: 6, name: '鸡肉', category: 'agricultural', basePrice: 40, naturalFluctuation: { min: -0.08, max: 0.08 } },
    { id: 7, name: '鸭肉', category: 'agricultural', basePrice: 35, naturalFluctuation: { min: -0.08, max: 0.08 } },
    { id: 8, name: '鸡蛋', category: 'agricultural', basePrice: 25, naturalFluctuation: { min: -0.08, max: 0.08 } },
    { id: 9, name: '蔬菜', category: 'agricultural', basePrice: 20, naturalFluctuation: { min: -0.08, max: 0.08 } },
    { id: 10, name: '水果', category: 'agricultural', basePrice: 30, naturalFluctuation: { min: -0.08, max: 0.08 } },
    
    { id: 11, name: '钢材', category: 'industrial', basePrice: 120, naturalFluctuation: { min: -0.15, max: 0.15 } },
    { id: 12, name: '水泥', category: 'industrial', basePrice: 80, naturalFluctuation: { min: -0.15, max: 0.15 } },
    { id: 13, name: '砖块', category: 'industrial', basePrice: 45, naturalFluctuation: { min: -0.15, max: 0.15 } },
    { id: 14, name: '玻璃', category: 'industrial', basePrice: 70, naturalFluctuation: { min: -0.15, max: 0.15 } },
    { id: 15, name: '铝材', category: 'industrial', basePrice: 110, naturalFluctuation: { min: -0.15, max: 0.15 } },
    
    { id: 16, name: '黄金', category: 'luxury', basePrice: 200, naturalFluctuation: { min: -0.18, max: 0.18 } },
    { id: 17, name: '白银', category: 'luxury', basePrice: 60, naturalFluctuation: { min: -0.18, max: 0.18 } },
    { id: 18, name: '珠宝原石', category: 'luxury', basePrice: 320, naturalFluctuation: { min: -0.18, max: 0.18 } },
    { id: 19, name: '收藏品', category: 'luxury', basePrice: 280, naturalFluctuation: { min: -0.18, max: 0.18 } },
    
    { id: 20, name: '煤炭', category: 'energy', basePrice: 55, naturalFluctuation: { min: -0.15, max: 0.15 } },
    { id: 21, name: '汽油', category: 'energy', basePrice: 140, naturalFluctuation: { min: -0.15, max: 0.15 } },
    { id: 22, name: '天然气', category: 'energy', basePrice: 95, naturalFluctuation: { min: -0.15, max: 0.15 } },
    { id: 23, name: '化工原料', category: 'energy', basePrice: 50, naturalFluctuation: { min: -0.15, max: 0.15 } },
    
    { id: 24, name: '布料', category: 'daily', basePrice: 35, naturalFluctuation: { min: -0.07, max: 0.07 } },
    { id: 25, name: '日化用品', category: 'daily', basePrice: 28, naturalFluctuation: { min: -0.07, max: 0.07 } },
    { id: 26, name: '塑料制品', category: 'daily', basePrice: 22, naturalFluctuation: { min: -0.07, max: 0.07 } },
    { id: 27, name: '二手家电', category: 'daily', basePrice: 80, naturalFluctuation: { min: -0.07, max: 0.07 } },
    { id: 28, name: '进口零食', category: 'daily', basePrice: 50, naturalFluctuation: { min: -0.07, max: 0.07 } },
    
    { id: 29, name: '酷噶手机', category: 'digital', basePrice: 800, naturalFluctuation: { min: -0.20, max: 0.20 } },
    { id: 30, name: '鸭梨平板', category: 'digital', basePrice: 650, naturalFluctuation: { min: -0.20, max: 0.20 } },
    { id: 31, name: '菠萝笔记本', category: 'digital', basePrice: 1200, naturalFluctuation: { min: -0.20, max: 0.20 } },
    { id: 32, name: '狗狗鼠标', category: 'digital', basePrice: 300, naturalFluctuation: { min: -0.20, max: 0.20 } },
    { id: 33, name: '闪电耳机', category: 'digital', basePrice: 450, naturalFluctuation: { min: -0.20, max: 0.20 } },
    
    { id: 34, name: '电动自行车', category: 'vehicle', basePrice: 1500, naturalFluctuation: { min: -0.18, max: 0.18 } },
    { id: 35, name: '轻便摩托车', category: 'vehicle', basePrice: 3200, naturalFluctuation: { min: -0.18, max: 0.18 } },
    { id: 36, name: '二手汽车', category: 'vehicle', basePrice: 8000, naturalFluctuation: { min: -0.18, max: 0.18 } },
    { id: 37, name: '折叠电动车', category: 'vehicle', basePrice: 1800, naturalFluctuation: { min: -0.18, max: 0.18 } },
    { id: 38, name: '电动滑板车', category: 'vehicle', basePrice: 900, naturalFluctuation: { min: -0.18, max: 0.18 } }
]

export const categories = [
    { id: 'agricultural', name: '农副产品', count: 10, color: '#27ae60' },
    { id: 'industrial', name: '工业建材', count: 5, color: '#7f8c8d' },
    { id: 'luxury', name: '贵金属奢侈品', count: 4, color: '#f1c40f' },
    { id: 'energy', name: '能源化工', count: 4, color: '#e74c3c' },
    { id: 'daily', name: '日用百货', count: 5, color: '#3498db' },
    { id: 'digital', name: '数码产品', count: 5, color: '#9b59b6' },
    { id: 'vehicle', name: '出行工具', count: 5, color: '#1abc9c' }
]
