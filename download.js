var request = require('request');
var async = require('async');
var fs = require('fs');
function getHeroes(cb) {
    request('https://www.heroescounters.com/', function (error, response, body) {
        if (error) return console.log(error);
        var splitData = body.split('/hero/');
        splitData.shift();
        var heroes = [];
        splitData.forEach(function (element) {
            var heroName = element.substring(0, element.indexOf('"'));
            heroes.push(heroName);
        });
        heroes = Array.from(new Set(heroes));
        cb(heroes);
    });
}

function getHeroData(hero, cb) {
    request('https://www.heroescounters.com/hero/' + hero, function (error, response, body) {
        if (error) return cb(error);

        var strongAgainst = getStrongAgainst(body);
        var weakAgainst = getWeakAgainst(body);
        var goodTeamWith = getGoodTeamWith(body);
        var maps = getMapInfo(body);
        cb(error, {
            hero,
            strongAgainst,
            weakAgainst,
            goodTeamWith,
            maps
        });
    });
}

function getStrongAgainst(body) {
    return getCountsForType(body, 'good');
}

function getWeakAgainst(body) {
    return getCountsForType(body, 'bad');
}

function getGoodTeamWith(body) {
    return getCountsForType(body, 'together');
}

function getMapInfo(body) {
    var counts = [];
    var data = body.replace(/ /g, '').split('class="map-box"');
    data.shift();
    data.forEach(function(item) {
        var map = between(item, '/map/', '"');
        console.log('beginitem', item, 'enditem');
        var score = parseInt(between(item, 'class="map-box-score"><strong>', '</strong>'));
        
        map && score && counts.push({
            map,
            score
        })
    });
    return counts;
}

function getCountsForType(body, type) {
    var counts = [];
    var data = body.split('data-countertype="');
    data.shift();
    data.forEach(function(item) {
        var countertype = item.substring(0, item.indexOf('"'));
        if (countertype === type) {
            var hero = between(item, '/hero/', '"');
            var points = parseInt(between(item, '<span class="counter-box-points"><strong>', '</strong>'));
            hero && points && counts.push({
                hero,
                points
            });
        }
    });
    return counts;
}

getHeroes(function(heroes) {
    var asyncFuncs = [];

    heroes.forEach(function(hero) {
        asyncFuncs.push(function(done) {
            getHeroData(hero, done);
        });
    });

    async.parallel(asyncFuncs, function(err, heroData) {
        if (err) throw err;

        console.log(JSON.stringify(heroData, null, 4));

        fs.writeFileSync('hero-data.json', JSON.stringify(heroData, null, 4), 'utf-8');
    });
});

function between(content, start, end) {
    var data = content.substring(content.indexOf(start) + start.length);
    data = data.substring(0, data.indexOf(end));
    return data;
}