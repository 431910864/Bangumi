/*
 * @Params: { _url, _title, _replies, _group, _groupThumb,
 *            _time,_avatar, _userName, _userId, _desc }
 * @Author: czy0729
 * @Date: 2019-04-29 19:55:09
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-03-19 01:16:22
 */
import { observable, computed } from 'mobx'
import {
  systemStore,
  rakuenStore,
  subjectStore,
  userStore,
  usersStore
} from '@stores'
import { IOS, HOST } from '@constants'
import store from '@utils/store'
import { removeHTMLTag } from '@utils/html'
import { info } from '@utils/ui'
import { t, baiduTranslate } from '@utils/fetch'
import decoder from '@utils/thirdParty/html-entities-decoder'

const namespace = 'ScreenTopic'
const excludeState = {
  placeholder: '', // 回复框placeholder
  value: '', // 回复框value
  replySub: '', // 存放bgm特有的子回复配置字符串
  message: '', // 存放子回复html
  translateResult: [] // 翻译缓存
}

export default class ScreenTopic extends store {
  state = observable({
    ...excludeState,
    filterMe: false,
    filterFriends: false,
    reverse: false,
    _loaded: false
  })

  init = async () => {
    const state = await this.getStorage(undefined, this.namespace)
    const commonState = (await this.getStorage(undefined, namespace)) || {}
    this.setState({
      ...state,
      ...excludeState,
      reverse: commonState.reverse,
      _loaded: true
    })

    this.fetchTopicFromCDN()

    // 章节需要请求章节详情
    if (this.isEp) {
      this.fetchEpFormHTML()
    }

    // 本地帖子过来不主动请求
    const { _noFetch } = this.params
    if (_noFetch) {
      return true
    }
    return this.fetchTopic()
  }

  // -------------------- fetch --------------------
  fetchTopic = () =>
    rakuenStore.fetchTopic({
      topicId: this.topicId
    })

  fetchEpFormHTML = () => {
    const epId = this.topicId.replace('ep/', '')
    return subjectStore.fetchEpFormHTML(epId)
  }

  /**
   * 私有CDN的帖子内容信息
   */
  fetchTopicFromCDN = () => {
    if (!this.topicId.includes('group/')) {
      return false
    }

    const { setting } = systemStore
    const { _loaded } = this.topic
    if (!setting.cdn || _loaded) {
      return true
    }

    return rakuenStore.fetchTopicFormCDN(this.topicId.replace('group/', ''))
  }

  // -------------------- get --------------------
  @computed get topicId() {
    const { topicId = '' } = this.params
    if (!topicId) {
      return '0'
    }
    return topicId.split('#')[0]
  }

  /**
   * 需要跳转到的楼层id
   */
  @computed get postId() {
    const { topicId = '' } = this.params
    const [, postId] = topicId.split('#post_')
    return postId
  }

  @computed get namespace() {
    return `${namespace}|${this.topicId}`
  }

  @computed get topic() {
    return rakuenStore.topic(this.topicId)
  }

  @computed get topicFormCDN() {
    return rakuenStore.topicFormCDN(this.topicId.replace('group/', ''))
  }

  @computed get comments() {
    const comments = rakuenStore.comments(this.topicId)
    const { filterMe, filterFriends, reverse } = this.state

    const list = reverse ? comments.list.reverse() : comments.list
    if (filterMe) {
      return {
        ...comments,
        list: list.filter(item => {
          if (item.sub.findIndex(i => i.userId === this.myId) !== -1) {
            return true
          }
          return item.userId === this.myId
        }),
        pagination: {
          page: 1,
          pageTotal: 1
        }
      }
    }

    // @notice 只显示好友相关评论
    if (filterFriends) {
      return {
        ...comments,
        list: list.filter(item => {
          if (item.sub.findIndex(i => this.myFriendsMap[i.userId]) !== -1) {
            return true
          }
          return this.myFriendsMap[item.userId]
        }),
        pagination: {
          page: 1,
          pageTotal: 1
        }
      }
    }

    return {
      ...comments,
      list
    }
  }

  @computed get commentMeCount() {
    const { list } = rakuenStore.comments(this.topicId)
    return list.filter(item => {
      if (item.sub.findIndex(i => i.userId === this.myId) !== -1) {
        return true
      }
      return item.userId === this.myId
    }).length
  }

  @computed get commentFriendsCount() {
    const { list } = rakuenStore.comments(this.topicId)
    return list.filter(item => {
      if (item.sub.findIndex(i => this.myFriendsMap[i.userId]) !== -1) {
        return true
      }
      return this.myFriendsMap[item.userId]
    }).length
  }

  @computed get isEp() {
    return this.topicId.indexOf('ep/') === 0
  }

  @computed get isMono() {
    return (
      this.topicId.indexOf('prsn/') === 0 || this.topicId.indexOf('crt/') === 0
    )
  }

  @computed get monoId() {
    if (this.topicId.indexOf('prsn/') === 0) {
      return this.topicId.replace('prsn/', 'person/')
    }

    if (this.topicId.indexOf('crt/') === 0) {
      return this.topicId.replace('crt/', 'character/')
    }

    return this.topicId
  }

  @computed get epFormHTML() {
    const epId = this.topicId.replace('ep/', '')
    return subjectStore.epFormHTML(epId)
  }

  @computed get isWebLogin() {
    return userStore.isWebLogin
  }

  @computed get readed() {
    return rakuenStore.readed(this.topicId)
  }

  @computed get myId() {
    return userStore.myId
  }

  @computed get myFriendsMap() {
    return usersStore.myFriendsMap
  }

  @computed get isUGCAgree() {
    return systemStore.isUGCAgree
  }

  @computed get isFavor() {
    return rakuenStore.favor(this.topicId)
  }

  @computed get setting() {
    return rakuenStore.setting
  }

  // -------------------- get: cdn fallback --------------------
  @computed get title() {
    return (
      this.topic.title || this.params._title || this.topicFormCDN.title || ''
    )
  }

  @computed get group() {
    if (this.isMono) {
      return this.topic.title || this.params._title
    }
    return (
      this.topic.group || this.params._group || this.topicFormCDN.group || ''
    )
  }

  @computed get groupThumb() {
    const { _group, _groupThumb } = this.params
    if (_groupThumb) {
      return _groupThumb
    }
    if (_group) {
      return rakuenStore.groupThumb(_group)
    }
    return this.topicFormCDN.groupThumb || ''
  }

  @computed get groupHref() {
    return this.topic.groupHref || this.topicFormCDN.groupHref || ''
  }

  @computed get time() {
    return this.topic.time || this.topicFormCDN.time || ''
  }

  @computed get avatar() {
    return (
      this.topic.avatar || this.params._avatar || this.topicFormCDN.avatar || ''
    )
  }

  @computed get userId() {
    return (
      this.topic.userId || this.params._userId || this.topicFormCDN.userId || ''
    )
  }

  @computed get userName() {
    return (
      this.topic.userName ||
      this.params._userName ||
      this.topicFormCDN.userName ||
      ''
    )
  }

  @computed get userSign() {
    return this.topic.userSign || this.topicFormCDN.userSign || ''
  }

  @computed get html() {
    // ep带上章节详情
    if (this.isEp) {
      return this.epFormHTML || this.params._desc
    }
    return this.topic.message || this.topicFormCDN.message || ''
  }

  // -------------------- page --------------------
  /**
   * 吐槽倒序
   */
  toggleReverseComments = () => {
    const { reverse } = this.state
    t('帖子.吐槽倒序', {
      topicId: this.topicId,
      reverse: !reverse
    })

    this.setState({
      reverse: !reverse
    })
    this.setStorage(undefined, undefined, namespace)
  }

  /**
   * 显示与我相关的回复
   */
  toggleFilterMe = () => {
    const { filterMe } = this.state
    t('帖子.与我相关', {
      topicId: this.topicId,
      filterMe: !filterMe
    })

    this.setState({
      filterMe: !filterMe,
      filterFriends: false
    })
    this.setStorage(undefined, undefined, this.namespace)
  }

  /**
   * 显示好友相关的回复
   */
  toggleFilterFriends = () => {
    const { filterFriends } = this.state
    t('帖子.好友相关', {
      topicId: this.topicId,
      filterFriends: !filterFriends
    })

    this.setState({
      filterMe: false,
      filterFriends: !filterFriends
    })
    this.setStorage(undefined, undefined, this.namespace)
  }

  /**
   * 显示评论框
   */
  showFixedTextarea = (placeholder, replySub, message) => {
    t('帖子.显示评论框', {
      topicId: this.topicId
    })

    this.setState({
      placeholder,
      replySub,
      message
    })
  }

  /**
   * 收起评论框
   */
  closeFixedTextarea = () => {
    this.setState({
      placeholder: '',
      replySub: '',
      message: ''
    })
  }

  /**
   * 输入框变化
   */
  onChange = value => {
    this.setState({
      value
    })
  }

  /**
   * 失败后恢复上次的内容
   */
  recoveryContent = content => {
    t('帖子.回复失败', {
      topicId: this.topicId
    })

    info('回复失败，可能是cookie失效了')
    this.setState({
      value: ''
    })
    setTimeout(() => {
      this.setState({
        value: content
      })
    }, 160)
  }

  /**
   * 设置收藏
   */
  setFavor = () => {
    t('帖子.设置收藏', {
      topicId: this.topicId,
      isFavor: !this.isFavor
    })

    rakuenStore.setFavor(this.topicId, !this.isFavor)
  }

  // -------------------- action --------------------
  /**
   * 提交回复
   */
  doSubmit = content => {
    let type
    if (this.topicId.includes('group/')) {
      type = 'group/topic'
    } else if (this.topicId.includes('subject/')) {
      type = 'subject/topic'
    } else if (this.topicId.includes('ep/')) {
      type = 'subject/ep'
    } else if (this.topicId.includes('crt/')) {
      type = 'character'
    } else if (this.topicId.includes('prsn/')) {
      type = 'person'
    } else {
      return
    }

    const { replySub } = this.state
    if (replySub) {
      this.doReplySub(content, type)
      return
    }

    this.doReply(content, type)
  }

  /**
   * 回复
   */
  doReply = (content, type) => {
    t('帖子.回复', {
      topicId: this.topicId,
      sub: false
    })

    const { formhash } = this.topic
    rakuenStore.doReply(
      {
        type,
        topicId: this.topicId.match(/\d+/g)[0],
        content,
        formhash
      },
      responseText => {
        let res = {}
        try {
          res = JSON.parse(responseText)
        } catch (error) {
          // do nothing
        }

        if (IOS && res.status !== 'ok') {
          this.recoveryContent(content)
        } else {
          this.setState({
            value: ''
          })
        }

        this.fetchTopic()
      }
    )
  }

  /**
   * 回复子回复
   */
  doReplySub = (content, type) => {
    t('帖子.回复', {
      topicId: this.topicId,
      sub: true
    })

    const { placeholder, replySub, message } = this.state
    const { formhash } = this.topic

    const [, topicId, related, , subReplyUid, postUid] = replySub.split(',')
    let _content = content
    if (message) {
      const _message = decoder(message).replace(
        /<div class="quote"><q>.*<\/q><\/div>/,
        ''
      )
      _content = `[quote][b]${placeholder}[/b] 说: ${removeHTMLTag(
        _message
      )}[/quote]\n${content}`
    }
    rakuenStore.doReply(
      {
        type,
        content: _content,
        formhash,
        topicId,
        related,
        sub_reply_uid: subReplyUid,
        post_uid: postUid
      },
      responseText => {
        let res = {}
        try {
          res = JSON.parse(responseText)
        } catch (error) {
          // do nothing
        }

        if (IOS && res.status !== 'ok') {
          this.recoveryContent(content)
        } else {
          this.setState({
            value: ''
          })
        }

        this.fetchTopic()
      }
    )
  }

  /**
   * 删除回复
   */
  doDeleteReply = url => {
    if (!url) {
      return
    }

    t('帖子.删除回复', {
      topicId: this.topicId
    })

    rakuenStore.doDeleteReply(
      {
        url: `${HOST}/${url}`
      },
      () => {
        info('已删除')
        this.fetchTopic()
      }
    )
  }

  /**
   * 翻译内容
   */
  doTranslate = async () => {
    if (this.state.translateResult.length) {
      return
    }

    t('帖子.翻译内容', {
      topicId: this.topicId
    })

    try {
      const response = await baiduTranslate(
        String(`${this.title}\n${this.html}`)
          .replace(/<br \/>/g, '\n')
          .replace(/<\/?[^>]*>/g, '') // 去除HTML tag
      )
      const { trans_result: translateResult } = JSON.parse(response)
      if (Array.isArray(translateResult)) {
        this.setState({
          translateResult
        })
        info('翻译成功')
        return
      }
      info('翻译失败, 请重试')
    } catch (error) {
      info('翻译失败, 请重试')
    }
  }
}
