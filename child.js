
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { makeRequest } from './utils/request/makeRequest.js';
import { memshiptypes, days } from './utils/defs/defs.js';
import { fileURLToPath } from 'url';

// ..
const log = console.log.bind(console);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const seasonStartDate = JSON.parse(fs.readFileSync(path.resolve(__dirname, './temp/season.json'))).Response.startDate;

async function doRequestCycle (memship) {
    
    // do request
    let platform = 254;
    const response = await makeRequest(platform, memship)
    .then(async (res) => {

        // check if profile has an applicable platform;
        if (res.ErrorCode === 18) {
            platform = memshiptypes[res.MessageData['membershipInfo.membershipType']];
            return await makeRequest(platform, memship);
        };

        // else return
        return [platform, res];
    });

    // time stdout
    const time = `[${new Date().getDate()}:${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()} (${days[new Date().getDay()]})]`;
    log(`${time} ${chalk.blue('Requested Resource')} ${chalk.magenta('/Profile')} ${chalk.blue('with')} ${chalk.red(platform)}:${chalk.red(memship)}`);

    // return it
    return [platform, response];
};

export async function doChildProcess (pid = '.') {

    // time stdout
    const start = `[${new Date().getDate()}:${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}]`;
    log(`${start} Thread ${pid} ${chalk.green('Created')}`);

    // ..
    setInterval(async () => {

        // check if this should be running
        let shouldRun = JSON.parse(fs.readFileSync(path.resolve(__dirname, './temp/dat.json'))).shouldRun;
        if (shouldRun) {

            // get memship and increment straight away
            let datJSON = JSON.parse(fs.readFileSync(path.resolve(__dirname, './temp/dat.json')));
            let memship = `${BigInt(datJSON.current)+1n}`.split('n')[0];
            datJSON.current = memship;

            fs.writeFileSync(path.resolve(__dirname, './temp/dat.json'), JSON.stringify(datJSON, null, 4));
            const promiseResponse = await doRequestCycle(BigInt(memship));
            const memshipType = promiseResponse[0];
            const response = promiseResponse[1];
            
            // account found
            if (response.ErrorCode === 1) {

                // pull dat and currently stored members
                let dat = JSON.parse(fs.readFileSync(path.resolve(__dirname, './temp/dat.json')));
                let mems = JSON.parse(fs.readFileSync(path.resolve(__dirname, './temp/mems.json')));

                // add user to temp
                mems[dat.profiles] = [`${memshipType}:${memship}`];
                fs.writeFileSync(path.resolve(__dirname, './temp/mems.json'), JSON.stringify(mems, null, 1));

                // increment profile count
                dat.profiles++;
                fs.writeFileSync(path.resolve(__dirname, './temp/dat.json'), JSON.stringify(dat, null, 4));

                // remove unwanted data
                let strippedProfile = {};

                strippedProfile.hasPlayedThisSeason = new Date(response.Response.profile.data.dateLastPlayed) > new Date(seasonStartDate);
                strippedProfile.guardianRanks = {
                    currentGuardianRank: response.Response.profile.data.currentGuardianRank,
                    lifetimeHighestGuardianRank: response.Response.profile.data.lifetimeHighestGuardianRank
                };
                strippedProfile.characters = response.Response.characters.data;
                strippedProfile.profileProgression = response.Response.profileProgression.data;

                // character specific progressions
                strippedProfile.characterProgressions = {};
                for (let charHash in response.Response.characterProgressions.data) {
                    strippedProfile.characterProgressions[charHash] = response.Response.characterProgressions.data[charHash].progressions;
                };

                // merge the stripped profile into a new array, ready for json
                let userProfile = {};
                userProfile[memship] = strippedProfile;

                // create new json
                fs.writeFileSync(path.resolve(__dirname, `./users/${memshipType}_${memship}.json`), JSON.stringify(userProfile));
            };
        };
        
    }, 5000);
};
