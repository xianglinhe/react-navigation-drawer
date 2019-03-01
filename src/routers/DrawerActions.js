const OPEN_DRAWER = 'Navigation/OPEN_DRAWER';
const CLOSE_DRAWER = 'Navigation/CLOSE_DRAWER';
const TOGGLE_DRAWER = 'Navigation/TOGGLE_DRAWER';
const DRAWER_OPENED = 'Navigation/DRAWER_OPENED';
const DRAWER_CLOSED = 'Navigation/DRAWER_CLOSED';
const ENABLE_DRAWER = 'Navigation/ENABLE_DRAWER';
const DISABLE_DRAWER = 'Navigation/DISABLE_DRAWER';

const openDrawer = payload => ({
  type: OPEN_DRAWER,
  ...payload,
});

const closeDrawer = payload => ({
  type: CLOSE_DRAWER,
  ...payload,
});

const toggleDrawer = payload => ({
  type: TOGGLE_DRAWER,
  ...payload,
});

const enableDrawer = payload => ({
  type: ENABLE_DRAWER,
  ...payload
});

const disableDrawer = payload => ({
  type: DISABLE_DRAWER,
  ...payload
});

export default {
  OPEN_DRAWER,
  CLOSE_DRAWER,
  TOGGLE_DRAWER,
  DRAWER_OPENED,
  DRAWER_CLOSED,
  ENABLE_DRAWER,
  DISABLE_DRAWER,

  openDrawer,
  closeDrawer,
  toggleDrawer,
  enableDrawer,
  disableDrawer
};
