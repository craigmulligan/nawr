require('dotenv').config()

module.exports = (phase, { defaultConfig }) => {
  return {
    env: {
      DOLOS_SQL_CONNECTION: process.env.DOLOS_SQL_CONNECTION
    }
  }
}
