fs = require('fs');
im = require('imagemagick');
const { exec } = require('child_process');
const {preprocessCard} = require('preprocessing');
const {generateCardNameLabel, generateCardTextBox, generateCardTypeLabel, generateManaSymbols, generateCardSmallBoxLabel} = require('generation');

function isMulticolor (cost) {
    if (cost.hybrid.length > 0) {

        return true;
    }

    let count = 0;
    Array.from(cost).forEach(([k,v]) => {
        if (k === 'colorless') {
            return;
        }

        if (v > 0) {
            count++;
        }
    })

    return count > 1;
}

function isWhite (cost) {
    const {colorless, black, green, red, blue, white, pink} = cost;
    return colorless <= 0 && black <= 0 && green <= 0 && red <= 0 && blue <= 0 && white > 0 && pink <= 0;
}
function isBlue (cost) {
    const {colorless, black, green, red, blue, white, pink} = cost;
    return colorless <= 0 && black <= 0 && green <= 0 && red <= 0 && blue > 0 && white <= 0 && pink <= 0;
}
function isBlack (cost) {
    const {colorless, black, green, red, blue, white, pink} = cost;
    return colorless <= 0 && black > 0 && green <= 0 && red <= 0 && blue <= 0 && white <= 0 && pink <= 0;
}
function isRed (cost) {
    const {colorless, black, green, red, blue, white, pink} = cost;
    return colorless <= 0 && black <= 0 && green <= 0 && red > 0 && blue <= 0 && white <= 0 && pink <= 0;
}
function isGreen (cost) {
    const {colorless, black, green, red, blue, white, pink} = cost;
    return colorless <= 0 && black <= 0 && green > 0 && red <= 0 && blue <= 0 && white <= 0  && pink <= 0;
}
function isColorless (cost) {
    const {colorless, black, green, red, blue, white, pink} = cost;
    return colorless >= 0 && black <= 0 && green <= 0 && red <= 0 && blue <= 0 && white <= 0 && pink <= 0;
}

function isPink (cost) {
    const {colorless, black, green, red, blue, white, pink} = cost;
    return colorless <= 0 && black <= 0 && green <= 0 && red <= 0 && blue <= 0 && white <= 0 && pink > 0;
}

function framePath (frame) {
    const prefix = 'assets/frames/';
    const suffix = '.png';
    return `${prefix}${frame}${suffix}`;
}

function pickFrame (card) {
    const {color, supertype, metatype} = card;

    if (supertype.includes('Planeswalker')) {
        // if it's a planeswalker
        if (isMulticolor(color)) {
            return framePath('PwkM');
        }
        if (isRed(color)) {
            return framePath('PwkR')
        }
        if (isBlack(color)) {
            return framePath('PwkB')
        }
        if (isGreen(color)) {
            return framePath('PwkG')
        }
        if (isPink(color)) {
            return framePath('PwkP')
        }
        if (isBlue(color)) {
            return framePath('PwkU')
        }
        if (isWhite(color)) {
            return framePath('PwkW')
        }
        if (isColorless(color)) {
            return framePath('PwkC')
        }
    }
    else if (supertype.includes('Creature')) {
        // if it's a planeswalker
        if (isMulticolor(color)) {
            return framePath('CreatureM');
        }
        if (isRed(color)) {
            return framePath('CreatureR')
        }
        if (isBlack(color)) {
            return framePath('CreatureB')
        }
        if (isGreen(color)) {
            return framePath('CreatureG')
        }
        if (isPink(color)) {
            return framePath('CreatureP')
        }
        if (isBlue(color)) {
            return framePath('CreatureU')
        }
        if (isWhite(color)) {
            return framePath('CreatureW')
        }
        if (isColorless(color)) {
            return framePath('CreatureC')
        }
    }
    else if (metatype.includes("kami") || metatype.includes("double")) {
        // if it's a planeswalker
        if (isMulticolor(color)) {
            return framePath('flipM');
        }
        if (isRed(color)) {
            return framePath('flipR')
        }
        if (isBlack(color)) {
            return framePath('flipB')
        }
        if (isGreen(color)) {
            return framePath('flipG')
        }
        if (isPink(color)) {
            return framePath('flipP')
        }
        if (isBlue(color)) {
            return framePath('flipU')
        }
        if (isWhite(color)) {
            return framePath('flipW')
        }
        if (isColorless(color)) {
            return framePath('flipC')
        }
    }
    else {
        // if it's a planeswalker
        if (isMulticolor(color)) {
            return framePath('NormalM');
        }
        if (isRed(color)) {
            return framePath('NormalR')
        }
        if (isBlack(color)) {
            return framePath('NormalB')
        }
        if (isGreen(color)) {
            return framePath('NormalG')
        }
        if (isPink(color)) {
            return framePath('NormalP')
        }
        if (isBlue(color)) {
            return framePath('NormalU')
        }
        if (isWhite(color)) {
            return framePath('fNormalW')
        }
        if (isColorless(color)) {
            return framePath('NormalC')
        }
    }
}

function generateCard (card) {
    // let {cost, name, rules, flaor, type} = card;
    let frame = pickFrame(card);
    let outputfile = `output/${Date.now()}_name.png`;

    exec(`magick -page +0+0 ${frame} ${generateCardTypeLabel(card)} ${generateCardSmallBoxLabel(card)} ${generateCardTextBox(card)} ${generateManaSymbols(card)} ${generateCardNameLabel(card)} -flatten ${outputfile}`,
        {},
        (output) => {
            if (output !== null) {
                console.log(output)
            }
        });

}

fs.readFile("test_cards.json", "utf8", (err, data) => {
    if (err) {
        return console.log(err);
    }

    let cards = JSON.parse(data);

    cards.map(preprocessCard).forEach(generateCard)
});

console.log('finished reading data')
