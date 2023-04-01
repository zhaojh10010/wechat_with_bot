import express from 'express';
import xmlparser from 'express-xml-bodyparser';
import encryption from './utils/encryption.js';
import config from './conf/config.js';
import { setToken, getToken, timingSetToken } from './utils/wxtoken.js';
import { ChatGPTAPI } from 'chatgpt';
import axios from 'axios';
import fetch from 'node-fetch';

setToken().then(() => {
    timingSetToken();
})

//公众号客服接口,需要公众号已认证...

const api = new ChatGPTAPI({ apiKey: config.OPENAI_API_KEY, fetch: fetch
    // , debug: true
    // , apiBaseUrl: 'https://api.openai.com/v1/chat/completions'
    // , completionParams: {
    //     model: 'gpt-3.5-turbo-0301'
    //   } 
});

function checkSignature(ctx) {
    let {signature = '', timestamp = '', nonce = '', echostr = ''} = ctx.query
    let token = config.token

    // 验证token
    let str = [token, timestamp, nonce].sort().join('')
    let sha1 = encryption.sha1(str)
    if (sha1 !== signature) {
        ctx.body = 'token验证失败'
        return false
    } else {
        ctx.body = echostr
        return true
    }
}

const BASE_CUSTOMER_URL = "https://api.weixin.qq.com/cgi-bin/message/custom/send";
async function sendCustomerMsg(content ,touser) {
    let token = await getToken();
    axios.post(BASE_CUSTOMER_URL + "?access_token="+token, {
        "touser": touser,
        "msgtype": "text",
        "text":
        {
             "content": content
        }
    }).then((res) => {
        console.log("=======sendCustomerMsg=======")
        if(res.data.errcode) {
          console.log(res.data.errcode+":"+res.data.errmsg);
        }
    }).catch(err => {
        console.log(err);
    });
}

const BASE_CUSTOMER_TYPING_URL = "https://api.weixin.qq.com/cgi-bin/message/custom/typing";
async function setCustomerTyping(touser) {
    let token = await getToken();
    axios.post(BASE_CUSTOMER_TYPING_URL + "?access_token="+token, {
        "touser": touser,
        "command": "Typing",
    }).then((res) => {
        console.log("=======setCustomerTyping=======")
        if(res.data.errcode) {
          console.log(res.data.errcode+":"+res.data.errmsg);
        }
    }).catch(err => {
        console.log(err);
    });
}

async function cancelCustomerTyping(touser) {
    let token = await getToken();
    axios.post(BASE_CUSTOMER_TYPING_URL + "?access_token="+token, {
        "touser": touser,
        "command": "CancelTyping",
    }).then((res) => {
        console.log("=======cancelCustomerTyping=======")
        if(res.data.errcode) {
          console.log(res.data.errcode+":"+res.data.errmsg);
        }
    }).catch(err => {
        console.log(err);
    });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded());
app.use(xmlparser());
//微信验证
// app.get("/", (req, res) => {
    // checkSignature(req)
    // res.send(req.body)
// });

app.get("/", (req, res) => {
    if(checkSignature(req)) {
        res.send(req.body);
        console.log("微信公众号已验证通过");
    } else {
        res.send("Get请求已收到!");
        console.log("非验证请求已收到");
    }
});

let userContext = {
    
}
app.post("/", (req, res) => {
    let xml = req.body.xml;
    let content = xml.content[0];
    let userid = xml.fromusername[0];
    if(!userContext[userid]) {
      userContext[userid] = {};
    }
    
    let currentUser = userContext[userid];
    let msgtype = xml.msgtype[0];
    switch (msgtype) {
        case "text":
            let abc = async () => {
                setCustomerTyping(userid);
                console.log("Q:", content);
                let response = await api.sendMessage(content, {
                    conversationId: currentUser.conversationId,
                    parentMessageId: currentUser.id
                });
                currentUser.conversationId = response.conversationId,
                currentUser.parentMessageId = response.id;
                
                await cancelCustomerTyping(userid);
                console.log("A:", response.text);
                sendCustomerMsg(response.text, userid);
            }
            res.send("");//直接返回空字符串, 微信不会做处理, 也不会重复请求
            abc();
            break;
        default:
            res.send("抱歉, 目前不支持该消息类型"); // 不是文本消息是默认响应一个空
            break;
    }
});

app.listen(34111, () => {
    console.log("服务器已成功启动!");
});
