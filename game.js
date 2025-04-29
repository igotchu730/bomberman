import Phaser from 'phaser';

const config = {
    /* How phaser renders the game */
    type: Phaser.AUTO,
    width: 544,
    height: 416,
    backgroundColor:'#1d1d1d',
    /* Render game for pixels, preserves sharp blocky look */
    pixelArt: true,
    /* Define physics engine of the game */
    physics: {
        default: 'arcade', // basic arcade engine
        arcade: {
            debug: true // shows outlines around bodies, for testing collisions
        }
    },
    scene: {
        preload,
        create,
        update
    },
    /* Makes sure the game scales to fit screen*/
    scale: {
        mode: Phaser.Scale.FIT,
    }
};


/* Load game assets */
function preload(){

    /* Import player character */
    this.load.spritesheet('character', new URL('assets/Prototype_Character.png', import.meta.url).href, {
        frameWidth: 32,
        frameHeight: 32
    });
      
};


/* Add game assets and game setup */
function create(){

    /* Define all directions */
    const directions = ['front', 'right', 'left', 'back'];


    /* 
        ---PLAYER ANIMATIONS---
    */
   
    /* Define all player animation data */
    const playerAnimations = {
        idle: { startFrames: { front: 0, right: 16, left: 32, back: 48 }, frameRate: 3 },
        walk: { startFrames: { front: 1, right: 17, left: 33, back: 49 }, frameRate: 7 },
        damage: { startFrames: { front: 2, right: 18, left: 34, back: 50 }, frameRate: 7 },
        death: { startFrames: { front: 3, right: 19, left: 35, back: 51 }, frameRate: 7 }
    };

    /* Loop through all player animation data and create directional animations for each */
    for(const [type, {startFrames, frameRate}] of Object.entries(playerAnimations)){
        directions.forEach(direction => {
            const start = startFrames[direction];
            this.anims.create({
                key: `${type}-${direction}`,
                frames: [
                    { key: 'character', frame: start },
                    { key: 'character', frame: start + 4 },
                    { key: 'character', frame: start + 8 },
                    { key: 'character', frame: start + 12 }
                ],
                frameRate,
                repeat: -1
            });
        });
    }

    /* Add player character as a physics sprite */
    this.player = this.physics.add.sprite(272, 208,'character');

    /* Make the player look bigger, Make collision box smaller */
    this.player.setScale(2);
    this.player.body.setSize(16, 16).setOffset(8, 8); 


    /* Player character collides with world bounds */
    this.player.setCollideWorldBounds(true);

    /* Create moving keys */
    this.cursors = this.input.keyboard.createCursorKeys(); // arrow keys
    this.wasd = this.input.keyboard.addKeys({ // WASD keys
        up: Phaser.Input.Keyboard.KeyCodes.W,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    /* Keeps track of where the player is facing, defaults to front */
    this.lastFacedDirection = 'idle-front';

    /* Play idle animation */
    this.player.play(this.lastFacedDirection);

};


function update(){

    const speed = 80; // player speed
    const player = this.player; // player object
    const cursors = this.cursors; // cursor object
    const wasd = this.wasd; // wasd object

    /* resets movement every frame so player only moves on key pressed */
    player.setVelocity(0);

    /* Check if multiple movement keys are pressed in an array, filter for true values */
    const keysPressed = [
        cursors.left.isDown || wasd.left.isDown,
        cursors.right.isDown || wasd.right.isDown,
        cursors.up.isDown || wasd.up.isDown,
        cursors.down.isDown || wasd.down.isDown
    ].filter(Boolean);
    /* If multiple movement keys are pressed at once, stop moving */
    if(keysPressed.length>1){
        player.play(this.lastFacedDirection, true);
        return;
    }

    /* Player movement by arrow and wasd keys, animated */
    if(cursors.left.isDown || wasd.left.isDown){
        player.setVelocityX(-speed);
        player.anims.play('walk-left',true);
        this.lastFacedDirection = 'idle-left';
    }
    else if (cursors.right.isDown || wasd.right.isDown){
        player.setVelocityX(speed);
        player.anims.play('walk-right',true);
        this.lastFacedDirection = 'idle-right';
    }
    else if (cursors.up.isDown || wasd.up.isDown){
        player.setVelocityY(-speed);
        player.anims.play('walk-back',true);
        this.lastFacedDirection = 'idle-back';
    }
    else if (cursors.down.isDown || wasd.down.isDown){
        player.setVelocityY(speed);
        player.anims.play('walk-front',true);
        this.lastFacedDirection = 'idle-front';
    }
    else{
        player.play(this.lastFacedDirection, true) // player faces last known direction
    }
};

new Phaser.Game(config);