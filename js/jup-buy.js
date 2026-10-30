/* PairScope: "Buy on Jupiter" / "Quick buy" / "Sell on Jupiter" links open Jupiter's official swap popup
   on this page with the coin already selected. If the popup can't load, the normal jup.ag link opens instead. */
(function(){
var SRC="https://plugin.jup.ag/plugin-v1.js",p=null;
/* EARN FEES: paste your Jupiter referral account key between the quotes (from referral.jup.ag).
   REF_FEE_BPS is your fee in basis points (100 = 1%). Jupiter's docs list 50 to 255 for referral fees.
   Leave REF_ACCOUNT empty to charge no fee. */
var REF_ACCOUNT="DWrrytCPHm6qPCqKN7bvnwXNzxXE23duuuFmEHVYkzda",REF_FEE_BPS=100;
function load(){if(window.Jupiter)return Promise.resolve();
  return p||(p=new Promise(function(ok,no){var s=document.createElement("script");s.src=SRC;s.async=true;
    s.onload=function(){window.Jupiter?ok():no()};s.onerror=function(){p=null;no()};document.head.appendChild(s)}))}
document.addEventListener("click",function(e){
  var a=e.target.closest&&e.target.closest('a[href^="https://jup.ag/swap/"]');if(!a)return;
  var m=a.getAttribute("href").slice(25).split("-");if(m.length!==2||!m[0]||!m[1])return;
  e.preventDefault();
  var inM=decodeURIComponent(m[0]),outM=decodeURIComponent(m[1]);
  load().then(function(){var fp={initialInputMint:inM,initialOutputMint:outM};if(REF_ACCOUNT){fp.referralAccount=REF_ACCOUNT;fp.referralFee=REF_FEE_BPS}window.Jupiter.init({displayMode:"modal",formProps:fp})})
    .catch(function(){window.open(a.href,"_blank","noopener")});
},true);
})();
