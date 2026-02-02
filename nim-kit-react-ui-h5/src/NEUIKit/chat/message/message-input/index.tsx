import React, { useState, useRef, useEffect, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import Face from '@/NEUIKit/chat/message/face'
import Icon from '@/NEUIKit/common/components/Icon'
import Input, { InputRef } from '@/NEUIKit/common/components/Input'
import MessageOneLine from '@/NEUIKit/common/components/MessageOneLine'
import Appellation from '@/NEUIKit/common/components/Appellation'
import { useTranslation } from '@/NEUIKit/common/hooks/useTranslate'
import { useStateContext } from '@/NEUIKit/common/hooks/useStateContext'
import { events, REPLY_MSG_TYPE_MAP, AT_ALL_ACCOUNT, ALLOW_AT } from '@/NEUIKit/common/utils/constants'
import { emojiMap } from '@/NEUIKit/common/utils/emoji'
import { replaceEmoji } from '@/NEUIKit/common/utils'
import { toast } from '@/NEUIKit/common/utils/toast'
import emitter from '@/NEUIKit/common/utils/eventBus'
import { V2NIMConst } from 'nim-web-sdk-ng/dist/esm/nim'
import type { V2NIMMessageForUI, YxServerExt, YxAitMsg } from '@xkit-yx/im-store-v2/dist/types/types'
import type { V2NIMMessage } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMMessageService'
import type { V2NIMTeam, V2NIMTeamChatBannedMode, V2NIMTeamMember } from 'nim-web-sdk-ng/dist/esm/nim/src/V2NIMTeamService'
import './index.less'
import BottomPopup from '@/NEUIKit/common/components/BottomPopup'
import MentionChooseList from '../mention-choose-list'
import { flushSync } from 'react-dom'

interface MessageInputProps {
  conversationType: V2NIMConst.V2NIMConversationType
  to: string
  replyMsgsMap?: {
    [key: string]: V2NIMMessageForUI
  }
}

/**
 * 消息输入组件
 */
const MessageInput: React.FC<MessageInputProps> = observer(({ conversationType, to, replyMsgsMap = {} }) => {
  const { t } = useTranslation()
  const { store, nim } = useStateContext()

  // 消息会话ID
  const conversationId = useMemo(() => {
    return conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_P2P
      ? nim.V2NIMConversationIdUtil.p2pConversationId(to)
      : nim.V2NIMConversationIdUtil.teamConversationId(to)
  }, [conversationType, to])

  // 输入文本
  const [inputText, setInputText] = useState('')

  // 发送更多面板flag
  const [sendMoreVisible, setSendMoreVisible] = useState(false)
  // 表情面板flag
  const [emojiVisible, setEmojiVisible] = useState(false)
  // input框flag
  const inputVisible = useMemo(() => !sendMoreVisible, [sendMoreVisible])

  // 用于解决表情面板和键盘冲突，导致输入框滚动消失问题
  const [showFakeInput, setShowFakeInput] = useState(false)

  // 回复消息相关
  const [isReplyMsg, setIsReplyMsg] = useState(false)
  const [isFocus, setIsFocus] = useState(false)
  const [replyMsg, setReplyMsg] = useState<V2NIMMessageForUI | undefined>()

  // @消息相关
  const [mentionPopupVisible, setMentionPopupVisible] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [atPosition, setAtPosition] = useState(0)
  const [selectedAtMembers, setSelectedAtMembers] = useState<{ accountId: string; appellation: string }[]>([])
  // 修改为使用正确的类型
  const inputRef = useRef<InputRef>(null)

  // 群相关
  const team = store.teamStore.teams.get(to)
  const teamMembers = store.teamMemberStore.getTeamMember(to)
  const teamMute = team?.chatBannedMode || V2NIMConst.V2NIMTeamChatBannedMode.V2NIM_TEAM_CHAT_BANNED_MODE_UNBAN

  const [isTeamOwner, setIsTeamOwner] = useState(false)
  const [isTeamManager, setIsTeamManager] = useState(false)
  const isTeamMute = useMemo(() => {
    if (teamMute === V2NIMConst.V2NIMTeamChatBannedMode.V2NIM_TEAM_CHAT_BANNED_MODE_UNBAN) return false
    if (isTeamOwner || isTeamManager) return false
    return true
  }, [teamMute, isTeamOwner, isTeamManager])
  
  // 是否允许@所有人
  const allowAtAll = useMemo(() => {
    let ext: YxServerExt = {};
    try {
      ext = JSON.parse((team?.serverExtension || "{}"));
    } catch (error) {
      // 解析错误时使用默认值
    }
    
    if (ext[ALLOW_AT] === "manager") {
      return isTeamOwner || isTeamManager;
    }
    return true;
  }, [team?.serverExtension, isTeamOwner, isTeamManager]);

  // 图片输入引用
  const imageInputRef = useRef<HTMLInputElement>(null)
  // 文件输入引用
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 处理输入框聚焦
  const handleInputFocus = () => {
    setIsFocus(true)
  }

  // 点击表情输入框，隐藏表情面板，显示键盘
  const onHideFakeInput = () => {
    setShowFakeInput(false)
    // 先将表情面板和发送更多面板隐藏
    setEmojiVisible(false)
    setSendMoreVisible(false)

    // 延迟一小段时间后再聚焦输入框
    setTimeout(() => {
      try {
        const input = document.getElementById('msg-input')
        input?.focus()
      } catch (error) {
        // console.log('error', error)
      }
    }, 100)
  }

  // 处理输入框失焦
  const handleInputBlur = () => {
    setIsFocus(false)
  }

  // 滚动到底部
  const scrollBottom = () => {
    emitter.emit(events.ON_SCROLL_BOTTOM)
  }

  // 发送文本消息
  const handleSendTextMsg = () => {
    if (inputText.trim() === '') return

    let text = replaceEmoji(inputText)
    const textMsg = nim.V2NIMMessageCreator.createTextMessage(text)
    const ext = onAtMembersExtHandler();

    store.msgStore
      .sendMessageActive({
        msg: textMsg as unknown as V2NIMMessage,
        conversationId,
        serverExtension: (selectedAtMembers.length ? ext : undefined) as any,
        sendBefore: () => {
          scrollBottom()
        }
      })
      .catch(() => {
        toast.info(t('sendMsgFailedText'))
      })
      .finally(() => {
        scrollBottom()
      })

    setInputText('')
    setSelectedAtMembers([]) // 清除选中的@成员
    setIsReplyMsg(false)
  }

  /**
   * 处理选中的@ 成员，构建艾特消息的扩展字段
   */
  const onAtMembersExtHandler = () => {
    let ext: YxServerExt | undefined;
    
    // 如果有选中的@成员，处理扩展字段
    if (selectedAtMembers.length) {
      // 过滤掉不允许@所有人的情况
      const filteredMembers = selectedAtMembers.filter((member) => {
        if (!allowAtAll && member.accountId === AT_ALL_ACCOUNT) {
          return false;
        }
        return true;
      });
      
      // 遍历每个成员，构建艾特消息扩展字段
      filteredMembers.forEach((member) => {
        const substr = `@${member.appellation}`;
        const positions: number[] = [];
        
        // 查找所有@成员出现的位置
        let pos = inputText.indexOf(substr);
        while (pos !== -1) {
          positions.push(pos);
          pos = inputText.indexOf(substr, pos + 1);
        }
        
        // 如果找到了@成员出现的位置，构建扩展字段
        if (positions.length) {
          if (!ext) {
            ext = {
              yxAitMsg: {
                [member.accountId]: {
                  text: substr,
                  segments: [],
                }
              }
            };
          } else {
            (ext.yxAitMsg as YxAitMsg)[member.accountId] = {
              text: substr,
              segments: [],
            };
          }
          
          // 添加每个出现位置的信息
          positions.forEach((position) => {
            const start = position;
            (ext?.yxAitMsg as YxAitMsg)[member.accountId].segments.push({
              start,
              end: start + substr.length,
              broken: false,
            });
          });
        }
      });
    }
    
    return ext;
  };

  // 移除回复消息
  const removeReplyMsg = () => {
    store.msgStore.removeReplyMsgActive(replyMsg?.conversationId as string)
    setIsReplyMsg(false)
  }

  // 显示表情面板
  const handleEmojiVisible = () => {
    if (isTeamMute) return

    setEmojiVisible(true)
    setShowFakeInput(true)
    setSendMoreVisible(false)
    scrollBottom()
  }

  // 点击表情
  const handleEmoji = (emoji: { key: string; type: string }) => {
    setInputText((prev) => prev + emoji.key)
  }

  // 删除表情
  const handleEmojiDelete = () => {
    const isEmojiEnd = Object.keys(emojiMap).reduce((prev, cur) => {
      const isEnd = inputText.endsWith(cur)
      return prev || isEnd
    }, false)

    // 如果以emoji结尾，删除最后一个emoji
    if (isEmojiEnd) {
      let target = ''
      for (const key of Object.keys(emojiMap)) {
        if (inputText.endsWith(key)) {
          target = key
          break
        }
      }

      if (target) {
        setInputText((prev) => prev.replace(new RegExp(`${target}$`), ''))
      }
    } else {
      // 否则删除最后一个字符
      setInputText((prev) => prev.slice(0, -1))
    }
  }

  /** 显示发送更多"+"面板 */
  const handleSendMoreVisible = () => {
    if (isTeamMute) return

    setEmojiVisible(false)
    setSendMoreVisible((prev) => !prev)
    setShowFakeInput(true)
    scrollBottom()
  }

  // 发送图片消息
  const handleSendImageMsg = () => {
    if (isTeamMute) return
    imageInputRef.current?.click()
  }

  const handleSendFileMsg = () => {
    if (isTeamMute) return
    fileInputRef.current?.click()
  }

  // 处理图片选择
  const onImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.info(t('selectImageText'))
      return
    }

    // 补充: 若图片超过 20MB, 当作文件对象发送而不是图片发送.
    const fileMsg = file.size > 20 * 1024 * 1024 ? nim.V2NIMMessageCreator.createFileMessage(file) : nim.V2NIMMessageCreator.createImageMessage(file)

    try {
      await store.msgStore.sendMessageActive({
        msg: fileMsg as unknown as V2NIMMessage,
        conversationId,
        progress: () => true,
        sendBefore: () => {
          scrollBottom()
        }
      })

      scrollBottom()
    } catch (err) {
      scrollBottom()
      toast.info(t('sendImageFailedText'))
    } finally {
      // 清空 input 的值，这样用户可以重复选择同一个文件
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  const onFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) return

    // 补充: 若图片超过 20MB, 当作文件对象发送而不是图片发送.
    const fileMsg = nim.V2NIMMessageCreator.createFileMessage(file)

    try {
      await store.msgStore.sendMessageActive({
        msg: fileMsg as unknown as V2NIMMessage,
        conversationId,
        progress: () => true,
        sendBefore: () => {
          scrollBottom()
        }
      })

      scrollBottom()
    } catch (err) {
      scrollBottom()
      toast.info(t('sendFileFailedText'))
    } finally {
      // 清空 input 的值，这样用户可以重复选择同一个文件
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  const handleInputChange = (value) => {
    setInputText(value)
    
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // 当前输入的是@ 展示群成员列表
    if (
      event.key === "@" &&
      conversationType ===
        V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM &&
      event
    ) {
      const cursorPos = event.currentTarget.selectionStart || 0
      setCursorPosition(cursorPos);
      setAtPosition(cursorPos - 1); // 修复这里，将 cursorPosition.value 改为 cursorPos
      setMentionPopupVisible(true)
      event.currentTarget.blur();
      
    }
  }

  // 关闭mention
  const handleCloseMention = () => {
    setMentionPopupVisible(false)
  };

  const handleMentionSelect = (member) => {
    const nickInTeam = member.appellation;
    setSelectedAtMembers([...selectedAtMembers.filter(item => item.accountId !== member.accountId), member]);

    // 在@符号位置插入@xxx，而不是追加到末尾
    const currentText = inputText;
    const beforeAt = currentText.substring(0, atPosition);
    const afterAt = currentText.substring(atPosition + 1); // +1 跳过@符号
    const newInputText = beforeAt + "@" + nickInTeam + " " + afterAt;

    // 使用 flushSync 确保同步更新, 更新input框的内容
    flushSync(() => {
      setInputText(newInputText);
      handleCloseMention();
    })

    try {
      // 使用我们的 ref 来设置光标位置
      if (inputRef.current) {
        // 计算新的光标位置
        const newCursorPos = atPosition + nickInTeam.length + 2; // @xxx + 空格
        
        // 使用 ref 的 setSelectionRange 方法
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    } catch (error) {
      console.error('Error setting cursor position:', error);
    }
  }


  // 监听群组信息
  useEffect(() => {
    if (conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM) {
      const myUser = store.userStore.myUserInfo
      setIsTeamOwner(team?.ownerAccountId === myUser?.accountId)
      setIsTeamManager(
        teamMembers
          .filter((item) => item.memberRole === V2NIMConst.V2NIMTeamMemberRole.V2NIM_TEAM_MEMBER_ROLE_MANAGER)
          .some((member) => member.accountId === myUser?.accountId)
      )
    }
  }, [conversationType, store.userStore.myUserInfo, to])

  // 监听消息重新编辑和回复
  useEffect(() => {
    // 撤回后，重新编辑消息
    const onReEditMsg = (_msg: any) => {
      const msg = _msg as V2NIMMessageForUI
      const _replyMsg = replyMsgsMap[msg.messageClientId]

      // 此处将 replyMsg 置空是为了解决：撤回普通消息1，撤回回复消息2，重新编辑消息2，再重新编辑消息1，
      // 输入框上方依然显示消息2的引用，消息1发送出去消息消息2的引用消息
      setReplyMsg(undefined)
      setIsReplyMsg(false)
      store.msgStore.removeReplyMsgActive(msg.conversationId)

      // 如果重新编辑的是回复消息，则需要将回复消息展示在输入框上方
      if (_replyMsg?.messageClientId) {
        _replyMsg && store.msgStore.replyMsgActive(_replyMsg)
        setReplyMsg(_replyMsg)
        setIsReplyMsg(true)
      }

      setInputText(msg?.oldText || '')
      setIsFocus(true)
    }

    // 回复消息
    const onReplyMsg = (msg: any) => {
      setIsReplyMsg(true)
      setIsFocus(true)
      setReplyMsg(msg as V2NIMMessageForUI)
    }

    // 关闭面板
    const onClosePanel = () => {
      setEmojiVisible(false)
      setSendMoreVisible(false)
    }

    emitter.on(events.ON_REEDIT_MSG, onReEditMsg)
    emitter.on(events.REPLY_MSG, onReplyMsg)
    emitter.on(events.CLOSE_PANEL, onClosePanel)

    return () => {
      emitter.off(events.ON_REEDIT_MSG, onReEditMsg)
      emitter.off(events.REPLY_MSG, onReplyMsg)
      emitter.off(events.CLOSE_PANEL, onClosePanel)
    }
  }, [replyMsgsMap])

  // 组件卸载时移除回复消息
  useEffect(() => {
    return () => {
      if (replyMsg?.conversationId) {
        store.msgStore.removeReplyMsgActive(replyMsg.conversationId)
      }
    }
  }, [replyMsg?.conversationId])

  return (
    <div className="input-root">
      {/* 回复消息显示区域 */}
      {isReplyMsg && (
        <div className="reply-message-wrapper">
          <div className="reply-message-close" onClick={removeReplyMsg}>
            <Icon style={{ color: '#929299', fontWeight: '200' }} size={13} type="icon-guanbi" />
          </div>
          <div className="reply-line">｜</div>
          <div className="reply-title">{t('replyText')}</div>
          {replyMsg && (
            <div className="reply-to">
              <Appellation
                account={replyMsg.senderId}
                teamId={conversationType === V2NIMConst.V2NIMConversationType.V2NIM_CONVERSATION_TYPE_TEAM ? to : ''}
                style={{ color: '#929299', fontSize: 13 }}
              />
            </div>
          )}
          <div className="reply-to-colon">:</div>

          {replyMsg && replyMsg.messageClientId === 'noFind' ? (
            <div className="reply-noFind">{t('replyNotFindText')}</div>
          ) : (
            <div className="reply-message">
              {replyMsg && replyMsg.messageType === V2NIMConst.V2NIMMessageType.V2NIM_MESSAGE_TYPE_TEXT ? (
                <MessageOneLine text={replyMsg.text || ''} />
              ) : (
                <div>{replyMsg?.messageType ? `[${REPLY_MSG_TYPE_MAP[replyMsg.messageType] || 'Unsupported Type'}]` : '[Unknown]'}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 输入区域 */}
      <div className="msg-input-wrapper">
        <div className="input-emoji-icon" onClick={handleEmojiVisible}>
          <Icon size={24} type="icon-biaoqing" />
        </div>

        <div className="input-inner">
          {/* 
            当从表情面板切换到文字输入时，直接唤起键盘，会导致input框滚动消失
            此处使用fake Input兼容，保证先隐藏表情/其他面板，再弹出键盘 
          */}
          {showFakeInput ? (
            <div className="fake-input" onClick={onHideFakeInput}>
              {inputText ? (
                <div className="input-text">{inputText}</div>
              ) : (
                <div className="input-placeholder">{isTeamMute ? t('teamMutePlaceholder') : t('chatInputPlaceHolder')}</div>
              )}
            </div>
          ) : (
            <Input
              id="msg-input"
              className="msg-input-input"
              placeholder={isTeamMute ? t('teamMutePlaceholder') : t('chatInputPlaceHolder')}
              value={inputText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isTeamMute}
              inputStyle={{
                padding: '0 10px'
              }}
              onConfirm={handleSendTextMsg}
              onBlur={handleInputBlur}
              onFocus={handleInputFocus}
              ref={inputRef}
            />
          )}
        </div>

        <div className="input-send-more" onClick={handleSendMoreVisible}>
          <Icon type="send-more" size={24} />
        </div>
      </div>

      {/* 表情面板 */}
      {emojiVisible && (
        <div className="msg-emoji-panel" onClick={(e) => e.stopPropagation()}>
          <Face onEmojiClick={handleEmoji} onEmojiDelete={handleEmojiDelete} onEmojiSend={handleSendTextMsg} />
        </div>
      )}

      {/* 发送更多面板 */}
      {sendMoreVisible && (
        <div className="send-more-panel" onClick={(e) => e.stopPropagation()}>
          <div className="send-more-panel-item-wrapper">
            <div className="send-more-panel-item">
              <input type="file" ref={imageInputRef} accept="image/*" className="file-input-overlay" onChange={onImageSelected} />
              <Icon size={26} type="icon-tupian" onClick={handleSendImageMsg} />
            </div>
            <div className="icon-text">{t('albumText')}</div>
          </div>
          <div className="send-more-panel-item-wrapper">
            <div className="send-more-panel-item">
              <input type="file" ref={fileInputRef} className="file-input-overlay" onChange={onFileSelected} />
              <Icon size={26} type="icon-tupian" onClick={handleSendFileMsg} />
            </div>
            <div className="icon-text">{t('fileText')}</div>
          </div>
        </div>
      )}

      {/** 艾特消息弹出层 */}
      {
        <BottomPopup
          visible={mentionPopupVisible}
          onCancel={() => setMentionPopupVisible(false)}
          showConfirm={false}
          showCancel={true}
        >
          <MentionChooseList teamId={to} onClose={handleCloseMention} onMemberClick={handleMentionSelect}></MentionChooseList>
        </BottomPopup>
      }
    </div>
  )
})

export default MessageInput