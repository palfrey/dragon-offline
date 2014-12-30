// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('dragon-offline', ['ionic'])
.config(['$httpProvider', function($httpProvider) {
  $httpProvider.defaults.withCredentials = true;
}])
.run(function($ionicPlatform, $http, $log) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    $dragon = "http://www.dragongoserver.net/";

    $db = new PouchDB("games");
    $login = $db.get("last-games", function(err, doc) {
      if (doc == null) {
          $http.get($dragon + "login.php?quick_mode=1&userid=" + $username + "&passwd=" + $password).
            success(function(data, status, headers, config) {
              $log.info(status);
              $http.get($dragon + "quick_do.php?obj=game&cmd=list&view=running").
                success(function(data, status, headers, config) {
                  $log.info(status);
                  $log.info(data);
                  data["when"] = new Date().toISOString();
                  $db.put(data, "last-games", function (err, response) { });
                });
            }).
            error(function(data, status, headers, config) {
            });
      }
      $log.info(doc);
    });
  });
})
