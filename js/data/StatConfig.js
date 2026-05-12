export const STAT_CONFIG = {
    money: { label: '金币', color: '#D4A574', icon: 'coin' },
    health: { label: '健康', color: '#7CB87C', icon: 'health' },
    energy: { label: '精力', color: '#7BA3C9', icon: 'energy' },
    mood: { label: '心情', color: '#D49BA3', icon: 'mood' },
    reputation: { label: '名誉', color: '#B8A3C9', icon: 'reputation' },
    privateLoan: { label: '私人贷款', color: '#C17B6B', icon: 'loanWarning' },
    bankLoan: { label: '银行贷款', color: '#7BA3C9', icon: 'bank' },
    bankDeposit: { label: '银行存款', color: '#7CB87C', icon: 'bank' }
}

export const ANIM_TYPE = Object.freeze({
    INCREASE: 'increase',
    DECREASE: 'decrease',
    LOAN: 'loan'
})

export function getStatLabel(statType) {
    return STAT_CONFIG[statType]?.label ?? statType
}

export function getStatColor(statType) {
    return STAT_CONFIG[statType]?.color ?? '#5D4037'
}
