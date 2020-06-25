const fetch = require('isomorphic-fetch')

const run = async (fileName, event) => {
  const data = await fetch(
    `http://localhost:3000/__nawr__/workers?name=${fileName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    }
  ).then(r => {
    if (!r.ok) {
      throw Error(response.statusText)
    }
    return r.json()
  })

  return data
}

module.exports = {
  run
}
