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
    let colorless = 0, black = 0, green = 0, red = 0, blue = 0, white = 0, pink = 0;
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
            case 'p':
                pink++
                break;
            default:
                console.log('ok!', elem);
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
        hybrid,
        pink
    }
}

function preprocessType (card) {
    const {type} = card;

    let supertype = "", subtypes = "", loalty = undefined, power = undefined, toughness = undefined;
    let tmpTypes = "";

    // type contains loyalty if it's a planeswalker
    if (type.includes('Planeswalker')) {
        const [tt, post] = type.split('(');
        tmpTypes = tt;
        loalty = Number(post.replace(')', "").replace("Loyalty ", "").trim())
    }
    // type contains power/toughness if it's a creature
    else if (type.includes('Creature')) {
        const [tt, post] = type.split('(');
        tmpTypes = tt;
        const [p, t] = post.replace(')', "").split('/');
        power = Number(p.trim());
        toughness = Number(t.trim());
    }
    else {
        tmpTypes = type;
    }

    const [sup, sub] = tmpTypes.split(' - ');
    supertype = sup?.trim() ?? '';
    subtypes = sub?.trim() ?? '';

    return {
        smallbox: {
            loalty,
            power,
            toughness,
        },
        type: {
            subtypes,
            supertype,
        }
    }
}

function escapeSpecialCharacters (data) {
    return data
        // .replaceAll('\\', '\\u005C')
        // .replaceAll('(', '\\u0028')
        // .replaceAll(')', '\\u0029')
        // .replaceAll('/', '\\u002F')
        .replaceAll('\'', "ʼ")
}


module.exports = {escapeSpecialCharacters, preprocessCost, preprocessType};
