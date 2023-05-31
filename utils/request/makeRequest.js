import fetch from 'node-fetch';

// ..
const configuration = {
    method: 'GET',
    headers: {
        "X-API-Key": '12a18fbb685a4a90bace718395c81ca8'
    }
};

// ..
export const makeRequest = function (platform = 254, memship) {
    
    return new Promise(async (resolve, reject) => {

        await fetch(`https://www.bungie.net/Platform/Destiny2/${platform}/Profile/${memship}/?components=100,104,200,201,202,205,300,301,305,900,1000,1200`, configuration)
        .then((serverPromise) => {
            serverPromise.json()
            .then(resolve)
            .catch(reject)
        })
        .catch((e) => console.error(e));
    });
};