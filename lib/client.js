// This is required so config.update takes place.
// It must be required before the data-api-client
require('./aws')
const dataApi = require('data-api-client')
if (!process.env.DOLOS_SQL_CONNECTION) {
  throw new Error('DOLOS_SQL_CONNECTION is not set')
}
const connectionValue = JSON.parse(process.env.DOLOS_SQL_CONNECTION)
const { secretArn, resourceArn, database } = connectionValue
const client = dataApi({ secretArn, resourceArn, database })
module.exports = client
