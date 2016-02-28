module.exports = {
  entry: './index.js',
  output: {
    path: __dirname,
    filename: 'loki.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'style!css!' },
      { test: /\.less$/, loader: 'css!less' },
      { test: /\.handlebars$/, loader: "handlebars-loader" }
    ]
  }
}
