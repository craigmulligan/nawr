'use strict'
const express = require('express')
const webpack = require('webpack')
const app = express()
const PORT = 8081

const config = {
  entry: {
    index: './nawr/workers/index.js'
  },
  output: {
    filename: '[name].js',
    path: __dirname + '/dist',
    libraryTarget: 'commonjs'
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
}
const compiler = webpack(config)
const watching = compiler.watch(
  {
    aggregateTimeout: 300,
    poll: undefined
  },
  (err, stats) => {
    console.log(stats)
  }
)

app.post('/invoke/:worker', async (req, res, next) => {
  const { body } = req
  const ctx = {}
  const workerName = req.params.worker
  const worker = require(`./dist/${workerName}.js`).default

  console.log(worker)
  try {
    const data = await worker(body || {}, ctx)
    res.json(data)
  } catch (err) {
    next(err)
  }
})

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`)
})
