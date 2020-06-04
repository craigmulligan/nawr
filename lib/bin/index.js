#!/usr/bin/env node
require('dotenv').config()
const yargs = require('yargs-parser')
const init = require('../init')
const migrate = require('../migrate')
const cmds = {
  init,
  migrate
}

const argv = yargs(process.argv.slice(2), {
  configuration: { 'parse-numbers': false }
})

;(async cmd => {
  if (cmd === 'init') {
    await init(argv)
    process.exit(0)
    return
  }

  if (cmd === 'migrate') {
    // removes cmd from arr
    argv._.shift()
    await migrate(argv)
    process.exit(0)
    return
  }

  stdout.write(
    [
      'Use: dolos [command]',
      '',
      'Where [command] is one of:',
      '  init                   creates a new serverless db',
      '  migrate                handles migration tasks'
    ].join('\n')
  )
  process.exit(1)
})(argv._[0])
