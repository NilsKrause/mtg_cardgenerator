const {nameCoords, rulesCoords, typeCoords, costCoords, smallboxCoords} = require("./positions.js");

let manacostLength = 0;
function generateCardNameLabel (card) {
    let {name} = card;

    return `\\( -page +${nameCoords.pos.x}+${nameCoords.pos.y} -background transparent -size ${nameCoords.size.x - manacostLength}x${nameCoords.size.y} -gravity west label:'${name}' \\)`;
}

function generateSeperator (posY) {
    return `\\( assets/frames/seperator.png -page +${rulesCoords.pos.x}+${posY} -background transparent -size ${rulesCoords.size.x}x${rulesCoords.size.y} -gravity center \\)`
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

function pickHybridName (hybrid) {
    if (hybrid.black > 0) {
        if (hybrid.green > 0) {
            // BG
            return 'BG';
        }
        if (hybrid.red > 0) {
            // BR
            return 'BR';
        }
        if (hybrid.blue > 0) {
            // BU
            return 'UB';
        }
        if (hybrid.white > 0) {
            // BW
            return 'WB';
        }
    }
    if (hybrid.green > 0) {
        if (hybrid.red > 0) {
            // GR
            return 'RG';
        }
        if (hybrid.blue > 0) {
            // GU
            return 'GU';
        }
        if (hybrid.white > 0) {
            // BW
            return 'WB';
        }
    }
    if (hybrid.red > 0) {
        if (hybrid.blue > 0) {
            // RU
            return 'UR';
        }
        if (hybrid.white > 0) {
            // RW
            return 'RW';
        }
    }
    if (hybrid.blue > 0) {
        if (hybrid.white > 0) {
            // UW
            return 'WU';
        }
    }
}

function generateHybridNames (hybrids) {
    // {black, green, red, blue, white}
    return hybrids.map(pickHybridName)
}

function generateManaSymbols (card) {
    let {colorless, black, green, red, blue, white, hybrid} = card.cost;
    let posX = costCoords.pos.x - costCoords.size.x;
    let posY = costCoords.pos.y + 10;

    const foo = (symbol) => `\\( -page +${posX}+${posY} ${symbol} -background transparent -size ${costCoords.size.x}x${costCoords.size.y} -gravity center \\)`

    let command = ""
    //0wubrg
    if (green > 0) {
        for (let i = green; i > 0; i--) {
            command += " " + foo('assets/mana/G.png');
            posX -= costCoords.size.x
        }
    }

    if (red > 0) {
        for (let i = red; i > 0; i--) {
            command += " " + foo('assets/mana/R.png');
            posX -= costCoords.size.x
        }
    }

    if (black > 0) {
        for (let i = black; i > 0; i--) {
            command += " " + foo('assets/mana/B.png');
            posX -= costCoords.size.x
        }
    }

    if (blue > 0) {
        for (let i = blue; i > 0; i--) {
            command += " " + foo('assets/mana/U.png');
            posX -= costCoords.size.x
        }
    }

    if (white > 0) {
        for (let i = white; i > 0; i--) {
            command += " " + foo('assets/mana/W.png');
            posX -= costCoords.size.x
        }
    }

    if (hybrid.length > 0) {
        const ree = generateHybridNames(hybrid).map((hybrid) => {
            let cmd = foo(`assets/mana/${hybrid}.png`);
            posX -= costCoords.size.x;
            return cmd;
        }).join(' ');
        command += ree;
    }

    if (colorless > 0) {
        command += " " + foo('assets/mana/C.png')
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
    } else {
        return '';
    }

    return `\\( -page +${smallboxCoords.pos.x}+${smallboxCoords.pos.y} -background transparent -size ${smallboxCoords.size.x}x${smallboxCoords.size.y} -gravity center label:'${label}' \\)`;
}

module.exports = {generateCardNameLabel, generateCardTextBox, generateCardTypeLabel, generateManaSymbols, generateCardSmallBoxLabel};
