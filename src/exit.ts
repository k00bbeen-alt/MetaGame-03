// No verified host exit API. Stop this session internally; never call window.close().
// TODO(glasses): connect a documented host exit API if one becomes available.
export const requestExit = (state: {exit: () => void}) => state.exit();
