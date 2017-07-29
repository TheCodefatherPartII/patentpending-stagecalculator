var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: './handler.js',
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, 'dist'),
    filename: 'handler.js'
  },
  externals: ['aws-sdk'],
  target: 'node',
  devtool: 'source-map',
  plugins: [
    // new webpack.optimize.OccurrenceOrderPlugin(),
    // new webpack.optimize.UglifyJsPlugin({
    //   compress: {
    //     unused: true,
    //     dead_code: true,
    //     warnings: false,
    //     drop_debugger: true
    //   }
    // })
  ],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      include: __dirname,
      exclude: /node_modules/,
    }]
  }
};