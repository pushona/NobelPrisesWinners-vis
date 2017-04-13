(function () {
    'use strict';

    angular.module('app').config(AppConfig);

    AppConfig.$inject = ['$mdIconProvider', '$mdThemingProvider', '$compileProvider'];

    function AppConfig($mdIconProvider, $mdThemingProvider, $compileProvider) {
        $mdIconProvider.defaultIconSet('assets/icons/icons.svg', 128);
        $mdThemingProvider.theme('default').primaryPalette('blue').accentPalette('yellow').warnPalette('red').backgroundPalette('grey');
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|tel|file|blob):/);
    }
})();