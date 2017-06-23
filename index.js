const express = require("express")
const app = express()
const path = require("path")
const fs = require("fs")
const pathConfig = path.join(__dirname, "config.json")
const config = JSON.parse(fs.readFileSync(pathConfig))
const pathHandlers = path.join(__dirname, config.relPathHandlers)
const pathNg = path.join(__dirname, config.relPathNg)

//pipeline managers
let authenticator = (req, res, next) =>{
  if(req.cookies.rememberme == null){
    res.cookie('rememberme', '1', { expires: new Date(Date.now() + 900000), httpOnly: true });
    //redirect to login
  }
  else{
    next()
  }
}
let getAuthorizer = (handler) => {
  return function(req, res, next){
    if(handler.roles == "all" || handler.roles.contains(req.user.role)){
      next()
    }
    else{
      res.send("Unautorized")
    }
  }
}
let getHandler = (handler) => {
  return function(req, res){
    new handler(req, res)
  }
}

//handlers
let defaultedRoutes = new Array()
let overiddenRoutes = new Array()
fs.readdirSync(pathHandlers)
  .filter(file => file.match(".+\..js") != null)
  .forEach(
    fileName => {
      let mdl = require(`.${config.relPathHandlers}/${fileName}`)
      Object.keys(mdl).forEach(function(handlerName){
          let handler = this[handlerName]
          let arrRoutes = handler.route == "default" ? defaultedRoutes : overiddenRoutes
          arrRoutes.push({fileName, handler})
        }.bind(mdl)
      )
    }
  )
let setHandler = (fileHandler) => {
  let route = fileHandler.handler.route != "default"
    ? fileHandler.handler.route
    : `/${fileHandler.fileName.split(".")[0].toLowerCase()}/${fileHandler.handler.name.toLowerCase()}`
  let authorizer = getAuthorizer(fileHandler.handler)
  let handler = getHandler(fileHandler)
  app[fileHandler.handler.method](route, [authenticator, authorizer, handler])
}
//register overrides first
let fileHandlers = overiddenRoutes.concat(defaultedRoutes)
fileHandlers.forEach(setHandler)

app.use(
  '/public',
  express.static('client/public')
)

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
