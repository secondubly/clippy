let topClips = [];
let distribution = {};

async function getClips(limit = 100, username = 'secondubly', period = 'all', weighted = true) {
    // TODO: sanitize input
    // Note: await/async unsupported in some older browsers (IE/Opera?)
    const data = await fetch(`https://api.twitch.tv/kraken/clips/top?channel=${username}&limit=${limit}&period=${period}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Client-ID': 'h032bgl79pc6sz5ftt7qax12eom1eg',
            'Accept': 'application/vnd.twitchtv.v5+json'
        }
    }).then(res => res.json());

    if (data.clips.length < 1) { return; } // if we don't have any clips, return early

    topClips = data.clips;
}

/**
 * Returns an index of 
 * @param {Array.<Object>} clips 
 * @param {number} percentage A decimal number that signifies the weighted percentage - the default is 0.10 (10%)
 * @returns {number} index of the array item that was randomly selected
 */
function weightedRandom (clips, percentage = 0.10) {
    // first we need to generate the weight ranges for each item
    let weights = [0]; // this array will hold a range starting from 0 that represents percentages [0, 1)
    let total_weight_sum = 0
    // generate weights for each item using the percentage
    for(let i = 0; i < clips.length; i++) {
        let item_weight = 1 / (1 + i) * percentage;
        weights.push(item_weight);
        total_weight_sum += item_weight; // add up the total weight for ALL items, we'll use this later
    }

    // pick a random value threshold, multiply it by the sum of all the weights (this gives it an upper limit)
    const threshold = Math.random() * total_weight_sum;
    // console.log(`Threshold Value: ${threshold}`)

    // now loop over all the weights - if the value is within the threshold then we've picked a clip
    total_weight_sum = 0;
    for (let i = 0; i < weights.length - 1; ++i) {
        // add the weight to our running total (which starts at 0)
        total_weight_sum += weights[i];
        // if this total weight is greater than the threshold value
        // aka if the threshold is 60 and the weight is 35
        // then we are in the range we need, so just return where we're at
        if(total_weight_sum >= threshold) {
            // return clips[i - 1];
            return i - 1;
        }
    }

    return clips.length - 1; // in case the previous loop fails, return the very last item!
}

getClips().then(_ => {
    if(topClips.length > 0) {
        let index = 0;
        // setup distribution map
        for (const _ of topClips) {
            distribution[index] = 0;
            index++;
        }
        for (let i = 0; i < 10000; i++) {
            const clip_index = weightedRandom(topClips);
            distribution[clip_index]++;
        }
        console.log(distribution);
    }
}).catch();