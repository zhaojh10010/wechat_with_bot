import express from 'express';
import xmlparser from 'express-xml-bodyparser';
import config from './conf/config.js';
import { ChatGPTAPI } from 'chatgpt';
import { syncMsg, sendCustomerMsg, checkCorpSignature
    , msgdecrypt, checkServiceState, changeServiceState } from './utils/qywxapi.js';
import { parseString } from 'xml2js';
import { readJsonFromFile, writeJsonToFile } from './utils/util.js';
import fetch from 'node-fetch';

const api = new ChatGPTAPI({ apiKey: config.OPENAI_API_KEY, fetch: fetch
    // , debug: true
    // , apiBaseUrl: 'https://api.openai.com/v1/chat/completions'
    // , completionParams: {
    //     model: 'gpt-3.5-turbo-0301'
    //   } 
});

const app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(xmlparser());

app.get("/", (req, res) => {
    if(checkCorpSignature(req)) {
        res.send(req.body);
        console.log("企业已验证通过");
    } else {
        res.send("Get请求已收到!");
        console.log("非验证请求已收到!");
    }
});



let userContext = {
    lastCursor: '',
    kefu: {},
}
let hasJumpToNewest = 0;
const cursorFile = "cursor.json";

app.post("/", (req, res) => {
    let xml = req.body.xml;
    // console.log("收到消息", xml);
    // let corpID = xml.tousername[0];
    let decrypt = msgdecrypt(xml.encrypt[0]);
    // console.log("解密", decrypt);
    //解密结果
    // {
    //     message: '<xml><ToUserName><![CDATA[ww9fe0390f34705d11]]></ToUserName><CreateTime>1676629554</CreateTime><MsgType><![CDATA[event]]></MsgType><Event><![CDATA[kf_msg_or_event]]></Event><Token><![CDATA[ENCEX5PR25ixgCPgg1RsQ5qLLHhe3rPTPMtEuBn3ot6iuGM]]></Token><OpenKfId><![CDATA[wk8YvKQAAAgldloC3LUKi5aKvdxoTPHg]]></OpenKfId></xml>',
    //     id: 'ww9fe0390f34705d11',
    //     random: <Buffer 39 30 35 66 66 32 37 38 61 61 66 31 35 34 33 33>
    //   }
    // 
    // result: {
    //     ToUserName: [ 'ww9fe0390f34705d11' ],
    //     CreateTime: [ '1676631042' ],
    //     MsgType: [ 'event' ],
    //     Event: [ 'kf_msg_or_event' ],
    //     Token: [ 'ENC21eDoopEKHKxiu1NtnroV2NCD3beM675H85XumG9P3Xd' ],
    //     OpenKfId: [ 'wk8YvKQAAAgldloC3LUKi5aKvdxoTPHg' ]
    //   }
    parseString(decrypt.message, {trim : true}, async (err, result) => {
        // if(userContext.lastCursor == result.xml.)
        // console.log("最终:", result.xml, userContext.lastCursor);
        result = result.xml;
        if(result.MsgType == 'event') {
            let fileData = await readJsonFromFile(cursorFile);
            userContext.lastCursor = fileData.cursor;
            // console.log("上一次cursor:", userContext.lastCursor);

            let data = await syncMsg(result.OpenKfId, result.Token, userContext.lastCursor, 1);
            if(!data) return;

            // writeJsonToFile(cursorFile, {
            //     cursor: data.next_cursor
            // });

            //每次重启都保持最新的一条, 忽略下线的时候发送的消息...
            if(!hasJumpToNewest) {
                let hasMore = data.has_more;
                let lastCursor = data.next_cursor;
                while(hasMore) {
                    let tmp = await syncMsg(result.OpenKfId, result.Token, lastCursor, 1);
                    // console.log("while   ",tmp.has_more, tmp.next_cursor, tmp.msg_list[0]);
                    lastCursor = tmp.next_cursor;
                    hasMore = tmp.has_more;
                    console.log("while", tmp.msg_list)
                    if(tmp.msg_list && tmp.msg_list[0])
                        data = tmp;
                }
                hasJumpToNewest = 1;
            }
            writeJsonToFile(cursorFile, {
                cursor: data.next_cursor
            });

            // console.log("消息列表:", data.msg_list);
            let item = data.msg_list[0];
            let kefuid = item.open_kfid;
            if(item.msgtype == "text" && !item.servicer_userid) {
                let msg = {
                    user: item.external_userid,
                    text: item.text.content,
                    origin: item.origin,
                    time: item.send_time
                };
                //客服[客服ID]=所属客服当前最新一条消息
                if(!userContext.kefu[kefuid]) userContext.kefu[kefuid] = {};
                userContext.kefu[kefuid] = Object.assign(userContext.kefu[kefuid], msg);
                let rMsg = userContext.kefu[kefuid];
                console.log("Q:",msg.text);
                api.sendMessage(msg.text, {
                    conversationId: rMsg.conversationId,
                    parentMessageId: rMsg.id
                }).then(response => {
                    rMsg.conversationId = response.conversationId;
                    rMsg.id = response.id;
                    console.log("A:", response.text);
                    // console.log(userContext.kefu[kefuid], "当前用户:"+rMsg.user);
                    sendCustomerMsg(response.text, rMsg.user, kefuid);
                }).catch(err => {
                    console.log(err);
                    sendCustomerMsg("本服务暂时不可用，请等待管理员进行检查", rMsg.user, kefuid);
                    // console.log(err.code+": "+err.message);
                });


            }
        }
    });
    res.send("");
});

app.listen(34110, () => {
    console.log("服务器已成功启动!");
});
