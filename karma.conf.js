module.exports = function (config) {
  config.set({
    browsers: [ 'Chrome_for_webrtc' ], //run in Chrome
    singleRun: false, //just run once by default
    frameworks: [ 'mocha' ], //use the mocha test framework
    files: [
      'tests.webpack.js' //just load this file
    ],
    preprocessors: {
      'tests.webpack.js': [ 'webpack', 'sourcemap' ] //preprocess with webpack and our sourcemap loader
    },
    reporters: [ 'dots' ], //report results in this format
    webpack: { //kind of a copy of your webpack config
      devtool: 'inline-source-map', //just do inline source maps instead of the default
      module: {
        loaders: [
          {test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader'}
        ]
      }
    },
    webpackServer: {
      noInfo: true //please don't spam the console when running in karma!
    },
    customLaunchers: {
      Chrome_for_webrtc: {
        base: 'Chrome',
        flags: ['--disable-web-security', '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
      }
    }
  });
};