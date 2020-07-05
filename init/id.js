const { customAlphabet } = require('nanoid')
const alphabet = [...Array(26)]
  .map((_, y) => String.fromCharCode(y + 65))
  .join('')
  .toLowerCase()

module.exports = customAlphabet(alphabet, 32)
