const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const SECRET = process.env.SECRET || 'changeme'

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true, default: 'unguessable password' }
})

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 5)
  }
})

userSchema.methods.generateToken = function () {
  const tokenData = {
    id: this._id,
    username: this.username
  }
  return jwt.sign(tokenData, SECRET)
}

userSchema.statics.authenticateBasic = function (username, password) {
  return this.findOne({ username })
    .then(result => result && result.comparePassword(password))
    .catch(console.error)
}

userSchema.methods.comparePassword = function (password) {
  // Compare a given password against the stored hashed password
  // If it matches, return the user instance, otherwise return null
  return bcrypt.compare(password, this.password)
    .then(valid => valid ? this : null)
    .catch(console.error)
}

module.exports = mongoose.model('User', userSchema)
