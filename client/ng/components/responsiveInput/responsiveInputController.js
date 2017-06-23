function ResponsiveInputController(){

}
ResponsiveInputController.prototype.$onChanges =function(objChanges){
  this.setValidationClasses();
}
ResponsiveInputController.prototype.setValidationClasses = function(){
  switch(this.validation){
    case "error":
      this.feedback = "has-error";
      this.feedbackIcon = "glyphicon-remove";
      this.alert = "alert-danger";
      break;
    case "warning":
      this.feedback = "has-warning";
      this.feedbackIcon = "glyphicon-warning-sign";
      this.alert = "alert-warning";
      break;
    case "success":
      this.feedback = "has-success";
      this.feedbackIcon = "glyphicon-okay";
      this.alert = "alert-success";
      break;
    case "default":
    default:
      this.feedback = "has-default";
      this.feedbackIcon = "glyphicon-default";
      this.alert = "alert-default";
      this.message = "";
  }
}
