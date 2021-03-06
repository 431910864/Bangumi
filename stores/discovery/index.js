/*
 * @Author: czy0729
 * @Date: 2019-06-22 15:44:31
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-04-05 02:05:00
 */
import { observable, computed } from 'mobx'
import { getTimestamp } from '@utils'
import store from '@utils/store'
import { fetchHTML } from '@utils/fetch'
import { log } from '@utils/dev'
import { HTMLDecode } from '@utils/html'
import { LIST_EMPTY, HOST_NING_MOE, HOST_ANITAMA } from '@constants'
import {
  HTML_TAGS,
  HTML_CATALOG,
  HTML_CATALOG_DETAIL,
  HTML_BLOG_LIST
} from '@constants/html'
import {
  NAMESPACE,
  DEFAULT_TYPE,
  INIT_NINGMOE_DETAIL_ITEM,
  INIT_ANITAMA_TIMELINE_ITEM,
  INIT_CATALOG_ITEM,
  INIT_CATELOG_DETAIL_ITEM,
  INIT_BLOG_ITEM
} from './init'
import {
  analysisTags,
  analysisCatalog,
  analysisCatalogDetail,
  cheerioBlog
} from './common'

class Discovery extends store {
  state = observable({
    /**
     * 随机看看
     */
    random: LIST_EMPTY,

    /**
     * 柠萌条目信息
     */
    ningMoeDetail: {
      // [bgmId]: INIT_NINGMOE_DETAIL_ITEM
    },

    /**
     * Anitama文章列表
     */
    anitamaTimeline: {
      // [page]: INIT_ANITAMA_TIMELINE_ITEM
    },

    /**
     * 标签
     */
    tags: {
      // [type]: LIST_EMPTY<INIT_TAGS_ITEM>
    },

    /**
     * 目录
     * @params {*} type '' | collect | me
     */
    catalog: {
      // [`${type}|${page}`]: INIT_CATALOG_ITEM
    },

    /**
     * 目录详情
     */
    catalogDetail: {
      // [id]: INIT_CATELOG_DETAIL_ITEM
    },

    /**
     * 全站日志
     * @params {*} type all => '' | anime | book | game | music | real
     */
    blog: {
      // [`${type}|${page}`]: INIT_BLOG_ITEM
    },

    /**
     * 日志查看历史
     */
    blogReaded: {
      // [blogId]: true
    }
  })

  init = () =>
    this.readStorage(
      [
        'ningMoeDetail',
        'tags',
        'catalog',
        'catalogDetail',
        'blog',
        'blogReaded'
      ],
      NAMESPACE
    )

  // -------------------- get --------------------
  @computed get random() {
    return this.state.random || LIST_EMPTY
  }

  ningMoeDetail(bgmId) {
    return computed(
      () => this.state.ningMoeDetail[bgmId] || INIT_NINGMOE_DETAIL_ITEM
    ).get()
  }

  anitamaTimeline(page = 1) {
    return this.state.anitamaTimeline[page] || INIT_ANITAMA_TIMELINE_ITEM
  }

  tags(type = DEFAULT_TYPE) {
    return this.state.tags[type] || LIST_EMPTY
  }

  catalog(type = '', page = 1) {
    return this.state.catalog[`${type}|${page}`] || INIT_CATALOG_ITEM
  }

  catalogDetail(id) {
    return this.state.catalogDetail[id] || INIT_CATELOG_DETAIL_ITEM
  }

  blog(type = '', page = 1) {
    return this.state.blog[`${type}|${page}`] || INIT_BLOG_ITEM
  }

  blogReaded(blogId) {
    return this.state.blogReaded[blogId]
  }

  // -------------------- fetch --------------------
  /**
   * 随便看看
   * @param {*} refresh
   */
  fetchRandom = async refresh => {
    const url = `${HOST_NING_MOE}/api/get_random_bangumi`
    log(`[fetch] 柠萌动漫随便看看 ${url}`)

    try {
      const { list, pagination } = this.random
      const data = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          current_list: refresh ? '[]' : `[${list.map(item => item.id).join()}]`
        })
      }).then(response => response.json())

      let random
      if (data.code === 200) {
        const nextList = data.data.map(({ classification: item }) => ({
          id: item.id,
          bgmId: item.bgm_id,
          cover: item.bangumi_cover,
          jp: HTMLDecode(item.en_name),
          cn: HTMLDecode(item.cn_name),
          desc: item.description,
          eps: item.eps,
          airDate: item.air_date
        }))

        const key = 'random'
        random = {
          list: refresh ? nextList : [...list, ...nextList],
          pagination: {
            page: pagination.page + 1,
            pageTotal: 100
          },
          _loaded: getTimestamp()
        }
        this.setState({
          [key]: random
        })
        this.setStorage(key, undefined, NAMESPACE)
      }

      return Promise.resolve(random)
    } catch (error) {
      return Promise.resolve(LIST_EMPTY)
    }
  }

  /**
   * 搜索柠萌动漫信息
   * @param {*} keyword 关键字
   */
  fetchNingMoeDetailBySearch = async ({ keyword }) => {
    const url = `${HOST_NING_MOE}/api/search`
    log(`[fetch] 搜索柠萌动漫信息 ${url}, ${keyword}`)

    try {
      const data = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          bangumi_type: '',
          keyword,
          limit: 10,
          page: 1,
          token: null,
          type: 'anime'
        })
      }).then(response => response.json())

      let ningMoeDetail = INIT_NINGMOE_DETAIL_ITEM
      if (data.code === 200) {
        if (Array.isArray(data.data)) {
          const key = 'ningMoeDetail'
          const { id, bgm_id: bgmId } = data.data[0].classification
          ningMoeDetail = {
            id,
            bgmId
          }
          this.setState({
            [key]: {
              [bgmId]: ningMoeDetail
            }
          })
          this.setStorage(key, undefined, NAMESPACE)
        }
      }

      return Promise.resolve(ningMoeDetail)
    } catch (error) {
      return Promise.resolve(INIT_NINGMOE_DETAIL_ITEM)
    }
  }

  /**
   * 查询柠萌动漫信息
   * @param {*} id
   * @param {*} bgmId
   */
  fetchNingMoeDetail = async ({ id, bgmId }) => {
    const url = `${HOST_NING_MOE}/api/get_bangumi`
    log(`[fetch] 查询柠萌动漫信息 ${url}`)

    try {
      const data = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          bangumi_id: id
        })
      }).then(response => response.json())

      let ningMoeDetail = INIT_NINGMOE_DETAIL_ITEM
      if (data.code === 200) {
        const key = 'ningMoeDetail'
        ningMoeDetail = {
          id,
          bgmId

          // @todo 暂时不做播放视频, 所以bakUrl无意义
          // eps: data.data.posts.reverse().map(item => ({
          //   bakUrl: item.bak_url,
          //   sort: item.eps
          // }))
        }
        this.setState({
          [key]: {
            [bgmId]: ningMoeDetail
          }
        })
        this.setStorage(key, undefined, NAMESPACE)
      }

      return Promise.resolve(ningMoeDetail)
    } catch (error) {
      return Promise.resolve(INIT_NINGMOE_DETAIL_ITEM)
    }
  }

  /**
   * 查询真正的云盘地址
   * @param {*} url
   */
  fetchNingMoeRealYunUrl = async ({ url }) => {
    const _url = `${HOST_NING_MOE}/api/get_real_yun_url`
    log(`[fetch] 查询真正的云盘地址 ${_url}`)

    try {
      const data = await fetch(_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          url
        })
      }).then(response => response.json())

      let ningMoeRealYunUrl = ''
      if (data.code === 200) {
        ningMoeRealYunUrl = data.data.yun_url
      }

      return Promise.resolve(ningMoeRealYunUrl)
    } catch (error) {
      return Promise.resolve('')
    }
  }

  /**
   * Anitama文章列表
   */
  fetchAnitamaTimeline = async (page = 1) => {
    const url = `${HOST_ANITAMA}/timeline?pageNo=${page}`
    log(`[fetch] Anitama文章列表 ${url}`)

    let animataTimeline = INIT_ANITAMA_TIMELINE_ITEM
    try {
      const data = await fetch(url).then(response => response.json())
      if (data.status === 200 && data.success) {
        const key = 'anitamaTimeline'
        animataTimeline = {
          list: data.data.page.list.filter(
            item => item.entryType === 'article'
          ),
          _loaded: getTimestamp()
        }
        this.setState({
          [key]: {
            [page]: animataTimeline
          }
        })
      }
    } catch (error) {
      // do nothing
    }

    return Promise.resolve(animataTimeline)
  }

  /**
   * 标签
   */
  fetchTags = async ({ type = DEFAULT_TYPE } = {}, refresh) => {
    const { list, pagination } = this.tags(type)
    let page
    if (refresh) {
      page = 1
    } else {
      page = pagination.page + 1
    }

    const html = await fetchHTML({
      url: HTML_TAGS(type, page)
    })
    const data = analysisTags(html)

    let characters
    if (refresh) {
      characters = {
        list: data.list,
        pagination: data.pagination,
        _loaded: getTimestamp()
      }
    } else {
      characters = {
        list: [...list, ...data.list],
        pagination: {
          ...pagination,
          page: pagination.page + 1
        },
        _loaded: getTimestamp()
      }
    }

    const key = 'tags'
    this.setState({
      [key]: {
        [type]: characters
      }
    })
    this.setStorage(key, undefined, NAMESPACE)

    return characters
  }

  /**
   * 目录
   */
  fetchCatalog = async ({ type = '', page = 1 } = {}) => {
    const html = await fetchHTML({
      url: HTML_CATALOG(type, page)
    })
    const data = analysisCatalog(html)

    const key = 'catalog'
    this.setState({
      [key]: {
        [`${type}|${page}`]: {
          list: data,
          _loaded: getTimestamp()
        }
      }
    })
    this.setStorage(key, undefined, NAMESPACE)

    return data
  }

  /**
   * 目录详情
   */
  fetchCatalogDetail = async ({ id } = {}) => {
    const html = await fetchHTML({
      url: HTML_CATALOG_DETAIL(id)
    })
    const data = analysisCatalogDetail(html)

    const key = 'catalogDetail'
    this.setState({
      [key]: {
        [id]: {
          ...data,
          _loaded: getTimestamp()
        }
      }
    })
    this.setStorage(key, undefined, NAMESPACE)

    return data
  }

  /**
   * 全站日志
   */
  fetchBlog = async ({ type = '', page = 1 }) => {
    const key = 'blog'
    const html = await fetchHTML({
      url: HTML_BLOG_LIST(type, page)
    })

    const list = cheerioBlog(html)
    this.setState({
      [key]: {
        [`${type}|${page}`]: {
          list,
          _loaded: getTimestamp()
        }
      }
    })
    this.setStorage(key, undefined, NAMESPACE)

    return list
  }

  // -------------------- page --------------------
  /**
   * 更新日志查看历史
   */
  updateBlogReaded = blogId => {
    const { blogReaded } = this.state
    this.setState({
      blogReaded: {
        ...blogReaded,
        [blogId]: true
      }
    })
  }
}

export default new Discovery()
