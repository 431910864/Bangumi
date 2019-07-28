/*
 * 标签
 * @Author: czy0729
 * @Date: 2019-06-08 03:25:36
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-07-28 18:04:13
 */
import { observable, computed } from 'mobx'
import { getTimestamp } from '@utils'
import store from '@utils/store'
import { fetchHTML } from '@utils/fetch'
import { LIST_EMPTY } from '@constants'
import { HTML_TAG, HTML_RANK } from '@constants/html'
import { NAMESPACE, DEFAULT_TYPE } from './init'
import { analysisTags } from './common'

class Tag extends store {
  state = observable({
    // 标签列表
    tag: {
      // [`${text}|${type}`]: LIST_EMPTY | INIT_TAG_ITEM
    },

    // 排行榜
    rank: {
      // [type]: LIST_EMPTY | INIT_RANK_ITEM
    }
  })

  async init() {
    const res = Promise.all([
      this.getStorage('tag', NAMESPACE),
      this.getStorage('rank', NAMESPACE)
    ])
    const state = await res
    this.setState({
      tag: state[0] || {},
      rank: state[1] || {}
    })
    return res
  }

  // -------------------- get --------------------
  /**
   * 取标签结果
   * @param {*} text 标签
   */
  tag(text = '', type = DEFAULT_TYPE) {
    const _text = text.replace(/ /g, '+')
    return computed(
      () => this.state.tag[`${_text}|${type}`] || LIST_EMPTY
    ).get()
  }

  /**
   * 取排行榜
   * @param {*} text 标签
   */
  rank(type = DEFAULT_TYPE) {
    return computed(() => this.state.rank[type] || LIST_EMPTY).get()
  }

  // -------------------- fetch --------------------
  /**
   * 标签结果
   * @param {*} text 关键字
   * @param {*} type 类型
   * @param {*} order 排序
   * @param {*} refresh 是否刷新
   */
  async fetchTag({ text = '', type = DEFAULT_TYPE, order } = {}, refresh) {
    const _text = text.replace(/ /g, '+')

    const { list, pagination } = this.tag(_text, type)
    let page // 下一页的页码
    if (refresh) {
      page = 1
    } else {
      page = pagination.page + 1
    }

    // -------------------- 请求HTML --------------------
    const res = fetchHTML({
      url: HTML_TAG(_text, type, order, page)
    })
    const raw = await res
    const { pageTotal, tag } = analysisTags(raw, page, pagination)

    const key = 'tag'
    const stateKey = `${_text}|${type}`
    this.setState({
      [key]: {
        [stateKey]: {
          list: refresh ? tag : [...list, ...tag],
          pagination: {
            page,
            pageTotal: parseInt(pageTotal)
          },
          _loaded: getTimestamp()
        }
      }
    })
    this.setStorage(key, undefined, NAMESPACE)

    return res
  }

  /**
   * 排行榜(与标签相似, 所以共用逻辑)
   * @param {*} type 类型
   * @param {*} filter 类型2
   * 动画: tv | web | ova | movie | misc
   * 书籍: comic | novel | illustration | misc
   * 音乐: [null]
   * 游戏: pc | mac | ps4 | xbox_one | ns | will_u | ps3 | xbox360 | wii | psv | 3ds | nds | psp | ps2 | xbox | ps | fc | gba | gb |
   * 三次元: jp | en | cn | misc
   * @param {*} airtime 2020-1960
   * @param {*} refresh 是否刷新
   */
  async fetchRank({ type = DEFAULT_TYPE, filter, airtime } = {}, refresh) {
    const { list, pagination } = this.rank(type)
    let page // 下一页的页码
    if (refresh) {
      page = 1
    } else {
      page = pagination.page + 1
    }

    // -------------------- 请求HTML --------------------
    const res = fetchHTML({
      url: HTML_RANK(type, 'rank', page, filter, airtime)
    })
    const raw = await res
    const { pageTotal, tag } = analysisTags(raw, page, pagination)

    const key = 'rank'
    const stateKey = type
    this.setState({
      [key]: {
        [stateKey]: {
          list: refresh ? tag : [...list, ...tag],
          pagination: {
            page,
            pageTotal: parseInt(pageTotal)
          },
          _loaded: getTimestamp()
        }
      }
    })
    this.setStorage(key, undefined, NAMESPACE)

    return res
  }
}

export default new Tag()
