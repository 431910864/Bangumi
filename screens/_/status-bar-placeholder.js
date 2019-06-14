/*
 * @Author: czy0729
 * @Date: 2019-04-14 14:15:38
 * @Last Modified by: czy0729
 * @Last Modified time: 2019-06-14 21:10:09
 */
import React from 'react'
import { View } from 'react-native'
import Constants from 'expo-constants'
import { colorPlain } from '@styles'

const StatusBarPlaceholder = ({ style }) => (
  <View
    style={[
      {
        height: Constants.statusBarHeight,
        backgroundColor: colorPlain
      },
      style
    ]}
  />
)

export default StatusBarPlaceholder
