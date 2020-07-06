const { promisify } = require('util')
const webpack = require('webpack')
const compile = promisify(webpack)
const log = require('../log')
const readdir = promisify(require('fs').readdir)
const path = require('path')

module.exports = async (sourceDir, dir, fileName, withHash = false) => {
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

  const outFileName = withHash ? '[name]-[hash].js' : '[name].js'

  const config = {
    target: 'node',
    entry: entries,
    mode: 'production',
    output: {
      filename: outFileName,
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
            {
              loader: 'cache-loader',
              options: {
                cacheContext: sourceDir,
                cacheDirectory: path.join(
                  sourceDir,
                  '.nawr',
                  'cache',
                  'webpack'
                )
              }
            },
            {
              loader: 'babel-loader',
              options: {
                presets: ['next/babel']
              }
            }
          ]
        }
      ]
    }
  }

  log.event(`Compiling ${dir}: ${fileName ? fileName : '*'}`)
  const stats = await compile(config)
  const info = stats.toJson()

  if (stats.hasErrors()) {
    log.error(info.errors)
  }

  if (stats.hasWarnings()) {
    log.warn(info.warnings)
  }

  log.event(`Compiled ${dir}: ${fileName ? fileName : '*'}`)
  return info.chunks.reduce((acc, chunk) => {
    return [...acc, ...chunk.files]
  }, [])
}
