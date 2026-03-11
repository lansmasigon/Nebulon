// Online asset manifest (CDN-hosted)
// Assets are optional at runtime; game falls back to procedural visuals/audio if unavailable.
const ONLINE_ASSETS = {
    images: [
        { key: 'bg_space', url: 'https://labs.phaser.io/assets/skies/deep-space.jpg' },
        { key: 'ship_player', url: 'https://labs.phaser.io/assets/sprites/bsquadron3.png' },
        { key: 'ship_player_alt', url: 'https://labs.phaser.io/assets/sprites/shmup-ship2.png' },
        { key: 'character_player', url: 'https://labs.phaser.io/assets/sprites/phaser-dude.png' },
        { key: 'enemy_pirate', url: 'https://labs.phaser.io/assets/sprites/bsquadron1.png' },
        { key: 'enemy_alien', url: 'https://labs.phaser.io/assets/sprites/ufo.png' },
        { key: 'enemy_drone', url: 'https://labs.phaser.io/assets/sprites/bsquadron4.png' },
        { key: 'enemy_boss', url: 'https://labs.phaser.io/assets/sprites/ufo2.png' },
        { key: 'asteroid_sprite', url: 'https://labs.phaser.io/assets/games/asteroids/asteroid1.png' },
        { key: 'terrain_rock', url: 'https://labs.phaser.io/assets/games/asteroids/asteroid1.png' },
        { key: 'terrain_crystal', url: 'https://labs.phaser.io/assets/particles/blue.png' },
        { key: 'terrain_pillar', url: 'https://labs.phaser.io/assets/sprites/block.png' },
        { key: 'terrain_ruins', url: 'https://labs.phaser.io/assets/sprites/crate.png' },
        { key: 'terrain_plant', url: 'https://labs.phaser.io/assets/particles/green.png' },
        { key: 'terrain_deco', url: 'https://labs.phaser.io/assets/particles/yellow.png' },
        { key: 'shop_sprite', url: 'https://labs.phaser.io/assets/sprites/space-baddie.png' },
        { key: 'loot_sprite', url: 'https://labs.phaser.io/assets/sprites/orb-blue.png' },
        { key: 'object_sprite', url: 'https://labs.phaser.io/assets/sprites/crate.png' },
        { key: 'planet_sprite', url: 'https://labs.phaser.io/assets/sprites/planet.png' },
        { key: 'laser_blue', url: 'https://labs.phaser.io/assets/particles/blue.png' }
    ],
    audio: [
        { key: 'sfx_laser', urls: ['https://labs.phaser.io/assets/audio/SoundEffects/laser5.ogg'] },
        { key: 'sfx_explosion', urls: ['https://labs.phaser.io/assets/audio/SoundEffects/explosion.mp3'] },
        { key: 'sfx_hit', urls: ['https://labs.phaser.io/assets/audio/SoundEffects/key.wav'] }
    ]
};
