import { createClient } from "redis"
import { STATUS_CODES } from 'http'
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config(); // due to import execution ordering, this file gets handled before anything uses process.env variables, so configure them here


const TWITCH_VALIDATE_URL = 'https://id.twitch.tv/oauth2/validate'
const TWITCH_OAUTH_URL = `https://id.twitch.tv/oauth2/token`
const ONE_HOUR = 60 * 60 // convert 1 hour to seconds

const redisClient = createClient({
    socket: {
        host: process.env.REDIS_URL,
        port: process.env.REDIS_PORT
    },
    password: process.env.REDIS_PASSWORD || ''
})

redisClient.connect()

export class Twitch {
    constructor() {
        this.maintain() // get the token on class creation
    }

    // this is the only method you ever need to directly call!
    async maintain() {
        let token = await redisClient.HGET('twitch_auth', `twitch_client_credentials_${process.env.CLIENT_ID}`)
        if (token) {
            console.info('Recovered existing token, validating...')
            // verify that the token works
            try {
                token = JSON.parse(token)
                process.env.ACCESS_TOKEN = token.access_token
                this.validate() // validate the given token
            } catch (e) {
                console.warn('Failed to parse token, generating a new one...', e)
                this.makeClientCredentials()
            }
            return // return early
        }
        
        this.makeClientCredentials()
    }

    async validate() {
        try {
            let res = await fetch(TWITCH_VALIDATE_URL, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
                }
            })

            res = await res.json()
            if (res.expires_in <= ONE_HOUR) {
                // token expires relatively soon, let's get a new one
                this.makeClientCredentials()
            } else {
                const hours = Math.floor(res.expires_in / 3600)
                console.log(`Token is valid, expires in ${hours} hours.`)
            }
        } catch (e) {
            console.log('Token validation error', e)
            this.makeClientCredentials()
        }
    }

    async makeClientCredentials() {
        try {
            let tokenURL = new URL(TWITCH_OAUTH_URL)
            tokenURL.search = new URLSearchParams([
                ['client_id',       process.env.CLIENT_ID],
                ['client_secret',   process.env.CLIENT_SECRET],
                ['grant_type',      'client_credentials']
            ]).toString()

            let res = await fetch(tokenURL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json'
                }
            })

            if (res.statusText !== STATUS_CODES[200]) {
                console.error('Failed to get a token', res.body)
                // most likely an unrecoverable error, so just return
                return
            }

            res = await res.json()
            res.client_id = process.env.CLIENT_ID // we're going to use this later!
            await redisClient.HSET(
                'twitch_auth',
                `twitch_client_credentials_${process.env.CLIENT_ID}`,
                JSON.stringify(res)
            )
        } catch (e) {
            console.error('Failed to get client credentials', e)
        }
    }

    async getUserID(username) {
        try {
            const response = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
                method: 'GET',
                headers: {'Client-Id':  process.env.CLIENT_ID, 'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`}
            });
        
            if(response.statusText !== STATUS_CODES[200]) {
                console.error('Could not retrieve user id', response.body)
                return response.status
            }

            const users = await response.json();
            return users.data[0].id
        } catch (e) {
            console.error('Failed to get User ID', e)
        }
    }

    async getClips(id, limit = 100) {
        const url = `https://api.twitch.tv/helix/clips?broadcaster_id=${id}&first=${limit}`
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {'Client-Id':  process.env.CLIENT_ID, 'Authorization': `Bearer ${process.env.ACCESS_TOKEN}`}
            })
        
            if(response.statusText != STATUS_CODES[200]) {
                console.error('Error getting twitch clips', response.body)
                return response.status;
            }
            const data = await response.json();
            return data;
        } catch (e) {
            console.error('Error getting clips', e)
        }
    }
}