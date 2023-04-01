import fs from 'fs';
import path from 'path';
import http from 'axios';
import config from '../conf/config.js';

import { fileURLToPath } from 'url'
const __filenameNew = fileURLToPath(import.meta.url)
const __dirnameNew = path.dirname(__filenameNew)

const fileUrl = path.resolve(__dirnameNew, "../../.token.json");
const APPID = config.appid; // 测试号的 APPID
const APPSECRET = config.appsecret; // 测试号的 APPSECRET
let INTERTIME = (7200 - 60) * 1000; // 设置一个默认的定期获取token的时间

// 保存Token
function setToken() {
  return new Promise((resolve, reject) => {
    http
      .get(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${APPSECRET}`
      )
      .then((res) => {
        //console.log("=====access token=====");
        // console.log(res);
        if(res.data.errcode) {
          console.log(res.data.errcode+":"+res.data.errmsg);
          console.log("获取access_token失败!");
        }
        // 更新token的过期时间，每隔这个时间重新获取一次token
        INTERTIME = (res.data.expires_in - 60) * 1000;
        // 获取到Token后保存到json文件中
        fs.writeFile(
          fileUrl,
          JSON.stringify({
            token: res.data.access_token,
          }),
          () => {
            // 通知外界Token获取成功
            resolve();
          }
        );
      }).catch(error => {
        // console.log("================")
        // console.log(error)
      });
  });
}

// 定时获取Token
function timingSetToken() {
  // 定时刷新token
  setInterval(() => {
    setToken();
  }, INTERTIME);
}

// 获取Token
function getToken() {
  return new Promise((resolve, reject) => {
    // 从json中读取保存的Token
    fs.readFile(fileUrl, (err, data) => {
      // 返回获取到的token
      if(!data) {
        reject();
        return;
      }
      resolve(JSON.parse(data).token);
    });
  });
}

// 导出封装好的方法
export {
  setToken, // 更新token
  getToken, // 返回获取到的token
  timingSetToken, // 定时更新token
};
