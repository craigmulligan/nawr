#!/usr/bin/env node
require('dotenv').config()
const yargs = require('yargs-parser')
const init = require('../init')
const migrate = require('../migrate')
const cmds = {
  init,
  migrate
}

const fail = err => {
  console.log(err)
  process.exit(1)
}

const argv = yargs(process.argv.slice(2), {
  configuration: { 'parse-numbers': false }
})
const isHelp = argv.help || argv.h
const help = `
nawr [command]

  init - Creates a new serverless db
  migrate - Handles migration tasks
`

;(async cmd => {
  if (cmd === 'init') {
    if (isHelp) {
      process.stdout.write(init.help)
      process.exit(0)
      return
    }

    await init(argv).catch(fail)
    process.exit(0)
    return
  }

  if (cmd === 'migrate') {
    // removes cmd from arr
    argv._.shift()
    if (isHelp) {
      process.stdout.write(migrate.help)
      process.exit(0)
      return
    }

    await migrate(argv).catch(fail)
    process.exit(0)
    return
  }

  // got here always print help
  process.stdout.write(init.help)
  process.exit(1)
})(argv._[0])
