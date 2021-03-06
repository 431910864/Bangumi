/*
 * @Author: czy0729
 * @Date: 2019-05-01 20:14:08
 * @Last Modified by: czy0729
 * @Last Modified time: 2020-03-19 00:42:19
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { HeaderPlaceholder, Flex, Text, Divider } from '@components'
import { Avatar } from '@screens/_'
import { _ } from '@stores'
import { simpleTime } from '@utils'
import { findBangumiCn, appNavigate } from '@utils/app'
import { HOST, IOS } from '@constants'
import Content from './content'
import SectionTitle from './section-title'

function Top(props, { $, navigation }) {
  const { _replies } = $.params
  const event = {
    id: '帖子.跳转',
    data: {
      from: '#1',
      topicId: $.topicId
    }
  }

  // 人物这里不显示详情, 所以要把小组的相关信息替换成人物信息, 跳转到人物页面查看
  let groupPress = () =>
    appNavigate(
      $.groupHref,
      navigation,
      {
        _jp: $.group
      },
      event
    )
  if ($.isMono) {
    groupPress = () => appNavigate(`${HOST}/${$.monoId}`, navigation, {}, event)
  }

  const isGroup = $.topicId.includes('group/')
  return (
    <>
      {!IOS && <HeaderPlaceholder />}
      <View style={_.container.inner}>
        <Text type='title' size={20} bold>
          {$.title}
          {!!_replies && (
            <Text type='main' size={12} lineHeight={26}>
              {' '}
              {_replies}
            </Text>
          )}
        </Text>
        <Flex style={[styles.groupWrap, _.mt.sm]}>
          <Text>
            <Text size={13} underline numberOfLines={1} onPress={groupPress}>
              {findBangumiCn($.group)}
            </Text>
            {!!$.time && (
              <>
                <Text style={_.ml.sm} type='sub' size={13}>
                  {' '}
                  /{' '}
                </Text>
                <Text type='sub' size={13}>
                  {simpleTime($.time)}
                </Text>
              </>
            )}
          </Text>
        </Flex>
        {isGroup && (
          <Flex style={[styles.userWrap, _.mt.sm]}>
            <View style={styles.userAvatarWrap}>
              {!!$.avatar && (
                <Avatar
                  navigation={navigation}
                  event={event}
                  size={40}
                  src={$.avatar}
                  userId={$.userId}
                  name={$.userName}
                />
              )}
            </View>
            {!!$.userId && (
              <Flex.Item style={_.ml.sm}>
                <Text numberOfLines={2}>
                  {$.userName}
                  <Text type='sub'> @{$.userId}</Text>
                </Text>
                {!!$.userSign && (
                  <Text style={_.mt.xs} type='sub' size={12}>
                    {$.userSign.slice(1, $.userSign.length - 1)}
                  </Text>
                )}
              </Flex.Item>
            )}
          </Flex>
        )}
        <Content />
      </View>
      <Divider />
      <SectionTitle />
    </>
  )
}

Top.contextTypes = {
  $: PropTypes.object,
  navigation: PropTypes.object
}

export default observer(Top)

const styles = StyleSheet.create({
  groupWrap: {
    height: 32
  },
  userWrap: {
    height: 42
  },
  userAvatarWrap: {
    width: 40
  }
})
