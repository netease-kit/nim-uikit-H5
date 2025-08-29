import React, { CSSProperties } from 'react'
import './style.less'

// 导入所有图标
import IconA1 from '../../../static/icons/icon-a-1.png'
import IconA2 from '../../../static/icons/icon-a-2.png'
import IconA3 from '../../../static/icons/icon-a-3.png'
import IconA4 from '../../../static/icons/icon-a-4.png'
import IconA5 from '../../../static/icons/icon-a-5.png'
import IconA6 from '../../../static/icons/icon-a-6.png'
import IconA7 from '../../../static/icons/icon-a-7.png'
import IconA8 from '../../../static/icons/icon-a-8.png'
import IconA9 from '../../../static/icons/icon-a-9.png'
import IconA10 from '../../../static/icons/icon-a-10.png'
import IconA11 from '../../../static/icons/icon-a-11.png'
import IconA12 from '../../../static/icons/icon-a-12.png'
import IconA13 from '../../../static/icons/icon-a-13.png'
import IconA14 from '../../../static/icons/icon-a-14.png'
import IconA15 from '../../../static/icons/icon-a-15.png'
import IconA16 from '../../../static/icons/icon-a-16.png'
import IconA17 from '../../../static/icons/icon-a-17.png'
import IconA18 from '../../../static/icons/icon-a-18.png'
import IconA19 from '../../../static/icons/icon-a-19.png'
import IconA20 from '../../../static/icons/icon-a-20.png'
import IconA21 from '../../../static/icons/icon-a-21.png'
import IconA22 from '../../../static/icons/icon-a-22.png'
import IconA23 from '../../../static/icons/icon-a-23.png'
import IconA24 from '../../../static/icons/icon-a-24.png'
import IconA25 from '../../../static/icons/icon-a-25.png'
import IconA26 from '../../../static/icons/icon-a-26.png'
import IconA27 from '../../../static/icons/icon-a-27.png'
import IconA28 from '../../../static/icons/icon-a-28.png'
import IconA29 from '../../../static/icons/icon-a-29.png'
import IconA30 from '../../../static/icons/icon-a-30.png'
import IconA31 from '../../../static/icons/icon-a-31.png'
import IconA32 from '../../../static/icons/icon-a-32.png'
import IconA33 from '../../../static/icons/icon-a-33.png'
import IconA34 from '../../../static/icons/icon-a-34.png'
import IconA35 from '../../../static/icons/icon-a-35.png'
import IconA36 from '../../../static/icons/icon-a-36.png'
import IconA37 from '../../../static/icons/icon-a-37.png'
import IconA38 from '../../../static/icons/icon-a-38.png'
import IconA39 from '../../../static/icons/icon-a-39.png'
import IconA40 from '../../../static/icons/icon-a-40.png'
import IconA41 from '../../../static/icons/icon-a-41.png'
import IconA42 from '../../../static/icons/icon-a-42.png'
import IconA43 from '../../../static/icons/icon-a-43.png'
import IconA44 from '../../../static/icons/icon-a-44.png'
import IconA45 from '../../../static/icons/icon-a-45.png'
import IconA46 from '../../../static/icons/icon-a-46.png'
import IconA47 from '../../../static/icons/icon-a-47.png'
import IconA48 from '../../../static/icons/icon-a-48.png'
import IconA49 from '../../../static/icons/icon-a-49.png'
import IconA50 from '../../../static/icons/icon-a-50.png'
import IconA51 from '../../../static/icons/icon-a-51.png'
import IconA52 from '../../../static/icons/icon-a-52.png'
import IconA53 from '../../../static/icons/icon-a-53.png'
import IconA54 from '../../../static/icons/icon-a-54.png'
import IconA55 from '../../../static/icons/icon-a-55.png'
import IconA56 from '../../../static/icons/icon-a-56.png'
import IconA57 from '../../../static/icons/icon-a-57.png'
import IconA58 from '../../../static/icons/icon-a-58.png'
import IconA59 from '../../../static/icons/icon-a-59.png'
import IconA60 from '../../../static/icons/icon-a-60.png'
import IconA61 from '../../../static/icons/icon-a-61.png'
import IconA62 from '../../../static/icons/icon-a-62.png'
import IconA63 from '../../../static/icons/icon-a-63.png'
import IconA64 from '../../../static/icons/icon-a-64.png'
import IconA65 from '../../../static/icons/icon-a-65.png'
import IconA66 from '../../../static/icons/icon-a-66.png'
import IconA67 from '../../../static/icons/icon-a-67.png'
import IconA68 from '../../../static/icons/icon-a-68.png'
import IconA70 from '../../../static/icons/icon-a-70.png'
import IconAFrame7 from '../../../static/icons/icon-a-Frame7.png'
import IconAFrame8 from '../../../static/icons/icon-a-Frame8.png'
import IconAddition from '../../../static/icons/icon-addition.png'
import IconBiaoqing from '../../../static/icons/icon-biaoqing.png'
import IconChehui from '../../../static/icons/icon-chehui.png'
import IconChuangjianqunzu from '../../../static/icons/icon-chuangjianqunzu.png'
import IconComputed from '../../../static/icons/icon-computed.png'
import IconErfenzhiyiyidu from '../../../static/icons/icon-erfenzhiyiyidu.png'
import IconExcel from '../../../static/icons/icon-Excel.png'
import IconFasong from '../../../static/icons/icon-fasong.png'
import IconFuzhi1 from '../../../static/icons/icon-fuzhi1.png'
import IconGuanbi from '../../../static/icons/icon-guanbi.png'
import IconGuanyu from '../../../static/icons/icon-guanyu.png'
import IconHuifu from '../../../static/icons/icon-huifu.png'
import IconImXuanzhong from '../../../static/icons/icon-im-xuanzhong.png'
import IconJiantou from '../../../static/icons/icon-jiantou.png'
import IconJiaruqunzu from '../../../static/icons/icon-jiaruqunzu.png'
import IconKefu from '../../../static/icons/icon-kefu.png'
import IconLahei from '../../../static/icons/icon-lahei.png'
import IconLishixiaoxi from '../../../static/icons/icon-lishixiaoxi.png'
import IconMore from '../../../static/icons/icon-More.png'
import IconPPT from '../../../static/icons/icon-PPT.png'
import IconQita from '../../../static/icons/icon-qita.png'
import IconQuxiaoxiaoximiandarao from '../../../static/icons/icon-quxiaoxiaoximiandarao.png'
import IconQuxiaozhiding from '../../../static/icons/icon-quxiaozhiding.png'
import IconRAR1 from '../../../static/icons/icon-RAR1.png'
import IconShanchu from '../../../static/icons/icon-shanchu.png'
import IconShandiao from '../../../static/icons/icon-shandiao.png'
import IconShezhi from '../../../static/icons/setting.png'
import IconShezhi1 from '../../../static/icons/icon-shezhi1.png'
import IconShipin from '../../../static/icons/icon-shipin.png'
import IconShipin8 from '../../../static/icons/icon-shipin8.png'
import IconShipinyuyin from '../../../static/icons/icon-shipinyuyin.png'
import IconSifenzhisanyidu from '../../../static/icons/icon-sifenzhisanyidu.png'
import IconSifenzhiyiyidu from '../../../static/icons/icon-sifenzhiyiyidu.png'
import IconSousuo from '../../../static/icons/icon-sousuo.png'
import IconTeam from '../../../static/icons/icon-team.png'
import IconZuojiantou from '../../../static/icons/icon-zuojiantou.png'
import IconZhuanfa from '../../../static/icons/icon-zhuanfa.png'
import IconZhongyingwen from '../../../static/icons/icon-zhongyingwen.png'
import IconZhankai from '../../../static/icons/icon-zhankai.png'
import IconYinle from '../../../static/icons/icon-yinle.png'
import IconYidu from '../../../static/icons/icon-yidu.png'
import IconYanzheng from '../../../static/icons/icon-yanzheng.png'
import IconXiaoxizhiding from '../../../static/icons/icon-xiaoxizhiding.png'
import IconXiaoximiandarao from '../../../static/icons/icon-xiaoximiandarao.png'
import IconWord from '../../../static/icons/icon-Word.png'
import IconWenjian from '../../../static/icons/icon-wenjian.png'
import IconWeizhiwenjian from '../../../static/icons/icon-weizhiwenjian.png'
import IconWeidu from '../../../static/icons/icon-weidu.png'
import IconTupian2 from '../../../static/icons/icon-tupian2.png'
import IconTupian1 from '../../../static/icons/icon-tupian1.png'
import IconTupian from '../../../static/icons/icon-tupian.png'
import IconTuigejian from '../../../static/icons/icon-tuigejian.png'
import IconTuichudenglu from '../../../static/icons/icon-tuichudenglu.png'
import IconTouxiang5 from '../../../static/icons/icon-touxiang5.png'
import IconTouxiang4 from '../../../static/icons/icon-touxiang4.png'
import IconTouxiang3 from '../../../static/icons/icon-touxiang3.png'
import IconTouxiang2 from '../../../static/icons/icon-touxiang2.png'
import IconTouxiang1 from '../../../static/icons/icon-touxiang1.png'
import IconTongxunluXuanzhong from '../../../static/icons/icon-tongxunlu-xuanzhong.png'
import IconTongxunluWeixuanzhong from '../../../static/icons/icon-tongxunlu-weixuanzhong.png'
import IconTianjiahaoyou from '../../../static/icons/icon-tianjiahaoyou.png'
import IconTianjiaanniu from '../../../static/icons/icon-tianjiaanniu.png'
import IconTeam2 from '../../../static/icons/icon-team2.png'
import IconLahei2 from '../../../static/icons/icon-lahei2.png'
import IconYuyin1 from '../../../static/icons/icon-yuyin1.png'
import IconYuyin2 from '../../../static/icons/icon-yuyin2.png'
import IconYuyin3 from '../../../static/icons/icon-yuyin3.png'
import IconYuyin8 from '../../../static/icons/icon-yuyin8.png'
import IconAudio from '../../../static/audio1.png'
import IconAudioBtn from '../../../static/Vector.png'
import IconAudioBtnSelected from '../../../static/Frame.png'
import IconSendMore from '../../../static/send-more.png'
import IconPaishe from '../../../static/paishe.png'
import IconShipin2 from '../../../static/icons/icon-shipin2.png'
import IconAudioCall from '../../../static/icons/icon-audio-call.png'
import IconVideoCall from '../../../static/icons/icon-video-call.png'
import IconRead from '../../../static/icons/read.png'
import IconFile from '../../../static/icons/icon-file.png'
import IconPin from '../../../static/black-pin.png'
import IconGreenPin from '../../../static/green-pin.png'
import IconChoosePicture from '../../../static/choose-picture.png'
import IconCollection from '../../../static/icons/add-collection.png'
import IconBlueCollection from '../../../static/icons/collection.png'

// 图标映射表
const urlMap: Record<string, string> = {
  'icon-a-1': IconA1,
  'icon-a-2': IconA2,
  'icon-a-3': IconA3,
  'icon-a-4': IconA4,
  'icon-a-5': IconA5,
  'icon-a-6': IconA6,
  'icon-a-7': IconA7,
  'icon-a-8': IconA8,
  'icon-a-9': IconA9,
  'icon-a-10': IconA10,
  'icon-a-11': IconA11,
  'icon-a-12': IconA12,
  'icon-a-13': IconA13,
  'icon-a-14': IconA14,
  'icon-a-15': IconA15,
  'icon-a-16': IconA16,
  'icon-a-17': IconA17,
  'icon-a-18': IconA18,
  'icon-a-19': IconA19,
  'icon-a-20': IconA20,
  'icon-a-21': IconA21,
  'icon-a-22': IconA22,
  'icon-a-23': IconA23,
  'icon-a-24': IconA24,
  'icon-a-25': IconA25,
  'icon-a-26': IconA26,
  'icon-a-27': IconA27,
  'icon-a-28': IconA28,
  'icon-a-29': IconA29,
  'icon-a-30': IconA30,
  'icon-a-31': IconA31,
  'icon-a-32': IconA32,
  'icon-a-33': IconA33,
  'icon-a-34': IconA34,
  'icon-a-35': IconA35,
  'icon-a-36': IconA36,
  'icon-a-37': IconA37,
  'icon-a-38': IconA38,
  'icon-a-39': IconA39,
  'icon-a-40': IconA40,
  'icon-a-41': IconA41,
  'icon-a-42': IconA42,
  'icon-a-43': IconA43,
  'icon-a-44': IconA44,
  'icon-a-45': IconA45,
  'icon-a-46': IconA46,
  'icon-a-47': IconA47,
  'icon-a-48': IconA48,
  'icon-a-49': IconA49,
  'icon-a-50': IconA50,
  'icon-a-51': IconA51,
  'icon-a-52': IconA52,
  'icon-a-53': IconA53,
  'icon-a-54': IconA54,
  'icon-a-55': IconA55,
  'icon-a-56': IconA56,
  'icon-a-57': IconA57,
  'icon-a-58': IconA58,
  'icon-a-59': IconA59,
  'icon-a-60': IconA60,
  'icon-a-61': IconA61,
  'icon-a-62': IconA62,
  'icon-a-63': IconA63,
  'icon-a-64': IconA64,
  'icon-a-65': IconA65,
  'icon-a-66': IconA66,
  'icon-a-67': IconA67,
  'icon-a-68': IconA68,
  'icon-a-70': IconA70,
  'icon-a-Frame7': IconAFrame7,
  'icon-a-Frame8': IconAFrame8,
  'icon-addition': IconAddition,
  'icon-biaoqing': IconBiaoqing,
  'icon-chehui': IconChehui,
  'icon-chuangjianqunzu': IconChuangjianqunzu,
  'icon-computed': IconComputed,
  'icon-erfenzhiyiyidu': IconErfenzhiyiyidu,
  'icon-Excel': IconExcel,
  'icon-fasong': IconFasong,
  'icon-fuzhi1': IconFuzhi1,
  'icon-guanbi': IconGuanbi,
  'icon-guanyu': IconGuanyu,
  'icon-huifu': IconHuifu,
  'icon-im-xuanzhong': IconImXuanzhong,
  'icon-jiantou': IconJiantou,
  'icon-jiaruqunzu': IconJiaruqunzu,
  'icon-kefu': IconKefu,
  'icon-lahei': IconLahei,
  'icon-lishixiaoxi': IconLishixiaoxi,
  'icon-More': IconMore,
  'icon-PPT': IconPPT,
  'icon-qita': IconQita,
  'icon-quxiaoxiaoximiandarao': IconQuxiaoxiaoximiandarao,
  'icon-quxiaozhiding': IconQuxiaozhiding,
  'icon-RAR1': IconRAR1,
  'icon-shanchu': IconShanchu,
  'icon-shandiao': IconShandiao,
  'icon-shezhi': IconShezhi,
  'icon-shezhi1': IconShezhi1,
  'icon-shipin': IconShipin,
  'icon-shipin8': IconShipin8,
  'icon-shipinyuyin': IconShipinyuyin,
  'icon-sifenzhisanyidu': IconSifenzhisanyidu,
  'icon-sifenzhiyiyidu': IconSifenzhiyiyidu,
  'icon-sousuo': IconSousuo,
  'icon-team': IconTeam,
  'icon-zuojiantou': IconZuojiantou,
  'icon-zhuanfa': IconZhuanfa,
  'icon-zhongyingwen': IconZhongyingwen,
  'icon-zhankai': IconZhankai,
  'icon-yinle': IconYinle,
  'icon-yidu': IconYidu,
  'icon-yanzheng': IconYanzheng,
  'icon-xiaoxizhiding': IconXiaoxizhiding,
  'icon-xiaoximiandarao': IconXiaoximiandarao,
  'icon-Word': IconWord,
  'icon-wenjian': IconWenjian,
  'icon-weizhiwenjian': IconWeizhiwenjian,
  'icon-weidu': IconWeidu,
  'icon-tupian2': IconTupian2,
  'icon-tupian1': IconTupian1,
  'icon-tupian': IconTupian,
  'icon-tuigejian': IconTuigejian,
  'icon-tuichudenglu': IconTuichudenglu,
  'icon-touxiang5': IconTouxiang5,
  'icon-touxiang4': IconTouxiang4,
  'icon-touxiang3': IconTouxiang3,
  'icon-touxiang2': IconTouxiang2,
  'icon-touxiang1': IconTouxiang1,
  'icon-tongxunlu-xuanzhong': IconTongxunluXuanzhong,
  'icon-tongxunlu-weixuanzhong': IconTongxunluWeixuanzhong,
  'icon-tianjiahaoyou': IconTianjiahaoyou,
  'icon-tianjiaanniu': IconTianjiaanniu,
  'icon-team2': IconTeam2,
  'icon-lahei2': IconLahei2,
  'icon-yuyin1': IconYuyin1,
  'icon-yuyin2': IconYuyin2,
  'icon-yuyin3': IconYuyin3,
  'icon-yuyin8': IconYuyin8,
  'icon-audio': IconAudio,
  'audio-btn': IconAudioBtn,
  'audio-btn-selected': IconAudioBtnSelected,
  'send-more': IconSendMore,
  'icon-paishe': IconPaishe,
  'icon-shipin2': IconShipin2,
  'icon-audio-call': IconAudioCall,
  'icon-video-call': IconVideoCall,
  'icon-read': IconRead,
  'icon-file': IconFile,
  'icon-pin': IconPin,
  'icon-green-pin': IconGreenPin,
  'choose-picture': IconChoosePicture,
  'icon-collection': IconCollection,
  'blue-collection': IconBlueCollection
}

export interface IconProps {
  /**
   * 图标类型，对应图标文件名（不含后缀）
   */
  type: string
  /**
   * 图标大小（宽高相等时使用）
   * @default 16
   */
  size?: number
  /**
   * 图标宽度，优先级高于size
   */
  width?: number
  /**
   * 图标高度，优先级高于size
   */
  height?: number
  /**
   * 图标容器的类名
   */
  iconClassName?: string
  /**
   * 图标容器的样式
   */
  style?: CSSProperties
  /**
   * 点击事件
   */
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void
}

/**
 * Icon组件，用于显示项目中的图标
 * @param props 组件属性
 * @returns Icon组件
 */
const Icon: React.FC<IconProps> = ({ type, size = 16, width, height, iconClassName = '', style = {}, onClick }) => {
  // 获取图标URL
  const iconUrl = urlMap[type]

  // 处理尺寸
  const finalWidth = width || size
  const finalHeight = height || size

  return (
    <span className={`nim-icon-wrapper ${iconClassName}`} style={style} onClick={onClick}>
      <img
        src={iconUrl}
        style={{
          width: `${finalWidth}px`,
          height: `${finalHeight}px`
        }}
        className="icon"
        alt={`icon-${type}`}
      />
    </span>
  )
}

export default Icon
