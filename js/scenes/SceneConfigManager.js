export default class SceneConfigManager {
    constructor() {
        this.configs = this.initConfigs()
    }

    initConfigs() {
        return {
            home: {
                imageName: 'ChuZuWu.png',
                localPath: 'tuer/chuzuwu.png',
                displayName: '出租屋',
                dialogPools: [
                    { speaker: '我', lines: ['终于回来了...虽然只是个出租屋，但好歹是个家。'] },
                    { speaker: '我', lines: ['今天又是辛苦的一天，回来歇歇吧。'] },
                    { speaker: '我', lines: ['这间小屋虽然简陋，但至少是我在这个城市的避风港。'] },
                    { speaker: '我', lines: ['躺在床上的感觉真好...要不要休息一下？'] },
                    { speaker: '我', lines: ['窗外车水马龙，我什么时候才能在这座城市真正立足呢？'] }
                ],
                actions: []
            },
            work: {
                imageName: 'work.png',
                localPath: 'tuer/work.png',
                displayName: '工作',
                dialogPools: [
                    { speaker: '主管', lines: ['嘿，又来上班了？今天好好干，工资少不了你的。'] },
                    { speaker: '主管', lines: ['你来得正好，今天活多，加班费翻倍！'] },
                    { speaker: '同事', lines: ['早啊！今天又是元气满满的一天呢...大概吧。'] },
                    { speaker: '我', lines: ['又是新的一天，为了梦想，加油！'] },
                    { speaker: '主管', lines: ['最近表现不错，继续保持，升职有望！'] },
                    { speaker: '我', lines: ['看着打卡机，心里默默叹了口气...但还是要微笑面对。'] }
                ],
                actions: [
                    { text: '开始工作', callback: 'startWork' }
                ]
            },
            bank: {
                imageName: 'yinhang.png',
                localPath: 'tuer/yinhang.png',
                displayName: '银行',
                dialogPools: [
                    { speaker: '银行柜员', lines: ['您好，欢迎光临！请问需要办理什么业务？'] },
                    { speaker: '银行柜员', lines: ['今天的存款利率很优惠哦，要考虑一下吗？'] },
                    { speaker: '我', lines: ['银行的冷气总是开得很足，让人清醒地面对自己的财务状况。'] },
                    { speaker: '银行柜员', lines: ['您的信用记录良好，可以享受更优惠的贷款利率。'] },
                    { speaker: '我', lines: ['看着存折上的数字，离买房又近了一步...吧？'] }
                ],
                actions: [
                    { text: '办理业务', callback: 'showBankModal' }
                ]
            },
            hospital: {
                imageName: 'yiyuan.png',
                localPath: 'tuer/yiyuan.png',
                displayName: '医院',
                dialogPools: [
                    { speaker: '医生', lines: ['来，让我看看你的情况。身体是革命的本钱，别太拼命了。'] },
                    { speaker: '护士', lines: ['又来了？年轻人要注意身体啊，别老熬夜。'] },
                    { speaker: '我', lines: ['医院的消毒水味让人不安...希望只是小毛病。'] },
                    { speaker: '医生', lines: ['你的健康指标不太理想，建议多休息，少加班。'] },
                    { speaker: '我', lines: ['看着挂号费，心疼钱包更心疼身体。'] }
                ],
                actions: [
                    { text: '接受治疗', callback: 'doHospital' }
                ]
            },
            gym: {
                imageName: 'jianshenfang.png',
                localPath: 'tuer/jianshenfang.png',
                displayName: '健身房',
                dialogPools: [
                    { speaker: '健身教练', lines: ['欢迎来健身！让我带你练起来！坚持锻炼，身体会越来越好的！'] },
                    { speaker: '健身教练', lines: ['连续来三天，我帮你提升精力上限！来吧，动起来！'] },
                    { speaker: '我', lines: ['看着镜子里日渐壮实的自己，感觉还不错！'] },
                    { speaker: '我', lines: ['虽然每次练完都累得要死，但出汗的感觉真爽。'] },
                    { speaker: '健身教练', lines: ['今天状态不错！再加把劲，突破极限！'] }
                ],
                actions: [
                    { text: '开始锻炼', callback: 'doGym' }
                ]
            },
            privateLoan: {
                imageName: 'gerenjiedai.png',
                localPath: 'tuer/gerenjiedai.png',
                displayName: '个人借贷',
                dialogPools: [
                    { speaker: '借贷人', lines: ['兄弟，手头紧了吧？我这里放款快，不过利息嘛...你懂的。'] },
                    { speaker: '借贷人', lines: ['老规矩，日利率2.5%，逾期后果很严重哦。想好了再借。'] },
                    { speaker: '我', lines: ['这个地方让人不安...但有时候真的别无选择。'] },
                    { speaker: '借贷人', lines: ['放心，我们很讲信用的。按时还款，大家都是朋友。'] },
                    { speaker: '我', lines: ['高利贷就像深渊，一旦踏入就很难回头...'] }
                ],
                actions: [
                    { text: '借贷', callback: 'showLoanModal' }
                ]
            }
        }
    }

    getSceneConfig(sceneName) {
        return this.configs[sceneName] || null
    }

    getAllSceneNames() {
        return Object.keys(this.configs)
    }

    getSceneDisplayName(sceneName) {
        const config = this.getSceneConfig(sceneName)
        return config ? config.displayName : sceneName
    }

    getRandomDialog(sceneName) {
        const config = this.getSceneConfig(sceneName)
        if (!config || !config.dialogPools || config.dialogPools.length === 0) {
            return { lines: [], speaker: '' }
        }
        const pool = config.dialogPools[Math.floor(Math.random() * config.dialogPools.length)]
        return pool
    }

    getActions(sceneName) {
        const config = this.getSceneConfig(sceneName)
        return config ? [...(config.actions || [])] : []
    }
}
