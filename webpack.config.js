var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: './handler.js',
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, 'dist'),
    filename: 'handler.js'
  },
  externals: [
    'aws-sdk',
    'mysql2',
    'sqlite3',
    'pg-native',
    'formidable',
  ],
  target: 'node',
  devtool: 'source-map',
  plugins: [],
  module: {
    loaders: [{
      test: /\.js$/,
      loaders: ['babel-loader'],
      include: __dirname,
      exclude: /node_modules/,
    }]
  }
};