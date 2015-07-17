
var bull = new Object();
bull["image"] = new Image();
bull.image.src = "playerRed.png";
bull["x"] = 0;
bull["y"] = 0;

var screenWidth = 250;
var screenHeight = 250;

var numEnemies = 4;
var enemies = [];
for (var i = 0; i < numEnemies; i++) {
    var nextEnemy = new Object();
    nextEnemy["image"] =  new Image();
	nextEnemy.image.src = "enemy.png";
	nextEnemy["explosionImage"] =  new Image();
	nextEnemy.explosionImage.src = "explosion.png";
    nextEnemy["x"] = Math.random() * screenWidth;
    nextEnemy["y"] = -30;
    nextEnemy["speed"] = getSpeed();
    enemies.push(nextEnemy);
}
var enemySize = enemies[0].image.width;
var sec = -1;
var min = 0;
var health;
var timerText;
var bestTime = new Object();
bestTime["seconds"] = 0;
bestTime["minutes"] = 0;
var gameStarted = false;
var videoEffect = "epsilon";



document.addEventListener('DOMContentLoaded', function(){
  	var canvas = document.getElementById("canvas"),
	    context = canvas.getContext("2d"),
	    video = document.getElementById("video"),
	    videoObj = { "video": true },
    errBack = function(error) {
      console.log("Video capture error: ", error.code); 
    };
    health = document.getElementById("health");
    timerText = document.getElementById("timerText");
    bestTimeText = document.getElementById("bestTime");

  	if(navigator.getUserMedia) {
	    navigator.getUserMedia(videoObj, function(stream) {
	      video.src = stream;
	      video.play();
	    }, errBack);
	} else if(navigator.webkitGetUserMedia) {
	    navigator.webkitGetUserMedia(videoObj, function(stream){
	      video.src = window.URL.createObjectURL(stream);
	      video.play();
	    }, errBack);
	} else if(navigator.mozGetUserMedia) {
	    navigator.mozGetUserMedia(videoObj, function(stream){
	      video.src = window.URL.createObjectURL(stream);
	      video.play();
	    }, errBack);
	}


	var back = document.createElement('canvas')
	var backcontext = back.getContext('2d');
	var cw,ch;
 
	cw = video.clientWidth;
	ch = video.clientHeight;
	canvas.width = cw;
	canvas.height = ch;
	back.width = cw;
	back.height = ch;
	draw(video,context,backcontext,cw,ch,0, health);
	stopWatch();

},false);



function draw(video,context,backcontext,clientWidth,clientHeight,prev) {

	backcontext.drawImage(video,0,0,clientWidth,clientHeight);
	var idata = backcontext.getImageData(0,0,clientWidth,clientHeight);
	var data = idata.data;
	var limit = data.length;
	var w = idata.width;
	var divRow = w*4;
	if(!prev)
		prev = data;
	var copy = new Array(limit);

	if(videoEffect == "epsilon") {
		for(var i = 0; i < limit; i++) {
			copy[i] = data[i];

			//epsilon photography
			data[i] = 0.5*data[i] + 0.5*prev[i];
		}
	} else if(videoEffect == "swapColors") {
		var tempPixel = 0;
		for(var i = 0; i < limit; i++) {
			copy[i] = data[i];

			//swap color channels
			if(i%4 == 0) {
				tempPixel = data[i];
				data[i] = data[i+1];
			}
			else if(i%4 == 1)
				data[i] = tempPixel;
		}
	} else {
		for(var i = 0; i < limit; i++) {
			copy[i] = data[i];

			//edge - because I'm iterating through the pixels only get pixel to right and below
			data[i] = 2*data[i] - data[i + 4] - data[i + w*4] + 200;
		}
	}

	//draw the video
	context.putImageData(idata,0,0);

	if(gameStarted) {
		var bullRowTotal = 0;
		var bullColTotal = 0;
		var numDiff = 0;
		var level = 0;
		var diff = 0;
		for(var i = 0; i < limit; i = i + 4) {
			var r = copy[i];
			var p = prev[i];
			
			if(r > p)
				diff = r - p;
			else
				diff = p - r;

			//check for a significant change in color
			if(diff > 50) {
				numDiff++;
				bullColTotal = bullColTotal + ((i/4) % w);
				bullRowTotal = bullRowTotal + Math.floor(i / divRow);
			}
		}

		//draw the player image
		if(numDiff > 100) {
			bull.x = bullColTotal / numDiff;
			bull.x -= bull.image.width / 2;
			bull.y = bullRowTotal / numDiff;
			bull.y -= bull.image.height / 2;
		}
		context.drawImage(bull.image, bull.x , bull.y);

		//draw the enemies and check for collision
		for (var i = 0; i < numEnemies; i++) {
			var enemy = enemies[i];
	        context.drawImage(enemy.image, enemy.x, enemy.y);
	        var xoverlap = false;
	        var enemyReset = false;
	        if(enemy.x > bull.x) {
	        	if(enemy.x < (bull.x + bull.image.width)) {
	        		xoverlap = true;
	        	}
	        }
	        else {
	        	if(bull.x < (enemy.x + enemy.image.width)) {
	        		xoverlap = true;
	        	}
	        }
	        if(xoverlap) {
		        if(enemy.y > bull.y) {
		        	if(enemy.y < (bull.y + bull.image.height)) {
		        		enemyReset = true;
		        	}
		        }
		        else {
		        	if(bull.y < (enemy.y + enemy.image.height)) {
		        		enemyReset = true;
		        	}
		        }
	        }

	        if(enemyReset) {
	        	//an enemy collided with the player
	        	health.value -= 20;
	        	context.drawImage(enemy.explosionImage, enemy.x, enemy.y);
	        	if(health.value <= 0) {
	        		gameStarted = false;
	        		if(min > bestTime.minutes || (min == bestTime.minutes && sec > bestTime.seconds)) {
	        			bestTime.minutes = min;
	        			bestTime.seconds = sec;
					    var secText;
						if (sec<=9) { 
							secText = "0" + bestTime.seconds; 
						} else
							secText = bestTime.seconds;
	        			bestTimeText.innerHTML = "Best Score:  " + bestTime.minutes + " : " + secText;
	        		}
	        	}
	        }

	        enemy.y += enemy.speed;
	        if(enemyReset || enemy.y > screenHeight) {
		        enemy.y = 0;
		        enemy.x = Math.random() * screenWidth;
		        enemies[i].speed = getSpeed();
        	}
        }
	}

	setTimeout(draw,200,video,context,backcontext,clientWidth,clientHeight,copy);
}

function getSpeed() {
	return 15 + Math.random() * 2;
}


function stopWatch() {
	if(gameStarted) {
	   	sec++;
	   	if (sec == 60) {
	   		sec = 0;
	   		min++; 
	   	}

	   	var secText;
		if (sec<=9) { 
			secText = "0" + sec; 
		} else
			secText = sec;
	   	
	   	timerText.innerHTML = "Current Score:  " + min + " : " + secText;
    }
    setTimeout(stopWatch,1000);
}

function resetStopWatch() {
	sec = -1;
	min = 0;
	timerText.innerHTML = "Current Score:  0 : 00";
}

function startGame() {
	resetStopWatch();
	
	health.value = 100;
	gameStarted = true;
}

function selectCharacter(characterImage) {
    bull.image.src = characterImage;
}

function changeVideoEffect(effect) {
	videoEffect = effect;
}