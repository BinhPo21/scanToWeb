import {BrowserQRCodeReader} from "https://cdn.jsdelivr.net/npm/@zxing/browser@0.2.1/+esm";
const DEPARTMENTS={"In":"https://docs.google.com/forms/d/1pfub1V_xXJTh53rsYOdPeIXqnOylyFWuJ-BCkDMrLRI/viewform","Bế":"https://docs.google.com/forms/d/1QamFMLVFpol0mLwrChpzOngo8LcWs84s2dmoHvbHR1o/viewform","Thành Phẩm":"https://docs.google.com/forms/d/1moque230vLB5bvTfCYZ9zqnr7_gCCsRH-EHVxoJvBIQ/viewform","Kho":"https://docs.google.com/forms/d/1L7CRNFqkQcH4soZEJyr8FmByHzOdp3Gdsrjouf8gT-4/viewform","Thanh V":"https://docs.google.com/forms/d/e/1FAIpQLSdMGu0cHh7d0oF0cwkD8WB_TCahiMz9FVYC4PHEsX3mw2CgHg/viewform","Giấy Tổ Ong":"https://docs.google.com/forms/d/10O2zXGVIvi_fmuvNFBtuDrFBdvtINs_QvlNYv3YHYBU/viewform"};
const ENTRY_IDS=["entry.392564381","entry.682796725","entry.260788272","entry.312519866","entry.697190504"];
const appHeader=document.getElementById("appHeader"),departmentBar=document.getElementById("departmentBar"),departmentScreen=document.getElementById("departmentScreen"),scannerScreen=document.getElementById("scannerScreen"),selectedDepartment=document.getElementById("selectedDepartment"),changeDepartment=document.getElementById("changeDepartment"),cameraBox=document.getElementById("cameraBox"),flashButton=document.getElementById("flashButton"),video=document.getElementById("video"),statusBox=document.getElementById("status"),imageScanBox=document.getElementById("imageScanBox"),imageInput=document.getElementById("imageInput"),manualBox=document.getElementById("manualBox"),manualInput=document.getElementById("manualCode"),pasteButton=document.getElementById("pasteButton"),openButton=document.getElementById("openButton"),formContainer=document.getElementById("formContainer"),googleForm=document.getElementById("googleForm"),btnScanAgain=document.getElementById("btnScanAgain"),btnHome=document.getElementById("btnHome");
let reader=null,controls=null,daQuet=false,boPhanDangChon=null,videoTrack=null,flashDangBat=false;

function capNhatTrangThaiNutMoForm(){
const coDuLieu=String(manualInput.value||"").trim().length>0;
openButton.disabled=!coDuLieu;
}

const warningModal=document.getElementById("warningModal"),warningMessage=document.getElementById("warningMessage"),warningOk=document.getElementById("warningOk");
function boScale10(value){
return String(value??"").replace(/&scale=10/g,"").trim();
}
function tachGiaTriQR(value){
return boScale10(value).replace(/\|\|/g,"|").split("|").map(x=>boScale10(x));
}

function chuanHoaKichDon(value){
return String(value??"")
    .trim()
    .replace(/\./g,",")
    .replace(/,0/g,"");
}

function chuanHoaSoLuongDonHang(value){
return String(value??"")
    .trim()
    .replace(/,0/g,"")
    .replace(/\./g,"");
}
async function taoLinkForm(chuoiQR){
if(!boPhanDangChon)throw new Error("Chưa chọn bộ phận.");

let parts=tachGiaTriQR(chuoiQR);
let maLenh="";
let qr5=null;
let canKiemTra=false;

if(parts.length===1){
    maLenh=parts[0];
}else if(parts.length===6){
    parts.splice(4,1);
    qr5=parts;
    qr5[3]=chuanHoaKichDon(qr5[3]);
    qr5[4]=chuanHoaSoLuongDonHang(qr5[4]);
    maLenh=qr5[2];
    canKiemTra=true;
}else if(parts.length===5){
    qr5=parts;
    qr5[3]=chuanHoaKichDon(qr5[3]);
    qr5[4]=chuanHoaSoLuongDonHang(qr5[4]);
    maLenh=qr5[2];
    canKiemTra=true;
}else{
    throw new Error("QR không đúng cấu trúc: chỉ hỗ trợ 1, 5 hoặc 6 mã.");
}

maLenh=boScale10(maLenh);
if(!maLenh)throw new Error("Không tìm thấy Mã Lệnh.");

const ketQua=await traCuuMaLenh(maLenh);

let partsKetQua;

if(ketQua){
    // Có dữ liệu Google Sheet
    partsKetQua=tachGiaTriQR(ketQua);

    // Quy Cách Đơn Hàng: quy dấu "." và "," về cùng dấu ",",
    // sau đó bỏ toàn bộ ",0".
    partsKetQua[3]=chuanHoaKichDon(partsKetQua[3]);

    // Số Lượng Đơn Hàng: bỏ toàn bộ ",0".
    partsKetQua[4]=chuanHoaSoLuongDonHang(partsKetQua[4]);

    if(partsKetQua.length!==5){
        throw new Error("Không lấy được đủ 5 giá trị từ Mã Lệnh.");
    }
}else if(parts.length===1){
    // QR chỉ có 1 mã:
    // Không tìm thấy Google Sheet sau 5 lần vẫn mở Form.
    // Chỉ điền Mã Lệnh, các trường khác để trống.
    partsKetQua=["","",maLenh,"",""];
}else{
    // QR 5/6 mã:
    // Không tìm thấy Google Sheet sau 5 lần thì bỏ qua kiểm tra
    // và dùng dữ liệu QR đã quy về 5 mã.
    partsKetQua=qr5;
}

const tenTruong=["Khách Hàng","Đơn Hàng","Mã Lệnh","Kích Đơn","Số Lượng Đơn Hàng"];
const sai=[];

if(canKiemTra && ketQua){
    for(let i=0;i<5;i++){
        // Mã Lệnh (vị trí 3) luôn cố định, không đưa vào cảnh báo.
        if(i===2)continue;
        if(qr5[i]!==partsKetQua[i]){
            sai.push({ten:tenTruong[i],qr:qr5[i],sheet:partsKetQua[i]});
        }
    }
}

const p=new URLSearchParams();
p.set("usp","pp_url");
ENTRY_IDS.forEach((id,i)=>p.set(id,partsKetQua[i].trim()));

return {
    url:DEPARTMENTS[boPhanDangChon]+"?"+p.toString(),
    canWarn:canKiemTra,
    sai:sai
};
}
async function tatFlash(){if(videoTrack){try{if(videoTrack.getCapabilities&&videoTrack.getCapabilities().torch)await videoTrack.applyConstraints({advanced:[{torch:false}]})}catch(_){}}flashDangBat=false;flashButton.classList.remove("on");flashButton.textContent="🔦 BẬT FLASH"}
async function dungCamera(){if(videoTrack){try{await videoTrack.applyConstraints({advanced:[{torch:false}]})}catch(_){}videoTrack=null}flashDangBat=false;flashButton.classList.remove("on");flashButton.textContent="🔦 BẬT FLASH";flashButton.style.display="none";if(controls){try{controls.stop()}catch(_){}controls=null}}
function xuLyMaQuet(text){
    if(daQuet)return;

    const value=String(text||"").trim().replace(/\|\|/g,"|");

    if(!value)return;

    moGoogleForm(value);
}
async function moGoogleForm(chuoiQR){
try{
statusBox.textContent="⏳ Đang tra cứu Mã Lệnh...";
statusBox.className="status";

const result=await taoLinkForm(chuoiQR);

daQuet=true;
await tatFlash();
cameraBox.classList.add("hidden");
imageScanBox.classList.add("hidden");
manualBox.classList.add("hidden");
scannerScreen.classList.add("hidden");
appHeader.classList.add("active");
departmentBar.classList.remove("hidden");
formContainer.classList.add("active-space");
statusBox.textContent="✅ Đã quét. Điền thông tin rồi bấm Gửi.";
statusBox.className="status ok";

if(result&&result.canWarn&&result.sai&&result.sai.length){
    hienCanhBao(result.sai, result.url);
}else{
    moFormSauKhiKiemTra(result.url);
}
}catch(e){
console.error(e);
statusBox.textContent=e.message;
statusBox.className="status error";
daQuet=false;
}
}

function hienCanhBao(sai,url){
const warningTitle=document.getElementById("warningTitle");

// Hien thi chi nhung truong co gia tri khac nhau.
warningTitle.textContent="⚠️ Tờ lệnh có thông tin khác";

warningMessage.innerHTML=sai.map(item=>{
    const ten=escapeHtml(item.ten);
    const qr=escapeHtml(item.qr);
    const sheet=escapeHtml(item.sheet);

    return `<div class="warning-item">
        <div class="warning-name">🔴 ${ten}</div>
        <div class="warning-value">
            <span class="warning-label">Tờ Lệnh:</span> ${qr}
            <span class="warning-arrow">→</span>
            <span class="warning-label">Mới Nhất:</span> ${sheet}
        </div>
    </div>`;
}).join("");

warningModal.classList.remove("hidden");

const tiepTuc=()=>{
warningModal.classList.add("hidden");
warningOk.removeEventListener("click",tiepTuc);
moFormSauKhiKiemTra(url);
};
warningOk.addEventListener("click",tiepTuc);
}

function escapeHtml(value){
return String(value??"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

// Tat ca trinh duyet va WebView deu dung chung mot che do hien thi Form.
function batCheDoFormScrollNeuHoTro(){
    document.body.classList.add("form-scroll-mode");
}

function moFormSauKhiKiemTra(url){
document.body.classList.remove("scanner-mode");
googleForm.src=url+"&embedded=true";
googleForm.style.height="100vh";
formContainer.style.display="block";

const bottomButtons=document.getElementById("bottomButtons");
if(bottomButtons){
    bottomButtons.style.display="flex";
    btnScanAgain.style.display="";
    btnHome.style.display="";
    btnHome.style.flex="";
}

// CHI khi da quet xong va mo Google Form moi dung single-scroll.
// Scanner van giu nguyen giao dien va scroll nhu V44.
batCheDoFormScrollNeuHoTro();
capNhatKhungForm();
requestAnimationFrame(capNhatKhungForm);
setTimeout(capNhatKhungForm,100);
}
function damBaoHeaderFooterCoDinh(){
// Dua Header va Footer ra truc tiep body.
// Giup position: fixed on dinh tren Android WebView, iOS va trinh duyet.
if(appHeader.parentElement!==document.body){
document.body.appendChild(appHeader);
}

const bottomButtons=document.getElementById("bottomButtons");
if(bottomButtons&&bottomButtons.parentElement!==document.body){
document.body.appendChild(bottomButtons);
}
}

function capNhatKhungForm(){
    const bottomButtons=document.getElementById("bottomButtons");

    // Header dang fixed tren dau man hinh.
    // Form bat dau dung tai mep duoi cua Header.
    const headerHeight=Math.ceil(
        appHeader.getBoundingClientRect().height
    );

    // Footer dang fixed cach day man hinh 14px.
    // Form ket thuc dung tai mep tren cua Footer.
    const footerHeight=bottomButtons
        ?Math.ceil(bottomButtons.getBoundingClientRect().height)
        :54;

    document.documentElement.style.setProperty(
        "--form-top",
        headerHeight+"px"
    );

    document.documentElement.style.setProperty(
        "--form-bottom",
        (footerHeight+14)+"px"
    );
}

function capNhatKhungQuet(){
    const headerHeight=Math.ceil(appHeader.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--scanner-top",headerHeight+"px");
}

async function chonBoPhan(boPhan){
if(!DEPARTMENTS[boPhan])return;

boPhanDangChon=boPhan;

damBaoHeaderFooterCoDinh();

// Luu bo phan gan nhat tren dung thiet bi/app nay.
try{
localStorage.setItem("boPhanGanNhat",boPhanDangChon);
}catch(_){}

// Thanh V va Giay To Ong khong quet QR. Mo truc tiep Google Form dang nhung.
const BO_PHAN_KHONG_QUET_QR=["Thanh V","Giấy Tổ Ong"];

function taoLinkFormEmbedded(url){
    const u=new URL(url);
    u.searchParams.set("embedded","true");
    return u.toString();
}

// Nut trai: chi doi thanh Gui Lenh Khac voi Thanh V va Giay To Ong.
// Dung capture de khong anh huong handler Quet To Lenh Khac cua cac bo phan khac.
btnScanAgain.addEventListener("click",function(event){
    const boPhanKhongQuet=["Thanh V","Giấy Tổ Ong"];

    if(!boPhanKhongQuet.includes(boPhanDangChon)){
        return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    googleForm.src="about:blank";

    setTimeout(function(){
        googleForm.src=taoLinkFormEmbedded(DEPARTMENTS[boPhanDangChon]);
        window.scrollTo({top:0,behavior:"smooth"});
    },100);
},true);
if(BO_PHAN_KHONG_QUET_QR.includes(boPhanDangChon)){
    document.body.classList.remove("scanner-mode");
    try{await dungCamera();}catch(_){}

    document.body.classList.remove("home-mode");
    batCheDoFormScrollNeuHoTro();
    document.querySelector(".card").classList.remove("home-mode");
    selectedDepartment.textContent="Bộ phận: "+boPhanDangChon;
    appHeader.classList.add("active");
    departmentBar.classList.remove("hidden");
    departmentScreen.classList.add("hidden");
    scannerScreen.classList.add("hidden");
    formContainer.classList.add("active-space");
    daQuet=true;

    googleForm.src=taoLinkFormEmbedded(DEPARTMENTS[boPhanDangChon]);
    formContainer.style.display="block";

    // Thanh V va Giay To Ong: hien nut Gui Lenh Khac de tai lai form moi.
    const bottomButtons=document.getElementById("bottomButtons");
    if(bottomButtons){
        bottomButtons.style.display="flex";
        btnScanAgain.style.display="block";
        btnScanAgain.style.flex="1";
        btnScanAgain.innerHTML="📝 Gửi Lệnh Khác";
        btnHome.style.display="block";
        btnHome.style.flex="1";
    }

    // Chi con 1 vung scroll: Google Form trong iframe.
    // Trang web ben ngoai duoc khoa scroll de tranh xung dot khi vuot.
    capNhatKhungForm();
    requestAnimationFrame(capNhatKhungForm);
    setTimeout(capNhatKhungForm,100);

    return;
}

// Cac bo phan khac quay lai giao dien quet QR binh thuong.
btnScanAgain.style.display="";
btnScanAgain.style.flex="";
btnScanAgain.innerHTML="🔄 Quét Tờ Lệnh Khác";
btnHome.style.flex="";

document.body.classList.remove("form-scroll-mode");
document.body.classList.add("scanner-mode");
document.body.classList.remove("home-mode");
document.querySelector(".card").classList.remove("home-mode");
selectedDepartment.textContent="Bộ phận: "+boPhanDangChon;
appHeader.classList.add("active");
departmentBar.classList.remove("hidden");
departmentScreen.classList.add("hidden");
scannerScreen.classList.remove("hidden");
scannerScreen.classList.add("active-space");
formContainer.classList.remove("active-space");
capNhatKhungQuet();
requestAnimationFrame(capNhatKhungQuet);
daQuet=false;
statusBox.textContent="📷 Đang mở camera...";
statusBox.className="status";
window.scrollTo({top:0,behavior:"smooth"});
await khoiDong();
}

function dungStreamCamera(){try{if(videoTrack){try{if(videoTrack.getCapabilities&&videoTrack.getCapabilities().torch)videoTrack.applyConstraints({advanced:[{torch:false}]}).catch(()=>{})}catch(_){} }const stream=video.srcObject;if(stream&&stream.getTracks)stream.getTracks().forEach(track=>{try{track.stop()}catch(_){}});video.srcObject=null;if(controls){try{controls.stop()}catch(_){}controls=null}videoTrack=null;flashDangBat=false;if(flashButton){flashButton.classList.remove("on");flashButton.textContent="🔦 BẬT FLASH"}}catch(_){} }
window.addEventListener("resize",()=>{
    if(document.body.classList.contains("form-scroll-mode")){
        capNhatKhungForm();
    }
    if(document.body.classList.contains("scanner-mode")){
        capNhatKhungQuet();
    }
});
window.addEventListener("orientationchange",()=>{
    if(document.body.classList.contains("form-scroll-mode")){
        setTimeout(capNhatKhungForm,150);
    }
    if(document.body.classList.contains("scanner-mode")){
        setTimeout(capNhatKhungQuet,150);
    }
});

document.addEventListener("visibilitychange",async()=>{if(document.visibilityState==="hidden"){dungStreamCamera();return}if(document.visibilityState==="visible"){const dangQuet=!scannerScreen.classList.contains("hidden");if(dangQuet&&!daQuet){try{await khoiDong()}catch(_){}}}});
window.addEventListener("pagehide",dungStreamCamera);window.addEventListener("beforeunload",dungStreamCamera);
async function khoiDong(){try{if(!window.isSecureContext)throw new Error("Trang phải chạy bằng HTTPS.");if(controls&&videoTrack&&videoTrack.readyState==="live"){cameraBox.classList.remove("hidden");imageScanBox.classList.remove("hidden");manualBox.classList.remove("hidden");statusBox.textContent="Sẵn sàng - đưa QR vào giữa khung.";statusBox.className="status";return}statusBox.textContent="Đang xin quyền Camera...";statusBox.className="status";reader=reader||new BrowserQRCodeReader();controls=await reader.decodeFromConstraints({audio:false,video:{facingMode:{ideal:"environment"},width:{ideal:1080},height:{ideal:720}}},video,function(result){if(result)xuLyMaQuet(result.getText())});const stream=video.srcObject;videoTrack=stream&&stream.getVideoTracks?stream.getVideoTracks()[0]:null;const capabilities=videoTrack&&videoTrack.getCapabilities?videoTrack.getCapabilities():{};if(capabilities&&capabilities.torch===true){flashButton.style.display="block";flashButton.disabled=false;flashButton.style.opacity="1";flashButton.textContent="🔦 BẬT FLASH"}else flashButton.style.display="none";statusBox.textContent="Sẵn sàng - đưa QR vào giữa khung.";statusBox.className="status"}catch(e){console.error(e);statusBox.textContent="Không khởi động được Camera: "+(e.message||e);statusBox.className="status error"}}
imageInput.addEventListener("change",async function(){const file=this.files&&this.files[0];this.value="";if(!file||daQuet)return;try{statusBox.textContent="🖼️ Đang đọc QR từ ảnh...";statusBox.className="status";const dataUrl=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=()=>reject(new Error("Không đọc được file ảnh."));fr.readAsDataURL(file)});const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(new Error("Không mở được hình ảnh."));img.src=dataUrl});const r=new BrowserQRCodeReader();let result=null;for(const scale of [1,.75,.5,.35]){if(result)break;const canvas=document.createElement("canvas"),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d",{willReadFrequently:true});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality="high";ctx.drawImage(img,0,0,w,h);const testImg=new Image();await new Promise((resolve,reject)=>{testImg.onload=resolve;testImg.onerror=reject;testImg.src=canvas.toDataURL("image/png")});try{result=await r.decodeFromImageElement(testImg)}catch(_){result=null}}if(!result)throw new Error("Không tìm thấy QR trong hình.");const text=result.getText();xuLyMaQuet(text)}catch(e){console.error(e);statusBox.textContent="❌ Không đọc được QR trong hình. Hãy chọn ảnh QR rõ hơn.";statusBox.className="status error"}});
pasteButton.addEventListener("click",async()=>{
try{
let text="";

// WebToApp co NativeBridge doc truc tiep clipboard Android.
// Uu tien cach nay vi navigator.clipboard co the bi gioi han trong WebView.
if(window.NativeBridge&&typeof window.NativeBridge.getClipboardText==="function"){
text=window.NativeBridge.getClipboardText()||"";
}

// Neu khong co NativeBridge hoac bridge khong tra du lieu,
// thu lai bang Clipboard API chuan cua trinh duyet.
if(!text&&navigator.clipboard&&typeof navigator.clipboard.readText==="function"){
text=await navigator.clipboard.readText();
}

if(!text){
throw new Error("Clipboard rong hoac WebToApp chua cap quyen doc clipboard.");
}

manualInput.value=text;
capNhatTrangThaiNutMoForm();
// Khong tu dong focus de tren dien thoai khong bat ban phim.
}catch(error){
console.error(error);
statusBox.textContent="❌ Không thể đọc nội dung trong bộ nhớ tạm.";
statusBox.className="status error";
}
});

openButton.addEventListener("click",()=>{
const value=String(manualInput.value||"").trim();
if(!value)return;
moGoogleForm(value);
});

manualInput.addEventListener("input",capNhatTrangThaiNutMoForm);
capNhatTrangThaiNutMoForm();

manualInput.addEventListener("keydown",e=>{
if(e.key==="Enter"){
e.preventDefault();
const value=String(manualInput.value||"").trim();
moGoogleForm(value);
}
});
btnScanAgain.addEventListener("click",async()=>{
const bottomButtons=document.getElementById("bottomButtons");
if(bottomButtons)bottomButtons.style.display="none";

googleForm.src="";

// Quay lai man quet QR: khoa trang ngoai, giu toan bo giao dien quet co dinh.
document.body.classList.remove("form-scroll-mode");
document.body.classList.add("scanner-mode");
capNhatKhungQuet();

formContainer.style.display="none";formContainer.classList.remove("active-space");scannerScreen.classList.remove("hidden");scannerScreen.classList.add("active-space");capNhatKhungQuet();requestAnimationFrame(capNhatKhungQuet);cameraBox.classList.remove("hidden");imageScanBox.classList.remove("hidden");manualBox.classList.remove("hidden");appHeader.classList.add("active");departmentBar.classList.remove("hidden");daQuet=false;statusBox.textContent="📷 Sẵn sàng - đưa QR vào giữa khung.";statusBox.className="status";if(!controls||!videoTrack||videoTrack.readyState!=="live")await khoiDong();window.scrollTo({top:0,behavior:"smooth"})});
flashButton.addEventListener("click",async()=>{if(!videoTrack||!videoTrack.getCapabilities){statusBox.textContent="⚠️ Điện thoại/trình duyệt không hỗ trợ bật Flash từ web.";statusBox.className="status error";return}const capabilities=videoTrack.getCapabilities();if(!capabilities.torch){statusBox.textContent="⚠️ Camera này không cho phép web điều khiển Flash.";statusBox.className="status error";return}try{flashDangBat=!flashDangBat;await videoTrack.applyConstraints({advanced:[{torch:flashDangBat}]});flashButton.classList.toggle("on",flashDangBat);flashButton.textContent=flashDangBat?"💡 TẮT FLASH":"🔦 BẬT FLASH"}catch(error){flashDangBat=false;flashButton.classList.remove("on");flashButton.textContent="🔦 BẬT FLASH";flashButton.style.display="none"}});
async function veChonBoPhan(){
try{
localStorage.removeItem("boPhanGanNhat");
}catch(_){}

try{
await dungCamera();
}catch(_){}

window.location.reload();
}

changeDepartment.addEventListener("click",async function(){
await veChonBoPhan();
});btnHome.addEventListener("click",async()=>{
await veChonBoPhan();
});
document.querySelectorAll(".department-button").forEach(button=>button.addEventListener("click",async()=>{
await chonBoPhan(button.dataset.department);
}));

document.addEventListener("DOMContentLoaded",async()=>{
try{
const boPhanDaLuu=localStorage.getItem("boPhanGanNhat");
if(boPhanDaLuu&&DEPARTMENTS[boPhanDaLuu]){
await chonBoPhan(boPhanDaLuu);
}
}catch(error){
console.error("Khong the khoi phuc bo phan da luu:",error);
}
});
