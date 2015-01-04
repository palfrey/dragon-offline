angular.module('dragon-offline.gamecontroller', []).controller('GameController', function($scope, $stateParams, $log, $ionicNavBarDelegate) {
	$scope.gameId = $stateParams.gameId;
	$scope.rows = [
		[]
	]
	$log.info($stateParams)
	$db.get("game-" + $scope.gameId).then(function(game) {
		$log.info("game" + game);
		$db.get("uid-" + game["white_player"]).then(function(white_name) {
			$log.info("white_name = " + white_name);
			$db.get("uid-" + game["black_player"]).then(function(black_name) {
				$log.info("black_name = " + black_name)
				$scope.$apply(function() {
					var title = white_name["name"] + " v.s. " + black_name["name"];
					$log.info(title);
					$scope.DisplayName = title;
				});
			})
		});
		sgf = window.smartgame.parse(game["sgf"]);
		$log.info(sgf);
		var board = null;
		sgf.gameTrees[0].nodes.forEach(function(element, index, array) {
			for (k in element) {
				//$log.info(k);
				if (k == "SZ") {
					var size = parseInt(element[k]);
					board = _.map(_.range(size), function(x) {
						return new Array(size)
					});
					$log.info(board);
				}
				if (k == "B" || k == "W") {
					var v = element[k];
					var x = v[0].charCodeAt(0) - 'a'.charCodeAt(0)
					var y = v[1].charCodeAt(0) - 'a'.charCodeAt(0)
					$log.info(x, y, v, k)
					board[x][y] = k
				}
			}
		});
		$scope.$apply(function() {
			$scope.rows = board;
		});
	}).
	catch (function(err) {
		$log.info(err);
	});
})