/* =============================================================================
   BOOT — loaded in <head> on every page, before first paint.
   Sets theme, picks this load's gradient hue, and flags the intro / page
   transition so their overlays cover the page from the very first frame.
   ============================================================================= */
(function(){
  var d=document.documentElement, still=false;
  try{ still=matchMedia("(prefers-reduced-motion:reduce)").matches; }catch(e){}

  /* theme (app.js keeps the toggle) */
  try{ d.setAttribute("data-theme", localStorage.getItem("theme") || (matchMedia("(prefers-color-scheme: light)").matches?"light":"dark")); }catch(e){}

  /* fresh gradient palette every load: base hue at least 60deg from the last one
     (styles.css derives every colour from --h) */
  var last=NaN; try{ last=parseFloat(localStorage.getItem("hue")); }catch(e){}
  var h, n=0;
  do{ h=Math.floor(Math.random()*360); n++; }while(n<50 && !isNaN(last) && Math.min(Math.abs(h-last),360-Math.abs(h-last))<60);
  d.style.setProperty("--h",h);
  try{ localStorage.setItem("hue",h); }catch(e){}

  /* intro once per browser session; otherwise finish an incoming page transition */
  try{
    if(!still && !sessionStorage.getItem("introSeen")) d.classList.add("intro");
    else if(!still && sessionStorage.getItem("pt")) d.classList.add("pt-in");
    sessionStorage.removeItem("pt");
  }catch(e){}
})();
