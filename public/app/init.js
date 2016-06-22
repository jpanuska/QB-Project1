(function(){
angular.module("qbhelper",['ui.router']);})();


angular.module("qbhelper").config(function($stateProvider, $urlRouterProvider){
            
        $stateProvider
                .state('customer',{
                    url: "/search/:cid",
                    template: "<customer-component></customer-component>"
                })
                .state('user', {
                    url: '/user',
                    template: '<user-component></user-component>'
                })
$urlRouterProvider.otherwise('/user')

});