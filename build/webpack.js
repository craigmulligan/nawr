const { promisify } = require('util')
const webpack = require('webpack')
const compile = promisify(webpack)
const log = require('../log')
const readdir = promisify(require('fs').readdir)
const path = require('path')

module.exports = async (sourceDir, dir, fileName) => {
  const entries = {}
  const p = `/${sourceDir}` + `/${dir}/`

  if (fileName) {
    entries[fileName] = p + fileName
  } else {
    // get all files in dir.
    const fileNames = await readdir(p)
    fileNames.forEach(f => {
      entries[path.parse(f).name] = p + f
    })
  }

  const config = {
    target: 'node',
    entry: entries,
    mode: 'production',
    output: {
      filename: '[name].js',
      path: sourceDir + '/.nawr/' + dir,
      libraryTarget: 'commonjs'
    },
    resolve: {
      modules: [
        sourceDir + '/node_modules',
        __dirname + '/node_modules',
        'node_modules'
      ],
      symlinks: true
    },
    module: {
      rules: [
        {
          test: /\.m?js$/,
          exclude: /(node_modules)/,
          use: [
            'cache-loader',
            {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env']
              }
            }
          ]
        }
      ]
    }
  }

  const stats = await compile(config)
  const info = stats.toJson()

  if (stats.hasErrors()) {
    log.error(info.errors)
  }

  if (stats.hasWarnings()) {
    log.warn(info.warnings)
  }
  log.event(`Compiled ${dir}: ${fileName ? fileName : '*'}`)
}
