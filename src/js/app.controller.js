(function () {
    'use strict';

    angular
        .module('app')
        .controller('AppController', AppController);

    AppController.$inject = ['$scope', '$mdSidenav', '$timeout', 'AppService'];

    function AppController ($scope, $mdSidenav, $timeout, AppService) {
        $scope.vm = AppService.exports;

        $scope.initialize = initialize;
        $scope.setYearsRange = setYearsRange;
        $scope.toggleSidenav = toggleSidenav;

        function initialize () {
            AppService.initialize();
        }
        function setYearsRange () {
            $timeout(AppService.setYearsRange);
        }
        function toggleSidenav () {
            $mdSidenav('left').toggle();
        }
    }
})();