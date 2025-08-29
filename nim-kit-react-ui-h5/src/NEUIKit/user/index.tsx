import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { observer } from 'mobx-react-lite'
import UserCard from '@/NEUIKit/common/components/UserCard'
import Icon from '@/NEUIKit/common/components/Icon'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { V2NIMUser } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMUserService'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'
import './index.less'
// import { useEventTracking } from '../common/hooks/useEventTracking'

/**
 * 用户中心组件
 */
const User: React.FC = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { store } = useStateContext()

  // 群组列表本地状态
  const [myUserInfo, setMyUserInfo] = useState<V2NIMUser>()

  // useEventTracking({
  //   component: 'UserUIKit'
  // })

  // 从store获取群组列表数据
  useEffect(() => {
    setMyUserInfo(store.userStore.myUserInfo)
  }, [])

  // 跳转到个人详情
  const gotoMyDetail = () => {
    navigate(neUiKitRouterPath.myDetail)
  }

  // 跳转到设置页面
  const gotoSetting = () => {
    navigate(neUiKitRouterPath.userSetting)
  }

  // 跳转到关于页面
  const gotoAbout = () => {
    navigate(neUiKitRouterPath.aboutNetease)
  }

  return (
    <div className="user-info-wrapper">
      {/* 用户卡片 */}
      <div className="card-wrapper" onClick={gotoMyDetail}>
        <UserCard account={myUserInfo?.accountId} nick={myUserInfo?.name} />
        <Icon iconClassName="arrow" type="icon-jiantou" />
      </div>

      <div className="box-shadow"></div>

      {/* 用户操作项 */}
      <div className="userInfo-item-wrapper">
        {/* 设置 */}
        <div className="userInfo-item" onClick={gotoSetting}>
          <div className="item-left">
            <Icon iconClassName="guanyu" type="icon-shezhi1" />
            {t('setText')}
          </div>
          <Icon iconClassName="icon-arrow" type="icon-jiantou" />
        </div>

        <div className="shadow"></div>

        {/* 关于网易云信 */}
        <div className="userInfo-item" onClick={gotoAbout}>
          <div className="item-left">
            <Icon iconClassName="guanyu" type="icon-guanyu" />
            {t('commsEaseText')}
          </div>
          <Icon iconClassName="icon-arrow" type="icon-jiantou" />
        </div>
      </div>
    </div>
  )
})

export default User
