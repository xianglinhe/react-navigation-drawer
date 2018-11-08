/* eslint-disable */

// @flow

// #########################################################
//    This is vendored from react-native-gesture-handler!
// #########################################################

// This component is based on RN's DrawerLayoutAndroid API
//
// It perhaps deserves to be put in a separate repo, but since it relies
// on react-native-gesture-handler library which isn't very popular at the
// moment I decided to keep it here for the time being. It will allow us
// to move faster and fix issues that may arise in gesture handler library
// that could be found when using the drawer component

import React, { Component } from 'react';
import { Animated, StyleSheet, View, Keyboard, Dimensions } from 'react-native';
import { AnimatedEvent } from 'react-native/Libraries/Animated/src/AnimatedEvent';

import {
  PanGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native-gesture-handler';

const DRAG_TOSS = 0.05;

const DEVICE_WIDTH = parseFloat(Dimensions.get('window').width);

export type PropType = {
  children: any,
  drawerBackgroundColor?: string,
  drawerWidth: number,
  renderNavigationView: (progressAnimatedValue: any) => any,
  useNativeAnimations: boolean,

  // brand new properties
  minSwipeDistance: number,
  overlayColor: string,
  contentContainerStyle?: any,

  // Properties not yet supported
  // onDrawerSlide?: Function
  // drawerLockMode?: 'unlocked' | 'locked-closed' | 'locked-open',
};

export type StateType = {
  drawerShown: boolean,
  containerWidth: number,
};

export type DrawerMovementOptionType = {
  velocity?: number,
};

export default class DrawerLayout extends Component<PropType, StateType> {
  static defaultProps = {
    drawerWidth: 200,
    useNativeAnimations: true,
    minSwipeDistance: 3,
    overlayColor: 'black',
    containerWidth: DEVICE_WIDTH
  };

  constructor(props: PropType, context: any) {
    super(props, context);

    this.state = {
      drawerShown: false,
    };

    this._openValue = new Animated.Value(0)

    this._onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: this._openValue } }],
      { useNativeDriver: true }
    );
  }

  _openingHandlerStateChange = ({ nativeEvent }) => {
    if (nativeEvent.oldState === State.ACTIVE) {
      this._handleRelease(nativeEvent);
    } else if (nativeEvent.state === State.ACTIVE) {
      Keyboard.dismiss();
    }
  };

  _onTapHandlerStateChange = ({ nativeEvent }) => {
    if (this.state.drawerShown && (nativeEvent.oldState === State.ACTIVE || nativeEvent.state === State.FAILED)) {
      this.closeDrawer();
    }
  };

  _handleRelease = nativeEvent => {

    console.log('release')

    const { drawerWidth, containerWidth } = this.props;
    const { drawerShown } = this.state;
    let { translationX: dragX, velocityX, x: touchX } = nativeEvent;

    const startOffsetX = dragX + (drawerShown ? drawerWidth : 0);
    const projOffsetX = startOffsetX + DRAG_TOSS * velocityX;

    const shouldOpen = projOffsetX > drawerWidth / 2;

    if (shouldOpen) {
      this._animateDrawer({
        fromValue: startOffsetX,
        toValue: drawerWidth,
        velocity: velocityX,
      });
    } else {
      this._animateDrawer({
        fromValue: startOffsetX,
        toValue: 0,
        velocity: velocityX,
      });
    }
  };

  _animateDrawer = ({
                      fromValue,
                      toValue,
                      velocity,
                    }: {
    fromValue: number,
    toValue: number,
    velocity: number,
  }) => {

    const willShow = toValue !== 0;
    // this.setState({ drawerShown: willShow });
    this.state.drawerShown = willShow
    Animated.spring(this._openValue, {
      velocity,
      bounciness: 0,
      toValue,
      useNativeDriver: true,
    }).start(({ finished }) => {
    });
  };

  openDrawer = (options: DrawerMovementOptionType = {}) => {
    this._animateDrawer({
      toValue: this.props.drawerWidth,
      velocity: options.velocity ? options.velocity : 0,
    });
  };

  closeDrawer = (options: DrawerMovementOptionType = {}) => {
    this._animateDrawer({
      toValue: 0,
      velocity: options.velocity ? options.velocity : 0,
    });
  };

  _renderOverlay = () => {
    /* Overlay styles */
    const overlayOpacity = this._openValue.interpolate({
      inputRange: [0, this.props.drawerWidth],
      outputRange: [0, 0.7],
      extrapolate: 'clamp',
    });
    const dynamicOverlayStyles = {
      opacity: overlayOpacity,
      backgroundColor: this.props.overlayColor,
    };
    return (
      <TapGestureHandler onHandlerStateChange={this._onTapHandlerStateChange}>
        <Animated.View
          pointerEvents={this.state.drawerShown ? 'auto' : 'none'}
          style={[styles.overlay, dynamicOverlayStyles]}
        />
      </TapGestureHandler>
    );
  };

  _renderDrawer = () => {
    const { drawerShown } = this.state;
    const {
      drawerBackgroundColor,
      drawerWidth,
      contentContainerStyle,
    } = this.props;

    const containerTranslateX = this._openValue.interpolate({
      inputRange: [0, drawerWidth],
      outputRange: [0, drawerWidth],
      extrapolate: 'clamp',
    });
    let containerStyles = {
      transform: [{ translateX: containerTranslateX }],
    };

    return (
      <Animated.View style={styles.main}>
        <Animated.View
          style={[
            styles.containerInFront,
            containerStyles,
            contentContainerStyle,
          ]}
        >
          {this.props.children}
        </Animated.View>
        <View
          pointerEvents="box-none"
          accessibilityViewIsModal={drawerShown}
          style={[styles.drawerContainer]}
        >
          {this.props.renderNavigationView()}
        </View>
      </Animated.View>
    );
  };

  render() {
    const { drawerShown, containerWidth } = this.state;

    const {
      minSwipeDistance,
    } = this.props;

    const gestureOrientation = drawerShown ? -1 : 1

    return (
      <PanGestureHandler
        hitSlop={0}
        minOffsetX={gestureOrientation * minSwipeDistance}
        maxDeltaY={15}
        onGestureEvent={this._onGestureEvent}
        onHandlerStateChange={this._openingHandlerStateChange}
        ref={this.props.gestureRef}
      >
        {this._renderDrawer()}
      </PanGestureHandler>
    );
  }
}

const styles = StyleSheet.create({
  drawer: { flex: 0 },
  drawerContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1001,
    flexDirection: 'row',
  },
  containerInFront: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1002,
  },
  main: {
    flex: 1,
    zIndex: 0,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1003,
  },
});
