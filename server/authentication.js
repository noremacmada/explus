let db = require("../db/db.js").getDb()

module.exports = class Authentication{
  constructor(){ }

  setSessionId(req, res){
    if(req.cookies == null || req.cookies.sessionId == null){
      let sessionId = getNewUid()
      req.sessionId = sessionId
      res.cookie('sessionId', sessionId, {httpOnly: true });
    }
    else{
      let user = db["session"][req.cookies.sessionId]
      req.sessionId = req.cookies.sessionId
      req.user = user
    }
  }
}
function getNewUid(){
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
    /[xy]/g,
    (c) => {
      let r = Math.random()*16|0
      let v = c == 'x' ? r : (r&0x3|0x8)
      return v.toString(16)
    }
  )
}
