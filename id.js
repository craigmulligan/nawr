const { customAlphabet } = require('nanoid')
const alphabet = [...Array(26)]
  .map((_, y) => String.fromCharCode(y + 65))
  .join('')

module.exports = customAlphabet(alphabet, 32)
