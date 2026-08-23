window.TasbehAnimation = {

  pulse(btn){
    btn.animate([
      {transform:"scale(1)"},
      {transform:"scale(.92)"},
      {transform:"scale(1.08)"},
      {transform:"scale(1)"}
    ],{
      duration:180,
      easing:"ease-out"
    });
  },

  complete(btn){
    btn.animate([
      {transform:"scale(1) rotate(0deg)"},
      {transform:"scale(1.15) rotate(-8deg)"},
      {transform:"scale(.95) rotate(8deg)"},
      {transform:"scale(1) rotate(0deg)"}
    ],{
      duration:450,
      easing:"ease-out"
    });
  },

  setRing(el,pct){
    el.parentElement.style.background =
      `conic-gradient(#22c55e ${pct}%, #1f2937 ${pct}%)`;
  }

};