import { lazy } from 'react'
import type { RouteObject } from 'react-router-dom'

// 使用 React.lazy 实现代码分割
const ConversationPage = lazy(() => import('./pages/conversation'))
const ConversationSearchPage = lazy(() => import('./pages/conversation/search'))
const LoginPage = lazy(() => import('./pages/login'))
const ContactsPage = lazy(() => import('./pages/contacts'))
const TeamListPage = lazy(() => import('./pages/contacts/teamList'))
const BlackListPage = lazy(() => import('./pages/contacts/blackList'))
const ValidListPage = lazy(() => import('./pages/contacts/validList'))
const MyPage = lazy(() => import('./pages/user/my'))
const MyDetailPage = lazy(() => import('./pages/user/myDetail'))
const MyDetailEditPage = lazy(() => import('./pages/user/myDetailEdit'))
const AboutNeteasePage = lazy(() => import('./pages/user/aboutNetease'))
const SettingPage = lazy(() => import('./pages/user/setting'))
const FriendCardPage = lazy(() => import('./pages/friend/friendCard'))
const FriendAddPage = lazy(() => import('./pages/friend/add'))
const FriendEditPage = lazy(() => import('./pages/friend/edit'))
const ChatPage = lazy(() => import('./pages/chat'))
const MessageReadInfoPage = lazy(() => import('./pages/chat/messageReadInfo'))
const P2PSettingPage = lazy(() => import('./pages/chat/p2pSetting'))
const TeamCreatePage = lazy(() => import('./pages/team/teamCreate'))
const TeamAddPage = lazy(() => import('./pages/team/teamAdd'))
const TeamMemberPage = lazy(() => import('./pages/team/teamMember'))
const TeamSettingPage = lazy(() => import('./pages/team/teamSetting'))
const TeamInfoEditPage = lazy(() => import('./pages/team/teamInfoEdit'))
const TeamInfoIntroduceEditPage = lazy(() => import('./pages/team/teamInfoIntroduceEdit'))
const TeamInfoAvatarEditPage = lazy(() => import('./pages/team/teamInfoAvatarEdit'))
const TeamInfoNickEditPage = lazy(() => import('./pages/team/teamInfoNickEdit'))

// 路由配置 - 在嵌套路由中，子路由路径是相对于父路由的
export const routes: RouteObject[] = [
  { index: true, element: <ConversationPage /> },
  { path: 'conversation', element: <ConversationPage /> },
  { path: 'conversation/search', element: <ConversationSearchPage /> },
  { path: 'login', element: <LoginPage /> },
  { path: 'contacts', element: <ContactsPage /> },
  { path: 'contacts/teamlist', element: <TeamListPage /> },
  { path: 'contacts/blacklist', element: <BlackListPage /> },
  { path: 'contacts/validlist', element: <ValidListPage /> },
  { path: 'my', element: <MyPage /> },
  { path: 'user/my-detail', element: <MyDetailPage /> },
  { path: 'user/my-detail-edit', element: <MyDetailEditPage /> },
  { path: 'user/aboutNetease', element: <AboutNeteasePage /> },
  { path: 'user/setting', element: <SettingPage /> },
  { path: 'friend/friend-card', element: <FriendCardPage /> },
  { path: 'friend/add', element: <FriendAddPage /> },
  { path: 'friend/edit', element: <FriendEditPage /> },
  { path: 'chat', element: <ChatPage /> },
  { path: 'chat/message-read-info', element: <MessageReadInfoPage /> },
  { path: 'p2p-setting', element: <P2PSettingPage /> },
  { path: 'team/create', element: <TeamCreatePage /> },
  { path: 'team/add', element: <TeamAddPage /> },
  { path: 'team/member', element: <TeamMemberPage /> },
  { path: 'team/setting', element: <TeamSettingPage /> },
  { path: 'team/info-edit', element: <TeamInfoEditPage /> },
  { path: 'team/info/introduce-edit', element: <TeamInfoIntroduceEditPage /> },
  { path: 'team/info/avatar-edit', element: <TeamInfoAvatarEditPage /> },
  { path: 'team/info/nick-edit', element: <TeamInfoNickEditPage /> },
]
