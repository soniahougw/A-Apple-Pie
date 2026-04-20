(function(){
  function initGallery(container){
    const data = container.dataset.gallery || '';
    const images = data.split(',').map(s=>s.trim()).filter(Boolean);
    if(!images.length) return;

  const mainImage = container.querySelector('.main-image');
    const prevBtn = container.querySelector('.btn.prev');
    const nextBtn = container.querySelector('.btn.next');

    // helper: derive fallback svg for a pN.jpg -> imgN.svg
    function fallbackFor(src){
      // replace p<number>.(jpg|jpeg|png) with img<number>.svg
      const m = src.match(/p(\d+)\.(?:jpg|jpeg|png)$/i);
      if(m) return src.replace(/p(\d+)\.(?:jpg|jpeg|png)$/i, 'img$1.svg');
      return src;
    }

    let index = 0;
    // find page count element (site-level). If there are multiple galleries
    // you can scope this differently; for this project a single element exists.
    const pageCountEl = document.querySelector('.page-count');

    function show(i){
      index = (i + images.length) % images.length;
      const primary = images[index];
      // set main image to primary; onerror will set fallback
      mainImage.src = primary;
      mainImage.alt = `Image ${index+1}`;

      // update visible page counter in format current/total (e.g. 1/15)
      if(pageCountEl){
        pageCountEl.textContent = `${index+1}/${images.length}`;
      }
      // hide/disable the previous button when on the first page so users
      // can't go back before the first page. Restore it on other pages.
      if(prevBtn){
        if(index === 0){
          prevBtn.style.display = 'none';
          prevBtn.setAttribute('aria-hidden', 'true');
          prevBtn.disabled = true;
        } else {
          prevBtn.style.display = '';
          prevBtn.removeAttribute('aria-hidden');
          prevBtn.disabled = false;
        }
      }
    }

    // expose the show function on the container element so external code
    // (e.g. clicking the site title) can jump back to the first page.
    container.show = show;

    // if main image fails to load, try fallback svg once
    mainImage.addEventListener('error', function(){
      const fb = fallbackFor(this.src);
      if(this.src.indexOf(fb) === -1){
        this.src = fb;
      }
    }, {once:true});

    prevBtn.addEventListener('click', ()=> show(index-1));
    nextBtn.addEventListener('click', ()=> show(index+1));

    // allow clicking the main image to advance
    mainImage.addEventListener('click', ()=> show(index+1));

    // keyboard navigation
    container.tabIndex = 0;
    container.addEventListener('keydown', (e)=>{
      if(e.key === 'ArrowLeft') show(index-1);
      if(e.key === 'ArrowRight') show(index+1);
    });

    // initial
    show(0);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll('.gallery-container').forEach(initGallery);
  });

  // wire the site title to jump to the first gallery page when clicked
  const siteTitle = document.getElementById('site-title');
  if(siteTitle){
    siteTitle.addEventListener('click', (e)=>{
      e.preventDefault();
      const firstGallery = document.querySelector('.gallery-container');
      if(firstGallery && typeof firstGallery.show === 'function'){
        firstGallery.show(0);
      }
    });
  }

  // warning overlay: dismiss when tapped/clicked (shows every load)
  // helper to reset gallery to first page from anywhere
  function goToFirstGallery(){
    const firstGallery = document.querySelector('.gallery-container');
    if(firstGallery && typeof firstGallery.show === 'function'){
      firstGallery.show(0);
    }
  }

  const warningOverlay = document.getElementById('warning-overlay');
  if(warningOverlay){
    // make focusable for keyboard users and announceable
    warningOverlay.tabIndex = -1;
    // focus so screen readers pick it up (overlay covers the page)
    try{ warningOverlay.focus(); }catch(e){}
    // ensure the gallery resets to the first page whenever the warning
    // overlay is shown (initial load or when re-created after inactivity)
    goToFirstGallery();

    const dismissOverlay = ()=>{
      warningOverlay.setAttribute('aria-hidden','true');
      // remove from DOM to avoid interfering with layout/focus
      if(warningOverlay.parentNode) warningOverlay.parentNode.removeChild(warningOverlay);
    };

    // dismiss on click/tap once
    warningOverlay.addEventListener('click', dismissOverlay, {once:true});
    // dismiss with Escape key
    warningOverlay.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') dismissOverlay(); });
  }


  // Inactivity detection: after 60s of no interaction show a 5s countdown modal
  const inactivityModal = document.getElementById('inactivity-modal');
  const inactivityCountEl = document.getElementById('inactivity-count');
  const continueBtn = document.getElementById('continue-viewing');

  if(inactivityModal){
    let inactivityTimer = null;
    let countdownTimer = null;
    const INACTIVITY_MS = 60 * 1000; // 1 minute
    const COUNTDOWN_SEC = 5;

    function clearTimers(){
      if(inactivityTimer) { clearTimeout(inactivityTimer); inactivityTimer = null; }
      if(countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    }

    function hideModal(){
      inactivityModal.setAttribute('aria-hidden','true');
    }

    function showWarningAgain(){
      // show the original warning overlay again
      if(warningOverlay){
        // ensure it's in DOM; if it was removed earlier add it back by reloading location
        // simpler: re-create and show a fresh overlay if none exists
        if(!document.getElementById('warning-overlay')){
          // create overlay and insert at end of body
          const newOverlay = document.createElement('div');
          newOverlay.id = 'warning-overlay';
          newOverlay.setAttribute('role','dialog');
          newOverlay.setAttribute('aria-label','Warning');
          newOverlay.innerHTML = '<img src="images/warning.png" alt="Warning" id="warning-image">';
          document.body.appendChild(newOverlay);
          // make sure gallery is at first page when overlay shows
          goToFirstGallery();
          // attach click to remove it again
          newOverlay.addEventListener('click', function(){ if(newOverlay.parentNode) newOverlay.parentNode.removeChild(newOverlay); }, {once:true});
        } else {
          // if original still exists but hidden, unhide it
          const ow = document.getElementById('warning-overlay');
          if(ow){
            ow.setAttribute('aria-hidden','false');
            goToFirstGallery();
          }
        }
      }
    }

    function startInactivityTimer(){
      clearTimers();
      inactivityTimer = setTimeout(()=>{
        // show modal with countdown
        let seconds = COUNTDOWN_SEC;
        if(inactivityCountEl) inactivityCountEl.textContent = String(seconds);
        inactivityModal.setAttribute('aria-hidden','false');
        inactivityModal.tabIndex = -1;
        try{ inactivityModal.focus(); }catch(e){}

        countdownTimer = setInterval(()=>{
          seconds -= 1;
          if(inactivityCountEl) inactivityCountEl.textContent = String(seconds);
          if(seconds <= 0){
            clearTimers();
            hideModal();
            // user didn't respond — show warning overlay again
            showWarningAgain();
            // restart inactivity monitoring after showing warning
            startInactivityTimer();
          }
        }, 1000);
      }, INACTIVITY_MS);
    }

    // reset timer on user interactions
    const resetHandler = ()=>{
      // if modal visible, hide it and clear countdown
      hideModal();
      clearTimers();
      startInactivityTimer();
    };

    ['mousemove','keydown','touchstart','click'].forEach(ev => document.addEventListener(ev, resetHandler, {passive:true}));

    if(continueBtn){
      continueBtn.addEventListener('click', (e)=>{ e.preventDefault(); resetHandler(); }, {once:true});
    }

    // also allow Esc to cancel the modal
    inactivityModal.addEventListener('keydown', (e)=>{ if(e.key === 'Escape'){ resetHandler(); } });

    // start monitoring
    startInactivityTimer();
  }
})();
