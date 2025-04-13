import Phaser from 'phaser';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor:'#1d1d1d',
    scene: {
        preload,
        create,
        update
    }
};

function preload(){

};

function create(){

};

function update(){

};

new Phaser.Game(config);