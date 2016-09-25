const webpack = require('webpack');
const path = require('path');

module.exports = {
  context: path.resolve(__dirname, 'client'),
  entry: 'javascripts/index',
  output: {
    path: path.resolve(__dirname, 'client/dist'),
    filename: 'bundle.js',

    publicPath: 'dist/',
  },

  module: {
    loaders: [
      {
        test: /\.jsx?/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          // Maybe we'll want fancier ES in the future
          // We could change this to stage-0 or stage-1 if we want more js-sizzle
          presets: ['es2015', 'stage-0'],
        },
      },
    ],
  },

  resolve: {
    root: path.resolve(__dirname, 'client/'),
    extensions: ['', '.js', '.jsx'],
  },
};
