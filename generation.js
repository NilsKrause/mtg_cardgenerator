const {nameCoords, rulesCoords, typeCoords, costCoords, smallboxCoords} = require("./positions");

let manacostLength = 0;
function generateCardNameLabel (card) {
    let {name} = card;

    return `\\( -page +${nameCoords.pos.x}+${nameCoords.pos.y} -background transparent -size ${nameCoords.size.x - manacostLength}x${nameCoords.size.y} -gravity west label:'${name}' \\)`;
}

function generateSeperator (posY) {
    return `\\( assets/seperator.png -page +${rulesCoords.pos.x}+${posY} -background transparent -size ${rulesCoords.size.x}x${rulesCoords.size.y} -gravity center \\)`
}

function generateCardTextBox (card) {
    if (card.flavor) {
        let lbWeight = 100;
        // the padding between flavor and rules text
        let padding = 10;

        // count the line breaks and give them a larger weight than a single character as they use up more vertical space
        let rulesLBCount = card.rules.split(/\r\n|\r|\n/).length;
        let flavorLBCount = card.flavor.split(/\r\n|\r|\n/).length;

        let rulesCount = card.rules.length + rulesLBCount * lbWeight;
        let flavorCount = card.flavor.length + flavorLBCount * lbWeight;

        let percent = (flavorCount + rulesCount) / 100;

        let flavorShare = flavorCount / percent;
        let rulesShare = rulesCount / percent;

        if (flavorShare > 25) {
            flavorShare = 25;
            rulesShare = 75;
        }

        let rulesSizeY = rulesShare * rulesCoords.size.percent;

        let flavorPosY = rulesCoords.pos.y + rulesSizeY + padding;
        let flavorSizeY = flavorShare * rulesCoords.size.percent - padding;

        return generateCardRulesLabel(card, rulesSizeY) + " " + generateSeperator(flavorPosY-padding) + " " + generateCardFlavorLabel(card,  flavorPosY, flavorSizeY);
    }

    return generateCardRulesLabel(card, rulesCoords.size.y)
}

function escapeSpecialCharacters (data) {
    return data
        // .replaceAll('\\', '\\u005C')
        // .replaceAll('(', '\\u0028')
        // .replaceAll(')', '\\u0029')
        // .replaceAll('/', '\\u002F')
        .replaceAll('\'', "ʼ")
}

function generateCardFlavorLabel (card, posY, sizeY) {
    let {flavor} = card;

    return `\\( -page +${rulesCoords.pos.x}+${posY} -background transparent -size ${rulesCoords.size.x}x${sizeY} -font 'Roboto-Italic' -gravity center caption:'${flavor}' \\)`;
}

function generateCardRulesLabel (card, sizeY) {
    let {rules} = card;

    return `\\( -page +${rulesCoords.pos.x}+${rulesCoords.pos.y} -background transparent -size ${rulesCoords.size.x}x${sizeY} -font 'Roboto' -gravity northwest caption:'${rules}' \\)`;
}

function generateCardTypeLabel (card) {
    let {type} = card;

    return `\\( -page +${typeCoords.pos.x}+${typeCoords.pos.y} -background transparent -size ${typeCoords.size.x}x${typeCoords.size.y} -gravity west label:'${type.supertype} - ${type.subtypes}' \\)`;
}

function generateManaSymbols (card) {
    let {colorless, black, green, red, blue, white, hybrid} = card.cost;
    let posX = costCoords.pos.x - costCoords.size.x;
    let posY = costCoords.pos.y + 10;

    const foo = (symbol) => `\\( ${symbol} -page +${posX}+${posY} -background transparent -size ${costCoords.size.x}x${costCoords.size.y} -gravity center \\)`

    let command = ""
    //0wubrg
    if (green > 0) {
        for (let i = green; i > 0; i--) {
            command += " " + foo('assets/g.png');
            posX -= costCoords.size.x
        }
    }

    if (red > 0) {
        for (let i = red; i > 0; i--) {
            command += " " + foo('assets/r.png');
            posX -= costCoords.size.x
        }
    }

    if (black > 0) {
        for (let i = black; i > 0; i--) {
            command += " " + foo('assets/b.png');
            posX -= costCoords.size.x
        }
    }

    if (blue > 0) {
        for (let i = blue; i > 0; i--) {
            command += " " + foo('assets/u.png');
            posX -= costCoords.size.x
        }
    }

    if (white > 0) {
        for (let i = white; i > 0; i--) {
            command += " " + foo('assets/w.png');
            posX -= costCoords.size.x
        }
    }

    if (colorless > 0) {
        command += " " + foo('assets/c.png')
        command += ` \\( -page +${posX}+${posY} -background transparent -size ${40}x${40} -gravity center label:${colorless} \\)`
    }

    manacostLength = costCoords.pos.x - posX;

    return command
}

function generateCardSmallBoxLabel (card) {
    let {smallbox} = card;
    let label = ""

    if (smallbox.loalty) {
        label = smallbox.loalty
    } else if (smallbox.power && smallbox.toughness) {
        label = `${smallbox.power} / ${smallbox.toughness}`
    }

    return `\\( -page +${smallboxCoords.pos.x}+${smallboxCoords.pos.y} -background transparent -size ${smallboxCoords.size.x}x${smallboxCoords.size.y} -gravity center label:'${label}' \\)`;
}
