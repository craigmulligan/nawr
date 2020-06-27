#!/usr/bin/env node
require('dotenv').config()
const log = require('../log')
const yargs = require('yargs')

const argv = yargs
  .usage('$0 command')
  .command(require('../init'))
  .command(require('../migrate'))
  .command(require('../dev'))
  .command(require('../build'))
  .demand(1, 'must provide a valid command')
  .version()
  .help('h')
  .alias('h', 'help')
  .fail((msg, err) => {
    log.error(err)
    process.exit(1)
  }).argv
