import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
const __filenameNew = fileURLToPath(import.meta.url);
const __dirnameNew = path.dirname(__filenameNew);

const BASE_PATH = path.resolve(__dirnameNew, "../..");//根目录

async function writeJsonToFile(file, data) {
    return new Promise((resolve, reject) => {
        try{
            if(!file) file = BASE_PATH + "/._" + Math.random()+".json";
            fs.writeFile(
                BASE_PATH + "/._"+file,
                JSON.stringify(data),
                () => {
                // console.log("文件"+file+"成功写入");
                resolve();
                }
            );
        } catch (err) { 
            console.log(err);
            reject();
        }
    })
    
}

async function readJsonFromFile(file) {
    return new Promise((resolve, reject) => {
        fs.readFile(BASE_PATH + "/._" + file, (err, data) => {
            // console.log("cursor file data", data);
            if(!data) {
                // reject();
                resolve("");
                return;
            }
            resolve(JSON.parse(data));
        });
    });
}

export {
    writeJsonToFile,
    readJsonFromFile
}