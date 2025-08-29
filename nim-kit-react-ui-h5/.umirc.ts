import { defineConfig } from 'umi'

export default defineConfig({
  title: 'Netease IM React H5',
  history: { type: 'hash' },
  routes: [
    { path: '/', component: 'conversation/index' },
    { path: '/conversation', component: 'conversation/index' },
    { path: '/conversation/search', component: 'conversation/search' },
    { path: '/login', component: 'login/index' },
    { path: '/contacts', component: 'contacts/index' },
    { path: '/contacts/teamlist', component: 'contacts/teamList' },
    { path: '/contacts/blacklist', component: 'contacts/blackList' },
    { path: '/contacts/validlist', component: 'contacts/validList' },
    { path: '/my', component: 'user/my' },
    { path: '/user/my-detail', component: 'user/myDetail' },
    { path: '/user/my-detail-edit', component: 'user/myDetailEdit' },
    { path: '/user/aboutNetease', component: 'user/aboutNetease' },
    { path: '/user/setting', component: 'user/setting' },
    { path: '/friend/friend-card', component: 'friend/friendCard' },
    { path: '/friend/add', component: 'friend/add' },
    { path: '/friend/edit', component: 'friend/edit' },
    { path: '/chat', component: 'chat/index' },
    { path: '/chat/message-read-info', component: 'chat/messageReadInfo' },
    { path: '/p2p-setting', component: 'chat/p2pSetting' },
    { path: '/team/create', component: 'team/teamCreate' },
    { path: '/team/add', component: 'team/teamAdd' },
    { path: '/team/member', component: 'team/teamMember' },
    { path: '/team/setting', component: 'team/teamSetting' },
    { path: '/team/info-edit', component: 'team/teamInfoEdit' },
    { path: '/team/info/introduce-edit', component: 'team/teamInfoIntroduceEdit' },
    { path: '/team/info/avatar-edit', component: 'team/teamInfoAvatarEdit' },
    { path: '/team/info/nick-edit', component: 'team/teamInfoNickEdit' }
  ],
  npmClient: 'npm'
})
