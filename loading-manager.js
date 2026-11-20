/* Loading manager — progresso por conclusão de tarefas reais do jogo. */
(function(root){
  "use strict";
  class LoadingManager{
    constructor(){this.running=false;this.completed=0;this.total=0;}
    async run(tasks,onProgress=()=>{}){
      if(this.running)throw new Error("Já existe um carregamento em andamento");
      if(!Array.isArray(tasks)||!tasks.length)throw new TypeError("O carregamento precisa de tarefas");
      if(tasks.some(task=>!task||typeof task.run!=="function"||!Number.isFinite(task.weight??1)||(task.weight??1)<=0))throw new TypeError("Tarefa de carregamento inválida");
      this.running=true;this.completed=0;this.total=tasks.reduce((sum,task)=>sum+(task.weight??1),0);
      let done=0;
      const report=(task,complete)=>onProgress({percent:Math.round(done/this.total*100),label:task.label||"Carregando…",completed:complete,total:tasks.length});
      try{
        onProgress({percent:0,label:tasks[0].label||"Preparando…",completed:0,total:tasks.length});
        for(const task of tasks){
          await new Promise(resolve=>{
            const raf=root.requestAnimationFrame;
            if(typeof raf==="function")raf.call(root,()=>resolve());
            else Promise.resolve().then(resolve);
          });
          await task.run();
          done+=task.weight??1;this.completed++;
          report(task,true);
        }
        onProgress({percent:100,label:"Pronto",completed:tasks.length,total:tasks.length});
        return {ok:true,completed:this.completed,total:tasks.length};
      }catch(error){
        onProgress({percent:Math.round(done/this.total*100),label:"Falha no carregamento",completed:this.completed,total:tasks.length,error});
        throw error;
      }finally{this.running=false;}
    }
  }
  root.GameLoadingManager=Object.freeze({LoadingManager});
})(typeof window!=="undefined"?window:globalThis);
