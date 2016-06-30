angular.module('qbhelper').component('userComponent', {
    templateUrl: '/component/user.html',
    controllerAs: 'vm',
    controller: function ($state, UserService) {

        var vm = this;
        vm.checked = false;
        vm.form = false;

        vm.find = function() {
            debugger
        // CHECK THE USER
        // vm.checked = true;
            UserService.createLink().then(handleSuccess, handleError);
        }
        // vm.createUser = function(newUser) {
        //     newUser.ck = "qyprdTjD18ZhGt5PwnU2jvy6lMn69O";
        //     newUser.cs = "kayCfBs78Ce4zYrS4euUx9PVha4O18IInYgRlVvB";
        //     newUser.rid = "193514327041942";
        //     UserService.createLink(newUser).then(handleSuccess, handleError);
        //     // vm.newUser = {};
        // }

        function handleSuccess(res) {
            if (res.data) {
                vm.checked = false;
                vm.form = true;
                vm.link = res.data;
            } else {
                vm.link = "Sorry, but there is some error.";
            }
        }
        function handleError(err) {
            console.log("SERVER ERROR ");
            vm.link = "Sorry, but there is some error on Quickbooks server.";
        }
    }
});
