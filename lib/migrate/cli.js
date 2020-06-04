const yargs = require('yargs-parser')
const table = require('borderless-table')

module.exports = function(umzug, opts) {
  const stdout = process.stdout
  let api = createApi(stdout, umzug)
  let apiMethods = Object.keys(api)
  let command = opts._.splice(0, 1)[0]
  if (!apiMethods.includes(command)) {
    stdout.write(
      [
        'Use: nawr migrate [command]',
        '',
        'Where [command] is one of:',
        '  up                     migrates everything up',
        '  down                   migrates 1 migration down',
        '  up [file-to-migrate]   migrates a specific file up',
        '  down [file-to-migrate] migrates a specific file down',
        '  execute [direction] [files-to-migrate] migrates a specific file',
        '  pending                shows all pending migrations',
        '  history                shows the migration history',
        ''
      ].join('\n')
    )
    process.exit(1)
  } else {
    if (command === 'up' || command === 'down') {
      if (opts.from || opts.to) opts = { from: opts.from, to: opts.to }
      else if (!opts._.length) opts = undefined
      else opts = opts._
    } else if (command === 'execute') {
      let direction = opts._.slice(0, 1)[0]
      let migrations = opts._.slice(1)
      if (direction !== 'up' && direction !== 'down') {
        throw new Error('Direction must be up or down.')
      }
      opts = { method: direction, migrations: migrations }
    }
    return api[command](opts)
  }

  return api
}

function createApi(stdout, umzug) {
  return {
    history: function() {
      if (typeof umzug.storage.history === 'function') {
        return umzug.storage.history().then(function(events) {
          if (!events.length) stdout.write('No executed migrations\n')
          let lines = events.map(function(e) {
            let time = new Date(e.time).toLocaleTimeString('en-us', {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric'
            })
            return Object.assign(e, { time: time })
          })
          table(lines, ['time', 'type', 'name', 'user', 'host'], null, stdout)
        })
      } else {
        return umzug.storage.executed().then(function(migrations) {
          migrations = migrations.map(mig => ({ file: mig }))
          if (!migrations.length) stdout.write('No executed migrations\n')
          else table(migrations, ['file'], ['Executed migrations'], stdout)
        })
      }
    },
    pending: function() {
      return umzug.pending().then(function(migrations) {
        if (!migrations.length) stdout.write('No pending migrations\n')
        else table(migrations, ['file'], ['Pending migrations'], stdout)
      })
    },
    up: updown(stdout, umzug, 'up'),
    down: updown(stdout, umzug, 'down'),
    execute: updown(stdout, umzug, 'execute')
  }
}

function updown(stdout, umzug, type) {
  let debug = createDebug(stdout)
  return function(opts) {
    let progress, seconds

    if (umzug.options.debug) {
      umzug
        .on('migrating', debug('migrate'))
        .on('migrated', debug('migrated'))
        .on('reverting', debug('revert'))
        .on('reverted', debug('reverted'))
        .on('debug', debug('debug'))
    } else {
      seconds = 0
      progress = setInterval(function() {
        seconds += 1
        stdout.write('.')
      }, 1000)
    }

    let res = umzug[type](opts)

    if (!umzug.options.debug) {
      res.then(function() {
        clearInterval(progress)
        if (seconds) stdout.write('\n') // we want a newline as soon as something gets logged.
      })
    }

    return res
      .then(function(migrations) {
        if (!migrations || !migrations.length)
          return stdout.write('No migrations executed\n')
        table(
          migrations,
          ['file'],
          [`Executed '${type}' of ${migrations.length} migrations`],
          stdout
        )
      })
      .catch(err => {
        debug('ERROR')(err)
        process.exit(1)
      })
  }
}

function createDebug(stdout) {
  return function debug(type) {
    return function(message) {
      if (message) stdout.write(`${type}: ${message}\n`)
      else stdout.write(`${type}\n`)
    }
  }
}
