/* Mouse look: coleta eventos de alta frequência e aplica o delta uma vez por frame.
 * O listener não toca na câmera nem no estado do jogo; evita trabalho redundante
 * quando o mouse dispara mais eventos que a taxa de renderização.
 */
(function(root){
  "use strict";
  class MouseLookInput{
    constructor(){this.dx=0;this.dy=0;this.enabled=false;this.maxAccumulated=2400;}
    setEnabled(value){this.enabled=!!value;if(!this.enabled)this.clear();}
    handle(event){
      if(!this.enabled)return false;
      const dx=Number(event&&event.movementX),dy=Number(event&&event.movementY);
      if(Number.isFinite(dx))this.dx=Math.max(-this.maxAccumulated,Math.min(this.maxAccumulated,this.dx+dx));
      if(Number.isFinite(dy))this.dy=Math.max(-this.maxAccumulated,Math.min(this.maxAccumulated,this.dy+dy));
      return true;
    }
    consume(sensitivity=1){
      const scale=Number.isFinite(sensitivity)?Math.max(.05,Math.min(4,sensitivity)):1;
      const delta={x:this.dx*scale,y:this.dy*scale};
      this.dx=0;this.dy=0;return delta;
    }
    clear(){this.dx=0;this.dy=0;}
  }
  root.GameInput={MouseLookInput};
})(typeof window!=="undefined"?window:globalThis);
