const AWS = require('aws-sdk')
const { promisify } = require('util')
const fs = require('fs')
const archiver = require('archiver')
const klaw = require('klaw')
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
        resolve([file.name, contents])
      })
      archive.pipe(output)

      archive.append(fs.createReadStream(source), {
        name: file.name + file.ext,
        stats: stats
      })

      archive.finalize()
    })
  }

  async createFunction(id, source, env) {
    const [name, zipFile] = await this._zip(source)
    const fnName = `workers-${name}-${id}`
    const params = {
      Code: {
        ZipFile: zipFile
      },
      FunctionName: fnName /* required */,
      Handler: `${name}.default` /* required */,
      // TODO create role.
      Role: 'arn:aws:iam::917491943275:role/niks' /* required */,
      Runtime: 'nodejs12.x',
      Description: 'nawr async worker',
      Environment: {
        Variables: env
      }
    }
    await this.lambda.createFunction(params).promise()
    return fnName
  }
}

module.exports = Lambda
