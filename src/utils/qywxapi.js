import axios from "axios";
import { setToken, getToken, timingSetToken } from './qywxtoken.js';
import config from "../conf/config.js";
import { getSignature, decrypt } from '@wecom/crypto';

setToken().then(() => {
    timingSetToken();
})

/**
 * 拉取客服消息
 * @param {} openKfId 
 * @param {*} token 
 * @param {*} cursor 
 * @returns 
 */
async function syncMsg(openKfId, token, cursor, limit = 1000) {
    let acc_token = await getToken();
    let url = "https://qyapi.weixin.qq.com/cgi-bin/kf/sync_msg?access_token=" + acc_token;
    return new Promise((resolve, reject) => {
        axios.post(url, {
            "cursor": cursor,
            "token": token+"",
            "limit": limit,
            "voice_format": 0,
            "open_kfid": openKfId+""
        }).then(res => {
            // console.log("sync返回:",res.data);
            if(!res.data.errcode) {
                resolve(res.data);
            } else {
                console.log("错误:"+res.data.errcode+":"+res.data.errmsg);
                reject();
            }
        }).catch(err => {
            reject("网络错误");
        });
    }) 
}

function checkCorpSignature(ctx) {
    let {msg_signature = '', timestamp = '', nonce = '', echostr = ''} = ctx.query

    let token = config.qytoken
    let encodingAESKey = config.qyEncodingAESKey;
    let newSign = getSignature(token, timestamp, nonce, echostr);
    console.log("newSign:", newSign);

    // 验证token
    if (newSign !== msg_signature) {
        ctx.body = 'token验证失败'
        return false
    } else {
        let rand_msg = decrypt(encodingAESKey, echostr)
        ctx.body = rand_msg["message"]
        return true
    }
}

function msgdecrypt(encrypt) {
    return decrypt(config.qyEncodingAESKey, encrypt);
}

const BASE_SERVICE_STATE_URL = "https://qyapi.weixin.qq.com/cgi-bin/kf/service_state/get";
async function checkServiceState(touser, openKfid) {
    let token = await getToken();
    axios.post(BASE_SERVICE_STATE_URL + "?access_token="+token, {
        "external_userid": touser,
        "open_kfid": openKfid,
    }).then((res) => {
        console.log("=======sendCustomerMsg=======")
        if(res.data.errcode) {
          console.log(res.data.errcode+":"+res.data.errmsg);
        }
        console.log("当前会话状态:", res.data.service_state, res.data.servicer_userid);
        // if(res.data.service_state == 3) {
            
        // }
    }).catch(err => {
        console.log(err);
    });
}

const BASE_SERVICE_STATE_CHANGE_URL = "https://qyapi.weixin.qq.com/cgi-bin/kf/service_state/trans";
async function changeServiceState(touser, openKfid, serviceState = 3, servicerUserid) {
    let token = await getToken();
    axios.post(BASE_SERVICE_STATE_CHANGE_URL + "?access_token="+token, {
        "external_userid": touser,
        "open_kfid": openKfid,
        "service_state": serviceState,
        "servicer_userid": servicerUserid
    }).then((res) => {
        console.log("=======sendCustomerMsg=======")
        if(res.data.errcode) {
          console.log(res.data.errcode+":"+res.data.errmsg);
        }
    }).catch(err => {
        console.log(err);
    });
}

const BASE_CUSTOMER_URL = "https://qyapi.weixin.qq.com/cgi-bin/kf/send_msg";
async function sendCustomerMsg(content, touser, openKfid) {
    let token = await getToken();
    axios.post(BASE_CUSTOMER_URL + "?access_token="+token, {
        "touser": touser,
        "msgtype": "text",
        "open_kfid": openKfid,
        "text":
        {
             "content": content
        },
    }).then((res) => {
        // console.log("=======sendCustomerMsg=======")
        if(res.data.errcode) {
          console.log(res.data.errcode+":"+res.data.errmsg);
        }
        // console.log(res.data)
    }).catch(err => {
        console.log(err);
    });
}


export {
    checkCorpSignature,
    syncMsg,
    sendCustomerMsg,
    msgdecrypt,
    checkServiceState,
    changeServiceState,
}