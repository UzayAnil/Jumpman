var canvas;
var ctx;
var score;
var targetCount = 0;
var highScore = 0;
var player;
var airborn;
var jumpTimer = 0;
var shieldTimer = 0;
var inputs = {
    left: false,
    up: false,
    right: false,
    down: false
};
var spritesheet = new Image();
var sprites = {
    left: new sprite(30, 38, 30, 38),
    right: new sprite(0, 0, 30, 38),
    leftJump: new sprite(0, 38, 30, 38),
    rightJump: new sprite(30, 0, 30, 38),
    brick: new sprite(60, 0, 64, 64)
};
var facingRight = true;
var level;
var platforms = [];
var target;
var shield;
var timestamp = Date.now();

var ACCEL = 200;
var MAX_VELOCITY = 100;
var MIN_VELOCITY = .5;
var JUMP_VELOCITY = 300;
var JUMP_TIME = .2;
var FRICTION_FACTOR = 3;
var DROP_FACTOR = 3;
var GRAVITY = 500;
var LETHAL_VELOCITY = 400;
var MAX_DELTA = .03;
var EDGE_CREEP = 7;
var SCORE_DIGITS = 8;
var LEVEL_CHANGE = 5;
var SHIELD_TIME = 10;

function init() {
    spritesheet.src = 'hatguy.png';

    canvas = document.getElementById('canvas');
    canvas.width = 600;
    canvas.height = 600;
    ctx = canvas.getContext('2d');
	
	shield = new entity(0, 0, 20, 20);
	
    
	level = new level();
    loadLevel(level.next());

    target = new entity(0, 0, 10, 10);
    moveTarget();

    player = new entity(0, 0, 30, 38);
    reset();
	

    document.addEventListener('keydown', keyDown, false);
    document.addEventListener('keyup', keyUp, false);
    document.addEventListener('mousedown', mouseDown, false);

    gameLoop();
}

function reset(soft) {
    if(!soft) score = 0;
    player.vx = 0;
    player.vy = 0;
    player.setLeft(0);
    player.setBottom(canvas.height);
}

function loadLevel(list) {
    platforms = [];
    var platform;
    for(var p=0; p<list.length; p++) {
        platform = list[p];
        platforms.push(
            new entity(platform[0], platform[1], platform[2], platform[3])
        );
    }
	resetShield();
}

function moveTarget() {
    score += 5;
    if(score > highScore) highScore = score;

    targetCount++;
    if(targetCount > LEVEL_CHANGE) {
        loadLevel(level.next());
        targetCount = 0;
        reset(true);
    }
	placeItem(target);
}
function placeItem(item) {
    while(true) {
        var platform = pick(platforms);
        item.setMidX(platform.getMidX());
        item.setMidY(platform.getTop() - platform.halfHeight);

        var success = true;
        for(var p=0; p<platforms.length; p++) {
            if(collideRect(item, platform)) {
                success = false;
                break;
            }
        }

        if(success) break;
    }
}
function resetShield() {
	placeItem(shield)
}

function gameLoop() {
    updatePosition();
    handleCollision();
    updateCanvas();
    window.requestAnimationFrame(gameLoop);
}

function updatePosition() {
    var now = Date.now();
    var delta = (now - timestamp) / 1000;
    if(delta > MAX_DELTA) delta = MAX_DELTA;
    timestamp = now;

    if(inputs.left) {
        facingRight = false;
        if(!airborn && player.vx > 0) {
            player.vx -= delta * player.vx * FRICTION_FACTOR;
        }
        player.vx -= delta * ACCEL;
    } else if(inputs.right) {
        facingRight = true;
        if(!airborn && player.vx < 0) {
            player.vx -= delta * player.vx * FRICTION_FACTOR;
        }
        player.vx += delta * ACCEL;
    } else if(!airborn) {
        player.vx -= delta * player.vx * FRICTION_FACTOR;
    }

    if(inputs.up) {
        if(!airborn) {
            jumpTimer = JUMP_TIME;
            player.vy = -JUMP_VELOCITY;
        }

        if(jumpTimer > 0) {
            jumpTimer -= delta;
        } else {
            player.vy += delta * GRAVITY;
        }

    } else {
        if(jumpTimer) jumpTimer = 0;
        if(player.vy < 0) player.vy -= delta * player.vy * DROP_FACTOR;
        player.vy += delta * GRAVITY;
    }

    if(player.vx > MAX_VELOCITY) {
        player.vx = MAX_VELOCITY;
    } else if(player.vx < -MAX_VELOCITY) {
        player.vx = -MAX_VELOCITY;
    } else if(Math.abs(player.vx) < MIN_VELOCITY) {
        player.vx = 0;
    }

    player.x += delta * player.vx;
    player.y += delta * player.vy;
	
	if(shieldTimer > 0) {
		shieldTimer -= delta;
		if(shieldTimer < 0) {
			shieldTimer = 0;
			resetShield();
		}
	}
}

function handleCollision() {
    airborn = true;

    var platform, dx, dy;
    for(var p=0; p<platforms.length; p++) {
        platform = platforms[p];
        if(collideRect(player, platform)) {
            dx = (platform.getMidX() - player.getMidX()) / platform.width;
            dy = (platform.getMidY() - player.getMidY()) / platform.height;

            //horizontal
            if(Math.abs(dx) > Math.abs(dy)) {
                if(dx < 0) {
                    if(player.vx < 0) player.vx = 0;
                    player.setLeft(platform.getRight());
                } else {
                    if(player.vx > 0) player.vx = 0;
                    player.setRight(platform.getLeft());
                }

            //vertical
            } else {
                if(dy < 0) {
                    if(player.vy < 0) player.vy = 0;
                    player.setTop(platform.getBottom());
                } else {
                  
                    if(player.vy > LETHAL_VELOCITY && shieldTimer <= 0) {
                        reset();
                    } else {
					  if(player.vy > 0) player.vy = 0;
                        player.setBottom(platform.getTop());
                        if(Math.abs(player.vx) < EDGE_CREEP) {
                            var x = player.getMidX();
                            if(x < platform.getLeft() && !inputs.right) {
                                player.vx = -EDGE_CREEP;
                            } else if(x > platform.getRight() && !inputs.left) {
                                player.vx = EDGE_CREEP;
                            }
                        }
                        airborn = false;
                    }
                }
            }
        }
    }

    if(collideRect(player, target)) moveTarget();
	
	if(collideRect(player, shield)) {
		shieldTimer = SHIELD_TIME;
		shield.setRight(-100);
		shield.setBottom(-100);
	}

    if(player.getLeft() < 0) {
        player.setLeft(0);
        player.vx = 0;
    } else if(player.getRight() > canvas.width) {
        player.setRight(canvas.width);
        player.vx = 0;
    }

    if(player.getTop() < 0) {
        player.setTop(0);
        player.vy = 0;
    } else if(player.getBottom() > canvas.height) {
        if(player.vy > LETHAL_VELOCITY && shieldTimer <= 0) {
            reset();
        } else {
            player.setBottom(canvas.height);
            player.vy = 0;
            airborn = false;
        }
    }
}

function updateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 18px Australian Sunrise';
    ctx.fillStyle = 'white';
    ctx.fillText(pad(highScore, SCORE_DIGITS), 30, 40);
    ctx.fillText(pad(score, SCORE_DIGITS), 30, 70);
	
	ctx.fillStyle = 'gold';
	var bar = Math.ceil(shieldTimer / SHIELD_TIME * player.width);
	ctx.fillRect(player.getLeft(), player.getTop() - 10, bar, 4);

    var sprite;
    if(airborn) {
        if(facingRight) {
            sprite = sprites.rightJump;
        } else {
            sprite = sprites.leftJump;
        }
    } else {
        if(facingRight) {
            sprite = sprites.right;
        } else {
            sprite = sprites.left;
        }
    }

    drawSprite(sprite, player);

    var platform;
    for(var p=0; p<platforms.length; p++) {
        platform = platforms[p];
        drawSprite(sprites.brick, platform);
    }
	ctx.fillStyle = 'gold';
    ctx.fillRect(shield.x, shield.y, shield.width, shield.height);
	
    ctx.fillStyle = 'blue';
    ctx.fillRect(target.x, target.y, target.width, target.height);
	
	 
}

function drawSprite(s, e) {
    ctx.drawImage(
        spritesheet, s.x, s.y, s.width, s.height, e.x, e.y, e.width, e.height
    );
}

function keyDown(e) {
    e.preventDefault();
    switch(e.keyCode) {
        case 37: //left
            inputs.left = true;
            break;
        case 38: //up
            inputs.up = true;
            break;
        case 39: //right
            inputs.right = true;
            break;
        case 40: //down
            inputs.down = true;
            break;
    }
}

function keyUp(e) {
    e.preventDefault();
    switch(e.keyCode) {
        case 37: //left
            inputs.left = false;
            break;
        case 38: //up
            inputs.up = false;
            break;
        case 39: //right
            inputs.right = false;
            break;
        case 40: //down
            inputs.down = false;
            break;
    }
}

function mouseDown(e) {
    var x = e.pageX - canvas.offsetLeft;
    var y = e.pageY - canvas.offsetTop;

    player.setMidX(x);
    player.setMidY(y);
}

function collideRect(a, b) {
    if(a.getLeft() > b.getRight()) return false;

    if(a.getTop() > b.getBottom()) return false;

    if(a.getRight() < b.getLeft()) return false;

    if(a.getBottom() < b.getTop()) return false;

    return true;
}
