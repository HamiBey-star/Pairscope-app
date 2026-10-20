(function(){
var v=document.getElementById("tmview");
function open(){v.classList.add("open");v.scrollTop=0;document.body.style.overflow="hidden";try{history.replaceState(null,"","#terms")}catch(e){}}
function close(){v.classList.remove("open");document.body.style.overflow="";try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}}
document.addEventListener("click",function(e){
  var t=e.target.closest&&e.target.closest("[data-terms]");if(t){e.preventDefault();open();return}
  if(e.target.id==="tmclose"){close();return}
  var a=e.target.closest&&e.target.closest("#tmview .toc a");
  if(a){e.preventDefault();var el=document.getElementById(a.getAttribute("href").slice(1));if(el)v.scrollTo({top:el.offsetTop-10,behavior:"smooth"})}
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"&&v.classList.contains("open"))close()});
if(location.hash==="#terms")open();
})();
