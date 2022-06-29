fs = require('fs');
im = require('imagemagick');
const { execSync } = require('child_process');
const {escapeSpecialCharacters, preprocessCost, preprocessType} = require('./preprocessing.js');
const {generateCardNameLabel, generateCardTextBox, generateCardTypeLabel, generateManaSymbols, generateCardSmallBoxLabel} = require('./generation.js');
const {flipCoords, cardsetNumberCoords, cardsetNameCoords, artistNameCoords} = require('./positions');

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

function isWhite2 (cost) {
    const {white, hybrid} = cost;
    return white > 0  || hybrid.findIndex(h => h.white > 0) !== -1;
}
function isBlue2 (cost) {
    const {blue, hybrid} = cost;
    return blue > 0 || hybrid.findIndex(h => h.blue > 0) !== -1;
}
function isBlack2 (cost) {
    const {black, hybrid} = cost;
    return black > 0 || hybrid.findIndex(h => h.black > 0) !== -1;
}
function isRed2 (cost) {
    const {red, hybrid} = cost;
    return red > 0 || hybrid.findIndex(h => h.red > 0) !== -1;
}
function isGreen2 (cost) {
    const {green, hybrid} = cost;
    return green > 0 || hybrid.findIndex(h => h.green > 0) !== -1;
}
function isPink2 (cost) {
    const {pink, hybrid} = cost;
    return pink > 0 || hybrid.findIndex(h => h.pink > 0) !== -1;
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
    const {type} = card;
    const {supertype} = type;

    let cost = card.cost;
    if (card.metatype === 'kami' && card.side === 2) {
        cost = card.cost2;
    }

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
    else if (supertype.includes('Land')) {
        const {addW, addB, addU, addR, addG, addP, addC} = landColors(card);
        if (addC) {
            return framePath('NormalC')
        }
        if (addR && !(addW || addB || addU || addG || addP)) {
            return framePath('NormalR')
        }
        if (addB && !(addW || addU || addG || addP || addR)) {
            return framePath('NormalB')
        }
        if (addG && !(addW || addU || addP || addR || addB)) {
            return framePath('NormalG')
        }
        if (addP && !(addW || addU || addR || addB || addG)) {
            return framePath('NormalP')
        }
        if (addU && !(addW || addR || addB || addG || addP)) {
            return framePath('NormalU')
        }
        if (addW && !(addR || addB || addG || addP || addU)) {
            return framePath('NormalW')
        }
        return framePath('NormalM');
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
    let {type} = card;
    let cost = card.cost;
    if (card.metatype === 'kami' && card.side === 2) {
        cost = card.cost2;
    }

    if (type.supertype.includes('Land')) {
        // if it's a land we do not need a background, we pick a random background as the land artwork
        return ''
    }

    if (isMulticolor(cost)) {
        let seed = [];
        if (isRed2(cost)) {
            seed.push('R1', 'R2');
        }
        if (isBlack2(cost)) {
            seed.push('B1', 'B2');
        }
        if (isGreen2(cost)) {
            seed.push('G1', 'G2');
        }
        if (isBlue2(cost)) {
            seed.push('U1', 'U2');
        }
        if (isWhite2(cost)) {
            seed.push('W1', 'W2');
        }
        if (isPink2(cost)) {
            seed.push('P1');
        }

        return bgPath(seed[randomIntBetween(0, seed.length-1)]);
    }

    const variant = randomIntBetween(1, 2);
    if (isRed(cost)) {
        return bgPath(`R${variant}`)
    }
    if (isBlack(cost)) {
        return bgPath(`B${variant}`)
    }
    if (isGreen(cost)) {
        return bgPath(`G${variant}`)
    }
    if (isBlue(cost)) {
        return bgPath(`U${variant}`)
    }
    if (isWhite(cost)) {
        return bgPath(`W${variant}`)
    }
    if (isColorless(cost)) {
        return bgPath(`C${variant}`)
    }
    if (isPink(cost)) {
        return bgPath(`P1`)
    }

    throw new Error('unknown color combination?!');
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
    const effect = randomIntBetween(1,8);
    const bg = randomIntBetween(1,7);

    return `-page +0+0 ${spellBgPath(bg)} -page +0+0 ${spellEffectPath(effect)}`
}

function landColors (card) {
    const coloredPattern = new RegExp('add\\s(\\d*[WBURGP]+)[\\s]');
    const colorlessPattern = new RegExp('add\\s\\d\\s');
    colorlessPattern.global = true;
    coloredPattern.global = true;

    const wPattern = new RegExp('W+');
    const bPattern = new RegExp('B+');
    const uPattern = new RegExp('U+');
    const rPattern = new RegExp('R+');
    const gPattern = new RegExp('G+');
    const pPattern = new RegExp('P+');

    let addW = false;
    let addB = false;
    let addU = false;
    let addR = false;
    let addG = false;
    let addP = false;
    let addC = false;

    const coloredResults = coloredPattern.exec(card.rules);
    const colorless = colorlessPattern.exec(card.rules);

    if ((coloredResults == null || coloredResults.length <= 0) && (colorless !== null) ) {
        addC = true;
    }

    if (!addC) {
        coloredResults?.forEach(res => {
            wPattern.test(res) && (addW = true);
            bPattern.test(res) && (addB = true);
            uPattern.test(res) && (addU = true);
            rPattern.test(res) && (addR = true);
            gPattern.test(res) && (addG = true);
            pPattern.test(res) && (addP = true);
        })
    }

    return {addW, addB, addU, addR, addG, addP, addC};
}

const blackBgs = ['B1', 'B2'];
const colorlessBgs = ['C1', 'C2'];
const greenBgs = ['G1', 'G2'];
// const pinkBgs = ['P1']; // not used, because it's only one bg and it's currently hardcoded
const redBgs = ['R1', 'R2'];
const blueBgs = ['U1', 'U2'];
const whiteBgs = ['W1', 'W2'];
const backgrounds = [...blackBgs, ...colorlessBgs, ...greenBgs, ...redBgs, ...blueBgs, ...whiteBgs];
function generateLand(card) {
    const {addW, addB, addU, addR, addG, addP, addC} = landColors(card);

    if (addC) {
        return `-page +0+0 ${bgPath(colorlessBgs[randomIntBetween(0, colorlessBgs.length-1)])}`;
    }

    if (addP) {
        return `-page +0+0 ${bgPath('P1')}`;
    }

    const selectPool = [];

    if (addW) {
        // white
        selectPool.push(...whiteBgs);
    }

    if (addB) {
        // black
        selectPool.push(...blackBgs);
    }

    if (addU) {
        // blue
        selectPool.push(...blueBgs);
    }

    if (addR) {
        // red
        selectPool.push(...redBgs);
    }

    if (addG) {
        // green
        selectPool.push(...greenBgs);
    }

    if (selectPool.length > 0) {
        return `-page +0+0 ${bgPath(selectPool[randomIntBetween(0, selectPool.length-1)])}`;
    }

    const background = backgrounds[randomIntBetween(0, backgrounds.length-1)];
    return `-page +0+0 ${bgPath(background)}`;
}

function generateArtistIcon () {
    return '-page +0+0 assets/frames/artistssymbol.png'
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
        return generateLand(card);
    }
    else if (supertype.includes('Planeswalker')) {
        return generatePlaneswalker();
    }
}

function flipIndicatorPath (indi) {
    return `assets/frames/flip${indi}.png`;
}

function pickFlipIndicator (card) {
    let cost = card.cost;
    if (card.metatype === 'kami' && card.side === 2) {
        cost = card.cost2;
    }

    if (isMulticolor(cost)) {
        return flipIndicatorPath('M');
    }
    if (isPink(cost)) {
        return flipIndicatorPath('P');
    }
    if (isWhite(cost)) {
        return flipIndicatorPath('W');
    }
    if (isBlack(cost)) {
        return flipIndicatorPath('B');
    }
    if (isBlue(cost)) {
        return flipIndicatorPath('U');
    }
    if (isRed(cost)) {
        return flipIndicatorPath('R');
    }
    if (isGreen(cost)) {
        return flipIndicatorPath('G');
    }
    if (isColorless(cost)) {
        return flipIndicatorPath('C');
    }

    throw new Error('cant define color for flip card...');
}

function generateDoubleCardIndicator (card) {
    if (card.metatype === undefined || card.metatype === null) {
        return '';
    }

    return `\\( -page +0+0 ${pickFlipIndicator(card)} \\)`;
}

function generateDoubleCardIndicatorLabel (card) {
    if (card.metatype === undefined || card.metatype === null | typeof card?.name2 !== "string") {
        return '';
    }

    return `\\( -page +${flipCoords.pos.x}+${flipCoords.pos.y} -background transparent -size ${flipCoords.size.x}x${flipCoords.size.y} -gravity west label:'${card.name2}' \\)`


}

function generateArtistLabel () {
    return `\\( -page +${artistNameCoords.pos.x}+${artistNameCoords.pos.y} -background transparent -size ${artistNameCoords.size.x}x${artistNameCoords.size.y} -fill white -gravity west label:'Roi & Nils' \\)`
}


function generateCardSetLabel () {
    return `\\( -page +${cardsetNameCoords.pos.x}+${cardsetNameCoords.pos.y} -background transparent -size ${cardsetNameCoords.size.x}x${cardsetNameCoords.size.y} -fill white -gravity west label:'FOA · EN' \\)`
}

function generateCardNuberLabel (card) {
    return `\\( -page +${cardsetNumberCoords.pos.x}+${cardsetNumberCoords.pos.y} -background transparent -size ${cardsetNumberCoords.size.x}x${cardsetNumberCoords.size.y} -fill white -gravity west label:'${String(card.number).padStart(4, '0')}/${card.setnumber}' \\)`
}

function generateCard (card) {
    let transparentBG = 'assets/default.png';

    // let {cost, name, rules, flaor, type} = card;
    let outputfile = `output/${Date.now()}_${card.name.replaceAll(' ', '_')}.png`;

    const command = `magick -page +0+0 `
        + `${transparentBG} `
        + `${pickBackground(card)} `
        + `${generateObject(card)} `
        + `-page +0+0 ${pickFrame(card)} `
        + `${generateDoubleCardIndicator(card)} `
        + `${generateArtistIcon()} `
        + `${generateCardTypeLabel(card)} `
        + `${generateCardSmallBoxLabel(card)} `
        + `${generateCardTextBox(card)} `
        + `${generateManaSymbols(card)} `
        + `${generateCardNameLabel(card)} `
        + `${generateCardNameLabel(card)} `
        + `${generateDoubleCardIndicatorLabel(card)} `
        + `${generateCardNuberLabel(card)} `
        + `${generateCardSetLabel()} `
        + `${generateArtistLabel()} `
        + `-flatten ${outputfile}`;
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
}

function processCard (card, cardNumber, cardAmount) {
    let start = new Date();
    generateCard({
        ...card,
        ...{number: cardNumber, setnumber: cardAmount},
        ...{metatype: card.metatype},
        ...{name: escapeSpecialCharacters(card.name)},
        ...{flavor: escapeSpecialCharacters(card.flavor)},
        ...{rules: escapeSpecialCharacters(card.rules?.trim() ?? '')},
        ...{cost: preprocessCost(card.cost)},
        ...{side: 1},
        ...preprocessType(card.type)
    });
    console.log(`${String(cardNumber).padStart(4, '0')}/${cardAmount} Finished ${card.name} in ${(new Date() - start) / 1000}s.`)

    if (card.metatype !== null) {
        console.log('\n');
        let doublesideStart = new Date();

        // we got a doublesided card
        generateCard({
            ...{number: cardNumber, setnumber: cardAmount},
            ...{metatype: card.metatype},
            ...{name: escapeSpecialCharacters(card.name2)},
            ...{flavor: escapeSpecialCharacters(card.flavor2)},
            ...{rules: escapeSpecialCharacters(card.rules2?.trim() ?? '')},
            ...{cost: preprocessCost(card.cost2)},
            ...{cost2: preprocessCost(card.cost)},
            ...{name2: card.name},
            ...{side: 2},
            ...preprocessType(card.type2)
        });
        console.log(`${String(cardNumber).padStart(4, '0')}/${cardAmount} Finished ${card.name2} in ${(new Date() - doublesideStart) / 1000}s.`)
        console.log(`Complete duration: ${(new Date() - start) / 1000}s`)
    }
}

fs.readFile("test_cards.json", {encoding: "utf8"}, (err, data) => {
    if (err) {
        return console.log(err);
    }

    let cards = JSON.parse(data);

    cards.forEach((card, i) => {
        try {
            processCard(card, i+1, cards.length)
        } catch (err) {
            console.log('ERROR! while processing card: ', err, card);
        }
        console.log('\n\n-------------\n\n');
    })
});

console.log('finished reading data')
