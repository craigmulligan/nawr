const webpack = require('webpack')
const { promisify } = require('util')
const compile = promisify(webpack)
const dockerLambda = require('docker-lambda')
const { nanoid } = require('nanoid')
const ora = require('ora')
const { getEnv } = require('../init')
const getPort = require('get-port')

const run = async (fileName, event) => {
  const spinner = ora()
  const sourceDir = process.cwd()
  const taskDir = sourceDir + '/.nawr/workers'
  const env = await getEnv(sourceDir + '/.env')

  const config = {
    target: 'node',
    entry: {
      [fileName]: sourceDir + '/workers/' + fileName + '.js'
    },
    mode: 'production',
    output: {
      filename: '[name].js',
      path: sourceDir + '/.nawr/workers',
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

  spinner.start(`Compiling worker ${fileName}`)
  const stats = await compile(config)
  const info = stats.toJson()

  if (stats.hasErrors()) {
    console.error(info.errors)
  }

  if (stats.hasWarnings()) {
    console.warn(info.warnings)
  }
  spinner.succeed(`Compild worker ${fileName}`)

  spinner.start(`Queuing worker ${fileName}`)
  const name = nanoid()
  console.log(`
     Your worker is being queued and will run via docker to 
     You can view the logs with docker logs ${name}
   `)

  // aws lambda invoke --endpoint http://localhost:9001 --no-sign-request \
  // --function-name myfunction --payload '{}' output.json
  const dockerEnv = Object.entries(env).reduce(
    (acc, [k, v]) => {
      return [...acc, '-e', `${k}=${v}`]
    },
    ['-e', 'DOCKER_LAMBDA_STAY_OPEN=1']
  )

  const result = dockerLambda({
    event,
    handler: `${fileName}.default`,
    taskDir,
    dockerImage: 'lambci/lambda:nodejs12.x',
    dockerArgs: ['--name', name, '--network', 'host', '-d', ...dockerEnv, '-p'],
    returnSpawnResult: true,
    cleanUp: false
  })

  if (result.error || result.status !== 0) {
    var err = result.error
    if (!err) {
      err = new Error(result.stdout || result.stderr)
      err.code = result.status
      err.stdout = result.stdout
      err.stderr = result.stderr
    }
    throw err
  }
  spinner.succeed(`Queud worker ${fileName}`)

  return {
    name
  }
}

module.exports = run
