function LoginController($http, $window, validation){
  this.services = {
    $http: $http,
    $window: $window,
    validation: validation
  }
  this.errorMessage = '';
  this.isCreateUser = false;
  this.email = {
    value:"",
    validate:function(){
      if(!validation.email(this.email.value)){
        this.email.validation = "error";
        this.email.message = "Please enter a valid email";
      }
      else{
        this.email.validation = "default";
        this.email.message = "";
      }
    }.bind(this)
  };
  this.username = {
    value:"",
    message:""
  };
  this.password = {
    value:"",
  };
  this.passwordConfirm = {
    value:"",
    validate: function(){
      if(this.password.value != this.passwordConfirm.value){
        this.passwordConfirm.validation = "error";
        this.passwordConfirm.message = "Please confirm with a matching password";
      }
      else{
        this.passwordConfirm.validation = "default";
        this.passwordConfirm.message = "";
      }
    }.bind(this)
  };
}
LoginController.prototype.toggleCreateUser = function(){
  this.isCreateUser = !this.isCreateUser;
  this.email.validation = "default";
  this.email.value = "";
  this.username.validation = "default";
  this.password.validation = "default";
  this.passwordConfirm.value = "";
  this.passwordConfirm.validation = "default";
}
LoginController.prototype.login = function(){
  var isValid = true;
  if(this.username.value == ''){
    this.username.validation = "error";
    this.username.message = "Please provide a username";
    this.isValid = false;
  }
  if(this.password.value == ''){
    this.username.validation = "error";
    this.username.message = "Please provide a password";
    this.isValid = false;
  }
  if(isValid){
    this.services.$http.post(
      '/user/login',
      {
        username: this.username.value,
        password: this.password.value
      }
    ).then(
      this.handleSuccess.bind(this),
      this.handleError.bind(this)
    )
  }
}
LoginController.prototype.create = function(){
  var isValid = true;
  if(this.email.value == ''){
    this.email.validation = "error";
    this.email.message = "Please provide a value";
    isValid = false;
  }
  if(this.username.value == ''){
    this.username.validation = "error";
    this.username.message = "Please provide a username";
    isValid = false;
  }
  if(this.password.value == ''){
    this.password.validation = "error";
    this.password.message = "Please provide a password";
    isValid = false;
  }
  if(this.passwordConfirm.value == ''){
    this.passwordConfirm.validation = "error";
    this.passwordConfirm.message = "Please provide a password confirmation";
    isValid = false;
  }
  if(isValid){
    this.services.$http.post(
      '/user/create',
      {
        email: this.email.value,
        username: this.username.value,
        password: this.password.value,
        passwordConfirm: this.passwordConfirm.value,
      }
    ).then(
      this.handleSuccess.bind(this),
      this.handleError.bind(this)
    );
  }
}
LoginController.prototype.handleSuccess = function(response){
  if(response.data.location != null){
    this.services.$window.location.replace(response.data.location);
    return;
  }
  this.handleError(response);
}
LoginController.prototype.handleError = function(response){
  if(response.status < 0){
    this.errorMessage = "Missing response status";
    return;
  }
  if(response.data == null){
    this.errorMessage = "Response status:" + response.status + ". Response body missing.";
    return;
  }
  if(response.data.error != null){
    var error = response.data.error;
    if(error.email != null){
      this.email.message = error.email;
      this.email.validation = "error";
    }
    if(error.username != null){
      this.username.message = error.username;
      this.username.validation = "error";
    }
    if(error.password != null){
      this.password.message = error.password;
      this.password.validation = "error";
    }
    if(error.passwordConfirm != null){
      this.passwordConfirm.message = error.passwordConfirm;
      this.passwordConfirm.validation = "error";
    }
  }
  else{
    this.errorMessage = response.data == "" ? response.statusText
      : angular.element(response.data).text() != "" ? angular.element(response.data).text()
      : response.data
    ;
  }
}
