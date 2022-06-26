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
    const {cost} = card;
    const variant = randomIntBetween(1, 2);
    let c = -1;

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

function generateCard (card) {
    let transparentBG = 'assets/default.png';

    // let {cost, name, rules, flaor, type} = card;
    let frame = pickFrame(card);
    console.log('framepath: ', frame);
    let outputfile = `output/${Date.now()}_${card.name.replace(' ', '_')}.png`;

    const command = `magick -page +0+0 ${transparentBG} ${pickBackground(card)} -page +0+0 ${frame} ${generateCardTypeLabel(card)} ${generateCardSmallBoxLabel(card)} ${generateCardTextBox(card)} ${generateManaSymbols(card)} ${generateCardNameLabel(card)} -flatten ${outputfile}`;
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


fs.readFile("test_cards.json", {encoding: "utf8"}, (err, data) => {
    if (err) {
        return console.log(err);
    }

    let cards = JSON.parse(data);

    cards.forEach((card, i) => processCard(card, i+1, cards.length))
});

console.log('finished reading data')
