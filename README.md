# wechat_with_bot

A chatgpt server for wechat &amp; wecom

## Requirements

- node >= 14.17.6
- npm >= 6.14.18

## Installation

```shell
git clone https://github.com/zhaojh10010/wechat_with_bot.git
```

```shell
cd wechat_with_bot
npm install
or
yarn install
```

modify `wechat_with_bot/src/conf/config.js` to add your wechat token and chatgpt token

- `token`: wechat verify token
- `encodingAESKey`: wechat encrypt key
- `qytoken`: wecom verify token
- `qyEncodingAESKey`: wecom encrypt key
- `corpid`: wecom corporation id
- `corpsecret`: wecom corporation secret
- `appid`: wechat official account appid
- `appsecret`: wechat official account appsecret
- `accName`: wechat official account name
- `OPENAI_API_KEY`: chatgpt api key

> see [WeChat Configuration](https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Access_Overview.html) for wechat dev tutorial
> see [WeCom Configuration](https://developer.work.weixin.qq.com/document/path/90664) for wecom dev tutorial
> see [ChatGPT Configuration](https://platform.openai.com/docs/introduction) for chatgpt api tutorial

## Usage

Use `npm run qy` to start wecom server, default port is `34110`

Use `npm run wx` to start wechat official account server, default port is `34111`

## Notice

- wechat needs a domain to verify your server, maybe `nginx` is suitable for reverse proxy
- To communicate with openai chatgpt, you need to use proxy or deploy this project in a foreign VPS
