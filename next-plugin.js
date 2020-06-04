require('dotenv').config()

module.exports = (phase, { defaultConfig }) => {
  return {
    env: {
      NAWR_SQL_CONNECTION: process.env.NAWR_SQL_CONNECTION
    }
  }
}
