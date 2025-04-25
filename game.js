import Phaser from 'phaser';

const config = {
    type: Phaser.AUTO,
    width: 544,
    height: 416,
    backgroundColor:'#1d1d1d',
    pixelArt: true,
    scene: {
        preload,
        create,
        update
    },
    scale: {
        mode: Phaser.Scale.FIT,
    }
};


/* Load game assets */
function preload(){

    /* Import player character */
    this.load.spritesheet('character', 'assets/Prototype_Character.png', {
        frameWidth: 32,
        frameHeight: 32
    });

};


/* Add game assets and game setup */
function create(){

    /* Define all directions */
    const directions = ['front', 'right', 'left', 'back'];

    /* Define all animation data */
    const playerAnimations = {
        idle: { startFrames: { front: 0, right: 16, left: 32, back: 48 }, frameRate: 3 },
        walk: { startFrames: { front: 1, right: 17, left: 33, back: 49 }, frameRate: 7 },
        damage: { startFrames: { front: 2, right: 18, left: 34, back: 50 }, frameRate: 7 },
        death: { startFrames: { front: 3, right: 19, left: 35, back: 51 }, frameRate: 7 }
    };

    /* 
        -PLAYER ANIMATIONS-
        Loop through all player animation data and create directional animations for each 
    */
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

    /* Add player character */
    this.player = this.add.sprite(272, 208,'character');

    /* Play idle animation */
    this.player.play('walk-front');

};


function update(){

};

new Phaser.Game(config);