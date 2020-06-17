const execa = require('execa')
const { delEnv } = require('./utils')

module.exports = () => {
  beforeAll(() => {
    delEnv()
    jest.resetModules()
  })

  describe('init', () => {
    it('should throw an error if production stage is used with out --id', async () => {
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
