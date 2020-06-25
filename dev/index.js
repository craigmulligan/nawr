// cli module
const server = require('./server')
exports.command = 'dev'
exports.describe = 'run next.js dev server'
// exports.builder = {
// stage: {
// description: 'which stage to provision the database for',
// default: 'development',
// choices: ['development', 'preview', 'production']
// }
// }

exports.handler = () => {
  console.log('running server')
  return server()
}
