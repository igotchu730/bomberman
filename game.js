import Phaser from 'phaser';
import { io } from 'socket.io-client';


/*
    WEB SOCKETS & SERVER
*/
// connect to server
const socket = io();
// log connection
socket.on('connect', () => {
    console.log('Connected to server: ', socket.id)
});




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
    },
    
};




/*
    USEFUL FUNCTIONS & VARIABLES
*/

// initialize global player stats
let speed = 80; // player speed
let bombCount = 1; // number of bombs
let explosionRadius = 1; // explosion range

// function to turn tile coordinates to keys
function toKey(x, y) {
    return `${x},${y}`;
}

// set for storing position of crates
let crateTiles = null;







/*
    Load game assets
*/
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
      
    /* Import crate sprite */
    this.load.spritesheet('crate', new URL('assets/crate.png', import.meta.url).href, {
        frameWidth: 32,
        frameHeight: 32
    });

    /* Import bomb sprite */
    this.load.spritesheet('bomb', new URL('assets/bomb.png', import.meta.url).href, {
        frameWidth: 32,
        frameHeight: 32
    });

    /* Import explosion sprite */
    this.load.spritesheet('explosion', new URL('assets/explosion.png', import.meta.url).href, {
        frameWidth: 32,
        frameHeight: 32
    });

    /* Import bombUp powerup sprite */
    this.load.spritesheet('bombUp', new URL('assets/bombUp.png', import.meta.url).href, {
        frameWidth: 32,
        frameHeight: 32
    });

    /* Import range powerup sprite */
    this.load.spritesheet('range', new URL('assets/range.png', import.meta.url).href, {
        frameWidth: 32,
        frameHeight: 32
    });

    /* Import speed powerup sprite */
    this.load.spritesheet('speed', new URL('assets/speed.png', import.meta.url).href, {
        frameWidth: 32,
        frameHeight: 32
    });

};





/* 
    Add game assets and game setup 
*/
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
    this.map = map;

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
        ---USEFUL FUNCTIONS---
    */
    // function to get all blocked tiles (playerspawn and walls)
    function getAllBlockedTiles(map, layers, propertyName = 'noSpawn'){

        // create a set to track tiles that are markled no spawn true
        const blocked = new Set();

        /* for each object on the player spawn and collision layer, check properties for no spawn true.
           If true, convert object's map coordinates to tile coordinates, add to set*/
        layers.forEach(layer => {
            if(!layer?.objects?.forEach) return;

            layer.objects.forEach(obj => {
                const hasBlock = obj.properties?.some(
                    p => p.name === propertyName && p.value === true
                );
                if(hasBlock){
                    const tileX = Math.floor(obj.x/map.tileWidth);
                    const tileY = Math.floor(obj.y/map.tileHeight);
                    blocked.add(toKey(tileX,tileY));
                };
            });
        });
        return blocked;
    };
    this.blockedTiles = getAllBlockedTiles(map, [playerSpawnLayer, collisionLayer]); //call

    // function to get all blocked tiles (walls only)
    function getWallBlockedTiles(map, layers, propertyName1 = 'noSpawn',propertyName2 = 'playerSpawn'){

        // create a set to track tiles that are markled no spawn true
        const blocked = new Set();

        /* for each object on the player spawn and collision layer, check properties for no spawn true.
           If true, convert object's map coordinates to tile coordinates, add to set*/
        layers.forEach(layer => {
            if(!layer?.objects?.forEach) return;

            layer.objects.forEach(obj => {
                const hasNoSpawn = obj.properties?.some(
                    p => p.name === propertyName1 && p.value === true
                );
                const notPlayerSpawn = obj.properties?.some(
                    p => p.name === propertyName2 && p.value === false
                );
                if(hasNoSpawn && notPlayerSpawn){
                    const tileX = Math.floor(obj.x/map.tileWidth);
                    const tileY = Math.floor(obj.y/map.tileHeight);
                    blocked.add(toKey(tileX,tileY));
                };
            });
        });
        return blocked;
    };
    this.blockedWallTiles = getWallBlockedTiles(map, [playerSpawnLayer, collisionLayer]); //call








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
                repeat: type === 'death' ? 0 : type === 'damage' ? 1 : -1 // only loop if not death
            });
        });
    }

    /* Add player character as a physics sprite */
    this.player = this.physics.add.sprite(48, 80,'character');

    /* Player is alive */
    this.player.isDead = false;

    /* show player on top layer */
    this.player.setDepth(1);


    /* Make the player look bigger, Make collision box smaller */
    this.player.setScale(2);
    this.player.body.setSize(8, 12).setOffset(12, 11);


    /* Player character collides with world bounds */
    this.player.setCollideWorldBounds(true);

    /* Add player to Light2d pipeline */
    this.player.setPipeline('Light2D');
    /* Dynamic player lighting */
    this.playerLight = this.lights.addLight(this.player.x, this.player.y, 100, 0xffba7a, 0.5)


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
        const expandedWidth = obj.width;
        const expandedHeight = obj.height;
        const collisionObj = this.add.rectangle(
            obj.x + obj.width / 2,
            obj.y + obj.height / 2,
            expandedWidth,
            expandedHeight
        );

        // add arcade physics to the rectangles, makes it an obstacle
        this.physics.add.existing(collisionObj, true);

        // enable collision detection between player and rectangles
        this.physics.add.collider(this.player, collisionObj);

    });



    /* 
        ---CRATE ANIMATIONS---
    */
    /* crate exploding animation */
    this.anims.create({
        key: `crate-explode`,
        frames: [
                    { key: 'crate', frame: 0},
                    { key: 'crate', frame: 1},
                    { key: 'crate', frame: 2},
                    { key: 'crate', frame: 3},
                    { key: 'crate', frame: 4}
                ],
        frameRate: 10,
        repeat: 0
    });




    /* 
        ---CRATE SPAWNING---
    */
    function spawnCrates(scene, map, blockedTiles, crateGroup, crateTextureKey, maxCrate, spawnChance)
    {
        // initialize map bounds and crate counter
        const width = map.width;
        const height = map.height;
        let cratesPlaced = 0;

        // set to record crate positions
        const cratePositions = new Set();

        // Loop through every tile
        for(let y = 0; y < height; y++){
            for(let x = 0; x < width; x++){
                // if amount of crates is greater than or equal to max, return
                if(cratesPlaced >= maxCrate) return cratePositions;

                // convert current tile to string key and see if it's in the blocked tile set, skip this tile
                const key = toKey(x,y);
                if(blockedTiles.has(key)) continue;

                // pick random number 0-1. If its less than spawn chance, crate is placed
                if(Math.random() < spawnChance){
                    const worldX = map.tileToWorldX(x);
                    const worldY = map.tileToWorldY(y);

                    // create crate as a static object
                    const crate = scene.crates.create(
                        worldX + map.tileWidth / 2,
                        worldY + map.tileHeight / 2,
                        crateTextureKey
                    );


                    // crate collision correction 
                    crate.body.setSize(crate.width, crate.height).setOffset(0, 0);

                    // depth bottom
                    crate.setDepth(0);

                    crate.setPipeline('Light2D'); // Add crates to Light2d pipeline
                    crate.setTint(0xAAAAAA); // Darken the crates a bit

                    // add crate to physics group
                    crateGroup.add(crate);
                    // increment
                    cratesPlaced++;

                    // save crate position in set
                    cratePositions.add(key);
                }
            }
        }
        return cratePositions;
    }
    // maximum amount of crates
    const maxCrate = 250;
    // chance spawning crate
    const spawnChance = 0.85;

    // create crate physics group
    this.crates = this.physics.add.staticGroup();

    // call function for crate spawning, assign return to crate Tiles set
    crateTiles = spawnCrates(this, map, this.blockedTiles, this.crates, 'crate', maxCrate, spawnChance);

    // collison between player and crate
    this.physics.add.collider(this.player,this.crates);

    


    /* 
        ---BOMB SPAWNING---
    */
   /* Bomb animation */
    this.anims.create({
        key: `bomb-idle`,
        frames: this.anims.generateFrameNumbers('bomb', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });
    /* Create space keys */
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // space keys

    /* create bombs group, add to physics group */
    this.bombs = this.physics.add.group();

    /* set for tracking occupied tiles */
    this.occupiedBombTile = new Set();

    /* count bombs player has and amount placed */
    this.bombsPlaced = 0;




    /* 
        ---EXPLOSION ANIMATIONS---
    */
    /* explosion origin animation */
    this.anims.create({
        key: `explosion-origin`,
        frames: [
                    { key: 'explosion', frame: 0},
                    { key: 'explosion', frame: 7},
                    { key: 'explosion', frame: 14},
                    { key: 'explosion', frame: 21},
                    { key: 'explosion', frame: 28},
                    { key: 'explosion', frame: 35},
                    { key: 'explosion', frame: 42},
                    { key: 'explosion', frame: 49},
                    { key: 'explosion', frame: 56},
                    { key: 'explosion', frame: 63},
                    { key: 'explosion', frame: 70},
                    { key: 'explosion', frame: 77},
                    { key: 'explosion', frame: 84},
                ],
        frameRate: 20,
        repeat: 0
    });
    /* explosion mid-vertical animation */
    this.anims.create({
        key: `explosion-mid-vertical`,
        frames: [
                    { key: 'explosion', frame: 1},
                    { key: 'explosion', frame: 8},
                    { key: 'explosion', frame: 15},
                    { key: 'explosion', frame: 22},
                    { key: 'explosion', frame: 29},
                    { key: 'explosion', frame: 36},
                    { key: 'explosion', frame: 43},
                    { key: 'explosion', frame: 50},
                    { key: 'explosion', frame: 57},
                    { key: 'explosion', frame: 64},
                    { key: 'explosion', frame: 71},
                    { key: 'explosion', frame: 78},
                    { key: 'explosion', frame: 85},
                ],
        frameRate: 20,
        repeat: 0
    });
    /* explosion mid-horizontal animation */
    this.anims.create({
        key: `explosion-mid-horizontal`,
        frames: [
                    { key: 'explosion', frame: 2},
                    { key: 'explosion', frame: 9},
                    { key: 'explosion', frame: 16},
                    { key: 'explosion', frame: 23},
                    { key: 'explosion', frame: 30},
                    { key: 'explosion', frame: 37},
                    { key: 'explosion', frame: 44},
                    { key: 'explosion', frame: 51},
                    { key: 'explosion', frame: 58},
                    { key: 'explosion', frame: 65},
                    { key: 'explosion', frame: 72},
                    { key: 'explosion', frame: 79},
                    { key: 'explosion', frame: 86},
                ],
        frameRate: 20,
        repeat: 0
    });
    /* explosion end-up animation */
    this.anims.create({
        key: `explosion-end-up`,
        frames: [
                    { key: 'explosion', frame: 3},
                    { key: 'explosion', frame: 10},
                    { key: 'explosion', frame: 17},
                    { key: 'explosion', frame: 24},
                    { key: 'explosion', frame: 31},
                    { key: 'explosion', frame: 38},
                    { key: 'explosion', frame: 45},
                    { key: 'explosion', frame: 52},
                    { key: 'explosion', frame: 59},
                    { key: 'explosion', frame: 66},
                    { key: 'explosion', frame: 73},
                    { key: 'explosion', frame: 80},
                    { key: 'explosion', frame: 87},
                ],
        frameRate: 20,
        repeat: 0
    });
    /* explosion end-down animation */
    this.anims.create({
        key: `explosion-end-down`,
        frames: [
                    { key: 'explosion', frame: 4},
                    { key: 'explosion', frame: 11},
                    { key: 'explosion', frame: 18},
                    { key: 'explosion', frame: 25},
                    { key: 'explosion', frame: 32},
                    { key: 'explosion', frame: 39},
                    { key: 'explosion', frame: 46},
                    { key: 'explosion', frame: 53},
                    { key: 'explosion', frame: 60},
                    { key: 'explosion', frame: 67},
                    { key: 'explosion', frame: 74},
                    { key: 'explosion', frame: 81},
                    { key: 'explosion', frame: 88},
                ],
        frameRate: 20,
        repeat: 0
    });
    /* explosion end-left animation */
    this.anims.create({
        key: `explosion-end-left`,
        frames: [
                    { key: 'explosion', frame: 5},
                    { key: 'explosion', frame: 12},
                    { key: 'explosion', frame: 19},
                    { key: 'explosion', frame: 26},
                    { key: 'explosion', frame: 33},
                    { key: 'explosion', frame: 40},
                    { key: 'explosion', frame: 47},
                    { key: 'explosion', frame: 54},
                    { key: 'explosion', frame: 61},
                    { key: 'explosion', frame: 68},
                    { key: 'explosion', frame: 75},
                    { key: 'explosion', frame: 82},
                    { key: 'explosion', frame: 89},
                ],
        frameRate: 20,
        repeat: 0
    });
    /* explosion end-right animation */
    this.anims.create({
        key: `explosion-end-right`,
        frames: [
                    { key: 'explosion', frame: 6},
                    { key: 'explosion', frame: 13},
                    { key: 'explosion', frame: 20},
                    { key: 'explosion', frame: 27},
                    { key: 'explosion', frame: 34},
                    { key: 'explosion', frame: 41},
                    { key: 'explosion', frame: 48},
                    { key: 'explosion', frame: 55},
                    { key: 'explosion', frame: 62},
                    { key: 'explosion', frame: 69},
                    { key: 'explosion', frame: 76},
                    { key: 'explosion', frame: 83},
                    { key: 'explosion', frame: 90},
                ],
        frameRate: 20,
        repeat: 0
    });



};


function update(){

    /* 
        Player logic
    */

    // if dead, then stop everything
    if (this.player.isDead) return;


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


    

    /* 
        ---DROP LOGIC---
    */
   // drop types and chances
    const drops = [
        { type: null, chance: 0.5 },
        { type: 'speed', chance: 0.18 },
        { type: 'range', chance: 0.18 },
        { type: 'bombUp', chance: 0.14 },
    ];
    // powerup functions
    const effects = {
        bombUp: () => bombCount++,
        speed: () => speed+=10,
        range: () => explosionRadius++
    };
   // function to determine if a crate drops anything and what
    function randomDrop(){
        const roll = Math.random();
        let cumulative = 0;

        // loop through drops array and determine drop type
        for(const drop of drops){
            cumulative += drop.chance;
            if (roll < cumulative) return drop.type;
        }
    }




    /* 
        ---EXPLOSION LOGIC---
    */
    // function to find all tiles of explosions
    function detonateBomb(scene, map, currBombTile, blockedWallTiles, explosionRadius){
        // create a set to track tiles that are exploded
        const explosionTiles = new Set();
        // create a map to track middle explosion directions
        const explosionMidDir = new Map();
        // create a map to track tiles where explosion ends
        const explosionEndpoints = new Map();
        // track center tile of explosion
        let centerKey = toKey(currBombTile.x, currBombTile.y);

        // 4 directions
        const directions = [
            { x: 0, y: -1, name: 'up', mid: 'vertical' },
            { x: 0, y: 1,  name: 'down', mid: 'vertical' },
            { x: -1, y: 0, name: 'left', mid: 'horizontal' },
            { x: 1, y: 0,  name: 'right', mid: 'horizontal' }
        ];

        // for each direction, expand by radius length. Detect any collisions. Track in sets.
        directions.forEach(dir =>{
            let endpoint = null;

            for(let i = 1; i <= explosionRadius; i++){
                const tX = currBombTile.x + dir.x * i;
                const tY = currBombTile.y + dir.y * i;
                const key = toKey(tX,tY);

                // if blocked by barrier
                if(blockedWallTiles.has(key)) break;

                // if blocked by crate
                if(crateTiles.has(key)){
                    explosionTiles.add(key);
                    explosionMidDir.set(key, dir.mid); 

                    // find the exploding crate at this tile
                    const [tileX, tileY] = key.split(',').map(Number);
                    const worldX = map.tileToWorldX(tileX) + map.tileWidth / 2;
                    const worldY = map.tileToWorldY(tileY) + map.tileHeight / 2;

                    // return array of all sprite onjects in crates group
                    const crate = scene.crates.getChildren().find(c => 
                        // checks if crate position is close enough to target position
                        Phaser.Math.Fuzzy.Equal(c.x, worldX, 1) &&
                        Phaser.Math.Fuzzy.Equal(c.y, worldY, 1)
                    );

                    // destroy crate after exploding
                    if(crate){
                        crate.play('crate-explode');
                        crate.on('animationcomplete', () => {
                            crate.destroy();
                        });

                        // determine item drops and spawn it after crate destroyed
                        let drop = randomDrop();

                        // collision for player and power
                        if(drop !== null) {
                            // add power object to scene
                            let droppedPower = scene.physics.add.sprite(worldX, worldY, drop);
                            // make power not move
                            droppedPower.body.immovable = true;
                            droppedPower.body.moves = false;
                            //set overlap with player, handle powerup, destroy power on contact
                            scene.physics.add.overlap(scene.player,droppedPower, ()=>{
                                effects[drop]?.(); // call powerup gain

                                // for test
                                if (drop === 'bombUp') {
                                    console.log(`Bomb Count: ${bombCount}`);
                                }
                                if (drop === 'speed') {
                                    console.log(`Speed: ${speed}`);
                                }
                                if (drop === 'range') {
                                    console.log(`Range: ${explosionRadius}`);
                                }

                                droppedPower.destroy();
                            });
                        };

                    }

                    // delete crate key from set
                    crateTiles.delete(key);
                    break;
                };

                explosionTiles.add(key);
                explosionMidDir.set(key, dir.mid);
                endpoint = key;
            };

            if (endpoint) {
                explosionEndpoints.set(
                    endpoint, directions.find(d => toKey(currBombTile.x + d.x * explosionRadius, currBombTile.y + d.y * explosionRadius) === endpoint)?.name || dir.name
                );
            };
        });

        // include center tile
        explosionTiles.add(centerKey);

        // spawn explosion sprites
        explosionTiles.forEach(key => {

            // take keys from each exzplosion tile and turn to numbers
            const [x,y] = key.split(',').map(Number);

            // convert tile position into pixels
            const worldX = map.tileToWorldX(x) + map.tileWidth / 2;
            const worldY = map.tileToWorldY(y) + map.tileHeight / 2;

            // default animation placeholder
            let explosionAnimation = 'explosion-mid-horizontal';

            // directionally and positionally determine explosion sprites
            if(key === centerKey){ //center
                explosionAnimation = 'explosion-origin'
            } else if(explosionEndpoints.has(key)){ // ends
                const dir = explosionEndpoints.get(key);
                explosionAnimation = `explosion-end-${dir}`;
            } else{ // mids
                const dir = explosionMidDir.get(key);
                explosionAnimation = `explosion-mid-${dir}`;
            }

            // spawn explosion sprites, play animation, destroy when done
            const explosion = scene.physics.add.sprite(worldX,worldY,'explosion');

            // Add explosion sprite to physics group
            if (!scene.explosions) {
                scene.explosions = scene.physics.add.group();
            }
            scene.explosions.add(explosion);

            /* PLAYER DEATH */
            // Set up collision detection between player and explosion
            scene.physics.add.overlap(scene.player, explosion, () => {
                if (!scene.player.isDead) {
                    
                    // set player is dead
                    scene.player.isDead = true;
                    // stop player movement
                    scene.player.setVelocity(0);

                    // player flashes white when hit
                    const flash = scene.add.sprite(scene.player.x, scene.player.y, 'character') //create new sprite over player
                        .setScale(scene.player.scaleX) // same size as player
                        .setFrame(scene.player.anims.currentFrame.index) //matches current player frame
                        .setTint(0xFFFFFF) // pure white tine
                        .setAlpha(1) // full brightness
                        .setBlendMode(Phaser.BlendModes.ADD) // brightens whats underneath
                        .setDepth(scene.player.depth + 1); // flash is above player
                    scene.time.delayedCall(300, () => flash.destroy()); // destroy flash after set time

                    // find last faced direcction and play death animation
                    const direction = scene.lastFacedDirection.replace('idle-', '');
                    scene.player.anims.play(`damage-${direction}`, true);
                    scene.time.delayedCall(500, () => {
                        scene.player.anims.play(`death-${direction}`, true);
                    });

                    // disable player collisions
                    scene.player.body.enable = false;

                    //after some time, destory player body
                    scene.time.delayedCall(1200, () => {
                        scene.player.destroy();
                        scene.lights.removeLight(scene.playerLight); //remove platyer light
                    })
                };
            }, null, scene);
  

            // color edit
            //explosion.setTint(0xFFFFE0); // more white
            explosion.setTint(0xFFEFC2); // more yellow
            explosion.setBlendMode(Phaser.BlendModes.ADD);

            // play animation
            explosion.play(explosionAnimation);
            
            explosion.on('animationcomplete', () => {
                explosion.destroy();
            });

        });
        
    };





    /* 
        Bomb logic
    */

    /* FOR FUTURE SAFEGUARD */
    // set variable to track the next time player can plant bomb
    if(!this.nextBombTime) this.nextBombTime = 0;
    // track current time
    const now = this.time.now;
    // cool down time for planting bomb
    const holdInterval = 0;

    /* Bomb spawning when space is pressed/held and next bomb time is 0 */
    if (this.spaceKey.isDown && now > this.nextBombTime) {

        // update next bomb time to holdinterval
        this.nextBombTime = now + holdInterval;

        // get center of player
        const playerCenter = this.player.getCenter();
        // convert player center to nearest tile coords
        const tile = this.map.worldToTileXY(playerCenter.x, playerCenter.y);
        // convert tile coords to string keys
        const tileKey = `${tile.x},${tile.y}`;

        // check if tile is occupied by bomb or if player has enough bombs left
        if(this.occupiedBombTile.has(tileKey) || this.bombsPlaced >= bombCount) return;


        // convert tile coords to map coords
        const worldPos = this.map.tileToWorldXY(tile.x, tile.y);
        // get bombPos with center
        const bombPosX = worldPos.x + this.map.tileWidth / 2;
        const bombPosY = worldPos.y + this.map.tileHeight / 2;

        // place bomb
        const bomb = this.physics.add.sprite(bombPosX,bombPosY,'bomb');
        // bombs are not movable
        bomb.body.immovable = true;
        bomb.body.moves = false;

        /* Play bomb idle animation */
        bomb.play('bomb-idle');

        /* track bombs, add to physics group */
        this.bombs.add(bomb);


        /* 
            Player bomb pass logic 
        */
        // Create collider between bomb and player.
        // Player initially has no collision with bomb placed
        const bombCollider = this.physics.add.collider(this.player, bomb);
        bombCollider.active = false;

        const bombTileKey = tileKey; // store coordinate where bomb was placed

        const bombMonitor = this.time.addEvent({
            delay:50, // start a loop that runs every 50ms
            loop: true,
            callback:() => {
                const playerTile = this.map.worldToTileXY(this.player.x,this.player.y);
                const playerTileKey = toKey(playerTile.x,playerTile.y);
                if(playerTileKey !== bombTileKey){ // if player has left bomb tile
                    bombCollider.active = true;    // enable collision
                }
            }
        });



        /* color/glow effects */
        const glow = this.add.sprite(bomb.x, bomb.y, 'bombGlow');
        glow.setScale(1.8);
        glow.setAlpha(0.5);
        glow.setDepth(bomb.depth - 1);
        bomb.setTint(0xffcc99);


        // Track tile as occupied
        this.occupiedBombTile.add(tileKey);

        // Add to amount of bombs placed
        this.bombsPlaced++;


        // Destroy bomb after set time
        this.time.delayedCall(3500, () => {
            this.occupiedBombTile.delete(tileKey);
            this.lights.removeLight(bomb.light);
            this.bombsPlaced-- //reset bombs placed
            bombMonitor.remove(); //remove the player collision check
            bomb.destroy();
            detonateBomb(this, this.map, tile, this.blockedWallTiles, explosionRadius);
        });
    }




};

new Phaser.Game(config);