import React, { useState, useEffect, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate } from '@/utils/router'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { HISTORY_LIMIT, events } from '@/NEUIKit/common/utils/constants'
import { showModal } from '@/NEUIKit/common/utils/modal'
import { showToast } from '@/NEUIKit/common/utils/toast'
import { neUiKitRouterPath } from '@/NEUIKit/common/utils/uikitRouter'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import emitter from '@/NEUIKit/common/utils/eventBus'

import NetworkAlert from '@/NEUIKit/common/components/NetworkAlert'
import NavBar from './message/nav-bar'
import Icon from '@/NEUIKit/common/components/Icon'
import MessageList from './message/message-list'
import MessageInput from './message/message-input'
import { useEventTracking } from '../common/hooks/useEventTracking'

import './index.less'
import { V2NIMMessageForUI } from '@xkit-yx/im-store-v2/dist/types/types'

// 回复消息类型
interface YxReplyMsg {
  conversationId: string
  messageClientId: string
  messageServerId: string
  conversationType: V2NIMConst.V2NIMConversationType
  senderId: string
  receiverId: string
  createTime: number
}

/**
 * 聊天组件
 */
const Chat = observer(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { store, nim } = useStateContext()

  const [title, setTitle] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [noMore, setNoMore] = useState(false)
  const [replyMsgsMap, setReplyMsgsMap] = useState<Record<string, any>>({})

  // 记录组件是否已挂载
  const isMountedRef = useRef(false)

  // 会话ID
  const conversationId = store.uiStore.selectedConversation as string

  // 会话类型
  const conversationType = nim.V2NIMConversationIdUtil.parseConversationType(conversationId) as unknown as V2NIMConst.V2NIMConversationType

  // 对话方
  const to = nim.V2NIMConversationIdUtil.parseConversationTargetId(conversationId)

  // 消息体
  const [msgs, setMsgs] = useState<V2NIMMessageForUI[]>([])

  // 是否需要显示群组消息已读未读，默认 false
  const teamManagerVisible = store.localOptions.teamMsgReceiptVisible

  // 是否需要显示 p2p 消息、p2p会话列表消息已读未读，默认 false
  const p2pMsgReceiptVisible = store.localOptions.p2pMsgReceiptVisible

  // 初始化埋点
  useEventTracking({
    component: 'ChatUIKit'
  })

  /**
   * 返回会话列表
   */
  const backToConversation = () => {
    navigate(neUiKitRouterPath.conversation)
  }

  /**
   * 跳转设置页
   */
  const handleSetting = () => {
    if (conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P) {
      navigate({
        pathname: neUiKitRouterPath.p2pSetting,
        search: `?accountId=${to}`
      })
    } else if (conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM) {
      navigate({
        pathname: neUiKitRouterPath.teamSetting,
        search: `?teamId=${to}`
      })
    }
  }

  /**
   * 解散群组回调
   */
  const onTeamDismissed = (data: any) => {
    if (data.teamId === to) {
      showModal({
        content: t('onDismissTeamText'),
        title: t('tipText'),
        onCancel: () => {
          backToConversation()
        },
        onConfirm: () => {
          backToConversation()
        }
      })
    }
  }

  /**
   * 自己主动离开群组或被管理员踢出回调
   */
  const onTeamLeft = () => {
    showToast({
      message: t('onRemoveTeamText'),
      type: 'info',
      duration: 1000
    })
    backToConversation()
  }

  /**
   * 收到新消息
   */
  const onReceiveMessages = (messages: any[]) => {
    // 当前在聊天页，视为消息已读，发送已读回执
    const pathname = window.location.pathname
    if (messages.length && !messages[0]?.isSelf && messages[0].conversationId === conversationId && pathname === neUiKitRouterPath.chat) {
      handleMsgReceipt(messages)
    }
    // 加个宏任务, 因为事件先触发后, msgs 自身才更新
    setTimeout(() => {
      emitter.emit(events.ON_SCROLL_BOTTOM)
    }, 0)
  }

  /**
   * 处理收到消息的已读回执
   */
  const handleMsgReceipt = (message: any[]) => {
    if (message[0].conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P && p2pMsgReceiptVisible) {
      store.msgStore.sendMsgReceiptActive(message[0])
    } else if (message[0].conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM && teamManagerVisible) {
      store.msgStore.sendTeamMsgReceiptActive(message)
    }
  }

  /**
   * 处理历史消息的已读未读
   */
  const handleHistoryMsgReceipt = (messages: any[]) => {
    // 如果是单聊
    if (conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P && p2pMsgReceiptVisible) {
      const myUserAccountId = nim.V2NIMLoginService.getLoginUser()
      const othersMsgs = messages
        .filter((item) => !['beReCallMsg', 'reCallMsg'].includes(item.recallType || ''))
        .filter((item) => item.senderId !== myUserAccountId)

      // 发送单聊消息已读回执
      if (othersMsgs.length > 0) {
        store.msgStore.sendMsgReceiptActive(othersMsgs[0])
      }
    }
    // 如果是群聊
    else if (conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM && teamManagerVisible) {
      const myUserAccountId = nim.V2NIMLoginService.getLoginUser()
      const myMsgs = messages
        .filter((item) => !['beReCallMsg', 'reCallMsg'].includes(item.recallType || ''))
        .filter((item) => item.senderId === myUserAccountId)

      store.msgStore.getTeamMsgReadsActive(myMsgs, conversationId)

      // 发送群消息已读回执
      // sdk 要求 一次最多传入 50 个消息对象
      const othersMsgs = messages
        .filter((item) => !['beReCallMsg', 'reCallMsg'].includes(item.recallType || ''))
        .filter((item) => item.senderId !== myUserAccountId)

      if (othersMsgs.length > 0 && othersMsgs.length < 50) {
        store.msgStore.sendTeamMsgReceiptActive(othersMsgs)
      }
    }
  }

  /**
   * 拉取历史消息
   */
  const getHistory = async (endTime: number, lastMsgId?: string) => {
    try {
      if (noMore) {
        return []
      }
      if (loadingMore) {
        return []
      }

      setLoadingMore(true)

      if (conversationId) {
        const historyMsgs = await store.msgStore.getHistoryMsgActive({
          conversationId,
          endTime,
          lastMsgId,
          limit: HISTORY_LIMIT
        })

        setLoadingMore(false)

        if (historyMsgs?.length) {
          if (historyMsgs.length < HISTORY_LIMIT) {
            setNoMore(true)
          }
          // 消息已读未读相关
          handleHistoryMsgReceipt(historyMsgs)
          return historyMsgs
        } else {
          setNoMore(true)
          return []
        }
      }
      return []
    } catch (error) {
      setLoadingMore(false)
      throw error
    }
  }

  /**
   * 加载更多消息
   */
  const loadMoreMsgs = (lastMsg?: any) => {
    if (lastMsg) {
      getHistory(lastMsg.createTime, lastMsg.messageServerId)
    } else {
      getHistory(Date.now())
    }
  }

  /**
   * 设置导航栏标题
   */
  const setNavTitle = () => {
    if (conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P) {
      setTitle(
        store.uiStore.getAppellation({
          account: to
        })
      )
    } else if (conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM) {
      const team = store.teamStore.teams.get(to)
      const subTitle = `(${team?.memberCount || 0})`
      setTitle((team?.name || '') + subTitle)
    }
  }

  // 消息列表
  useEffect(() => {
    // 被解散群的时候, 此刻 conversationId 会变为空字符串的
    if (conversationId) {
      setMsgs(store.msgStore.getMsg(conversationId) || [])
    }
  }, [conversationId, store.msgStore.getMsg(conversationId)])

  // todo , store.msgStore ui 变了也得变

  // 监听导航栏标题
  useEffect(() => {
    // 防解散群的时候 conversationId 编为空字符串, type 变 unknwon, to 变空字符串
    if (conversationId) {
      // 初始设置标题
      setNavTitle()
    }
  }, [conversationId, store.teamStore.teams.get(to)])

  // 进入聊天页首次加载消息, 监听到重新登录了也要重新加载
  useEffect(() => {
    if (store.connectStore.loginStatus === V2NIMConst.V2NIMLoginStatus.V2NIM_LOGIN_STATUS_LOGINED) {
      getHistory(Date.now())
        .then(() => {
          if (!isMountedRef.current) {
            setTimeout(() => {
              emitter.emit(events.ON_SCROLL_BOTTOM)
              isMountedRef.current = true
            }, 0)
          }
        })
        .catch((err) => {
          showToast({
            message: t('getHistoryFailedText'),
            type: 'error',
            duration: 1000
          })
          console.error('Get history message failed', err.toString())
        })
    }
  }, [store.connectStore.loginStatus])

  // 处理可能的回复消息
  const processReplyMsg = (msgs: any) => {
    const _replyMsgsMap: Record<string, any> = {}
    const reqMsgs: YxReplyMsg[] = []
    const messageClientIds: Record<string, string> = {}
    msgs.forEach((msg: any) => {
      // 兼容旧版本用 serverExtension 存储被回复消息的相关消息
      if (msg.serverExtension) {
        try {
          // yxReplyMsg 存储着被回复消息的相关消息
          const { yxReplyMsg } = JSON.parse(msg.serverExtension)
          if (yxReplyMsg) {
            // 从消息列表中找到被回复消息，replyMsg 为被回复的消息
            const replyMsg = msgs.find((item) => item.messageClientId === yxReplyMsg.idClient)
            // 如果直接找到，存储在map中
            if (replyMsg) {
              _replyMsgsMap[msg.messageClientId] = replyMsg
              // 如果没找到，说明被回复的消息可能有三种情况：1.被删除 2.被撤回 3.不在当前消息列表中（一次性没拉到，在之前的消息中）
            } else {
              _replyMsgsMap[msg.messageClientId] = {
                messageClientId: 'noFind'
              }
              const { scene, from, to, idServer, messageClientId, time, receiverId } = yxReplyMsg

              if (scene && from && to && idServer && messageClientId && time && receiverId) {
                reqMsgs.push({
                  conversationType: scene,
                  senderId: from,
                  conversationId: to,
                  messageServerId: idServer,
                  messageClientId,
                  createTime: time,
                  receiverId
                })
                messageClientIds[idServer] = msg.messageClientId
              }
            }
          }
        } catch (e) {
          // 解析JSON失败
        }
      }
      // 新版本采用 threadReply 存储被回复消息的相关消息
      else if (msg.threadReply) {
        // serverExtension":"{\"yxReplyMsg\":{\"idClient\":\"0cb875a967854da69173df397294a832\",\"scene\":2,\"from\":\"334574329307264\",\"receiverId\":\"46223315430\",\"to\":\"334633283559552|2|46223315430\",\"idServer\":\"3101994188820971548\",\"time\":1755500811326}}","sendingState":3,"senderName":""}
        // yxReplyMsg 存储着被回复消息的相关消息
        const yxReplyMsg = msg.threadReply
        // 从消息列表中找到被回复消息，replyMsg 为被回复的消息
        const replyMsg = msgs.find((item) => item.messageClientId === yxReplyMsg.messageClientId)
        // 如果直接找到，存储在map中
        if (replyMsg) {
          _replyMsgsMap[msg.messageClientId] = replyMsg
          // 如果没找到，说明被回复的消息可能有三种情况：1.被删除 2.被撤回 3.不在当前消息列表中（一次性没拉到，在之前的消息中）
        } else {
          _replyMsgsMap[msg.messageClientId] = {
            messageClientId: 'noFind'
          }
          const { conversationType, conversationId, senderId, receiverId, messageServerId, messageClientId, createTime } = yxReplyMsg

          reqMsgs.push({
            conversationId,
            conversationType,
            senderId,
            receiverId,
            messageServerId,
            messageClientId,
            createTime
          })
          messageClientIds[messageServerId] = msg.messageClientId
        }
      }
    })

    return { _replyMsgsMap, reqMsgs, messageClientIds }
  }

  // 监听消息列表
  useEffect(() => {
    // 遍历所有消息，找出被回复消息，储存在map中
    if (msgs.length > 0) {
      const { _replyMsgsMap, reqMsgs, messageClientIds } = processReplyMsg(msgs)

      if (reqMsgs.length > 0) {
        // 从服务器拉取被回复消息, 但是有频率控制
        nim.V2NIMMessageService.getMessageListByRefers(
          reqMsgs.map((item) => ({
            senderId: item.senderId,
            receiverId: item.receiverId,
            messageClientId: item.messageClientId,
            messageServerId: item.messageServerId,
            createTime: item.createTime,
            conversationType: item.conversationType,
            conversationId: item.conversationId
          }))
        )
          .then((res: any) => {
            if (res?.length > 0) {
              res.forEach((item: any) => {
                if (item.messageServerId) {
                  _replyMsgsMap[messageClientIds[item.messageServerId]] = item
                }
              })
            }
            setReplyMsgsMap({ ..._replyMsgsMap })
          })
          .catch(() => {
            setReplyMsgsMap({ ..._replyMsgsMap })
          })
      } else {
        setReplyMsgsMap({ ..._replyMsgsMap })
      }
    }
  }, [msgs])

  // // 绑定和解绑事件监听
  useEffect(() => {
    // 初始加载时，如果有消息，发送已读回执
    if (msgs.length) {
      const _msgs = [...msgs].reverse()
      handleHistoryMsgReceipt(_msgs)
    }

    // 绑定事件监听
    nim.V2NIMMessageService.on('onReceiveMessages', onReceiveMessages)
    nim.V2NIMTeamService.on('onTeamDismissed', onTeamDismissed)
    nim.V2NIMTeamService.on('onTeamLeft', onTeamLeft)

    emitter.on(events.GET_HISTORY_MSG, loadMoreMsgs)

    return () => {
      // 解绑事件监听
      nim.V2NIMMessageService.off('onReceiveMessages', onReceiveMessages)
      nim.V2NIMTeamService.off('onTeamDismissed', onTeamDismissed)
      nim.V2NIMTeamService.off('onTeamLeft', onTeamLeft)

      emitter.off(events.GET_HISTORY_MSG, loadMoreMsgs)
    }
  }, [])

  return (
    <div className="msg-page-wrapper-h5">
      <NavBar
        title={title}
        showLeft={true}
        leftContent={
          <div onClick={backToConversation}>
            <Icon type="icon-zuojiantou" size={24} />
          </div>
        }
        rightContent={
          <div onClick={handleSetting}>
            <Icon type="icon-More" size={24} />
          </div>
        }
      />

      <div className="msg-alert">
        <NetworkAlert />
      </div>

      <MessageList conversationType={conversationType} to={to} msgs={msgs} loadingMore={loadingMore} noMore={noMore} replyMsgsMap={replyMsgsMap} />

      <MessageInput replyMsgsMap={replyMsgsMap} conversationType={conversationType} to={to} />
    </div>
  )
})

export default Chat
