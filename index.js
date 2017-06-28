const express = require("express")
const app = express()
const path = require("path")
const fs = require("fs")
const pathConfig = path.join(__dirname, "config.json")
const config = JSON.parse(fs.readFileSync(pathConfig))
const pathHandlers = path.join(__dirname, config.relPathHandlers)
const pathNg = path.join(__dirname, config.relPathNg)
const mdlAuthentication = require("./server/authentication.js")
const authentication = new mdlAuthentication()
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')


app.use(bodyParser.json())
app.use(cookieParser())

//lifecycle managers
let getAuthenticator = (handler) => {
  return function(req, res, next){
    authentication.setSessionId(req, res)
    if(!req.user && handler.secure){
      res.redirect("/insecure/login.html")
      return
    }
    else{
      next()
    }
  }
}
let getAuthorizer = (handler) => {
  return function(req, res, next){
    if(handler.roles == "all" || handler.roles.contains(req.user.roles)){
      next()
    }
    else{
      res.status(401)
    }
  }
}
let getConfigurator = (handler) => {
  return function(req, res, next){
    req.config = config
    next()
  }
}
let getParametizer = (handler) => {
  return function(req, res, next){
    req.args = Object.assign(req.params, req.query)
    if(req.body){
      req.args = Object.assign(req.args, req.body)
    }
    next()
  }
}
let getResponseWrapper = (handler) => {
  return function(req, res, next){
    res.set('Cache-Control', 'no-cache')
    next()
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
  let authenticator = getAuthenticator(fileHandler.handler)
  let authorizer = getAuthorizer(fileHandler.handler)
  let configurator = getConfigurator(fileHandler.handler)
  let parametizer = getParametizer(fileHandler.handler)
  let responseWrapper = getResponseWrapper(fileHandler.hander)
  let handler = getHandler(fileHandler.handler)

  app[fileHandler.handler.method](
    route,
    [
      authenticator,
      authorizer,
      configurator,
      parametizer,
      responseWrapper,
      handler
    ]
  )
}
//register overrides first
// app.use(
//   '/public',
//   express.static('client/public')
// )
overiddenRoutes.forEach(setHandler)
defaultedRoutes.forEach(setHandler)
app.get('/', function (req, res) {
  res.send('Whoops!')
})

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
