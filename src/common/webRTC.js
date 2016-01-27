// This is a little hack because skylinkjs just attaches the skylink to
// window.Skylink. We want to move this to a scoped location incase we change it.
//require('skylinkjs')

// TODO: I'd like to wrap this in my own promise based library. Convert actions
// so they return promises instead of callbacks.
export default window.Skylink();
