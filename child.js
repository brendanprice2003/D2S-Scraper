
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { makeRequest } from './utils/request/makeRequest.js';
import { memshiptypes, days } from './utils/defs/defs.js';
import { fileURLToPath } from 'url';

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
        return res;
    });

    // stdout
    const time = `[${new Date().getDate()}:${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()} (${days[new Date().getDay()]})]`;
    log(`${time} ${chalk.blue('Requested Resource')} ${chalk.magenta('/Profile')} ${chalk.blue('with')} ${chalk.red(platform)}:${chalk.red(memship)}`);

    // return it
    return response;
};

export async function doChildProcess (pid = '.') {

    const start = `[${new Date().getDate()}:${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}]`;
    log(`${start} Thread ${pid} ${chalk.green('Created')}`);

    // 
    setInterval(async () => {

        // check if this should be running
        let shouldRun = JSON.parse(fs.readFileSync(path.resolve(__dirname, './temp/dat.json'))).shouldRun;
        if (shouldRun) {

            // get memship and increment straight away
            let datJSON = JSON.parse(fs.readFileSync(path.resolve(__dirname, './temp/dat.json')));
            let memship = `${BigInt(datJSON.current)+1n}`.split('n')[0];
            datJSON.current = memship;

            fs.writeFileSync(path.resolve(__dirname, './temp/dat.json'), JSON.stringify(datJSON, null, 4));
            const response = await doRequestCycle(BigInt(memship));
            
            // account found
            if (response.ErrorCode === 1) {

                // increment profile count
                let dat = JSON.parse(fs.readFileSync(path.resolve(__dirname, './temp/dat.json')));
                dat.profiles++;
                fs.writeFileSync(path.resolve(__dirname, './temp/dat.json'), JSON.stringify(dat, null, 4));

                // get current json
                let userProfile = JSON.parse(fs.readFileSync(path.resolve(__dirname, './temp/prfs.json')));

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

                // new profile
                userProfile[memship] = strippedProfile;

                // append profile
                fs.writeFileSync(path.resolve(__dirname, './temp/prfs.json'), JSON.stringify(userProfile, null, 0));
            };
        };
        
    }, 5000);
};
