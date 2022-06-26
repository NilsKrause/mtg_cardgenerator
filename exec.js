fs = require('fs');
im = require('imagemagick');
const { execSync } = require('child_process');
const {escapeSpecialCharacters, preprocessCost, preprocessType} = require('./preprocessing.js');
const {generateCardNameLabel, generateCardTextBox, generateCardTypeLabel, generateManaSymbols, generateCardSmallBoxLabel} = require('./generation.js');

function isMulticolor (cost) {
    if (cost?.hybrid.length > 0) {
        return true;
    }

    let count = 0;
    for (const [k, v] of Object.entries(cost)) {
        if (k === 'colorless') {
            continue;
        }

        if (v > 0) {
            count++;
        }
    }

    return count > 1;
}
function isWhite (cost) {
    const {black, green, red, blue, white, pink} = cost;
    return black <= 0 && green <= 0 && red <= 0 && blue <= 0 && white > 0 && pink <= 0;
}
function isBlue (cost) {
    const {black, green, red, blue, white, pink} = cost;
    return black <= 0 && green <= 0 && red <= 0 && blue > 0 && white <= 0 && pink <= 0;
}
function isBlack (cost) {
    const {black, green, red, blue, white, pink} = cost;
    return black > 0 && green <= 0 && red <= 0 && blue <= 0 && white <= 0 && pink <= 0;
}
function isRed (cost) {
    const {black, green, red, blue, white, pink} = cost;
    return black <= 0 && green <= 0 && red > 0 && blue <= 0 && white <= 0 && pink <= 0;
}
function isGreen (cost) {
    const {black, green, red, blue, white, pink} = cost;
    return black <= 0 && green > 0 && red <= 0 && blue <= 0 && white <= 0  && pink <= 0;
}
function isColorless (cost) {
    const {colorless, black, green, red, blue, white, pink} = cost;
    return colorless >= 0 && black <= 0 && green <= 0 && red <= 0 && blue <= 0 && white <= 0 && pink <= 0;
}
function isPink (cost) {
    const {colorless, black, green, red, blue, white, pink} = cost;
    return black <= 0 && green <= 0 && red <= 0 && blue <= 0 && white <= 0 && pink > 0;
}

function randomIntBetween(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function framePath (frame) {
    const prefix = 'assets/frames/';
    const suffix = '.png';
    return `${prefix}${frame}${suffix}`;
}
function bgPath (bg) {
    const prefix = 'assets/bg/bg';
    const suffix = '.png';
    return `${prefix}${bg}${suffix}`;
}

function creatureFacePath (face) {
    return `assets/face/face${face}.png`
}

function creatureTypePath (type) {
    return `assets/types/${type}.png`;
}

function pickFrame (card) {
    const {cost, type} = card;
    const {supertype} = type;

    if (supertype.includes('Planeswalker')) {
        // if it's a planeswalker
        if (isMulticolor(cost)) {
            return framePath('PwkM');
        }
        if (isRed(cost)) {
            return framePath('PwkR')
        }
        if (isBlack(cost)) {
            return framePath('PwkB')
        }
        if (isGreen(cost)) {
            return framePath('PwkG')
        }
        if (isPink(cost)) {
            return framePath('PwkP')
        }
        if (isBlue(cost)) {
            return framePath('PwkU')
        }
        if (isWhite(cost)) {
            return framePath('PwkW')
        }
        if (isColorless(cost)) {
            return framePath('PwkC')
        }
    }
    else if (supertype.includes('Creature')) {
        // if it's a planeswalker
        if (isMulticolor(cost)) {
            return framePath('CreatureM');
        }
        if (isRed(cost)) {
            return framePath('CreatureR')
        }
        if (isBlack(cost)) {
            return framePath('CreatureB')
        }
        if (isGreen(cost)) {
            return framePath('CreatureG')
        }
        if (isPink(cost)) {
            return framePath('CreatureP')
        }
        if (isBlue(cost)) {
            return framePath('CreatureU')
        }
        if (isWhite(cost)) {
            return framePath('CreatureW')
        }
        if (isColorless(cost)) {
            return framePath('CreatureC')
        }
    }
    else {
        if (isMulticolor(cost)) {
            return framePath('NormalM');
        }
        if (isRed(cost)) {
            return framePath('NormalR')
        }
        if (isBlack(cost)) {
            return framePath('NormalB')
        }
        if (isGreen(cost)) {
            return framePath('NormalG')
        }
        if (isPink(cost)) {
            return framePath('NormalP')
        }
        if (isBlue(cost)) {
            return framePath('NormalU')
        }
        if (isWhite(cost)) {
            return framePath('NormalW')
        }
        if (isColorless(cost)) {
            return framePath('NormalC')
        }
    }

    console.log('card', card);
    throw new Error('wtf..');
}

function pickBackground (card) {
    const {cost, type} = card;
    const variant = randomIntBetween(1, 2);
    let c = -1;

    if (type.supertype.includes('Land')) {
        // if it's a land we do not need a background, we pick a random background as the land artwork
        return ''
    }

    if (isMulticolor(cost)) {
        c = randomIntBetween(1, 7)
    }
    if (isRed(cost) || c === 1) {
        return bgPath(`R${variant}`)
    }
    if (isBlack(cost) || c === 2) {
        return bgPath(`B${variant}`)
    }
    if (isGreen(cost) || c === 3) {
        return bgPath(`G${variant}`)
    }
    if (isPink(cost) || c === 4) {
        return bgPath('P1')
    }
    if (isBlue(cost) || c === 5) {
        return bgPath(`U${variant}`)
    }
    if (isWhite(cost) || c === 6) {
        return bgPath(`W${variant}`)
    }
    if (isColorless(cost) || c === 7) {
        return bgPath(`C${variant}`)
    }
}

function enchBottomPath (n) {
    return `assets/enchantment/enb${n}.png`
}

function enchTopPath (n) {
    return `assets/enchantment/ent${n}.png`
}

function enchObjPath (n) {
    return `assets/enchantment/eno${n}.png`
}

function generateEnchantment () {
    const layer1 = randomIntBetween(1,5);
    const layer2 = randomIntBetween(1,5);
    const layer3 = randomIntBetween(1,5);

    return `-page +0+0 ${enchBottomPath(layer1)} -page +0+0 ${enchTopPath(layer2)} -page +0+0 ${enchObjPath(layer3)}`;
}

function equiBgPath (n) {
    return `assets/equipment/es${n}.png`;
}

function equiTopPath (n) {
    return `assets/equipment/et${n}.png`;
}

function generateEquipment () {
    const layer1 = randomIntBetween(1, 4);
    const layer2 = randomIntBetween(1, 4);

    return `-page +0+0 ${equiBgPath(layer1)} -page +0+0 ${equiTopPath(layer2)}`;
}

function pickFace () {
    const pickedFace = randomIntBetween(1, 20);

    return creatureFacePath(pickedFace)
}

function pickType (card) {
    // pick random creature type
    const {type} = card;
    const {subtypes} = type;
    const stypes = subtypes.split(' ');
    const pickedType = randomIntBetween(0, stypes.length-1);

    return creatureTypePath(stypes[pickedType])
}

const types = ['angel', 'cleric', 'dryad', 'faerie', 'goblin', 'human', 'knight', 'myr', 'scout', 'soldier', 'treefolk', 'warrior', 'beast', 'dragon', 'dwarf', 'gargoyle', 'golem', 'illusion', 'merfolk', 'rat', 'shaman', 'spider', 'vampire', 'wizard', 'bird', 'drake', 'elemental', 'giant', 'gorgon', 'insect', 'minion', 'rogue', 'sliver', 'spirit', 'vedalken', 'zombie', 'cat', 'druid', 'elf', 'gnome', 'horror', 'kithkin', 'moonfolk', 'samurai', 'snake', 'thopter', 'viashino'];
function pickPlaneswalkerBody () {
    const randomType = randomIntBetween(0, types.length-1);
    return `-page +0+0 ${creatureTypePath(types[randomType])}`;
}

function generatePlaneswalker () {
    return `${pickPlaneswalkerBody()} ${pickFace()}`
}

function generateCreatue (card) {
    return `-page +0+0 ${pickType(card)} -page +0+0 ${pickFace()}`
}

function generateArtifact () {
    // only since i have nothing other..
    return generateEquipment();
}

function spellEffectPath (effect) {
    return `assets/sm/sm${effect}.png`;
}

function spellBgPath (bg) {
    return `assets/sm/se${bg}.png`;
}

function generateSpell () {
    const effect = randomIntBetween(1,7);
    const bg = randomIntBetween(1,8);

    return `-page +0+0 ${spellBgPath(bg)} -page +0+0 ${spellEffectPath(effect)}`
}

const backgrounds = ['B1', 'B2', 'C1', 'C2', 'G1', 'G2', 'P1', 'R1', 'R2', 'U1', 'U2', 'W1', 'W2'];
function generateLand() {
    const background = backgrounds[randomIntBetween(0, backgrounds.length-1)];
    return `-page +0+0 ${bgPath(background)}`;
}

function generateObject (card) {
    const {type} = card;
    const {supertype, subtypes} = type;
    if (supertype.includes('Creature')) {
        return generateCreatue(card);
    }
    else if (supertype.includes('Enchantment')) {
        return generateEnchantment(card);
    }
    else if (supertype.includes('Artifact')) {
        if (subtypes.includes('Equipment')) {
            return generateEquipment();
        }
        return generateArtifact();
    }
    else if (supertype.includes('Instant') || supertype.includes('Sorcery')) {
        return generateSpell()
    }
    else if (supertype.includes('Land')) {
        return generateLand();
    }
    else if (supertype.includes('Planeswalker')) {
        return generatePlaneswalker();
    }
}

function generateCard (card) {
    let transparentBG = 'assets/default.png';

    // let {cost, name, rules, flaor, type} = card;
    let frame = pickFrame(card);
    console.log('framepath: ', frame);
    let outputfile = `output/${Date.now()}_${card.name.replaceAll(' ', '_')}.png`;

    const command = `magick -page +0+0 ${transparentBG} ${pickBackground(card)} ${generateObject(card)} -page +0+0 ${frame} ${generateCardTypeLabel(card)} ${generateCardSmallBoxLabel(card)} ${generateCardTextBox(card)} ${generateManaSymbols(card)} ${generateCardNameLabel(card)} -flatten ${outputfile}`;
    console.log('command: ', command)

    try {
        const output = execSync(command);

        if (output.length > 0) {
            console.log('Stdout: ', output.toString());
            console.log('Card: ', JSON.stringify(card));
        }
    } catch (err) {
        console.log('Error: ', err);
        console.log('Card: ', JSON.stringify(card));
    }

    console.log('\n-------------\n');
}

function processCard (card, cardNumber, cardAmount) {
    const start = new Date();

    let {cost, rules} = card;
    const processedCard = {
        ...card,
        ...{rules: escapeSpecialCharacters(rules.trim())},
        ...{cost: preprocessCost(cost)},
        ...preprocessType(card)
    }

    generateCard(processedCard);
    console.log(`${String(cardNumber).padStart(4, '0')}/${cardAmount} Finished ${processedCard.name} in ${(new Date() - start) / 1000}s.`)
}

fs.readFile("cards.json", {encoding: "utf8"}, (err, data) => {
    if (err) {
        return console.log(err);
    }

    let cards = JSON.parse(data);

    cards.forEach((card, i) => processCard(card, i+1, cards.length))
});

console.log('finished reading data')
