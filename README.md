# NAWR

> Serverless rds dbs on demand.

I wanted an easy way to spin up a sql database for every one of my [vercel](https://vercel.com) deploys. I found that amazons RDS offers a `serverless` mode,
which means you are only charged for the time that the database is "active".

Nawr simplifies management and use of serverless sql databases:

- Simple to create a database for every deploy.
- Simple to create a permanently provisioned database for production deploys.
- Uses the RDS http api, which handles connection pooling for you and is optimized for serverless usecases.
- Built in migrations.

It pairs nicely with platforms like vercel and frameworks like next.js, but it should work with any serverless framework.

Commands run `nawr --help`

[example]()
