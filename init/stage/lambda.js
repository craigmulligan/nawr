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
  }

  async _zip(source) {
    console.log('=> Zipping repo. This might take up to 30 seconds')
    const file = path.parse(source)
    console.log(file)
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

  async createFunction(name, lambdaName, p, env) {
    console.log(name, lambdaName, p)
    const zipFile = await this._zip(p)
    const params = {
      Code: {
        ZipFile: zipFile
      },
      FunctionName: lambdaName /* required */,
      Handler: `${name}.default` /* required */,
      // TODO create role.
      Role: 'arn:aws:iam::917491943275:role/nawr' /* required */,
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
