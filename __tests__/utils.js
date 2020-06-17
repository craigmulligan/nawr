const fs = require('fs')
const delEnv = () => {
  delete process.env.NAWR_SQL_CONNECTION
  try {
    fs.unlinkSync('./.env')
  } catch (err) {
    // noop
  }
}

module.exports = {
  delEnv,
  TIMEOUT: 600000
}
