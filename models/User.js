const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: String,
});

UserSchema.virtual('isLocked').get(function () {
  return this.lockUntil && this.lockUntil > Date.now();
});

UserSchema.methods.resetAttempts = function (callback) {
  console.log('reset');
  return this.update(
    {
      $set: { loginAttempts: 0 },
      $unset: { lockUntil: 1 },
    },
    callback
  );
};

UserSchema.methods.incrementLoginAttempts = function (callback) {
  console.log('lockUntil', this.lockUntil);
  // if we have a previous lock that has expired, restart at 1
  var lockExpired = this.lockUntil && this.lockUntil < Date.now();
  console.log('lockExpired', lockExpired);
  if (lockExpired) {
    return this.update(
      {
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 },
      },
      callback
    );
  }
  // otherwise we're incrementing
  var updates = { $inc: { loginAttempts: 1 } };
  // lock the account if we've reached max attempts and it's not locked already
  var needToLock = !!(this.loginAttempts + 1 >= 2 && !this.isLocked);
  console.log('needToLock', needToLock);
  console.log('loginAttempts', this.loginAttempts);
  if (needToLock) {
    let time = Date.now() + 86400000;
    time = '' + time;
    updates.$set = { lockUntil: time };
    console.log('lockoutHours', time, Date.now());
  }
  //console.log("lockUntil",this.lockUntil)
  return this.update(updates, callback);
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
