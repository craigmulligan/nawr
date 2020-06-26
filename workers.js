const got = require('got')

const run = async (fileName, event) => {
  console.log('calling fetch!')
  const { body } = await got.post(
    `http://localhost:3000/__nawr__/workers?name=${fileName}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(event)
    }
  )

  return body.data
}

module.exports = {
  run
}
