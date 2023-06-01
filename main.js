
import { doChildProcess } from './child.js';
import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

// ..
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// configure threads
// an even (lower than 16) number works best
const THREADCOUNT = 16;
let threadsArr = [];

// exec
main();

// do configuration before doing anything else
async function getMyProfile () {

    // get the current season definition and store it
    async function getSeasonDefinition (hash) {
        await fetch(`https://www.bungie.net/Platform/Destiny2/Manifest/DestinySeasonDefinition/${hash}/`, {headers: {"X-API-Key": '12a18fbb685a4a90bace718395c81ca8'}})
        .then((res) => {
            return res.json();
        })
        .then((data) => {
            fs.writeFileSync(path.resolve(__dirname, './temp/season.json'), JSON.stringify(data, null, 4));
        });
    };

    // get MY (brendan's; remember how you spell it k) profile for the current season hash
    await fetch('https://www.bungie.net/Platform/Destiny2/1/Profile/4611686018447977370/?components=100', {headers: {"X-API-Key": '12a18fbb685a4a90bace718395c81ca8'}})
    .then((res) => {
        return res.json();
    })
    .then((data) => {
        getSeasonDefinition(data.Response.profile.data.currentSeasonHash);
    });
};

// main entry point
async function main () {

    await getMyProfile();

    // ..
    for (let i=0; i<THREADCOUNT; i++) {
        threadsArr.push(doChildProcess(i));
    };

    // "promise-fy" all processes
    Promise.all(threadsArr);
};