const Docker = require('dockerode')
const docker = Docker()

const createDB = async () => {
  console.log('Running db!')
  // const [output, container] = await docker.run(
  // 'koxudaxi/local-data-api:latest',
  // null,
  // process.stdout,
  // {
  // Env: {
  // ''engine: 'PostgreSQLJDBC',
  // POSTGRES_HOST: 5432,
  // POSTGRES_USER: 'postgres',
  // POSTGRES_PASSWORD: 'example',
  // RESOURCE_ARN: 'arn:aws:rds:us-east-1:123456789012:cluster:dummy',
  // SECRET_ARN: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:dummy'
  // },
  // Ports: [
  // {
  // PrivatePort: 80,
  // PublicPort: 8080,
  // Type: 'tcp'
  // }
  // ]
  // }
  // )
  const [output, constainer] = await docker.run(
    'postgres:10.7-alpine',
    null,
    process.stdout
  )
}

module.exports = {
  createDB
}
