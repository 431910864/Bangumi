/*
 * @Author: czy0729
 * @Date: 2019-04-12 12:15:41
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-05-12 20:47:18
 */
import React from 'react'
import { StyleSheet, View } from 'react-native'
import PropTypes from 'prop-types'
import { observer } from 'mobx-react'
import { Loading, Iconfont, Touchable } from '@components'
import { SectionTitle } from '@screens/_'
import _ from '@styles'
import Head from './head'
import Box from './box'
import Ep from './ep'
import Tags from './tags'
import Summary from './summary'
import Rating from './rating'
import Character from './character'
import Staff from './staff'
import Relations from './relations'
import Blog from './blog'
import Topic from './topic'

const Header = (props, { $ }) => {
  const loaded =
    $.collection._loaded &&
    $.subjectEp._loaded &&
    $.userProgress._loaded &&
    $.subjectFormHTML._loaded
  return (
    <>
      <Head />
      <View style={styles.content}>
        {loaded ? (
          <>
            <Box style={_.mt.md} />
            <Ep style={_.mt.lg} />
            <Tags style={_.mt.lg} />
            <Summary style={_.mt.lg} />
            <Rating style={_.mt.lg} />
            <Character style={_.mt.lg} />
            <Staff style={_.mt.lg} />
            <Relations style={_.mt.lg} />
            <Blog style={_.mt.lg} />
            <Topic style={_.mt.lg} />
            <SectionTitle
              style={[styles.title, _.mt.lg]}
              right={
                <Touchable style={styles.sort}>
                  <Iconfont name='sort' size={16} />
                </Touchable>
              }
            >
              吐槽箱
            </SectionTitle>
          </>
        ) : (
          <Loading />
        )}
      </View>
    </>
  )
}

Header.contextTypes = {
  $: PropTypes.object
}

export default observer(Header)

const styles = StyleSheet.create({
  content: {
    minHeight: _.window.height * 0.5,
    backgroundColor: _.colorPlain
  },
  title: {
    paddingHorizontal: _.wind
  },
  sort: {
    padding: _.sm
  }
})