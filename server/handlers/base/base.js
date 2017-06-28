module.exports = {
  Base : class Base{
    static get secure(){return true}
    static get method(){return "all"}
    static get roles(){return "all"}
    static get route(){return "default"}
    constructor(req,res){}
  }
}
