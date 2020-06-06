# NAWR

> Serverless RDS dbs on demand.

I wanted an easy way to spin up a sql database for every one of my [vercel](https://vercel.com) deploys. I found that amazons RDS offers a `serverless` mode,
which means you are only charged for the time that the database is "active".

So I've built nawr a set of tools that simplifies the management and use of serverless sql databases.

### Features

- Automatically create preview databases for every deploy.
- Automatically create provisioned database for production deploys.
- Uses the [RDS http api](https://github.com/jeremydaly/data-api-client), which handles connection pooling and is optimized for serverless usecases.
- Offers built in migrations which run as transactions so you are never left in a funky state on failed deploys.

It pairs nicely with platforms like vercel and frameworks like next.js, but it should work with any serverless framework.

### Installation

```
npm install nawr
```

### Usage

You can follow the diff'd example below or just clone the [example](https://github.com/hobochild/boiler):

First, update your package.json scripts to run nawr during your build step.

```diff
// package.json
- "build": "next build",
+ "build": "nawr init && nawr migrate up && next build",
```

Add a migration to setup up you database, any files in your migration folder will be run on `nawr migrate`.

```js
// migrations/00_init.js
module.exports = {
  async up(client) {
    client
      .query(
        `create table if not exists users (
      name text primary key,
      date timestamptz not null default now()
    )`
      )
      .query(`INSERT INTO users (name) VALUES(:name)`, [
        [{ name: 'Marcia' }],
        [{ name: 'Peter' }],
        [{ name: 'Jan' }],
        [{ name: 'Cindy' }],
        [{ name: 'Bobby' }]
      ])
  },
  async down(client) {
    client.query(`drop table if exists users`)
  }
}
```

Add a front page to query your database:

```js
// pages/index.js
import client from 'nawr/client'

const Home = ({ users }) => (
  <div className="container">
    <main>
      <h1>Nawr Demo</h1>
      <ul>
        {users.map(({ name }) => {
          return <li key={name}>{name}</li>
        })}
      </ul>
    </main>
  </div>
)

export const getServerSideProps = async () => {
  const { records } = await client.query('select * from users;')

  return {
    props: {
      users: records
    }
  }
}

export default Home
```

Then set the required variables this can be in your `.env` or via the vercel dashboard:

// TODO add minimium required IAM permissions.

```
| Environment Variable | Required |
| -------------------- | -------- |
| NAWR_AWS_KEY_ID      | true     |
| NAWR_AWS_SECRET      | true     |
| NAWR_AWS_REGION      | false    |
| NAWR_SQL_IS_PROD     | false    |
```
