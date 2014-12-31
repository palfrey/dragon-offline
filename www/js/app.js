// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('dragon-offline', ['ionic'])
.config(['$httpProvider', function($httpProvider) {
  $httpProvider.defaults.withCredentials = true;
}])
.run(function($ionicPlatform, $http, $log, $rootScope) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    $rootScope.dragon = "http://www.dragongoserver.net/";
    $rootScope.uid = "8095";

    function getDoc(onDone, doc) {
      $http.get($rootScope.dragon + "login.php?quick_mode=1&userid=" + $username + "&passwd=" + $password).
        success(function(data, status, headers, config) {
          $log.info(status);
          $http.get($rootScope.dragon + "quick_do.php?obj=game&cmd=list&view=running").
            success(function(data, status, headers, config) {
              data["when"] = new Date().toISOString();
              $rev = doc == null? null: doc._rev;
              $db.put(data, "running-games", $rev, function (err, response) { onDone(data); });
            });
        }).
        error(function(data, status, headers, config) {
        });
    }

    function useDoc(doc) {
      $log.info(doc);
      headers = doc.list_header;
      $rootScope.games = [];
      for (var key in doc.list_result) {
        item = doc.list_result[key];
        hash = {};
        for (i=0;i<headers.length;i++) {
          hash[headers[i]] = item[i];
        }
        $log.info(hash);
        $rootScope.games.push({"white_player" : hash["white_user.id"], "black_player" : hash["black_user.id"], "display_class": hash["move_uid"] == $rootScope.uid ? "yours": "theirs" })
      }
      $log.info($rootScope.games)
      $rootScope.$digest();
    }

    $db = new PouchDB("games");
    $rootScope.db = $db;
    $login = $db.get("running-games", function(err, doc) {
      if (doc == null) {
        getDoc(useDoc);
      }
      else if ((new Date() - Date.parse(doc["when"])) > 1000*60*20) { // 20 minutes
        getDoc(useDoc, doc);
      }
      else {
         useDoc(doc);
      }
    });
  });
})
.directive('player', function($log, $http) {
  return {
    templateUrl: "player.html",
    scope: true,
    link: function(scope, element, attrs) {
      scope.uid = attrs.uid;
      if (scope.username) {
        scope.displayName = scope.username;
      }
      else {
        scope.displayName = scope.uid;
        scope.db.get("uid-" + attrs.uid, function(err, doc) {
          if (doc == null) {
            $http.get(scope.dragon + "quick_do.php?obj=user&cmd=info&uid=" + attrs.uid + "&fields=name").
              success(function(data, status, headers, config) {
                $log.info(data);
                scope.username = data["name"];
                scope.displayName = scope.username;
                scope.$digest();
                scope.db.put({"name":data["name"]}, "uid-" + attrs.uid, function (err, response) { $log.info(err); });
              });
          }
          else {
            scope.username = doc["name"];
            scope.displayName = scope.username;
            scope.$digest();
          }
        });
      }
    }
  }
});
