angular.module('qbhelper').component('userComponent', {
    templateUrl: '/component/user.html',
    controllerAs: 'vm',
    controller: function ($state, UserService) {

        var vm = this;
        vm.checked = false;

        vm.find = function(user) {
        // CHECK THE USER
            vm.checked = true;
        }
        vm.createUser = function(newUser) {
            UserService.createLink(newUser).then(handleSuccess, handleError);
            ch.newUser = {};
        }

        function handleSuccess(res) {
            if (res.data) {
                ch.link = res.data;
            } else {
                ch.link = "Sorry, but there is some error.";
            }
        }
        function handleError(err) {
            console.log("SERVER ERROR ");
            ch.link = "Sorry, but there is some error on Quickbooks server.";
        }
    }
});
