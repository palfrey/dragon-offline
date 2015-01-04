angular.module('dragon-offline', ['ionic', 'dragon-offline.gamecontroller']).config(function($httpProvider, $stateProvider, $urlRouterProvider, $ionicConfigProvider) {
	$ionicConfigProvider.views.maxCache(0);
	$httpProvider.defaults.withCredentials = true;
	$stateProvider.state('app', {
		url: "/app",
		abstract: true,
		templateUrl: "menu.html",
	}).state('app.games', {
		url: "/games",
		views: {
			'menuContent': {
				templateUrl: "games.html",
			}
		}
	}).state('app.game', {
		url: "/games/:gameId",
		views: {
			'menuContent': {
				templateUrl: "game.html",
				controller: 'GameController'
			}
		}
	});
	// if none of the above states are matched, use this as the fallback
	$urlRouterProvider.otherwise('/app/games');
}).run(function($ionicPlatform, $http, $log, $rootScope) {
	$ionicPlatform.ready(function() {
		// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
		// for form inputs)
		if (window.cordova && window.cordova.plugins.Keyboard) {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		if (window.StatusBar) {
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
					$rev = doc == null ? null : doc._rev;
					$db.put(data, "running-games", $rev, function(err, response) {
						onDone(data);
					});
				});
			}).
			error(function(data, status, headers, config) {});
		}

		function useDoc(doc) {
			$log.info(doc);
			headers = doc.list_header;
			$rootScope.games = [];
			for (var key in doc.list_result) {
				item = doc.list_result[key];
				hash = {};
				for (i = 0; i < headers.length; i++) {
					hash[headers[i]] = item[i];
				}
				$log.info(hash);
				$rootScope.games.push({
					"white_player": hash["white_user.id"],
					"black_player": hash["black_user.id"],
					"display_class": hash["move_uid"] == $rootScope.uid ? "yours" : "theirs",
					"id": hash["id"]
				})
				$db.get("game-" + hash["id"], (function(hash) {
					return function(err, doc) {
						if (doc == null) {
							getGame(hash, null);
						} else {
							//$log.info(doc);
							//$log.info(window.smartgame.parse(doc["sgf"]));
						}
					}
				})(hash));
			}
			$rootScope.$digest();
		}

		function getGame(hash, doc) {
			$http.get($rootScope.dragon + "sgf.php?gid=" + hash["id"] + "&quick_mode=1").
			success(function(data, status, headers, config) {
				data = {
					"sgf": data
				}
				data["move_id"] = hash["move_id"];
				data["white_player"] = hash["white_user.id"];
				data["black_player"] = hash["black_user.id"];
				$rev = doc == null ? null : doc._rev;
				$db.put(data, "game-" + hash["id"], $rev, function(err, response) {
					if (err != null) {
						$log.info(gid);
						$log.info(err);
					}
				});
			});
		}
		$db = new PouchDB("games");
		$rootScope.db = $db;
		$db.get("running-games", function(err, doc) {
			if (doc == null) {
				getDoc(useDoc);
			} else if ((new Date() - Date.parse(doc["when"])) > 1000 * 60 * 20) { // 20 minutes
				getDoc(useDoc, doc);
			} else {
				useDoc(doc);
			}
		});
	});
}).directive('player', function($log, $http) {
	return {
		templateUrl: "player.html",
		scope: true,
		link: function(scope, element, attrs) {
			scope.uid = attrs.uid;
			if (scope.username) {
				scope.displayName = scope.username;
			} else {
				scope.displayName = scope.uid;
				scope.db.get("uid-" + attrs.uid, function(err, doc) {
					if (doc == null) {
						$http.get(scope.dragon + "quick_do.php?obj=user&cmd=info&uid=" + attrs.uid + "&fields=name").
						success(function(data, status, headers, config) {
							$log.info(data);
							scope.$apply(function() {
								scope.username = data["name"];
								scope.displayName = scope.username;
							});
							scope.db.put({
								"name": data["name"]
							}, "uid-" + attrs.uid, function(err, response) {
								if (err != null) {
									$log.info(data);
									$log.info(err);
								}
							});
						});
					} else {
						scope.$apply(function() {
							scope.username = doc["name"];
							scope.displayName = scope.username;
						});
					}
				});
			}
		}
	}
});