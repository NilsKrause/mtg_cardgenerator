fs = require('fs');
im = require('imagemagick');
const { exec } = require('child_process');

const nameCoords = {
    pos: {x: 50, y: 55},
    size: {x: 690, y: 60}
};

const typeCoords = {
    pos: {x: 50, y: 628},
    size: {x: 600, y: 50}
};

// power/toughness box
const smallboxCoords = {
    pos: {x: 625, y: 990},
    size: {x: 110, y: 40}
};

// power/toughness box
// percent in size, is y/100
const rulesCoords = {
    pos: {x: 60, y: 695},
    size: {x: 660, y: 290, percent: 2.9}
};

// the pos of the cost need to be calculated.
// this is the left most position and you need to subtract the size of the inserted symbol from the x position.
const costCoords = {
    pos: {x: 740, y: 55},
    size: {x: 42, y: 60}
}

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

function generateCard (card) {
    // let {cost, name, rules, flaor, type} = card;
    let frame = "assets/frame.png";
    let outputfile = `output/${Date.now()}_name.png`;

    exec(`magick -page +0+0 ${frame} ${generateCardTypeLabel(card)} ${generateCardSmallBoxLabel(card)} ${generateCardTextBox(card)} ${generateManaSymbols(card)} ${generateCardNameLabel(card)} -flatten ${outputfile}`,
        {},
        (output) => {
        if (output !== null) {
            console.log(output)
        }
        });

}

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

function preprocessHybrid (hybrid) {
    // @todo
    let colors = hybrid.replace("()/", "");
    let black = 0, green = 0, red = 0, blue = 0, white = 0;
    for (var i = 0; i < colors.length; i++) {
        let color = colors.charAt(i);
        switch (color) {
            case 'b':
                black++;
                break;
            case 'u':
                blue++;
                break;
            case 'r':
                red++;
                break;
            case 'g':
                green++;
                break;
            case 'w':
                white++
                break;
        }

    }

    return {
        black,
        green,
        red,
        blue,
        white,
    }
}

function preprocessCost (cost) {
    let colorless = 0, black = 0, green = 0, red = 0, blue = 0, white = 0;
    let hybrid = [];

    let tmp = "";
    for (var i = 0; i < cost.length; i++) {
        let elem = cost.charAt(i).toLowerCase();

        // start of hybrid found
        if (elem === '(' || tmp !== "") {
            tmp += elem;
            if (elem === ')') {
                // end of hybrid found
                let h = preprocessHybrid(tmp)
                hybrid.push(h);
                tmp = "";
            }
            continue;
        }

        switch (elem) {
            case 'b':
                black++;
                break;
            case 'u':
                blue++;
                break;
            case 'r':
                red++;
                break;
            case 'g':
                green++;
                break;
            case 'w':
                white++
                break;
            default:
                colorless += Number(elem);
        }
    }

    return {
        colorless,
        black,
        green,
        red,
        blue,
        white,
        hybrid
    }
}

function generateImage (supertype) {
    // @todo generate card image based on supertype
    return ""
}

function preprocessType (card) {
    const {type} = card;

    let supertype = "", subtypes = "", loalty = undefined, power = undefined, toughness = undefined;
    let tmpTypes = "";
    if (type.includes('Enchantment')) {

    } else

    // type contains loyalty if it's a planeswalker
    if (type.includes('Planeswalker')) {
        const [tt, post] = type.split('(');
        tmpTypes = tt;
        loalty = Number(post.replace(')', "").replace("Loyalty ", "").trim())
    } else

    // type contains power/toughness if it's a creature
    if (type.includes('Creature')) {
        const [tt, post] = type.split('(');
        tmpTypes = tt;
        const [p, t] = post.replace(')', "").split('/');
        power = Number(p.trim());
        toughness = Number(t.trim());
    }

    const [sup, sub] = tmpTypes.split(' - ');
    supertype = sup.trim();
    subtypes = sub.trim();

    return {
        smallbox: {
            loalty,
            power,
            toughness,
        },
        type: {
            subtypes,
            supertype,
        },
        image: generateImage()
    }
}

function preprocessCard (card) {
    let {cost, rules} = card;

    return {
        ...card,
        ...{rules: escapeSpecialCharacters(rules.trim())},
        ...{cost: preprocessCost(cost)},
        ...preprocessType(card)
    }
}

fs.readFile("test.json", "utf8", (err, data) => {
    if (err) {
        return console.log(err);
    }

    let cards = JSON.parse(data);

    cards.map(preprocessCard).forEach(generateCard)
});

console.log('finished reading data')
