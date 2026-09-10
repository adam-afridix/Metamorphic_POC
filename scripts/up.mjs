import puppeteer from "puppeteer-core";
const B="http://localhost:5173/#";
const b=await puppeteer.launch({executablePath:"C:/Program Files/Google/Chrome/Application/chrome.exe",headless:"new",args:["--no-sandbox","--window-size=1440,960"]});
const p=await b.newPage(); await p.setViewport({width:1440,height:960});
const errs=[]; p.on("pageerror",e=>errs.push(e.message)); p.on("console",m=>{if(m.type()==="error"&&!m.text().includes("404"))errs.push(m.text())});
const w=ms=>new Promise(r=>setTimeout(r,ms));
const click=t=>p.evaluate(t=>{const e=[...document.querySelectorAll("button,a")].find(b=>b.textContent.trim().includes(t)); if(e){e.click();return true;} return false;},t);
await p.goto(B+"/setup",{waitUntil:"domcontentloaded"}); await w(700);
await click("Upload Model"); await click("Upload Dataset"); await w(120);
await click("Use example"); await w(120);
await click("Start Agentic Test"); await w(500);
await click("Skip to end"); await w(1400);
for (const th of ["warm","dark"]) {
  await p.evaluate(t=>{localStorage.setItem("metamorph-theme",t); if(t==="dark")document.documentElement.setAttribute("data-theme","dark"); else document.documentElement.removeAttribute("data-theme");},th);
  for (const [h,n] of [["/","dash"],["/mr","mr"],["/testing","testing"],["/results","results"],["/violations","viol"],["/report","report"]]) {
    await p.goto(B+h,{waitUntil:"domcontentloaded"}); await w(650);
    await p.screenshot({path:`scripts/u-${th}-${n}.png`, fullPage:(n==="report"||n==="mr")});
  }
}
await b.close();
console.log(errs.length?"ERR:\n"+[...new Set(errs)].join("\n"):"no errors");
