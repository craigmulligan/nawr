const log = require('loglevel')

const table = (migrations, prefix) => {
  return migrations
    .map(({ file }) => {
      return `${prefix}: ${file}`
    })
    .join('\n')
}

function execute(umzug, type, opts) {
  let res = umzug[type](opts)

  return res.then(function(migrations) {
    if (!migrations || !migrations.length) {
      return log.info('No migrations executed\n')
    } else {
      log.info(`Executed '${type}' of ${migrations.length} migrations`)
    }
  })
}

execute.options = {
  from: {
    type: 'string',
    describe: 'target start migration'
  },
  to: {
    type: 'string',
    describe: 'target end migration'
  }
}

const api = {
  history: {
    command: 'history',
    describe: 'View migration history',
    handler: ({ migrator }) => {
      return migrator.storage.executed().then(function(migrations) {
        migrations = migrations.map(mig => ({ file: mig }))
        if (!migrations.length) log.info('No executed migrations\n')
        else {
          log.info(table(migrations, `✔ executed`))
        }
      })
    }
  },
  pending: {
    command: 'pending',
    describe: 'View pending migrations',
    handler: function({ migrator }) {
      return migrator.pending().then(function(migrations) {
        if (!migrations.length) log.info('No pending migrations\n')
        else {
          log.info(table(migrations, `⚠ pending`))
        }
      })
    }
  },
  up: {
    command: 'up',
    describe: 'migrate up',
    builder: execute.options,
    handler: function({ migrator, from, to }) {
      execute(migrator, 'up', { from, to })
    }
  },
  down: {
    command: 'down',
    describe: 'migrate down',
    handler: function({ migrator, from, to }) {
      execute(migrator, 'down', { from, to })
    },
    builder: execute.options
  }
  // TODO add execute for specific migrations
}

module.exports = {
  api
}
