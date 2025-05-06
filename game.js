import Phaser from 'phaser';

const config = {
    /* How phaser renders the game */
    type: Phaser.AUTO,
    width: 736,
    height: 608,
    backgroundColor:'#1d1d1d',
    /* Render game for pixels, preserves sharp blocky look */
    pixelArt: true,
    /* Define physics engine of the game */
    physics: {
        default: 'arcade', // basic arcade engine
        arcade: {
            debug: false // shows outlines around bodies, for testing collisions
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

    /* Import tilemap and its tile sets */
    this.load.tilemapTiledJSON('map', new URL('assets/map.tmj', import.meta.url).href);
    this.load.image('barrier', new URL('assets/barrier.png', import.meta.url).href);
    this.load.image('tileset1', new URL('assets/tileset1.png', import.meta.url).href);
    this.load.image('tileset2', new URL('assets/tileset2.png', import.meta.url).href);
    this.load.image('tileset3', new URL('assets/tileset3.png', import.meta.url).href);
      
};


/* Add game assets and game setup */
function create(){

    /* 
        ---MAP---
    */

     /* Dim the background for lighting */
    this.lights.enable().setAmbientColor(0x101010);
    /* Add lighting to map */
    this.lights.addLight(80, 48, 200, 0xffba7a, 1.5);
    this.lights.addLight(368, 48, 200, 0xffba7a, 1.5);
    this.lights.addLight(656, 48, 200, 0xffba7a, 1.5);
    this.lights.addLight(80, 512, 200, 0xffba7a, 1.5);
    this.lights.addLight(656, 512, 200, 0xffba7a, 1.5);
    this.lights.addLight(224, 288, 500, 0xffba7a, 1.5);
    this.lights.addLight(528, 288, 500, 0xffba7a, 1.5);
    this.lights.addLight(368, 512, 500, 0xffba7a, 0.5);


    /* Create tile map */
    const map = this.make.tilemap({key: 'map'});

    /* Connect tile map to the tilesets */
    const barriers = map.addTilesetImage('barrier','barrier');
    const tileset1 = map.addTilesetImage('tileset1','tileset1');
    const tileset2 = map.addTilesetImage('tileset2','tileset2');
    const tileset3 = map.addTilesetImage('tileset3','tileset3');

    /* Create layers as is in tile map */
    const base_color = map.createLayer('base_color',[barriers, tileset1, tileset2, tileset3], 0, 0);
    const floor = map.createLayer('floor',[barriers, tileset1, tileset2, tileset3], 0, 0);
    const outer_walls = map.createLayer('outer_walls',[barriers, tileset1, tileset2, tileset3], 0, 0);
    const barrs = map.createLayer('barriers',[barriers, tileset1, tileset2, tileset3], 0, 0);
    const decor = map.createLayer('decor',[barriers, tileset1, tileset2, tileset3], 0, 0);

    /* Create layers for object layers */
    const playerSpawnLayer = map.getObjectLayer('player_spawn');
    const collisionLayer = map.getObjectLayer('collision');
    
    /* Add layers to Light2d pipeline */
    base_color.setPipeline('Light2D');
    floor.setPipeline('Light2D');
    outer_walls.setPipeline('Light2D');
    barrs.setPipeline('Light2D');
    decor.setPipeline('Light2D');

    



    /* 
        ---PLAYER ANIMATIONS---
    */

    /* Define all directions */
    const directions = ['front', 'right', 'left', 'back'];
   
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
    this.player = this.physics.add.sprite(48, 80,'character');

    /* Make the player look bigger, Make collision box smaller */
    this.player.setScale(2);
    this.player.body.setSize(10,10).setOffset(11,13); 


    /* Player character collides with world bounds */
    this.player.setCollideWorldBounds(true);

    /* Add player to Light2d pipeline */
    this.player.setPipeline('Light2D');
    /* Dynamic player lighting */
    this.playerLight = this.lights.addLight(this.player.x, this.player.y, 100, 0xffba7a, 0.7)


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




    /* 
        ---COLLISIONS---
    */
   /* Loop through every object in tiled object layer called collision */
    collisionLayer.objects.forEach(obj => {
        // create phaser rectangle at position and size of tiled object
        const collisionObj = this.add.rectangle(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2,
            obj.width,
            obj.height
        );
        // add arcade physics to the rectangles, makes it an obstacle
        this.physics.add.existing(collisionObj, true);

        // enable collision detection between player and rectangles
        this.physics.add.collider(this.player, collisionObj);

    });

    
    
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


    /* Dynamic player lighting, light follows player */
    this.playerLight.x = this.player.x;
    this.playerLight.y = this.player.y;

};

new Phaser.Game(config);