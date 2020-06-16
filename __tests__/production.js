const execa = require('execa')
const { getEnv } = require('../init')
const compose = require('docker-compose')
const version = require('../package.json').version
const path = require('path')
const aws = require('aws-sdk')
const fs = require('fs')
const stages = require('../init/stage')

const TIMEOUT = 600000

const delEnv = () => {
  try {
    fs.unlinkSync('./.env')
  } catch (err) {}
}

module.exports = () => {
  beforeAll(delEnv)

  describe('init', () => {
    it.only('should throw an error if production stage is used with out --id', async () => {
      // 10 minute timeout to ensure waitOnAvailable completes.
      try {
        await execa('node', ['./bin/index.js', 'init', '--stage', 'production'])
      } catch (err) {
        // check env
        expect(err.message).toContain(
          'In production stage a database an --id must be provided'
        )
      }
    })
  })
}
