module.exports = {
  entry: './index.js',
  output: {
    publicPath: 'https://gigx.be',
    path: __dirname + '/dist',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css!' },
      { test: /\.less$/, loader: 'css!less' },
      { test: /\.handlebars$/, loader: 'handlebars-loader' }
    ]
  }
};
