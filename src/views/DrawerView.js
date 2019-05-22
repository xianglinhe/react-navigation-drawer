import React from 'react';
import { Dimensions, DeviceEventEmitter } from 'react-native';
import DrawerLayout from './DrawerLayout';
import { SceneView } from 'react-navigation';

import DrawerSidebar from './DrawerSidebar';
import DrawerActions from '../routers/DrawerActions';

/**
 * Component that renders the drawer.
 */
export default class DrawerView extends React.PureComponent {
  state = {
    drawerWidth:
      typeof this.props.navigationConfig.drawerWidth === 'function'
        ? this.props.navigationConfig.drawerWidth()
        : this.props.navigationConfig.drawerWidth,
  };

  componentDidMount() {
    Dimensions.addEventListener('change', this._updateWidth);
  }

  componentDidUpdate(prevProps) {
    const {
      openId,
      closeId,
      toggleId,
      isDrawerOpen,
      disableId,
      enableId,
    } = this.props.navigation.state;
    const {
      openId: prevOpenId,
      closeId: prevCloseId,
      toggleId: prevToggleId,
      disableId: prevDisableId,
      enableId: prevEnableId,
    } = prevProps.navigation.state;

    if (openId !== prevOpenId) {
      this._drawer.openDrawer();
    } else if (closeId !== prevCloseId) {
      this._drawer.closeDrawer();
    } else if (toggleId !== prevToggleId) {
      if (isDrawerOpen) {
        this._drawer.closeDrawer();
      } else {
        this._drawer.openDrawer();
      }
    } else if (disableId !== prevDisableId) {
      this._drawer.disableDrawer();
    } else if (enableId !== prevEnableId) {
      this._drawer.enableDrawer();
    }
  }

  componentWillUnmount() {
    Dimensions.removeEventListener('change', this._updateWidth);
  }

  _handleDrawerOpen = () => {
    this.props.navigation.dispatch({
      type: DrawerActions.DRAWER_OPENED,
      key: this.props.navigation.state.key,
    });
  };

  _handleDrawerClose = () => {
    this.props.navigation.dispatch({
      type: DrawerActions.DRAWER_CLOSED,
      key: this.props.navigation.state.key,
    });
  };

  _updateWidth = () => {
    const drawerWidth =
      typeof this.props.navigationConfig.drawerWidth === 'function'
        ? this.props.navigationConfig.drawerWidth()
        : this.props.navigationConfig.drawerWidth;

    if (this.state.drawerWidth !== drawerWidth) {
      this.setState({ drawerWidth });
    }
  };

  _renderNavigationView = () => {
    return (
      <DrawerSidebar
        screenProps={this.props.screenProps}
        navigation={this.props.navigation}
        descriptors={this.props.descriptors}
        contentComponent={this.props.navigationConfig.contentComponent}
        contentOptions={this.props.navigationConfig.contentOptions}
        drawerPosition={this.props.navigationConfig.drawerPosition}
        style={this.props.navigationConfig.style}
        {...this.props.navigationConfig}
      />
    );
  };

  _onDrawerStateChanged = (newState, drawerWillShow) => {
    if (newState === "Idle" && drawerWillShow === true) {
      DeviceEventEmitter.emit('drawerOpened')
    }
  }

  render() {
    const { state } = this.props.navigation;
    const activeKey = state.routes[state.index].key;
    const descriptor = this.props.descriptors[activeKey];

    const { drawerLockMode } = descriptor.options;

    return <DrawerLayout 
      ref={c => {
        this._drawer = c;
      }} 
      hitSlopWidth={this.props.navigationConfig.hitSlopWidth} 
      stackCount={state.routes[0].routes.length} 
      drawerLockMode={drawerLockMode || this.props.screenProps && this.props.screenProps.drawerLockMode || this.props.navigationConfig.drawerLockMode} 
      drawerBackgroundColor={this.props.navigationConfig.drawerBackgroundColor} 
      drawerWidth={this.state.drawerWidth} 
      onDrawerOpen={this._handleDrawerOpen} 
      onDrawerClose={this._handleDrawerClose} 
      useNativeAnimations={this.props.navigationConfig.useNativeAnimations} 
      renderNavigationView={this._renderNavigationView} 
      drawerPosition={this.props.navigationConfig.drawerPosition === 'right' ? DrawerLayout.positions.Right : DrawerLayout.positions.Left} 
      contentContainerStyle={this.props.navigationConfig.contentContainerStyle} 
      onDrawerStateChanged={this._onDrawerStateChanged}
      overlayColor={this.props.navigationConfig.overlayColor}>
        <SceneView navigation={descriptor.navigation} screenProps={this.props.screenProps} component={descriptor.getComponent()} />
      </DrawerLayout>;
  }
}
