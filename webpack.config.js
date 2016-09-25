const webpack = require('webpack');
const path = require('path');

module.exports = {
  context: path.resolve(__dirname, 'client'),
  entry: 'javascripts/index',
  output: {
    path: path.resolve(__dirname, 'client/dist'),
    filename: 'bundle.js',

    publicPath: '/',
  },

  module: {
    loaders: [
      {
        test: /\.jsx?/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015'],
        },
      },
    ],
  },

  resolve: {
    root: path.resolve(__dirname, 'client/'),
    extensions: ['', '.js', '.jsx'],
  },
};
