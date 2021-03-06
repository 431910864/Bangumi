/*
 * @Author: czy0729
 * @Date: 2019-04-14 00:51:13
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-01-23 19:49:38
 */
import React from 'react'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { Loading, ListView } from '@components'
import { Login, SectionHeader, ItemTimeline } from '@screens/_'
import { _ } from '@stores'
import { keyExtractor } from '@utils/app'
import { withTabsHeader } from '@utils/decorators'
import { MODEL_TIMELINE_SCOPE, MODEL_TIMELINE_TYPE } from '@constants/model'

export default
@observer
class List extends React.Component {
  static contextTypes = {
    $: PropTypes.object,
    navigation: PropTypes.object
  }

  state = {
    /**
     * @issue 列表的滚回顶部scrollToLocation不知道如何正确使用
     * 暂时使用重新渲染的办法解决列表变换置顶问题
     */
    hide: false
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.scope !== this.props.scope) {
      this.setState({
        hide: true
      })

      setTimeout(() => {
        this.setState({
          hide: false
        })
      }, 0)
    }
  }

  renderItem = ({ item, index }) => {
    const { $, navigation } = this.context
    const { scope, title } = this.props
    const event = {
      id: '时间胶囊.跳转',
      data: {
        scope,
        title
      }
    }
    return (
      <ItemTimeline
        navigation={navigation}
        index={index}
        {...item}
        event={event}
        onDelete={$.doDelete}
      />
    )
  }

  render() {
    const { $ } = this.context
    const { scope, title } = this.props
    const label = MODEL_TIMELINE_SCOPE.getLabel(scope)
    if (!$.isWebLogin && ['好友', '自己'].includes(label)) {
      return <Login />
    }

    const { hide } = this.state
    if (hide) {
      return null
    }

    const timeline = $.timeline(scope, MODEL_TIMELINE_TYPE.getValue(title))
    if (!timeline._loaded) {
      return <Loading />
    }

    return (
      <ListView
        contentContainerStyle={_.container.bottom}
        keyExtractor={keyExtractor}
        data={timeline}
        sectionKey='date'
        stickySectionHeadersEnabled={false}
        renderSectionHeader={renderSectionHeader}
        renderItem={this.renderItem}
        onHeaderRefresh={$.onHeaderRefresh}
        onFooterRefresh={$.fetchTimeline}
        {...withTabsHeader.listViewProps}
      />
    )
  }
}

function renderSectionHeader({ section: { title } }) {
  return <SectionHeader>{title}</SectionHeader>
}
