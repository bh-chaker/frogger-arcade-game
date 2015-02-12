// Enemy, Player, Gem and Key classes will use this class
var Displayable = function (sprite, x, y, displayed){
    this.sprite = sprite;
    this.x = x;
    this.y = y;
    this.displayed = displayed;
};

Displayable.prototype.render = function(){
    if (this.displayed){
        ctx.drawImage(Resources.get(this.sprite), this.x*offsetX, this.y*offsetY-25);
    }
};

// Enemies our player must avoid
var Enemy = function(x, y) {
    // Enemy constructor will take the initial position (x,y) and add
    // Then, it will call Displayable construtor with 'enemy-bug' image path.
    Displayable.call(this, 'images/enemy-bug.png', x, y, true);
}
// Enherit the render function from Displayable
Enemy.prototype = Object.create(Displayable.prototype);
Enemy.prototype.constructor = Enemy;

// Update the enemy's position, required method for game
// Parameter: dt, a time delta between ticks
Enemy.prototype.update = function(dt) {
    // You should multiply any movement by the dt parameter
    // which will ensure the game runs at the same speed for
    // all computers.
    if (this.x > numCols-1){
        this.x = getRandomInt(-3, 0);
    }
    else{
        this.x+= dt;
    }
}
// Now write your own player class
// This class requires an update(), render() and
// a handleInput() method.

var Player = function(x, y) {
    // Variables applied to each of our instances go here,
    // we've provided one for you to get started

    // The image/sprite for our enemies, this uses
    // a helper we've provided to easily load images

    Displayable.call(this, 'images/char-boy.png', startX, startY, true);

    this.lives = 4;
    this.gems = 0;
    this.dead = false;
    this.deadSince = Date.now();
}
Player.prototype = Object.create(Displayable.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function (dt) {
    var length = allGems.length;
    if (this.dead){
        // If the player is dead, the games freezes for few seconds.
        if (Date.now()-this.deadSince > 1000){
            this.dead = false;
            this.x = startX;
            this.y = startY;
            if (this.lives>0){
                this.lives--;
            }
        }
    }
    else{
        for (var i=length-1; i>=0; i--){
            var gem = allGems[i];
            if (player.y==gem.y && player.x==gem.x){
                allGems.splice(i, 1);
                this.gems++;
            }
        }
        var length = allEnemies.length;
        for (var i=0; i<length; i++){
            var enemy = allEnemies[i];
            if (player.y==enemy.y && player.x - enemy.x < 0.7 && enemy.x - player.x < 0.7){
                this.dead = true;
                this.deadSince = Date.now();
            }
        }
    }

}

Player.prototype.render = function (topMargin) {
    var offset = 0;

    if (this.dead){
        offset = 20;
    }
    var img = Resources.get(this.sprite);
    ctx.drawImage(img, this.x*offsetX-offset/2, topMargin+this.y*offsetY-25, img.width+offset, img.height+offset);
}

Player.prototype.handleInput = function(input){
    if (this.dead){
        return;
    }
    if (input=='up' && this.y>0){
        this.y--;
    }

    if (input=='down' && this.y<startY){
        this.y++;
    }

    if (input=='left' && this.x>0){
        this.x--;
    }

    if (input=='right' && this.x<numCols-1){
        this.x++;
    }
}

var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}
// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player
var allEnemies = [];


function init_enemies(){
    allEnemies = [];
    for (var i=0; i<3; i++){
        var enemy = new Enemy(getRandomInt(0,numCols-1), i+1);
        allEnemies.push(enemy);
    }
}

var allGems = [];
var gemSprites = [
    'images/Gem Blue.png',
    'images/Gem Green.png',
    'images/Gem Orange.png',
];

function init_gems(){
    allGems = [];
    for (var i=0; i<3; i++){
        var gem = new Displayable(gemSprites[getRandomInt(0,3)], getRandomInt(0, numCols-1), i+1, true);
        allGems.push(gem);
    }
}

var player;
function init_player(){
    player = new Player();
}

var key;
function init_key(){
    key = new Displayable('images/Key.png', startX, 0, false);
}

function init_all(){
    init_enemies();
    init_gems();
    init_player();
    init_key();
    document.addEventListener('keyup', playerKeyupListener);
}

// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
var playerKeyupListener = function (e){
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
};

