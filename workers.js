const fetch = require('node-fetch').default

const run = async (fileName, event) => {
  const data = await fetch(
    `http://localhost:3000/__nawr__/workers?name=${fileName}`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(event)
    }
  )
    .then(res => {
      if (!res.ok) {
        throw new Error(res.statusText)
      }
      return res
    })
    .then(res => {
      return res.json()
    })

  return data
}

module.exports = {
  run
}
