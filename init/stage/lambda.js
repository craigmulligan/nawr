const AWS = require('aws-sdk')
const { promisify } = require('util')
const fs = require('fs')
const archiver = require('archiver')
const path = require('path')
const os = require('os')
const stat = promisify(fs.stat)

class Lambda {
  constructor() {
    this.lambda = new AWS.Lambda()
    this.iam = new AWS.IAM()
  }

  async _zip(source) {
    const file = path.parse(source)
    const stats = await stat(source)

    const tmpZipFile = path.join(os.tmpdir(), +new Date() + '.zip')
    const output = fs.createWriteStream(tmpZipFile)
    const archive = archiver('zip', {
      zlib: { level: 9 } // Sets the compression level.
    })
    return new Promise(resolve => {
      output.on('close', () => {
        const contents = fs.readFileSync(tmpZipFile)
        fs.unlinkSync(tmpZipFile)
        resolve(contents)
      })
      archive.pipe(output)

      archive.append(fs.createReadStream(source), {
        name: file.name + file.ext,
        stats: stats
      })

      archive.finalize()
    })
  }

  async createRole() {
    const RoleName = 'nawr-worker-execution-role'
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com'
          },
          Action: 'sts:AssumeRole'
        }
      ]
    }

    try {
      let data = await this.iam
        .createRole({
          AssumeRolePolicyDocument: JSON.stringify(policy),
          RoleName
        })
        .promise()

      await this.iam
        .attachRolePolicy({
          PolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaRole',
          RoleName
        })
        .promise()

      return data.Role.Arn
    } catch (err) {
      if (err.code == 'EntityAlreadyExists') {
        let data = await this.iam
          .getRole({
            RoleName
          })
          .promise()
        return data.Role.Arn
      }

      throw err
    }
  }

  async createFunction(name, lambdaName, p, env) {
    const Role = await this.createRole()
    const zipFile = await this._zip(p)

    const params = {
      Code: {
        ZipFile: zipFile
      },
      FunctionName: lambdaName /* required */,
      Handler: `${name}.default` /* required */,
      Role,
      Runtime: 'nodejs12.x',
      Description: 'nawr async worker',
      Environment: {
        Variables: env
      },
      Timeout: 900
    }
    return this.lambda.createFunction(params).promise()
  }
}

module.exports = Lambda
