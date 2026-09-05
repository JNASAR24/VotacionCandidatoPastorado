const STORAGE_KEY = "ibrcv_votacion_naifer";
const ADMIN_PASSWORD = "ADMINICRCV17";
const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"agree":0,"disagree":0}');
const demoState = JSON.parse(sessionStorage.getItem("ibrcv_demo") || '{"agree":0,"disagree":0}');
let chartCanvas;
let pendingVote = null;
let currentVoteMode = "real";

const $ = (id) => document.getElementById(id);

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
function saveDemoState(){
  sessionStorage.setItem("ibrcv_demo", JSON.stringify(demoState));
}

function showView(name){
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const view = $("view-" + name);
  if(view) view.classList.add("active");
  window.scrollTo({top:0, behavior:"smooth"});
  if(name === "admin") updateAdmin();
}

document.querySelectorAll("[data-go]").forEach(btn => {
  btn.addEventListener("click", () => {
    if(btn.dataset.go === "admin"){
    $("admin-password").value = "";
    $("admin-login-error").textContent = "";
    showView("admin-login");
    } else {
      showView(btn.dataset.go);
    }
  });
});

function showToast(message){
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3200);
}

/* ===== Modal ===== */
function openModal({icon="?", kicker="Confirmación", title="", text="", actions=[]}){
  $("modal-icon").textContent = icon;
  $("modal-kicker").textContent = kicker;
  $("modal-title").textContent = title;
  $("modal-text").textContent = text;
  const actionsBox = $("modal-actions");
  actionsBox.innerHTML = "";
  actions.forEach(action => {
    const btn = document.createElement("button");
    btn.className = "modal-btn " + (action.className || "");
    btn.textContent = action.label;
    btn.addEventListener("click", action.onClick);
    actionsBox.appendChild(btn);
  });
  $("modal-overlay").classList.add("show");
  $("modal-overlay").setAttribute("aria-hidden","false");
}
function closeModal(){
  $("modal-overlay").classList.remove("show");
  $("modal-overlay").setAttribute("aria-hidden","true");
}
$("modal-close").addEventListener("click", closeModal);
$("modal-overlay").addEventListener("click", (e) => {
  if(e.target === $("modal-overlay")) closeModal();
});

function askVoteConfirmation(mode, type){
  pendingVote = type;
  currentVoteMode = mode;
  const label = type === "agree" ? "Estoy de acuerdo" : "No estoy de acuerdo";
  openModal({
    icon: "✓",
    kicker: mode === "demo" ? "Demo · Confirmación" : "Confirmación del voto",
    title: "¿Está seguro de su voto?",
    text: `Ha seleccionado: “${label}”. Si está seguro, confirme su voto. Si desea cambiarlo, puede corregirlo.`,
    actions: [
      {
        label: "✓ Estoy seguro",
        className: "modal-confirm",
        onClick: () => confirmPendingVote()
      },
      {
        label: "↶ Corregir voto",
        className: "modal-correct",
        onClick: () => correctPendingVote()
      }
    ]
  });
}

function confirmPendingVote(){
  if(!pendingVote) return;
  const type = pendingVote;
  const mode = currentVoteMode;

  if(mode === "real"){
    state[type]++;
    saveState();
    document.querySelectorAll("[data-vote]").forEach(b => b.disabled = true);
  } else {
    demoState[type]++;
    saveDemoState();
    document.querySelectorAll("[data-demo-vote]").forEach(b => b.disabled = true);
  }

  pendingVote = null;
  closeModal();

  // Segundo modal: voto confirmado + botón Continuar para el siguiente votante.
  setTimeout(() => {
    openModal({
      icon: "✓",
      kicker: mode === "demo" ? "Demo · Voto confirmado" : "Voto confirmado",
      title: "Voto confirmado",
      text: "El voto ha sido registrado correctamente. Pulse Continuar para permitir que el siguiente votante utilice la aplicación.",
      actions: [{
        label: "Continuar",
        className: "modal-continue",
        onClick: () => {
          closeModal();
          if(mode === "real"){
            $("vote-message").textContent = "✓ Voto confirmado. Listo para el siguiente votante.";
            resetVoterForNext();
          } else {
            $("demo-vote-message").textContent = "✓ Voto confirmado en la DEMO.";
            resetDemoForNext();
          }
        }
      }]
    });
  }, 120);
}

function correctPendingVote(){
  pendingVote = null;
  closeModal();
  if(currentVoteMode === "real"){
    document.querySelectorAll("[data-vote]").forEach(b => b.disabled = false);
    $("vote-message").textContent = "Puede corregir su voto. Seleccione nuevamente una opción.";
    showView("voter");
    setTimeout(() => {
      openModal({
        icon: "↶",
        kicker: "Corrección de voto",
        title: "Seleccione nuevamente",
        text: "Puede elegir el mismo voto o cambiarlo. Recuerde confirmar cuando esté seguro.",
        actions: [{
          label: "Continuar",
          className: "modal-continue",
          onClick: closeModal
        }]
      });
    }, 180);
  } else {
    document.querySelectorAll("[data-demo-vote]").forEach(b => b.disabled = false);
    $("demo-vote-message").textContent = "Puede corregir su voto en la DEMO.";
    showView("demo");
    setTimeout(() => {
      openModal({
        icon: "↶",
        kicker: "Demo · Corrección",
        title: "Puede votar nuevamente",
        text: "El voto anterior no fue contabilizado. Seleccione nuevamente una opción.",
        actions: [{
          label: "Continuar",
          className: "modal-continue",
          onClick: closeModal
        }]
      });
    }, 180);
  }
}

function resetVoterForNext(){
  document.querySelectorAll("[data-vote]").forEach(b => b.disabled = false);
  $("vote-message").textContent = "";
  showView("voter");
}
function resetDemoForNext(){
  document.querySelectorAll("[data-demo-vote]").forEach(b => b.disabled = false);
  $("demo-vote-message").textContent = "";
  showView("demo");
}

document.querySelectorAll(".vote-btn[data-vote]").forEach(btn => {
  btn.addEventListener("click", () => askVoteConfirmation("real", btn.dataset.vote));
});
document.querySelectorAll(".vote-btn[data-demo-vote]").forEach(btn => {
  btn.addEventListener("click", () => askVoteConfirmation("demo", btn.dataset.demoVote));
});

/* ===== Admin login ===== */
$("admin-login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const value = $("admin-password").value;
  if(value === ADMIN_PASSWORD){
    $("admin-password").value = "";
    $("admin-login-error").textContent = "";
    showToast("Acceso de administrador autorizado.");
    showView("admin");
  } else {
    $("admin-login-error").textContent = "Clave incorrecta. Verifique e intente nuevamente.";
    $("admin-password").select();
  }
});

/* ===== Admin ===== */
function getTotals(){
  const total = state.agree + state.disagree;
  const approval = total ? Math.round((state.agree / total) * 100) : 0;
  return {total, approval};
}
function updateAdmin(){
  const {total, approval} = getTotals();
  $("totalVotes").textContent = total;
  $("agreeVotes").textContent = state.agree;
  $("disagreeVotes").textContent = state.disagree;
  $("approvalPercent").textContent = approval + "%";
  $("reportDate").textContent = new Intl.DateTimeFormat("es-CO", {dateStyle:"long"}).format(new Date());
  $("resultLabel").textContent = total === 0 ? "Sin votos" : `${approval}% de aprobación`;
  drawChart();
}
function drawChart(){
  const canvas = $("voteChart");
  chartCanvas = canvas;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = "#0d1d32"; ctx.fillRect(0,0,w,h);

  const pad = {left:75,right:35,top:35,bottom:60};
  const chartW = w-pad.left-pad.right, chartH = h-pad.top-pad.bottom;
  const max = Math.max(1, state.agree, state.disagree);
  const top = Math.max(5, Math.ceil(max * 1.25));
  const values = [state.agree, state.disagree];
  const labels = ["De acuerdo", "No de acuerdo"];

  ctx.font = "12px Inter, sans-serif"; ctx.textAlign = "right";
  for(let i=0;i<=4;i++){
    const val = Math.round(top*i/4);
    const y = pad.top + chartH - (chartH*i/4);
    ctx.strokeStyle = "rgba(255,255,255,.09)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(pad.left,y); ctx.lineTo(w-pad.right,y); ctx.stroke();
    ctx.fillStyle = "#8794a7"; ctx.fillText(val, pad.left-12, y+4);
  }

  const barW = Math.min(150, chartW/4);
  values.forEach((val,i)=>{
    const x = pad.left + chartW*(i+.5)/2 - barW/2;
    const bh = val/top*chartH, y = pad.top + chartH - bh;
    const gradient = ctx.createLinearGradient(0,y,0,pad.top+chartH);
    if(i===0){gradient.addColorStop(0,"#62c995");gradient.addColorStop(1,"#1d7651")}
    else {gradient.addColorStop(0,"#e98b91");gradient.addColorStop(1,"#9c3942")}
    ctx.fillStyle = gradient; roundRect(ctx,x,y,barW,Math.max(2,bh),12); ctx.fill();
    ctx.fillStyle = "#f6f0e6"; ctx.font = "700 18px Inter, sans-serif"; ctx.textAlign="center";
    ctx.fillText(val,x+barW/2,Math.max(25,y-10));
    ctx.fillStyle = "#aab5c5"; ctx.font = "11px Inter, sans-serif";
    ctx.fillText(labels[i],x+barW/2,h-26);
  });
}
function roundRect(ctx,x,y,w,h,r){
  r = Math.min(r,w/2,h/2);
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

$("resetVotes").addEventListener("click", () => {
  openModal({
    icon:"!",
    kicker:"Administración",
    title:"¿Restablecer la votación?",
    text:"Esta acción borrará todos los votos registrados para la votación de Naifer Lovera. Esta operación no se puede deshacer.",
    actions:[
      {label:"Sí, restablecer",className:"modal-correct",onClick:()=>{
        state.agree=0; state.disagree=0; saveState(); updateAdmin(); closeModal(); showToast("Votos restablecidos.");
      }},
      {label:"Cancelar",className:"modal-confirm",onClick:closeModal}
    ]
  });
});

/* ===== Reset total de aplicación ===== */
$("resetApp").addEventListener("click", () => {
  openModal({
    icon:"⚙",
    kicker:"Reinicio completo",
    title:"Reiniciar la aplicación",
    text:"Se borrarán los votos, configuraciones y datos locales del navegador. Luego se solicitará la clave de administrador antes de reiniciar.",
    actions:[
      {label:"Cancelar",className:"modal-confirm",onClick:closeModal},
      {label:"Continuar",className:"modal-correct",onClick:()=>requestResetPassword()}
    ]
  });
});

function requestResetPassword(){
  closeModal();
  setTimeout(()=>{
    openModal({
      icon:"🔐",
      kicker:"Autorización requerida",
      title:"Clave de administrador",
      text:"Ingrese la clave para ejecutar el reinicio completo.",
      actions:[
        {
          label:"Cancelar",className:"modal-confirm",onClick:closeModal
        },
        {
          label:"Validar clave",className:"modal-correct",onClick:validateResetPassword
        }
      ]
    });
    // Inject a password field into the modal text area.
    const input = document.createElement("input");
    input.id = "reset-password-input";
    input.type = "password";
    input.autocomplete = "off";
    input.placeholder = "ADMINICRCV17";
    input.style.cssText = "width:100%;border:1px solid rgba(255,255,255,.14);background:#071222;color:#f6f0e6;border-radius:11px;padding:13px;margin:0 0 12px;outline:none;";
    $("modal-text").after(input);
    input.focus();
  },120);
}

async function validateResetPassword(){
  const input = $("reset-password-input");
  if(!input || input.value !== ADMIN_PASSWORD){
    showToast("Clave incorrecta.");
    input?.focus();
    return;
  }
  closeModal();
  await clearApplicationData();
  location.reload();
}

async function clearApplicationData(){
  try{ localStorage.clear(); }catch(e){}
  try{ sessionStorage.clear(); }catch(e){}
  try{
    if("caches" in window){
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  }catch(e){}
  // No service worker is used by this project, but unregister any existing one for this origin.
  try{
    if("serviceWorker" in navigator){
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r => r.unregister()));
    }
  }catch(e){}
}

/* ===== PDF generator ===== */
async function generatePDF({demo=false}={}){
  const jsPDF = window.jspdf?.jsPDF;
  if(!jsPDF){
    showToast("No se pudo cargar el generador PDF. Verifique su conexión.");
    return;
  }

  const values = demo ? demoState : state;
  const total = values.agree + values.disagree;
  const approval = total ? Math.round(values.agree / total * 100) : 0;
  const doc = new jsPDF({unit:"mm",format:"a4"});
  const navy=[8,20,38], gold=[180,138,74], cream=[246,240,230];

  doc.setFillColor(...navy); doc.rect(0,0,210,297,"F");
  doc.setDrawColor(...gold); doc.setLineWidth(.7); doc.rect(10,10,190,277);

  const logoData = await imageToDataURL("images/logo_IBRCV.png");
  if(logoData) doc.addImage(logoData,"PNG",17,17,22,22);

  doc.setTextColor(...gold); doc.setFont("helvetica","bold"); doc.setFontSize(9);
  doc.text("IGLESIA BAUTISTA REFORMADA CRISTO VIENE · IBRCV",105,22,{align:"center"});
  doc.setTextColor(...cream); doc.setFontSize(23);
  doc.text(demo ? "PDF DE PRUEBA" : "Reporte de Votación Pastoral",105,37,{align:"center"});
  doc.setFontSize(13); doc.setTextColor(...gold);
  doc.text(demo ? "Candidato de demostración: Sr. Kiwi" : "Candidato: Naifer Lovera",105,48,{align:"center"});

  doc.setTextColor(...cream); doc.setFontSize(10);
  doc.text("Fecha: " + new Intl.DateTimeFormat("es-CO",{dateStyle:"long"}).format(new Date()),20,62);
  doc.text("Total de votos: " + total,20,70);

  let y=84;
  doc.setFillColor(...gold); doc.roundedRect(20,y,170,10,2,2,"F");
  doc.setTextColor(...navy); doc.setFontSize(9);
  doc.text("OPCIÓN",25,y+6.5); doc.text("VOTOS",120,y+6.5); doc.text("%",165,y+6.5);
  y+=14;
  [["Estoy de acuerdo",values.agree,total?Math.round(values.agree/total*100)+"%":"0%"],
   ["No estoy de acuerdo",values.disagree,total?Math.round(values.disagree/total*100)+"%":"0%"]].forEach((r,i)=>{
    doc.setFillColor(i===0?25:45, i===0?70:45, i===0?52:52);
    doc.roundedRect(20,y,170,12,2,2,"F");
    doc.setTextColor(...cream); doc.text(r[0],25,y+7.5); doc.text(String(r[1]),120,y+7.5); doc.text(r[2],165,y+7.5);
    y+=16;
  });

  doc.setFillColor(28,45,61); doc.roundedRect(20,128,170,30,3,3,"F");
  doc.setTextColor(...gold); doc.setFontSize(9); doc.text("PORCENTAJE DE APROBACIÓN",28,139);
  doc.setTextColor(...cream); doc.setFontSize(22); doc.text(approval+"%",28,151);

  // Build a temporary chart image using the current real/demo values.
  const chart = document.createElement("canvas"); chart.width=760; chart.height=380;
  const ctx=chart.getContext("2d");
  ctx.fillStyle="#0d1d32";ctx.fillRect(0,0,760,380);
  const vals=[values.agree,values.disagree], labels=["De acuerdo","No de acuerdo"], max=Math.max(1,...vals), top=Math.max(5,Math.ceil(max*1.25));
  const pad={left:75,right:35,top:35,bottom:60}, cw=760-pad.left-pad.right, ch=380-pad.top-pad.bottom;
  ctx.font="12px Inter,sans-serif";ctx.textAlign="right";
  for(let i=0;i<=4;i++){const yy=pad.top+ch-(ch*i/4),vv=Math.round(top*i/4);ctx.strokeStyle="rgba(255,255,255,.09)";ctx.beginPath();ctx.moveTo(pad.left,yy);ctx.lineTo(725,yy);ctx.stroke();ctx.fillStyle="#8794a7";ctx.fillText(vv,pad.left-12,yy+4);}
  vals.forEach((val,i)=>{const bw=150,x=pad.left+cw*(i+.5)/2-bw/2,bh=val/top*ch,yy=pad.top+ch-bh,g=ctx.createLinearGradient(0,yy,0,pad.top+ch);if(i===0){g.addColorStop(0,"#62c995");g.addColorStop(1,"#1d7651")}else{g.addColorStop(0,"#e98b91");g.addColorStop(1,"#9c3942")}ctx.fillStyle=g;roundRect(ctx,x,yy,bw,Math.max(2,bh),12);ctx.fill();ctx.fillStyle="#f6f0e6";ctx.font="700 18px Inter,sans-serif";ctx.textAlign="center";ctx.fillText(val,x+bw/2,Math.max(25,yy-10));ctx.fillStyle="#aab5c5";ctx.font="11px Inter,sans-serif";ctx.fillText(labels[i],x+bw/2,354);});
  doc.addImage(chart.toDataURL("image/png"),"PNG",22,168,166,83);

  doc.setTextColor(135,148,167); doc.setFontSize(8);
  doc.text(demo ? "PDF DE PRUEBA · Este documento corresponde al modo DEMO." : "Documento generado desde el sistema de votación IBRCV.",105,269,{align:"center"});
  doc.text("Para una elección real, conecte el sistema a un servidor/base de datos.",105,275,{align:"center"});
  doc.save(demo ? "PDF_DE_PRUEBA_IBRCV_Sr_Kiwi.pdf" : "Reporte_Votacion_IBRCV_Naifer_Lovera.pdf");
  showToast(demo ? "PDF de prueba generado." : "Reporte PDF generado.");
}

$("pdfButton").addEventListener("click", () => generatePDF({demo:false}));
$("demo-pdf").addEventListener("click", () => generatePDF({demo:true}));

function imageToDataURL(src){
  return new Promise(resolve=>{
    const img=new Image();
    img.crossOrigin="anonymous";
    img.onload=()=>{const c=document.createElement("canvas");c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext("2d").drawImage(img,0,0);resolve(c.toDataURL("image/png"));};
    img.onerror=()=>resolve(null);
    img.src=src;
  });
}

/* ===== Pantalla de carga: 5 segundos + aviso ===== */
function startLoading(){
  const screen=$("loading-screen"), bar=$("loading-progress-bar"), percent=$("loading-percent");
  const start=performance.now(), duration=5000;
  function tick(now){
    const progress=Math.min(1,(now-start)/duration);
    const value=Math.round(progress*100);
    bar.style.width=value+"%"; percent.textContent=value+"%";
    if(progress<1) requestAnimationFrame(tick);
    else setTimeout(()=>{
      screen.classList.add("hidden");
      openModal({
        icon:"✓",
        kicker:"Sistema listo",
        title:"Aplicación de votación lista para continuar",
        text:"El sistema está preparado. Seleccione Votante, Administrador o DEMO para continuar.",
        actions:[{label:"Continuar",className:"modal-continue",onClick:closeModal}]
      });
    },250);
  }
  requestAnimationFrame(tick);
}

updateAdmin();
startLoading();
