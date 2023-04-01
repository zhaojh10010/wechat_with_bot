import crypto from 'crypto';

export default {
  md5: (str) => {
    return crypto.createHash('md5').update(str).digest('hex')
  },
  sha1: (str) => {
    return crypto.createHash('sha1').update(str).digest('hex')
  }
}