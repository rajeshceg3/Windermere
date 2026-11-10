/* global process,console,document,getComputedStyle,innerWidth,setTimeout */
import puppeteer from 'puppeteer-core'; import assert from 'node:assert/strict'; import fs from 'node:fs';
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--hide-scrollbars']});const results=[];const out=process.env.OUT||'verification/lake-depth/local';fs.mkdirSync(out,{recursive:true});
try{for(const w of JSON.parse(process.env.WIDTHS||'[390]'))for(const motion of JSON.parse(process.env.MOTIONS||'["reduce","no-preference"]')){
const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(String(e)));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await p.setViewport({width:w,height:844});await p.emulateMediaFeatures([{name:'prefers-reduced-motion',value:motion}]);await p.goto(process.env.BASE_URL||'http://127.0.0.1:8791/');await p.waitForSelector('.veil',{hidden:true,timeout:15000});
for(let ch=0;ch<3;ch++){
await p.evaluate(ch=>document.querySelectorAll('.time-dock button')[ch].click(),ch);await new Promise(r=>setTimeout(r,7000));
const target=[{yaw:0,pitch:-.08},{yaw:.08,pitch:-.11},{yaw:-.03,pitch:-.07}][ch];
await p.mouse.move(w*.55,300);await p.mouse.down();await p.mouse.move(w*.2,350,{steps:8});await p.mouse.up();await p.click('[aria-label="Reset lake view"]');await new Promise(r=>setTimeout(r,2000));
const state=await p.evaluate(()=>({yaw:+document.querySelector('canvas').dataset.yaw,pitch:+document.querySelector('canvas').dataset.pitch,nav:[...document.querySelectorAll('.time-dock button')].map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,visible:getComputedStyle(e.querySelector('.time-label')).opacity,name:e.getAttribute('aria-label')}}),overflow:document.documentElement.scrollWidth>innerWidth,muted:document.querySelector('[aria-label="Unmute the lake"]')?.getAttribute('aria-pressed')}));
assert.ok(Math.abs(state.yaw-target.yaw)<.006&&Math.abs(state.pitch-target.pitch)<.006,JSON.stringify(state));assert.ok(state.nav.every(n=>n.w>=44&&n.h>=44&&+n.visible===1&&n.name));assert.ok(!state.overflow);assert.equal(state.muted,'false');
await p.screenshot({path:`${out}/gate-${w}-${motion}-${ch}.png`});
results.push({w,motion,ch,resetHeld:true,labels:true,targets:true,audioOff:true});
}
await p.click('[aria-label="Calm settings"]');assert.ok(await p.$('.calm-sheet.is-open'));await p.keyboard.press('Tab');assert.ok(await p.evaluate(()=>document.activeElement?.tagName==='BUTTON'));assert.deepEqual(errors,[]);await p.close();}
fs.writeFileSync(`${out}/gate-${process.env.WIDTHS||'390'}-${process.env.MOTIONS||'both'}.json`,JSON.stringify(results,null,2));console.log(results);
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
