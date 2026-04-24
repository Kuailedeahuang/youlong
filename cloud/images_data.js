// 房屋图片数据 - 可直接导入到云开发 images 集合
// 导入方法：在云开发控制台数据库中，选择 images 集合，点击导入，选择此文件

const imagesData = [
  {
    name: "chengzhongcunpengwu.png",
    fileID: "cloud://cloud1-1glyk3ivc2fc740d/sellhouse/chengzhongcunpengwu.png",
    type: "house"
  },
  {
    name: "laojiuminfang.png",
    fileID: "cloud://cloud1-1glyk3ivc2fc740d/sellhouse/laojiuminfang.png",
    type: "house"
  },
  {
    name: "biaozhunyijushi.png",
    fileID: "cloud://cloud1-1glyk3ivc2fc740d/sellhouse/biaozhunyijushi.png",
    type: "house"
  },
  {
    name: "shushiliangjushi.png",
    fileID: "cloud://cloud1-1glyk3ivc2fc740d/sellhouse/shushiliangjushi.png",
    type: "house"
  },
  {
    name: "haohuasanjushi.png",
    fileID: "cloud://cloud1-1glyk3ivc2fc740d/sellhouse/haohuasanjushi.png",
    type: "house"
  },
  {
    name: "jiangjingbieshu.png",
    fileID: "cloud://cloud1-1glyk3ivc2fc740d/sellhouse/jiangjingbieshu.png",
    type: "house"
  },
  {
    name: "huayuanyangfang.png",
    fileID: "cloud://cloud1-1glyk3ivc2fc740d/sellhouse/huayuanyangfang.png",
    type: "house"
  },
  {
    name: "shizhongxingongyu.png",
    fileID: "cloud://cloud1-1glyk3ivc2fc740d/sellhouse/shizhongxingongyu.png",
    type: "house"
  },
  {
    name: "lianpaibieshu.png",
    fileID: "cloud://cloud1-1glyk3ivc2fc740d/sellhouse/lianpaibieshu.png",
    type: "house"
  },
  {
    name: "haijingbieshu.png",
    fileID: "cloud://cloud1-1glyk3ivc2fc740d/sellhouse/haijingbieshu.png",
    type: "house"
  }
];

// 导出数据
module.exports = {
  images: imagesData
};

// 云函数导入使用
if (typeof wx !== 'undefined' && wx.cloud) {
  // 小程序环境
  module.exports = imagesData;
}

// 直接导出数组
module.exports.images = imagesData;
