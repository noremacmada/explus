function ValidationService(){
  return {
    email: function(value){
      var regExEmail = /[^\s@]+@[^\s@]+\.[^\s@]+/
      return regExEmail.test(value)
    }
  }
}
