/*
 * @Author: czy0729
 * @Date: 2019-07-15 09:27:59
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-07-15 09:31:56
 */
export const NAMESPACE = 'Subject'

// -------------------- init --------------------
export const INIT_SUBJECT_ITEM = {
  air_date: '',
  air_weekday: '',
  blog: null,
  collection: {},
  crt: [],
  eps: [],
  eps_count: '',
  id: '',
  images: {},
  name: '',
  name_cn: '',
  rank: '',
  rating: {
    count: {},
    score: '',
    total: ''
  },
  staff: [],
  summary: '',
  topic: [],
  type: '',
  url: ''
}

export const INIT_SUBJECT_FROM_HTML_ITEM = {
  tags: [], // 标签
  relations: [], // 关联条目
  friend: {
    score: 0, // 好友评分
    total: 0
  },
  typeNum: '', // eg. 291人想看 / 21人看过 / 744人在看 / 49人搁置 / 83人抛弃
  disc: [], // 曲目列表
  book: {}, // 书籍章节信息
  comit: [], // 单行本
  like: [] // 猜你喜欢
}

export const INIT_MONO = {
  name: '', // 日文名
  nameCn: '', // 中文名
  cover: '', // 封面
  info: '', // 简介
  detail: '', // 内容详情
  voice: [], // 最近演出角色
  workes: [], // 最近参与
  jobs: [] // 出演
}

export const INIT_MONO_COMMENTS_ITEM = {}