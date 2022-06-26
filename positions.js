
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

module.exports = {nameCoords, rulesCoords, typeCoords, costCoords, smallboxCoords}
