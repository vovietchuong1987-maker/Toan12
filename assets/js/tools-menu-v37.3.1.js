/* Math12 Hub  — compact tools menu hotfix
   Closes the Question Bank "Công cụ" menu after choosing an action,
   when clicking outside, pressing Escape, or when the main modal opens. */
(function(){
  'use strict';

  function getMenus(){
    return Array.from(document.querySelectorAll('details.v371-tools-menu'));
  }

  function closeMenus(except){
    getMenus().forEach(function(menu){
      if(menu!==except && menu.open) menu.open=false;
    });
  }

  function bindMenu(menu){
    if(!menu || menu.dataset.v3731Bound==='1') return;
    menu.dataset.v3731Bound='1';

    menu.addEventListener('toggle',function(){
      if(menu.open) closeMenus(menu);
    });

    menu.querySelectorAll('.v371-tools-panel button').forEach(function(button){
      button.addEventListener('click',function(){
        // Let the original onclick open its modal/page first, then collapse the tool menu.
        window.setTimeout(function(){ menu.open=false; },0);
      });
    });
  }

  function init(){
    getMenus().forEach(bindMenu);

    document.addEventListener('pointerdown',function(event){
      var inside=event.target && event.target.closest ? event.target.closest('details.v371-tools-menu') : null;
      if(!inside) closeMenus();
    });

    document.addEventListener('keydown',function(event){
      if(event.key==='Escape') closeMenus();
    });

    var backdrop=document.getElementById('modalBackdrop');
    if(backdrop && typeof MutationObserver!=='undefined'){
      var observer=new MutationObserver(function(){
        var style=window.getComputedStyle(backdrop);
        var visible=style.display!=='none' && style.visibility!=='hidden' && Number(style.opacity||1)!==0;
        if(visible) closeMenus();
      });
      observer.observe(backdrop,{attributes:true,attributeFilter:['class','style','aria-hidden']});
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();

  window.v3731CloseQuestionBankTools=closeMenus;
})();
