var yargs = require('yargs');
var argv = yargs.argv;
var fs = require('fs');
var heroData = JSON.parse(fs.readFileSync(__dirname + '/hero-data.json'));


if (!argv.team || !argv.enemy) {
    console.log('Please specify --team="lili,illidan" --enemy="diablo,raynor" syntax when running.');
    process.exit(-1);
}

var teammates = format(argv.team).split(',');
var enemies = format(argv.enemy).split(',');
var totalPoints = heroData.map(function(heroInfo) {
    return {
        hero: heroInfo.hero,
        points: 0
    };
});

//Good with my team
teammates.forEach(function(teammate) {
    var heroInfo = findHero(teammate);
    totalPoints.forEach(function(heroPoints) {
        heroPoints.points += findHero(heroPoints.hero, heroInfo.goodTeamWith).points;
    });
});

//Good against the enemy team
enemies.forEach(function(enemy) {
    var heroInfo = findHero(enemy);
    totalPoints.forEach(function(heroPoints) {
        heroPoints.points += findHero(heroPoints.hero, heroInfo.weakAgainst).points;
    });
});

//Not countered by the enemy team.
enemies.forEach(function(enemy) {
    var heroInfo = findHero(enemy);
    totalPoints.forEach(function(heroPoints) {
        heroPoints.points -= findHero(heroPoints.hero, heroInfo.strongAgainst).points;
    });
});

//Add map info
if (argv.map) {
    var map = format(argv.map);
    totalPoints.forEach(function(heroPoints) {
        mapInfo = findMap(findHero(heroPoints.hero), map);
        heroPoints.points += mapInfo.score;
    });
}

function format(input) {
    return input.toLowerCase().replace(/[ \.-]/g, '');
}

function findHero(hero, data) {
    var foundHero = null;

    (data || heroData).forEach(function(heroInfo) {
        if (format(heroInfo.hero).indexOf(hero) !== -1) {
            foundHero = heroInfo;
        }
    });

    if (!foundHero) {
        foundHero = {
            hero: 'Unknown',
            strongAgainst: [],
            weakAgainst: [],
            goodTeamWith: [],
            points: 0
        }
    }
    return foundHero;
}

function findMap(heroInfo, map) {
    var foundMap = null;

    heroInfo.maps && heroInfo.maps.forEach(function(mapInfo) {
        if (format(mapInfo.map).indexOf(map) !== -1) {
            foundMap = mapInfo;
        }
    });

    if (!foundMap) {
        foundMap = {
            map: 'Unknown',
            score: 0
        };
    }

    return foundMap;
}

totalPoints.sort(function(a, b) {
    return b.points - a.points;
});

console.log('BEST =========');
for (var i = 0; i < 30; i++) {
    var heroPick = totalPoints[i];
    console.log(heroPick.hero + ' (' + heroPick.points + ')');
}