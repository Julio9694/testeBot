const makeWaSocket = require('@adiwajshing/baileys').default
const { delay, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@adiwajshing/baileys')
const P = require('pino')
const { unlink, existsSync, mkdirSync } = require('fs')
const ZDGPath = './ZDGSessions/'
const ZDGAuth = 'ZDG_auth_info.json'

const ZDGBtn1 = {
   id: 'ZDGContinuar',
   displayText: 'CONTINUAR',
}

const ZDGBtn2 = {
   id: 'ZDGSair',
   displayText: 'SAIR',
}

const ZDGbtnMD1 = [
   { index: 1, quickReplyButton: ZDGBtn1 },
   { index: 2, quickReplyButton: ZDGBtn2 },
]

const ZDGGroupCheck = (jid) => {
   const regexp = new RegExp(/^\d{18}@g.us$/)
   return regexp.test(jid)
}

const ZDGUpdate = (ZDGsock) => {
   ZDGsock.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr){
         console.log('© BOT-ZDG - Qrcode: ', qr);
      };
      if (connection === 'close') {
         const ZDGReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
         if (ZDGReconnect) ZDGConnection()
         console.log(`© BOT-ZDG - CONEXÃO FECHADA! RAZÃO: ` + DisconnectReason.loggedOut.toString());
         if (ZDGReconnect === false) {
            const removeAuth = ZDGPath + ZDGAuth
            unlink(removeAuth, err => {
               if (err) throw err
            })
         }
      }
      if (connection === 'open'){
         console.log('© BOT-ZDG - CONECTADO')
      }
   })
}

const ZDGConnection = async () => {
   const { version } = await fetchLatestBaileysVersion()
   if (!existsSync(ZDGPath)) {
      mkdirSync(ZDGPath, { recursive: true });
   }
   const { saveState, state } = useSingleFileAuthState(ZDGPath + ZDGAuth)
   const config = {
      auth: state,
      logger: P({ level: 'error' }),
      printQRInTerminal: true,
      version,
      connectTimeoutMs: 60_000,
      async getMessage(key) {
         return { conversation: 'botzg' };
      },
   }
   const ZDGsock = makeWaSocket(config);
   ZDGUpdate(ZDGsock.ev);
   ZDGsock.ev.on('creds.update', saveState);

   const ZDGSendMessage = async (jid, msg) => {
      await ZDGsock.presenceSubscribe(jid)
      await delay(1500)
      await ZDGsock.sendPresenceUpdate('composing', jid)
      await delay(1000)
      await ZDGsock.sendPresenceUpdate('paused', jid)
      return await ZDGsock.sendMessage(jid, msg)
   }

   function isBlank(str) {
      return (!str || /^\s*$/.test(str));
   }

   ZDGsock.ev.on('messages.upsert', async ({ messages, type }) => {
   const msg = messages[0]
   const jid = msg.key.remoteJid
   const ZDGUser = msg.pushName;
   const conversation = msg.message.conversation;

      if (!ZDGGroupCheck(jid) && !msg.key.fromMe && jid !== 'status@broadcast') {
         console.log("© BOT-ZDG - MENSAGEM : ", msg)
         ZDGsock.sendReadReceipt(jid, msg.key.participant, [msg.key.id])
         
         if(isBlank(conversation)){
            if (msg.message.templateButtonReplyMessage.selectedId === 'ZDGContinuar'){
               ZDGSendMessage(jid, { text: ZDGUser + ', você já conhece a Comunidade ZDG?\n1- Sim!\n2- Não' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
            if (msg.message.templateButtonReplyMessage.selectedId === 'ZDGSair') {     
               ZDGSendMessage(jid, { text: ZDGUser + ' muito obrigado pelo seu contato.\n Escolha uma opção!\n3- Não quero mais receber mensagens\n4- Estou ocupado, nos falamos depois.' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }

         }
         else {   
            if (msg.message.conversation.toLowerCase() === '1') {     
               ZDGSendMessage(jid, { text: ZDGUser + ', obrigado pela sua resposta.' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
            if (msg.message.conversation.toLowerCase() === '2') {     
               ZDGSendMessage(jid, { text: ZDGUser + ', você pode saber mais sobre a comunidade no link https://zapdasgalaxias.com.br' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
            if (msg.message.conversation.toLowerCase() === '3') {     
               ZDGSendMessage(jid, { text: ZDGUser + ', vou remover o seu contato da nossa lista de clientes.' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
            if (msg.message.conversation.toLowerCase() === '4') {     
               ZDGSendMessage(jid, { text: ZDGUser + ', já já eu te chamo de novo.' })
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }
            if (msg.message.conversation.toLowerCase() !== '1' && msg.message.conversation.toLowerCase() !== '2' && msg.message.conversation.toLowerCase() !== '3' && msg.message.conversation.toLowerCase() !== '4') {     
               const ZDGbtnImage = {
                  caption: '\n Olá *'+  ZDGUser +  '*, Pedrinho da NASA aqui \n Escolha uma opção!\n',
                  footer: '✅ Ao continuar você concorda com os Termos de Uso e Política de Privacidade',
                  image: {
                     url: './assets/card.jpg',
                  },
                  templateButtons: ZDGbtnMD1
               }
               ZDGSendMessage(jid, ZDGbtnImage)
                  .then(result => console.log('RESULT: ', result))
                  .catch(err => console.log('ERROR: ', err))
            }  
         }

      }
   })
}

ZDGConnection()