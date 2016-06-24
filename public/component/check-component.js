angular.module('qbhelper').component('customerComponent', {
    templateUrl: '/component/check.html',
    controllerAs: 'ch',
    controller: function ($state, MemberService, PhoneService) {

        var ch = this;
        ch.checked = false;
        ch.vform = 1;

        // formating phone number under the mask
        ch.formatPhoneNumber = function (phoneNumber, customer) {
            var formatted = PhoneService.formatPhoneNumber(phoneNumber);
            ch.phoneNumber = formatted
            if (customer) {
                ch.currentCustomer.PrimaryPhone.FreeFormNumber = formatted
            }
        }
        // FIND CUSTOMER BY PHONE
        ch.find = function (phoneNumber) {
            MemberService.findMemberByPhone(phoneNumber).then(handleServerSuccess, handleServerError);
        };

        // UPDATING THE CUSTOMER INFORMATION
        ch.updateCustomer = function (updatedCustomer) {
            MemberService.updateCustomer(updatedCustomer).then(handleUpdateSuccess, handleServerError);
            ch.currentCustomer = {};
        }

        // SEND SMS FOR PHONE VERIFICATION
        function sendSMS(customer) {
            MemberService.sendSMS(customer).then(CodeSuccess, handleServerError);
        }
        // POP-UP MESSAGING
        function showMessage(message) {
            ch.message = message;
            $('#showMessage').modal('show');
        }
        //PROFILE IS UPDATED
        function handleUpdateSuccess(res) {
            console.log(" Update success");
            ch.checked = false;
            ch.vform = 3;
        }
        // CHECK RESPONCE AFTER FIDING CUSTOMER BY PHONE
        function handleServerSuccess(res) {
            if (res.data) {
                ch.currentCustomer = res.data;
                sendSMS(ch.currentCustomer);
            } else {
                console.log(" WRONG PHONE NUMBER ");
                showMessage("Sorry, but we do not know this phone number. Please, try again..");
            }
        }
        // CHECK RESPONCE AFTER SENDING SMS
        function CodeSuccess(res) {
            console.log('CODE SENT');
            ch.vform = 2;
            var code = res.data.response;
            ch.checkCode = function (vcode) {
                if (code == vcode) {
                    ch.checked = true;
                } else {
                    console.log("WRONG SMS CODE");
                    showMessage("Sorry, but it is wrong code. Please, try again..")
                }
            };
        }
        // CHECK SERVER ERRORS
        function handleServerError(err) {
            console.log("SERVER ERROR ");
            showMessage("Sorry, but there is some error. Please, try again..");
        }
    }
});

