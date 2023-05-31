
import { doChildProcess } from './child.js';
import fetch from 'node-fetch';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

getMyProfile();
async function getMyProfile () {

    // get my profile for the current season hash
    await fetch('https://www.bungie.net/Platform/Destiny2/1/Profile/4611686018447977370/?components=100', {headers: {"X-API-Key": '12a18fbb685a4a90bace718395c81ca8'}})
    .then((res) => {
        return res.json();
    })
    .then((data) => {
        getSeasonDefinition(data.Response.profile.data.currentSeasonHash);
    });

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
};

// configure threads
let threadCount = 128;
let threads = [];

for (let i=0; i<threadCount; i++) {
    threads.push(doChildProcess(i));
};

Promise.all(threads);