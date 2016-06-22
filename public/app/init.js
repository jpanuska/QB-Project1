(function(){
angular.module("qbhelper",['ui.router']);
angular.module("qbhelper").config(function($stateProvider){
            
        $stateProvider
                .state('home',{
                    url: "",
                    template: "<customer-component></customer-component>"
                })
                .state('books', {
                    url: '/admin',
                    template: '<user-component></user-component>'
                })
})}());