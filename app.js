const keyInput=document.querySelector('#print-key');
const revealButton=document.querySelector('#reveal');
const connectButton=document.querySelector('#connect');
const senderInput=document.querySelector('#sender-name');
const messageInput=document.querySelector('#message');
const textModeButton=document.querySelector('#mode-text');
const imageModeButton=document.querySelector('#mode-image');
const messageControls=document.querySelector('#message-controls');
const imageControls=document.querySelector('#image-controls');
const imageInput=document.querySelector('#image-file');
const imagePreview=document.querySelector('#image-preview');
const imagePlaceholder=document.querySelector('#image-placeholder');
const imageFileName=document.querySelector('#image-file-name');
const sendButton=document.querySelector('#send');
const form=document.querySelector('#message-form');
const poster=document.querySelector('#poster-text');
const counter=document.querySelector('#counter');
const printerName=document.querySelector('#printer-name');
const printerInfo=document.querySelector('#printer-info');
const notice=document.querySelector('#notice');
const noticeIcon=document.querySelector('#notice-icon');
const noticeText=document.querySelector('#notice-text');
let messageMode='text';
let selectedImage=null;
let selectedImageURL='';

document.querySelector('#receipt-date').textContent=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short',year:'numeric'}).format(new Date()).replace(',','  | ').toUpperCase()+'  |  WEB';

function updateReceiptSender(){
  const date=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'short',year:'numeric'}).format(new Date()).replace(',','  | ').toUpperCase();
  document.querySelector('#receipt-date').textContent=date+'  |  FROM '+(senderInput.value.trim()||'SENDER').toUpperCase();
}

function hasContent(){
  return messageMode==='image'?Boolean(selectedImage):Boolean(messageInput.value.trim());
}

function updateSendButton(){
  sendButton.disabled=!senderInput.value.trim()||!hasContent();
}

function setMode(mode){
  messageMode=mode;
  textModeButton.classList.toggle('active',mode==='text');
  imageModeButton.classList.toggle('active',mode==='image');
  messageControls.hidden=mode!=='text';
  poster.hidden=mode!=='text';
  imageControls.hidden=mode!=='image';
  imagePreview.hidden=mode!=='image'||!selectedImage;
  imagePlaceholder.hidden=mode!=='image'||Boolean(selectedImage);
  updateSendButton();
}

function endpoint(){
  const value=keyInput.value.trim().replace(/\/+$/,'');
  const url=new URL(value);
  if(!/^https?:$/.test(url.protocol))throw new Error('invalid');
  return value;
}

function setNotice(state,text,icon=''){
  notice.className='notice '+state;
  noticeText.textContent=text;
  noticeIcon.textContent=icon;
  noticeIcon.hidden=!icon;
}

function errorMessage(error,action){
  if(error.message==='not-found')return 'This Print Key was not found.';
  if(error.message==='offline')return 'Little Printer is offline. Bring it online and try again.';
  if(error.message==='Failed to fetch')return 'The browser could not reach the Print Key. Check the URL and HTTPS/CORS settings.';
  if(error.message==='invalid')return 'Enter a valid Print Key URL.';
  return action==='connect'?'The server returned an invalid response.':'The message was not accepted by the server.';
}

revealButton.addEventListener('click',()=>{
  const show=keyInput.type==='password';
  keyInput.type=show?'url':'password';
  revealButton.textContent=show?'HIDE':'SHOW';
});

keyInput.addEventListener('input',()=>{
  printerName.textContent='Connect a printer';
  printerInfo.textContent='Enter your Nord Projects Print Key';
  setNotice('','Connect with a Print Key, then send a message.');
});

connectButton.addEventListener('click',async()=>{
  let url;
  try{url=endpoint()}catch(error){setNotice('error',errorMessage(error,'connect'),'×');return}
  connectButton.disabled=true;
  connectButton.textContent='…';
  setNotice('sending','Looking for your Little Printer…','⌛');
  try{
    const response=await fetch(url,{method:'GET',mode:'cors',cache:'no-store',headers:{Accept:'application/json'}});
    if(response.status===404)throw new Error('not-found');
    if(!response.ok)throw new Error('HTTP '+response.status);
    const info=await response.json();
    if(!info||!info.name||!info.status)throw new Error('invalid-response');
    printerName.textContent=info.name;
    printerInfo.innerHTML='<span class="dot '+String(info.status).replace(/[^a-z-]/gi,'')+'"></span>'+info.status+' · @'+String(info.owner||'unknown').replace(/[<>&"']/g,'');
    setNotice(info.status==='online'?'sent':'error',info.status==='online'?'Your printer is online.':'Your printer is currently offline.',info.status==='online'?'✓':'×');
  }catch(error){setNotice('error',errorMessage(error,'connect'),'×')}
  finally{connectButton.disabled=false;connectButton.textContent='CONNECT'}
});

messageInput.addEventListener('input',()=>{
  const text=messageInput.value.trim();
  poster.textContent=text||'YOUR MESSAGE';
  poster.className='poster-text'+(!text?' placeholder':text.length>180?' xs':text.length>110?' sm':text.length>55?' md':'');
  counter.textContent=messageInput.value.length+'/280';
  updateSendButton();
});

senderInput.addEventListener('input',()=>{
  updateReceiptSender();
  updateSendButton();
});

textModeButton.addEventListener('click',()=>setMode('text'));
imageModeButton.addEventListener('click',()=>setMode('image'));

imageInput.addEventListener('change',()=>{
  const file=imageInput.files?.[0]||null;
  if(selectedImageURL)URL.revokeObjectURL(selectedImageURL);
  selectedImage=null;
  selectedImageURL='';
  imagePreview.removeAttribute('src');
  imageFileName.textContent='Choose PNG, JPEG or GIF';
  if(!file){setMode('image');return}
  if(!['image/png','image/jpeg','image/gif'].includes(file.type)){
    imageInput.value='';
    setNotice('error','Choose a PNG, JPEG or GIF image.','×');
    setMode('image');
    return;
  }
  if(file.size>10*1024*1024){
    imageInput.value='';
    setNotice('error','The image must be smaller than 10 MB.','×');
    setMode('image');
    return;
  }
  selectedImage=file;
  selectedImageURL=URL.createObjectURL(file);
  imagePreview.src=selectedImageURL;
  imageFileName.textContent=file.name;
  setNotice('','Image ready to send.');
  setMode('image');
});

form.addEventListener('submit',async event=>{
  event.preventDefault();
  const text=messageInput.value.trim();
  if(messageMode==='text'&&!text){setNotice('error','Write a message first.','×');return}
  if(messageMode==='image'&&!selectedImage){setNotice('error','Choose an image first.','×');return}
  const sender=senderInput.value.trim();
  if(!sender){setNotice('error','Enter your name before sending.','×');return}
  let url;
  try{url=new URL(endpoint());url.searchParams.set('from',sender)}catch(error){setNotice('error','Connect a valid Print Key first.','×');return}
  sendButton.disabled=true;
  setNotice('sending','Sending your message…','⌛');
  try{
    const response=await fetch(url.toString(),{method:'POST',mode:'cors',cache:'no-store',headers:{'Content-Type':messageMode==='image'?selectedImage.type:'text/plain;charset=UTF-8',Accept:'application/json'},body:messageMode==='image'?selectedImage:text});
    const result=await response.json().catch(()=>null);
    if(response.status===504||result?.status==='failed-offline')throw new Error('offline');
    if(response.status===404)throw new Error('not-found');
    if(!response.ok||result?.status!=='sent')throw new Error('HTTP '+response.status);
    setNotice('sent',messageMode==='image'?'Image sent to Little Printer!':'Message sent to Little Printer!','✓');
  }catch(error){setNotice('error',errorMessage(error,'send'),'×')}
  finally{updateSendButton()}
});

updateReceiptSender();
setMode('text');
