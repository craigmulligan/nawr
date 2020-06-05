const log = require('log-level')

const help = [
  'nawr migrate [command]',
  '',
  'commands:',
  '  up                     migrates everything up',
  '  down                   migrates 1 migration down',
  '  up [file-to-migrate]   migrates a specific file up',
  '  down [file-to-migrate] migrates a specific file down',
  '  execute [direction] [files-to-migrate] migrates a specific file',
  '  pending                shows all pending migrations',
  '  history                shows the migration history',
  ''
].join('\n')

const table = (migrations, prefix) => {
  return migrations
    .map(({ file }) => {
      return `${prefix}: ${file}`
    })
    .join('\n')
}

const migrate = function(umzug, opts) {
  let api = createApi(umzug)
  let apiMethods = Object.keys(api)
  let command = opts._.splice(0, 1)[0]
  if (!apiMethods.includes(command)) {
    log.info(help)
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

function createApi(umzug) {
  return {
    history: function() {
      return umzug.storage.executed().then(function(migrations) {
        migrations = migrations.map(mig => ({ file: mig }))
        if (!migrations.length) log.info('No executed migrations\n')
        else {
          log.info(table(migrations, `✔ executed`))
        }
      })
    },
    pending: function() {
      return umzug.pending().then(function(migrations) {
        if (!migrations.length) log.info('No pending migrations\n')
        else {
          log.info(table(migrations, `⚠ pending`))
        }
      })
    },
    up: updown(umzug, 'up'),
    down: updown(umzug, 'down'),
    execute: updown(umzug, 'execute')
  }
}

function updown(umzug, type) {
  return function(opts) {
    let res = umzug[type](opts)

    return res.then(function(migrations) {
      if (!migrations || !migrations.length) {
        return log.info('No migrations executed\n')
      } else {
        log.info(`Executed '${type}' of ${migrations.length} migrations`)
      }
    })
  }
}

migrate.help = help
module.exports = migrate
