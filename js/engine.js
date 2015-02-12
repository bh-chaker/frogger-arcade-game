/* Engine.js
 * This file provides the game loop functionality (update entities and render),
 * draws the initial game board on the screen, and then calls the update and
 * render methods on your player and enemy objects (defined in your app.js).
 *
 * A game engine works by drawing the entire game screen over and over, kind of
 * like a flipbook you may have created as a kid. When your player moves across
 * the screen, it may look like just that image/character is moving or being
 * drawn but that is not the case. What's really happening is the entire "scene"
 * is being drawn over and over, presenting the illusion of animation.
 *
 * This engine is available globally via the Engine variable and it also makes
 * the canvas' context (ctx) object globally available to make writing app.js
 * a little simpler to work with.
 */

var Engine = (function(global) {
    /* Predefine the variables we'll be using within this scope,
     * create the canvas element, grab the 2D context for that canvas
     * set the canvas elements height/width and add it to the DOM.
     */
    var doc = global.document,
        win = global.window,
        canvas = doc.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        lastTime,
        starTime,
        numRows = 6,
        numCols = 8,
        tileWidth = 101,
        tileHeight = 101,
        offsetX = 101,
        offsetY = 83;

    var gameOver = false;
    var gameOverTime;
    var gameOverDisplayed = false;

    var topMargin = 0;

    var level;

    var rowTiles = [
        'grass',
        'stone',
        'stone',
        'stone',
        'grass',
        'grass'
    ];

    canvas.width = numCols * tileWidth;
    canvas.height = (numRows+1) * tileHeight;
    doc.body.appendChild(canvas);

    /* This function serves as the kickoff point for the game loop itself
     * and handles properly calling the update and render methods.
     */
    function main() {
        /* Get our time delta information which is required if your game
         * requires smooth animation. Because everyone's computer processes
         * instructions at different speeds we need a constant value that
         * would be the same for everyone (regardless of how fast their
         * computer is) - hurray time!
         */
        var now = Date.now(),
            dt = (now - lastTime) / 1000.0;

        /* Call our update/render functions, pass along the time delta to
         * our update function since it may be used for smooth animation.
         */
         if (gameOver){
            if (!gameOverDisplayed){
                displayGameOverScreen();
                gameOverDisplayed = true;
                doc.addEventListener('keyup', gameOverKeyupListener);
            }
         }
         else{
            update(dt);
            render();
         }


        /* Set our lastTime variable which is used to determine the time delta
         * for the next time this function is called.
         */
        lastTime = now;

        /* Use the browser's requestAnimationFrame function to call this
         * function again as soon as the browser is able to draw another frame.
         */
        win.requestAnimationFrame(main);
    };

    /* This function does some initial setup that should only occur once,
     * particularly setting the lastTime variable that is required for the
     * game loop.
     */
    function init() {
        reset();
        startTime = Date.now();
        lastTime = Date.now();
        level = {
            'currentLevel': 1,
            'loadingNextLevel': false,
            'currentRow': 0
        };

        gameOver = false;
        gameOverDisplayed = false;

        main();
    }

    /* This function is called by main (our game loop) and itself calls all
     * of the functions which may need to update entity's data. Based on how
     * you implement your collision detection (when two entities occupy the
     * same space, for instance when your character should die), you may find
     * the need to add an additional function call here. For now, we've left
     * it commented out - you may or may not want to implement this
     * functionality this way (you could just implement collision detection
     * on the entities themselves within your app.js file).
     */
    function update(dt) {
        updateEntities(dt);
        // checkCollisions();
    }

    /* This is called by the update function  and loops through all of the
     * objects within your allEnemies array as defined in app.js and calls
     * their update() methods. It will then call the update function for your
     * player object. These update methods should focus purely on updating
     * the data/properties related to  the object. Do your drawing in your
     * render methods.
     */
    function updateEntities(dt) {
        if (level.loadingNextLevel){
            if (topMargin < offsetY){
                topMargin += 150 * dt;
            }
            else{
                topMargin -= offsetY;
                level.currentRow += 1;
                if (level.currentRow < numRows){
                    rowTiles.unshift(rowTiles.pop());
                }
                else{
                    init_enemies();
                    init_gems();
                    topMargin = 0;
                    rowTiles.unshift(rowTiles.pop());
                    level.loadingNextLevel = false;
                    player.y = numRows - 2;
                    doc.addEventListener('keyup', playerKeyupListener);
                }
            }
        }
        else{
            allEnemies.forEach(function(enemy) {
                if (!player.dead){
                    enemy.update(dt + dt*level.currentLevel*0.5);
                }
            });
            player.update(dt);
            if (player.lives==0){
                doc.removeEventListener('keyup', playerKeyupListener);
                gameOver = true;
                gameOverTime = Date.now();
                gameOverDisplayed = false;
            }
        }

    }

    /* This function initially draws the "game level", it will then call
     * the renderEntities function. Remember, this function is called every
     * game tick (or loop of the game engine) because that's how games work -
     * they are flipbooks creating the illusion of animation but in reality
     * they are just drawing the entire screen over and over.
     */
    function render() {
        /* This array holds the relative URL to the image used
         * for that particular row of the game level.
         */
        var row, col;


        // Disploy bottom blocks at the top to give an impression of infinite length
        for (col = 0; col < numCols; col++) {
            ctx.drawImage(Resources.get('images/'+ rowTiles[numRows-2] +'-block.png'),
                col * tileWidth, topMargin - 2*offsetY);
            ctx.drawImage(Resources.get('images/'+ rowTiles[numRows-1] +'-block.png'),
                col * tileWidth, topMargin - offsetY);
        }

        /* Loop through the number of rows and columns we've defined above
         * and, using the rowImages array, draw the correct image for that
         * portion of the "grid"
         */
        for (row = 0; row < numRows; row++) {
            for (col = 0; col < numCols; col++) {
                /* The drawImage function of the canvas' context element
                 * requires 3 parameters: the image to draw, the x coordinate
                 * to start drawing and the y coordinate to start drawing.
                 * We're using our Resources helpers to refer to our images
                 * so that we get the benefits of caching these images, since
                 * we're using them over and over.
                 */
                var imgPath = 'images/'+ rowTiles[row] +'-block.png';
                ctx.drawImage(Resources.get(imgPath), col * tileWidth, topMargin + row * offsetY);
            }
        }

        displayFooter();
        displayInstructions();

        renderEntities();

        if (level.loadingNextLevel){
            displayLoadingNextLevel();

        }

    }

    /* This function is called by the render function and is called on each game
     * tick. It's purpose is to then call the render functions you have defined
     * on your enemy and player entities within app.js
     */
    function renderEntities() {
        /* Loop through all of the objects within the allEnemies array and call
         * the render function you have defined.
         */
        allEnemies.forEach(function(enemy) {
            enemy.render();
        });

        allGems.forEach(function(gem) {
            gem.render();
        });

        key.render();

        if (key.displayed){
            if (key.x==player.x && key.y==player.y){
                key.displayed = false;
                console.log('key is hidden');
                allEnemies = [];
                level.currentLevel++;
                level.loadingNextLevel = true;
                level.currentRow = 0;
                topMargin = 0;
                doc.removeEventListener('keyup', playerKeyupListener);
            }
            else{
                player.render(topMargin);
            }
        }
        else if (!level.loadingNextLevel && allGems.length==0){
            key.displayed = true;
        }
        else{
            if (!level.loadingNextLevel){
                player.render(topMargin);
            }
            else{
                if (level.currentRow < numRows-3){
                    player.y = level.currentRow;
                }
                else{
                    player.y = numRows-3;
                }

                player.render(topMargin);
            }
        }
    }

    function displayGameOverScreen(){
        ctx.fillStyle = "#F67841";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "white";
        ctx.strokeStyle = "#67200A";
        ctx.textAlign = 'center';
        ctx.font="50px Georgia";

        ctx.fillText("Game Over", canvas.width/2, 1*tileHeight);
        ctx.fillText("You reached level "+level.currentLevel, canvas.width/2, 2*tileHeight);
        ctx.fillText("You collected "+player.gems+" gems", canvas.width/2, 3*tileHeight);
        var playedTime = gameOverTime - startTime;
        playedTime = msToTime(playedTime);
        ctx.fillText("Total time "+playedTime, canvas.width/2, 4*tileHeight);
        ctx.fillText("Press any key to restart", canvas.width/2, 5*tileHeight);
    }

    function gameOverKeyupListener(e){
        gameOver = false;
        doc.removeEventListener('keyup', gameOverKeyupListener);
        init();
    }

    function displayFooter(){
        displayFooterBoxes();
        displayFooterLivesCount();
        displayFooterGemsCont();
        displayFooterLevel();
        displayFooterTime();
    }

    function displayFooterBoxes(){
        ctx.fillStyle = "white";
        ctx.strokeStyle = "green";
        ctx.textAlign = "left";
        ctx.lineWidth = 4;
        ctx.fillRect(0, canvas.height-231, canvas.width, 130);
        ctx.strokeRect(0*2*tileWidth+ctx.lineWidth/2, canvas.height-231, 2*tileWidth-ctx.lineWidth, 130);
        ctx.strokeRect(1*2*tileWidth+ctx.lineWidth/2, canvas.height-231, 2*tileWidth-ctx.lineWidth, 130);
        ctx.strokeRect(2*2*tileWidth+ctx.lineWidth/2, canvas.height-231, 4*tileWidth-ctx.lineWidth, 65);
        ctx.strokeRect(2*2*tileWidth+ctx.lineWidth/2, canvas.height-166, 4*tileWidth-ctx.lineWidth, 65);
    }

    function displayFooterLivesCount(){
        ctx.drawImage(Resources.get('images/Heart.png'), 0, (numRows-1) * offsetY + 35);
        ctx.font="50px Georgia";
        ctx.fillStyle = "#F67841";
        ctx.strokeStyle = "#67200A";
        ctx.lineWidth = 2;
        ctx.fillText("x "+player.lives,111, numRows * offsetY + 50);
        ctx.strokeText("x "+player.lives,111, numRows * offsetY + 50);
    }

    function displayFooterGemsCont(){
        ctx.drawImage(Resources.get('images/Gem Blue.png'), offsetX*2+6, (numRows-1) * offsetY + 15);
        ctx.font="50px Georgia";
        ctx.fillStyle = "#F67841";
        ctx.strokeStyle = "#67200A";
        ctx.lineWidth = 2;
        ctx.fillText("x "+player.gems,offsetX*3+10, numRows * offsetY + 50);
        ctx.strokeText("x "+player.gems,offsetX*3+10, numRows * offsetY + 50);
    }

    function displayFooterLevel(){
        ctx.font="50px Georgia";
        ctx.fillStyle = "#F67841";
        ctx.strokeStyle = "#67200A";
        ctx.lineWidth = 2;
        ctx.fillText("Level",offsetX*4+10, numRows * offsetY + 30);
        ctx.strokeText("Level",offsetX*4+10, numRows * offsetY + 30);

        ctx.textAlign = "right";
        ctx.fillText(level.currentLevel,offsetX*6, numRows * offsetY + 30);
        ctx.strokeText(level.currentLevel,offsetX*6, numRows * offsetY + 30);
    }

    function displayFooterTime(){
        ctx.textAlign = "left";
        ctx.font="50px Georgia";
        ctx.fillStyle = "#F67841";
        ctx.strokeStyle = "#67200A";
        ctx.lineWidth = 2;

        var playedTime = Date.now() - startTime;
        playedTime = msToTime(playedTime);
        ctx.fillText("Time",offsetX*4+10, numRows * offsetY + 85);
        ctx.strokeText("Time",offsetX*4+10, numRows * offsetY + 85);
        ctx.textAlign = "right";
        ctx.fillText(playedTime, canvas.width-20, numRows * offsetY + 85);
        ctx.strokeText(playedTime, canvas.width-20, numRows * offsetY + 85);
    }

    function displayInstructions(){
        ctx.fillStyle = "#F67841";
        ctx.fillRect(0, 6*tileWidth + 2, canvas.width, tileWidth);
        ctx.fillStyle = "white";
        ctx.strokeStyle = "#67200A";
        ctx.textAlign = 'left';
        ctx.font="30px Georgia";
        ctx.fillText("1) Use arrows to move.", 10, 6.3*tileHeight);
        ctx.fillText("2) Collect all 3 gems to make the key appear.", 10, 6.6*tileHeight);
        ctx.fillText("3) Collect the key to advance to next level.", 10, 6.9*tileHeight);
    }

    function displayLoadingNextLevel(){
        ctx.textAlign = "center";
        ctx.font="80px Georgia";
        var color1 = "#F67841";
        var color2 = "#67200A";
        var t = Date.now();
        if ((t-t%500)%1000==0){
            ctx.fillStyle = color1;
            ctx.strokeStyle = color2;
        }
        else{
            ctx.fillStyle = color2;
            ctx.strokeStyle = color1;
        }

        ctx.lineWidth = 2;
        ctx.fillText("Loading Next Level",canvas.width/2, 120);
        ctx.strokeText("Loading Next Level",canvas.width/2, 120);
    }

    /* This function does nothing but it could have been a good place to
     * handle game reset states - maybe a new game menu or a game over screen
     * those sorts of things. It's only called once by the init() method.
     */
    function reset() {
        init_all();
    }

    /* Go ahead and load all of the images we know we're going to need to
     * draw our game level. Then set init as the callback method, so that when
     * all of these images are properly loaded our game will start.
     */
    Resources.load([
        'images/Gem Blue.png',
        'images/Gem Green.png',
        'images/Gem Orange.png',
        'images/Heart.png',
        'images/background-block.png',
        'images/empty-block.png',
        'images/stone-block.png',
        'images/water-block.png',
        'images/grass-block.png',
        'images/enemy-bug.png',
        'images/char-boy.png',
        'images/Key.png'
    ]);
    Resources.onReady(init);

    /* Assign the canvas' context object to the global variable (the window
     * object when run in a browser) so that developer's can use it more easily
     * from within their app.js files.
     */
    global.ctx = ctx;
    global.numRows = numRows;
    global.numCols = numCols;
    global.startX = 3;
    global.startY = 4;
    global.tileWidth = tileWidth;
    global.tileHeight = tileHeight;
    global.offsetX = offsetX;
    global.offsetY = offsetY;
})(this);


function msToTime(s) {

  function addZ(n) {
    return (n<10? '0':'') + n;
  }

  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;

  return addZ(hrs) + ':' + addZ(mins) + ':' + addZ(secs) + '.' + Math.floor(ms/100.0);
}