import React, { useEffect, useState } from 'react'
import { t } from '../../utils/i18n'
import { observer } from 'mobx-react-lite'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import './index.less'

/**
 * 网络状态提示组件
 * 在网络连接断开或连接中时显示状态提示
 */
const NetworkAlert: React.FC = observer(() => {
  const { store } = useStateContext()
  const loginStatus = store.connectStore.loginStatus
  const isLogined = loginStatus === V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED
  const text = loginStatus === V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGOUT ? t('offlineText') : t('connectingText')
  // 如果已连接或无文本，则不显示
  if (isLogined) {
    return null
  }

  return <div className="nim-network-alert">{text}</div>
})

export default NetworkAlert
