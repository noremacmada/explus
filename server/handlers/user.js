let db = require("../../db/db.js").getDb()

const msTokenValidity = 30 * 60 * 60 * 1000
const Base = require("./base/base.js").Base

class Create extends Base{
  static get secure(){return false}
  static get method(){return "post"}
  constructor(req, res){
    super()
    let user = getUser(req.args.username)
      if(user != null){
        let validationError = {error:{username: "Username already exists."}}
        res.json(validationError)
        return
      }
      db.data.users[req.args.username.toLowerCase()] = {
        password: req.args.password,
        email: req.args.email,
        roles: ["default"]
      }
      new Login(req, res)
  }
}
class Login extends Base{
  static get secure(){return false}
  static get method(){return "post"}
  constructor(req, res){
    super()
    let user = getUser(req.args.username)
    if(user == null){
      let validationError = {error:{username: "User not found."}}
      res.json(validationError)
      return
    }
    if(req.args.password != req.args.password){
      let validationError = {error:{password: "Password incorrect."}}
      res.json(validationError)
      return
    }
    let dtNow = new Date()
    user.tokenExpiration = new Date(dtNow + msTokenValidity)
    db.session[req.sessionId] = user
    res.json({location:"/public/content.html"})
  }
}

module.exports = {Create, Login}

function getUser(username){
  let searchName = username.toLowerCase();
  let isUserFound = Object.keys(db.data.users).filter(
      findName => findName == searchName
    ).length > 0
  let user = isUserFound ? db.data.users[searchName] : null
  return user
}
