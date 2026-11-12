/* global document, localStorage, console, setTimeout */
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
const server=spawn('python3',['-m','http.server','8793','--bind','127.0.0.1','--directory','apps/web/dist'],{stdio:'ignore'});
const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--enable-unsafe-swiftshader']});
try{for(const width of [390,1365]){
 const p=await b.newPage();await p.setViewport({width,height:844});const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await p.evaluateOnNewDocument(()=>localStorage.setItem('windermere-chrome-pin','1'));
 await p.goto('http://127.0.0.1:8793');await p.waitForSelector('.veil',{hidden:true});
 const yaw=()=>p.$eval('canvas',e=>+e.dataset.yaw);
 assert.equal(await p.$eval('html',e=>e.dataset.osReduce),'true');
 await p.focus('canvas');const first=await yaw();await p.keyboard.press('ArrowRight');assert.ok(Math.abs((await yaw())-first-Math.PI/18)<0.00002);
 await p.click('[aria-label="Calm settings"]');const pose=await yaw();
 const bounds=await (await p.$('[aria-label="Calm settings"]')).boundingBox();await p.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await p.mouse.down();await p.mouse.move(bounds.x-100,bounds.y+80,{steps:8});await p.mouse.up();assert.equal(await yaw(),pose);
 assert.equal(await p.$$eval('[role="switch"]',es=>es.filter(e=>e.textContent.includes('Reduced motion')).length),0);
 await p.click('.look-choices button');assert.ok((await yaw())<pose);
 await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}]);await p.waitForFunction(()=>document.documentElement.dataset.osReduce==='false');
 await p.click('[aria-label="Calm settings"]');
 await p.mouse.move(width/2,400);await p.mouse.down();await p.mouse.move(width/2-60,400,{steps:6});
 await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await p.waitForFunction(()=>document.documentElement.dataset.osReduce==='true');const stop=await yaw();
 await p.mouse.move(width/2-120,400,{steps:6});await p.mouse.up();assert.equal(await yaw(),stop);
 await new Promise(r=>setTimeout(r,400));assert.equal(await yaw(),stop);
 await p.screenshot({path:`/downloads/windermere-calm/gate-${width}.png`});assert.deepEqual(errors,[]);console.log('PASS calm OS initial/live, keyboard/tap, chrome guard, interrupted drag, no release drift',width);await p.close();
}}finally{await b.close();server.kill();}
