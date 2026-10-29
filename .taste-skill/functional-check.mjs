import assert from 'node:assert/strict';
import { readFileSync, mkdirSync } from 'node:fs';
import Papa from 'papaparse';
import { chromium } from 'file:///C:/Users/yenmo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const base=process.env.ASSIGNMENT_TEST_URL ?? 'http://localhost:4173';
const output='.taste-skill/verification';
mkdirSync(output,{recursive:true});
const rows=Papa.parse(new TextDecoder('windows-1252').decode(readFileSync('public/data.csv')),{skipEmptyLines:'greedy'}).data;
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
let checks=0;
async function scenario({mode='success',expires=3600,reducedMotion='reduce',width=1440,height=900}={}) {
 const context=await browser.newContext({viewport:{width,height},reducedMotion});
 const page=await context.newPage(); page.setDefaultTimeout(10000); const requests=[];const errors=[];let status=200;let sheetRows=rows;
 page.on('pageerror',error=>errors.push(error.message));
 const identityStub = ({mode,expires}) => {
  window.google = { accounts: { oauth2: { initTokenClient(config) {
   return { requestAccessToken() {
    if (mode === 'popup') config.error_callback({type:'popup_closed'});
    else if (mode === 'denied') config.callback({error:'access_denied'});
    else config.callback({access_token:'test-token',expires_in:expires,scope:mode==='scope'?'openid email profile':'openid email profile https://www.googleapis.com/auth/spreadsheets.readonly'});
   } };
  } } } };
 };
 await page.route('https://accounts.google.com/gsi/client',route=>route.fulfill({contentType:'application/javascript',body:`(${identityStub.toString()})(${JSON.stringify({mode,expires})});`}));
 await page.route('https://openidconnect.googleapis.com/v1/userinfo',route=>{
  assert.equal(route.request().headers().authorization,'Bearer test-token');
  return route.fulfill({json:mode==='unverified'?{email:'qa@example.invalid',email_verified:false}:{email:'qa@example.invalid',name:'QA User',email_verified:true}});
 });
 await page.route('https://sheets.googleapis.com/**',route=>{
  requests.push(route.request());assert.equal(route.request().headers().authorization,'Bearer test-token');
  assert.ok(decodeURIComponent(route.request().url()).endsWith('/values/People!A1:F201'));
  return route.fulfill({status,json:status===200?{values:sheetRows}:{error:{message:'Test API error'}}});
 });
 await page.route('https://fonts.googleapis.com/**', route => route.abort());
 await page.goto(base, {waitUntil:'domcontentloaded'});
 try { await page.getByRole('button',{name:'Sign in with Google',exact:true}).waitFor({state:'visible'}); } catch(error) { console.log('Loading diagnostics:', await page.locator('body').innerText(), errors); throw error; }
 assert.equal(await page.locator('.person-tile').count(),0);assert.equal(requests.length,0);
 try { await page.getByRole('button',{name:'Sign in with Google',exact:true}).click(); } catch(error) { console.log('Sign-in diagnostics:', await page.locator('body').innerText(), errors); throw error; }
 return {page,context,requests,errors,setStatus:value=>{status=value},setRows:value=>{sheetRows=value}};
}
async function dimensions(page) {
 await page.waitForFunction(() => [...document.querySelectorAll('.person-tile')].every(t => t.style.transform.includes('matrix3d')));
 await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
 return page.locator('.person-tile').evaluateAll(tiles=>{
  const coords=tiles.map(t=>{const m=t.style.transform.match(/matrix3d\(([^)]+)\)/)[1].split(',').map(Number);return [m[12],m[13],m[14]]});
  return [0,1,2].map(axis=>new Set(coords.map(c=>Number(c[axis].toFixed(5)))).size);
 });
}
try {
 const s=await scenario();const {page}=s;
 await page.waitForFunction(()=>document.querySelectorAll('.person-tile').length===200);
 assert.deepEqual(await dimensions(page),[20,10,1]);checks++;
 for(const layout of ['Sphere','Helix','Grid','Table']) {
  await page.getByRole('button',{name:layout,exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('.person-tile')?.style.transform.includes('matrix3d'));
  const actual=await dimensions(page);
  if(layout==='Grid') assert.deepEqual(actual,[5,4,10]);
  if(layout==='Table') assert.deepEqual(actual,[20,10,1]);
  if(layout==='Sphere') assert.ok(actual[0]>100&&actual[2]>100);
  if(layout==='Helix') assert.equal(actual[1],100);
  assert.equal(await page.getByRole('button',{name:layout,exact:true}).getAttribute('aria-pressed'),'true');
  await page.screenshot({path:`${output}/desktop-${layout.toLowerCase()}.png`,fullPage:true});checks++;
 }
 const transform=await page.locator('.three-scene').evaluate(el=>el.firstElementChild.firstElementChild.firstElementChild.style.transform);
 await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
 const zoomed=await page.locator('.three-scene').evaluate(el=>el.firstElementChild.firstElementChild.firstElementChild.style.transform);
 assert.notEqual(transform,zoomed); await page.getByRole('button',{name:'Reset view'}).click();checks++;
 assert.equal(await page.locator('.tile-country').first().textContent(),'CN');assert.equal(await page.locator('.tile-age').first().textContent(),'25');checks++;
 s.setStatus(403);await page.getByRole('button',{name:'Refresh data'}).click();await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').innerText(),/Google denied access/);
 s.setStatus(200);await page.getByRole('button',{name:'Try again'}).click();await page.waitForFunction(()=>document.querySelectorAll('.person-tile').length===200);checks++;
 s.setRows([rows[0]]);await page.getByRole('button',{name:'Refresh data'}).click();await page.getByRole('heading',{name:'No people in this collection'}).waitFor();checks++;
 s.setRows([['Name','Age'],['Incomplete','25']]);await page.getByRole('button',{name:'Refresh data'}).click();await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').innerText(),/Missing CSV column/);checks++;
 s.setStatus(401);await page.getByRole('button',{name:'Try again'}).click();await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').innerText(),/Sign out and sign in/);checks++;
 await page.getByRole('button',{name:'Sign out',exact:true}).click();await page.getByRole('button',{name:'Sign in with Google',exact:true}).waitFor();assert.equal(await page.locator('.person-tile').count(),0);assert.equal(await page.evaluate(()=>localStorage.length+sessionStorage.length),0);assert.deepEqual(s.errors,[]);checks++;
 await s.context.close();
 for(const mode of ['popup','denied','scope','unverified']) {
  const s=await scenario({mode});await s.page.getByRole('alert').waitFor();assert.equal(s.requests.length,0);assert.equal(await s.page.locator('.person-tile').count(),0);assert.deepEqual(s.errors,[]);checks++;await s.context.close();
 }
 const expired=await scenario({expires:1});await expired.page.getByRole('button',{name:'Sign out',exact:true}).waitFor();await expired.page.getByRole('alert').waitFor();assert.match(await expired.page.getByRole('alert').innerText(),/session expired/);assert.equal(await expired.page.locator('.person-tile').count(),0);checks++;await expired.context.close();
 for(const width of [768,390]) {
  const s=await scenario({width,height:width===390?844:1024});await s.page.waitForFunction(()=>document.querySelectorAll('.person-tile').length===200);
  for(const layout of ['Table','Sphere','Helix','Grid']) {
   await s.page.getByRole('button',{name:layout,exact:true}).click();
   assert.equal(await s.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await s.page.screenshot({path:`${output}/${width}-${layout.toLowerCase()}.png`,fullPage:true});checks++;
  }
  await s.page.getByRole('button',{name:'Sign out',exact:true}).click();await s.page.screenshot({path:`${output}/${width}-sign-in.png`,fullPage:true});assert.deepEqual(s.errors,[]);await s.context.close();
 }
 const motion=await scenario({reducedMotion:'no-preference'});await motion.page.waitForFunction(()=>document.querySelectorAll('.person-tile').length===200);
 await motion.page.getByRole('button',{name:'Sphere',exact:true}).click();await motion.page.waitForTimeout(350);const mid=await dimensions(motion.page);assert.ok(mid[2]>1);await motion.page.screenshot({path:`${output}/sphere-mid-transition.png`,fullPage:true});
 await motion.page.getByRole('button',{name:'Grid',exact:true}).click();await motion.page.waitForTimeout(1150);assert.deepEqual(await dimensions(motion.page),[5,4,10]);assert.deepEqual(motion.errors,[]);checks++;await motion.context.close();
 console.log(`PASS: ${checks} browser checks, including auth errors, verified identity, authenticated Sheet requests, all layouts, camera controls, refresh, empty/malformed/denied data, sign-out, expiry, reduced motion, transitions, and desktop/tablet/mobile rendering.`);
} finally {await browser.close();}






