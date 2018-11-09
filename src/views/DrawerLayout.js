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
import { Animated, StyleSheet, View, Keyboard, TouchableWithoutFeedback } from 'react-native';
import invariant from '../utils/invariant';
import { AnimatedEvent } from 'react-native/Libraries/Animated/src/AnimatedEvent';

import {
  PanGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native-gesture-handler';

const DRAG_TOSS = 0.05;

export type PropType = {
  children: any,
  drawerBackgroundColor?: string,
  drawerWidth: number,
  renderNavigationView: (progressAnimatedValue: any) => any,

  // brand new properties
  overlayColor: string,
  contentContainerStyle?: any,

  // Properties not yet supported
  // onDrawerSlide?: Function
  // drawerLockMode?: 'unlocked' | 'locked-closed' | 'locked-open',
};

export type StateType = {
  drawerShown: boolean,
  dragX: any,
  touchX: any,
  drawerTranslation: any,
  containerWidth: number,
};

export type EventType = {
  stopPropagation: Function,
};

export type DrawerMovementOptionType = {
  velocity?: number,
};

export default class DrawerLayout extends Component<PropType, StateType> {
  static defaultProps = {
    drawerWidth: 200,
    overlayColor: 'black',
  };

  static positions = {
    Left: 'left',
    Right: 'right',
  };
  _openValue: ?Animated.Interpolation;
  _onGestureEvent: ?AnimatedEvent;

  constructor(props: PropType, context: any) {
    super(props, context);

    const dragX = new Animated.Value(0);
    const touchX = new Animated.Value(0);
    const drawerTranslation = new Animated.Value(0);

    this.state = {
      dragX,
      touchX,
      drawerTranslation,
      drawerShown: false,
      containerWidth: 0,
    };

    this._updateAnimatedEvent(props, this.state);
  }

  _updateAnimatedEvent = (props: PropType, state: StateType) => {
    // Event definition is based on
    const { drawerWidth } = props;
    const {
      dragX: dragXValue,
      touchX: touchXValue,
      drawerTranslation,
      containerWidth,
    } = state;

    let dragX = dragXValue;
    let touchX = touchXValue;

    touchXValue.setValue(0);

    // While closing the drawer when user starts gesture outside of its area (in greyed
    // out part of the window), we want the drawer to follow only once finger reaches the
    // edge of the drawer.
    // E.g. on the diagram below drawer is illustrate by X signs and the greyed out area by
    // dots. The touch gesture starts at '*' and moves left, touch path is indicated by
    // an arrow pointing left
    // 1) +---------------+ 2) +---------------+ 3) +---------------+ 4) +---------------+
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|.<-*..|    |XXXXXXXX|<--*..|    |XXXXX|<-----*..|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXXXXX|......|    |XXXXX|.........|
    //    +---------------+    +---------------+    +---------------+    +---------------+
    //
    // For the above to work properly we define animated value that will keep start position
    // of the gesture. Then we use that value to calculate how much we need to subtract from
    // the dragX. If the gesture started on the greyed out area we take the distance from the
    // edge of the drawer to the start position. Otherwise we don't subtract at all and the
    // drawer be pulled back as soon as you start the pan.
    //
    // This is used only when drawerType is "front"
    //
    let translationX = dragX;

    this._openValue = Animated.add(translationX, drawerTranslation).interpolate(
      {
        inputRange: [0, drawerWidth],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }
    );

    this._onGestureEvent = Animated.event(
      [{ nativeEvent: { translationX: dragXValue, x: touchXValue } }],
      { useNativeDriver: true }
    );
  };

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

  _onOverlayClick = () => {
    if (this.state.drawerShown) {
      this.closeDrawer();
    }
  }

  _handleRelease = nativeEvent => {
    const { drawerWidth } = this.props;
    const { drawerShown, containerWidth } = this.state;
    let { translationX: dragX, velocityX, x: touchX } = nativeEvent;

    const gestureStartX = touchX - dragX;
    let dragOffsetBasedOnStart = 0;

    const startOffsetX =
      dragX + dragOffsetBasedOnStart + (drawerShown ? drawerWidth : 0);
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
    this.state.dragX.setValue(0);
    this.state.touchX.setValue(0);

    if (typeof fromValue === 'number') {
      this.state.drawerTranslation.setValue(fromValue);
    }

    const willShow = toValue !== 0;
    this.state.drawerShown = willShow
    Animated.spring(this.state.drawerTranslation, {
      velocity,
      bounciness: 0,
      overshootClamping: true,
      toValue,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        this.overlayRef.setNativeProps({
          pointerEvents: willShow ? 'auto' : 'none'
        })
      }
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
    invariant(this._openValue, 'should be set');
    const overlayOpacity = this._openValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.1],
      extrapolate: 'clamp',
    });
    const dynamicOverlayStyles = {
      opacity: overlayOpacity,
      backgroundColor: this.props.overlayColor,
    };
    return (
      <TapGestureHandler onHandlerStateChange={this._onTapHandlerStateChange}>
        <Animated.View
          ref={(ref) => this.overlayRef = ref}
          style={[styles.overlay, dynamicOverlayStyles]}
        />
      </TapGestureHandler>
    );


    //
    // /* Overlay styles */
    // invariant(this._openValue, 'should be set');
    // const overlayOpacity = this._openValue.interpolate({
    //     inputRange: [0, 1],
    //     outputRange: [0, 0.7],
    //     extrapolate: 'clamp',
    // });
    // const animatedOverlayStyles = {
    //     opacity: overlayOpacity,
    //     backgroundColor: 'red'//this.props.overlayColor,
    // };
    // const pointerEvents = this.state.drawerShown ? 'auto' : 'none';
    // const contentContainerStyle = this.props.contentContainerStyle
    //
    // return (
    //
    //         <TouchableWithoutFeedback
    //             pointerEvents={pointerEvents}
    //             onPress={this._onOverlayClick}
    //         >
    //             <Animated.View
    //                 pointerEvents={pointerEvents}
    //                 style={[styles.overlay, animatedOverlayStyles]}
    //             />
    //         </TouchableWithoutFeedback>
    //     )
  };

  _renderDrawer = () => {
    const { drawerShown } = this.state;
    const {
      drawerBackgroundColor,
      drawerWidth,
      contentContainerStyle,
    } = this.props;

    const openValue = this._openValue;
    invariant(openValue, 'should be set');

    const containerTranslateX = openValue.interpolate({
      inputRange: [0, 1],
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
          {typeof this.props.children === 'function'
            ? this.props.children(this._openValue)
            : this.props.children}
          {this._renderOverlay()}
        </Animated.View>
        <Animated.View
          pointerEvents="box-none"
          style={[styles.drawerContainer]}
        >
          <View style={[styles.drawer]}>
            {this.props.renderNavigationView(this._openValue)}
          </View>
        </Animated.View>
      </Animated.View>
    );
  };

  render() {
    return (
      <PanGestureHandler
        hitSlop={0}
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
  containerOnBack: {
    ...StyleSheet.absoluteFillObject,
  },
  main: {
    flex: 1,
    zIndex: 0,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1004,
  },
});
