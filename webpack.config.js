const webpack = require('webpack');
const path = require('path');

const dotCssLoaders = [
  'style?sourceMap',
  'css?modules',
];

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
      {
        test: /\.css/,
        exclude: /node_modules/,
        loaders: dotCssLoaders,
      },
      {
        test: /\.scss/,
        exclude: /node_modules/,
        loaders: [].concat(dotCssLoaders).concat(['sass']),
      },
    ],
  },

  resolve: {
    root: path.resolve(__dirname, 'client/'),
    extensions: ['', '.js', '.jsx'],
  },
};
