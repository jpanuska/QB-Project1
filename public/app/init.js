(function(){
angular.module("qbhelper",['ui.router']);})();


angular.module("qbhelper").config(function($stateProvider){
            
        $stateProvider
                .state('customer',{
                    url: "/",
                    template: "<customer-component></customer-component>"
                })
                .state('user', {
                    url: '/user',
                    template: '<user-component></user-component>'
                })
});