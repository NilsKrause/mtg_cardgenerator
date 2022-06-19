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
const rulesCoords = {
    pos: {x: 60, y: 695},
    size: {x: 660, y: 290}
};

function generateCardNameLabel (card) {
    let {name} = card;

    return `\\( -page +${nameCoords.pos.x}+${nameCoords.pos.y} -background transparent -size ${nameCoords.size.x}x${nameCoords.size.y} -gravity west label:'${name}' \\)`;
}

function generateCardRulesLabel (card) {
    let {rules} = card;

    return `\\( -page +${rulesCoords.pos.x}+${rulesCoords.pos.y} -background transparent -size ${rulesCoords.size.x}x${rulesCoords.size.y} -gravity northwest caption:'${rules}' \\)`;
}

function generateCardTypeLabel (card) {
    let {type} = card;

    return `\\( -page +${typeCoords.pos.x}+${typeCoords.pos.y} -background transparent -size ${typeCoords.size.x}x${typeCoords.size.y} -gravity west label:'${type.supertype} - ${type.subtypes}' \\)`;
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

    exec(`magick -page +0+0 ${frame} ${generateCardNameLabel(card)} ${generateCardTypeLabel(card)} ${generateCardSmallBoxLabel(card)} ${generateCardRulesLabel(card)} -flatten ${outputfile}`, {});

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

        if (typeof elem === 'number') {
            colorless += elem;
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
        ...{rules: rules.trim()},
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
