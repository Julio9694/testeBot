import fs from 'fs'
import { decodeWAMessage } from './Utils/decode-wa-message'

interface BrowserMessagesInfo {
    bundle: { encKey: string, macKey: string }
    harFilePath: string
}
interface WSMessage {
    type: 'send' | 'receive',
    data: string
}
const file = fs.readFileSync ('./browser-messages.json', {encoding: 'utf-8'})
const json: BrowserMessagesInfo = JSON.parse (file)

const encKey = Buffer.from (json.bundle.encKey, 'base64')
const macKey = Buffer.from (json.bundle.macKey, 'base64')

const harFile = JSON.parse ( fs.readFileSync( json.harFilePath , {encoding: 'utf-8'}))
const entries = harFile['log']['entries']
let wsMessages: WSMessage[] = []
entries.forEach ((e, i) => {    
    if ('_webSocketMessages' in e) {
        wsMessages.push (...e['_webSocketMessages'])
    }
})
const decrypt = (buffer, fromMe) => decodeWAMessage(buffer, { macKey, encKey }, fromMe)

console.log ('parsing ' + wsMessages.length + ' messages')
const list = wsMessages.map ((item, i) => {
    const buffer = item.data.includes(',') ? item.data : Buffer.from (item.data, 'base64')
    try {
        const [tag, json, binaryTags] = decrypt (buffer, item.type === 'send')
        
        return {tag, json: json && JSON.stringify(json), binaryTags}
    } catch (error) {
        return { error: error.message, data: buffer.toString('utf-8') }
    }
})
.filter (Boolean)
const str = JSON.stringify (list, null, '\t')
fs.writeFileSync ('decoded-ws.json', str)