const fs = require("fs")
const newLine = require("os").EOL
const cache = {}
const Base = require('./base/base.js').Base

class Static extends Base{
  constructor(req, res){
    super(req, res)
    let filePath = `${getPublicDir(req)}\\${req.args.relPathFile}`
    res.sendFile(filePath)
  }
}

module.exports = {
  Include : class Include extends Base {
    static get method(){return "get"}
    static get roles(){return "all"}
    static get route(){return "default"}
    static get secure(){return false}
    constructor(req, res){
      super(req, res)
      let prmsGetResponseBody = getPrmsGetResponseBody(req, res)
      prmsGetResponseBody.then(responseBody =>
        res.send(responseBody)
      )
      .catch(err =>
        res.status(500).send(err.stack)
      )
    }
  },
  Insecure : class Insecure extends Static {
    static get route(){return "/insecure/:relPathFile"}
    static get secure(){return false}
    constructor(req, res){super(req,res)}
  },
  Secure : class Secure extends Static {
    static get route(){return "/public/:relPathFile"}
    constructor(req, res){super(req,res)}
  }

}

let appDir = ""
function getAppDir() {
  if(appDir == ""){
    let arrDir = __dirname.split("\\")
    arrDir.pop()
    arrDir.pop()
    appDir = arrDir.join("/")
  }
  return appDir
}
let publicDir =""
function getPublicDir(req){
  if(publicDir == ""){
    publicDir = getAppDir()
      + req.config.relPathClient
      + "/public"
  }
  return publicDir
}

function getPrmsLoadFile(filePath){
  return new Promise(
    (resolve, reject) => {
      fs.readFile(
        filePath,
        "utf-8",
        (err, data) => {
          if (err){
            reject(err)
          }
          else{
            let json = JSON.parse(data)
            resolve(json)
          }
        }
      )
    }
  )
}

function getPrmsLoadService(ngPath, serviceName, arrServices){
  return new Promise(
    (resolve, reject) => {
      let filePathService = `${ngPath}/services/${serviceName}.js`
      fs.readFile(
        filePathService,
        "utf-8",
        (err, data) => {
          if (err){
            reject(err)
          }
          else{
            arrServices.push(data)
            resolve()
          }
        }
      )
    }
  )
}

function getPrmsLoadComponentBindings(dirPathComponent, objComponent){
  return new Promise(
    (resolve, reject) => {
      let filePathComponentBindings = `${dirPathComponent}/${objComponent.name}Bindings.json`
      fs.readFile(
        filePathComponentBindings,
        "utf-8",
        (err, data) => {
          if (err){
            reject(err)
          }
          else{
            objComponent.bindings = data
            resolve()
          }
        }
      )
    }
  )
}

function getPrmsLoadComponentController(dirPathComponent, objComponent){
  return new Promise(
    (resolve, reject) => {
      let filePathComponentController = `${dirPathComponent}/${objComponent.name}Controller.js`
      fs.readFile(
        filePathComponentController,
        "utf-8",
        (err, data) => {
          if (err){
            reject(err)
          }
          else {
            objComponent.controller = data
            resolve()
          }
        }
      )
    }
  )
}

function getPrmsLoadComponentTemplate(dirPathComponent, objComponent){
  return new Promise(
    (resolve, reject) => {
      let filePathComponentTemplate = `${dirPathComponent}/${objComponent.name}Template.html`
      fs.readFile(
        filePathComponentTemplate,
        "utf-8",
        (err, data) => {
          if (err){
            reject(err)
          }
          let template = data.split(newLine).join(" ")
          objComponent.template = template
          resolve()
        }
      )
    }
  )
}

function getPrmsLoadComponents(dirPathComponent, componentName, arrObjComponents){
  return new Promise(
    (resolve, reject) => {
      let objComponent = {name:componentName}
      arrObjComponents.push(objComponent)
      let prmsLoadComponentBindings = getPrmsLoadComponentBindings(dirPathComponent, objComponent)
      let prmsLoadComponentController = getPrmsLoadComponentController(dirPathComponent, objComponent)
      let prmsLoadComponentTemplate = getPrmsLoadComponentTemplate(dirPathComponent, objComponent )
      Promise.all(
        [
          prmsLoadComponentBindings,
          prmsLoadComponentController,
          prmsLoadComponentTemplate
        ]
      ).then(
        () => {
          resolve()
        }
      )
    }
  )
}

function getComponentDeclaration(moduleName, objComponent){
  let componentFunctionName = objComponent.name.charAt(0).toUpperCase() + objComponent.name.slice(1)
  return `${moduleName}.component('${objComponent.name}', {
bindings: ${objComponent.bindings},
controller: ${componentFunctionName}Controller,
template: "${objComponent.template.replace(/\"/g, "\\\"")}"
});`
}

function getStrApp(moduleName, params, obj){
  let strApp = `var ${moduleName} = angular.module('${params.app}',[]);`
  obj.appJson.services.forEach(
    serviceName => {
      let factoryName = serviceName.replace("Service","")
      let serviceFunctionName = serviceName.charAt(0).toUpperCase() + serviceName.slice(1)
      strApp += `${newLine}${moduleName}.factory('${factoryName}', ${serviceFunctionName});`
    }
  )
  obj.arrObjComponents.forEach(
    objComponent => {
      strApp += newLine + getComponentDeclaration(moduleName, objComponent)
    }
  )
  obj.arrServices.forEach(
    service =>
      strApp += `${newLine}${service}`
  )
  obj.arrObjComponents.forEach(
    objComponent =>
      strApp += `${newLine}${objComponent.controller}`
  )
  return strApp
}

function getPrmsGetResponseBody(req){
  return new Promise(
    (resolve, reject) => {
      if(req.config.cacheNg && cache[req.args.app]){
        resolve(cache[req.args.app])
      }
      else {
        let appDir = getAppDir()
        let ngPath = `${appDir}${req.config.relPathNg}`
        let filePath =  `${ngPath}/apps/${req.args.app}.json`
        let prmsLoadFile = getPrmsLoadFile(filePath)
        let prmsLoadModules = prmsLoadFile.then(
          appJson => {
            let services = appJson.services
            let arrServices = new Array()
            let prmsLoadServices = services.map(serviceName => {
                return getPrmsLoadService(ngPath, serviceName, arrServices)
              }
            )

            let components = appJson.components
            let arrObjComponents = new Array()
            let prmsLoadComponents = components.map(componentName => {
                let dirPathComponent = `${ngPath}/components/${componentName}`
                return getPrmsLoadComponents(dirPathComponent, componentName, arrObjComponents)
              }
            )
            let prmsLoaders = prmsLoadServices.concat(prmsLoadComponents)
            return Promise.all(prmsLoaders).then(
              () => {
                  return new Promise(
                    (resolve, reject) => {
                      resolve({appJson, arrServices, arrObjComponents})
                    }
                  )
                //.catch(err =>
                  //this.responseWrapper.error(500, "Error loading modules")
                //)
//                .catch(err =>
//                  console.log("Error loading module")
//                )
              }
            )
          }
        )
        .catch(err => reject(err))
        prmsLoadModules.then(
          obj => {
            let moduleName = `${req.args.app}Module`
            let strApp = getStrApp(moduleName, req.args, obj)
            if(req.config.cacheNg){
              cache[req.args.app] = strApp
            }
            resolve(strApp)
          }
        )
        .catch(err => reject(err))
      }
    }
  )
}
