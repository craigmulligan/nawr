# NAWR

> Serverless RDS dbs on demand.

I wanted an easy way to spin up a sql database for every one of my [vercel](https://vercel.com) deploys. I found that [amazons RDS](https://aws.amazon.com/rds/) offers a `serverless` mode, which means you are only charged for the time that the database is "active".

So I've built `nawr` a tool that simplifies the management and use of serverless sql databases.

It pairs nicely with platforms like [vercel](https://vercel.com) and frameworks like [next.js](https://nextjs.org) but it should work in most situations where you need an SQL db on demand.

### Features

- Automatically create preview database for every deploy.
- Automatically creates a permanent database for production.
- Uses the [RDS http api](https://github.com/jeremydaly/data-api-client), which handles connection pooling and is optimized for serverless usecases.
- Seemless local development workflow against a local db via the RDS http api.
- Offers built in migrations which run as transactions so you are never left in a funky state on failed deploys.
- Automatically removes old databases when you run up against AWS quotas.

### Installation

```
npm install nawr
```

### System requirements

You'll need both [docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/#install-compose) installed on your system for the local-dev workflow.

### Usage

This illustrates how to use nawr with next.js & vercel.

You can follow the diff'd example below or just clone the [example](https://github.com/hobochild/boiler):

First, update your package.json scripts to run nawr during your build step.

```diff
// package.json
- "dev": "next dev",
+ "dev": "nawr init --local && nawr migrate up && next dev",
- "build": "next build",
+ "build": "nawr init --id $DB_ID --stage=$DB_STAGE && nawr migrate up && next build",
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

Add a Home page which queries your database:

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

### Now run the dev server

```
npm run dev
```

### Deploying

**NOTE**: NB: When `nawr` hits the quota for maximum RDS instances (40). It will delete the oldest one to make room for more. If you have RDS databases that aren't managed by nawr should you enable **deletion protection** for all of them.

#### Required Environment Variables

Before deploying set the following environment variables in you're vercel project settings dashboard:

You can use your root AWS user keys but It's best practice to create a new [AWS IAM credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html#id_users_create_api) it'll need the following policies:

- AmazonRDSFullAccess
- AmazonRDSDataFullAccess

```
| Environment Variable | Required | description |
| -------------------- | -------- | ----------- |
| NAWR_AWS_KEY_ID      | true     | aws credentials key |
| NAWR_AWS_SECRET      | true     | aws credentials secret |
```

#### Stages

- `development` - Sets up a local database on your machine with a proxy for the RDS http data-api.
- `preview` - Creates a RDS serverless database which will sleep after 15 mins of inactivity and does not have deletion protected.
- `production` - Creates a RDS serverless database which will never sleep and has deletion protection.

#### Recommended environment configuration:

For instance if your build command is:

```
nawr init --id $DB_ID --stage $DB_STAGE && nawr migrate up && next build
```

Then in on your _preview_ CI deploy you should have the following envars set.

```
export DB_STAGE=preview
```

For _production_ you should always name you db so you use the same db instead of creating a new one for every deploy.

```
export DB_ID=myproject-production-db
export DB_STAGE=production
```

**NOTE**: You can always start with `stage=preview` for your production database while testing and then switch it to production when you are ready.

## Commands

### init

```
nawr init

initialize sql db

Options:
--loglevel, -l set log-level [default: "info"]
--version Show version number [boolean]
-h, --help Show help [boolean]
--engine, -e set storage engine
[choices: "postgresql", "mysql"][default: "postgresql"]
--id set database id [string]
--stage which stage to provision the database for
[choices: "development", "preview", "production"][default: "development"]

```

### migrate

```
nawr migrate <command>

run migration tasks

Commands:
nawr migrate history View migration history
nawr migrate pending View pending migrations
nawr migrate up migrate up
nawr migrate down migrate down

Options:
--loglevel, -l set log-level [default: "info"]
--version Show version number [boolean]
-h, --help Show help [boolean]
```
