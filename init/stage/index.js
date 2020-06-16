const Development = require('./development')
const Preview = require('./preview')
const Production = require('./production')

module.exports = {
  development: Development,
  preview: Preview,
  production: Production
}
