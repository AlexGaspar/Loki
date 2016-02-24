module.exports = {
  entry: './popup.js',
  output: {
    path: __dirname,
    filename: 'loki.js'
  },
  module: {
    loaders: [
      { test: /\.css$/, loader: 'css!' } 
    ]
  }
}
