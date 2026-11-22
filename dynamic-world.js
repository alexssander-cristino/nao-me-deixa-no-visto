/* Mundo dinâmico: seed reproduzível, coletáveis em células alcançáveis e narrativa por capítulo. */
(function(root){
"use strict";
const STORAGE_KEY="ndmvv.run.seed";
let runSeed=0;
try{runSeed=Number(localStorage.getItem(STORAGE_KEY))>>>0}catch(_){}
if(!runSeed)runSeed=0x4e444d56;
function makeSeed(){let value=0;try{const data=new Uint32Array(1);crypto.getRandomValues(data);value=data[0]}catch(_){value=(Math.random()*0xffffffff)>>>0}return value||0x4e444d56}
function rngFor(level,salt=0){let state=(runSeed^Math.imul(level+1,0x9e3779b1)^salt)>>>0;return()=>{state=(state+0x6D2B79F5)>>>0;let t=state;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
root.GameRunSeed=()=>runSeed;
const lore=[
 ["O bilhete está dobrado quatro vezes: “Anderson, deixei a luz da cozinha acesa. Você sempre esquece de voltar.”","No verso da fotografia: “A última vez que ele respondeu foi antes de eu comprar o vestido.”","A tela rachada ainda mostra a mensagem: “Cheguei.” O horário é de treze anos atrás."],
 ["A parede tem marcas de unhas na altura de alguém tentando alcançar a maçaneta.","Um aviso de manutenção: “O corredor muda quando todas as lâmpadas apagam.”","No interfone, uma voz sussurra: “Não use a porta que acabou de abrir.”"],
 ["Lista de compras presa ao carrinho: pão, leite, pilhas e uma aliança do tamanho errado.","O alto-falante repete uma promoção. Entre os números, alguém diz seu nome.","Há pegadas molhadas no corredor de congelados. Elas terminam diante de uma parede."],
 ["Comprovante do quarto 13: duas diárias. Uma pessoa fez o check-in; ninguém registrou a saída.","O telefone do balcão tem uma única chamada salva: “Anderson — atender desta vez”.","Atrás do espelho: “Ela não está esperando no quarto. Está esperando você lembrar.”"],
 ["O livro de visitas registra uma cerimônia sem testemunhas. A data foi corrigida à mão treze vezes.","A cera endurecida forma letras: “Você prometeu voltar antes do amanhecer.”","No banco da frente há um buquê seco, ainda preso por uma fita com suas iniciais."],
 ["Um crachá riscado informa: “Acesso liberado somente para quem responder à chamada.”","A câmera de segurança mostra o corredor vazio. No monitor, alguém está atrás de você.","O registro de entrada tem sua assinatura, embora você nunca tenha trabalhado aqui."],
 ["A chamada da diretoria foi arquivada como atendida. A gravação contém apenas respiração.","Uma redação infantil pergunta: “Por que os adultos deixam as mensagens sem resposta?”","O livro de ocorrências termina com: “A aluna voltou a conversar com a parede.”"],
 ["Prontuário sem nome: paciente acorda às 03h17 e pergunta por uma pessoa que não está no quarto.","A etiqueta do soro diz “não administrar”. Alguém escreveu abaixo: “ela já tomou”.","O monitor cardíaco registra dois ritmos, embora haja apenas um leito ocupado."],
 ["O relatório do estacionamento descreve um carro ligado há treze anos, sem motorista.","Uma chave está etiquetada como “saída”. A fechadura correspondente foi cimentada.","A guarita recebeu uma ligação: “Não deixe o homem ir embora sozinho.”"],
 ["O painel da plataforma exibe um trem cancelado. O destino muda quando você pisca.","Bilhete único, sem estação de origem: “A próxima parada é onde você visualizou.”","O alto-falante anuncia seu nome e pede que permaneça longe da linha amarela."],
 ["O convite está assinado por duas pessoas. Uma delas foi riscada com tanta força que rasgou o papel.","A lista de convidados inclui todos os contatos que você deixou no visualizado.","No palco, o microfone está ligado. Alguém ensaia seus votos em voz baixa."],
 ["O livro de hóspedes registra o quarto 13 ocupado desde 2013. A chave nunca foi devolvida.","A camareira anotou: “Não trocar os lençóis. O lado vazio ainda está quente.”","O elevador abre para um corredor que não existe na planta do hotel."],
 ["A válvula principal foi fechada por dentro. Há marcas recentes no volante enferrujado.","A tubulação conduz até uma sala lacrada com o nome Anderson.","No vapor do cano, uma frase aparece e desaparece: “Eu ouvi você chegar.”"],
 ["As pulseiras têm nomes escritos por mãos diferentes. Todas levam à mesma data.","O registro neonatal foi alterado. A linha do acompanhante está preenchida com seu número.","Uma gravação antiga repete: “Quando ele voltar, não deixem que ela o veja primeiro.”"],
 ["O altar tem duas sombras, mas só um corpo. A segunda sombra segura um celular aceso.","A última mensagem nunca enviada diz: “Eu devia ter respondido quando ainda era só uma mensagem.”","No verso do véu: “Se você chegou até aqui, ela também chegou.”"]
];
function reachableCells(){
 const startR=Math.round(pl.z/4),startC=Math.round(pl.x/4),queue=[[startR,startC]],dist=new Map([[startR+","+startC,0]]);
 for(let i=0;i<queue.length;i++){const [r,c]=queue[i],d=dist.get(r+","+c);for(const [dr,dc] of [[0,1],[1,0],[0,-1],[-1,0]]){const nr=r+dr,nc=c+dc,key=nr+","+nc,k=ch(nr,nc);if(k==="#"||k==="H"||dist.has(key))continue;dist.set(key,d+1);queue.push([nr,nc])}}
 return [...dist.entries()].map(([key,d])=>{const [r,c]=key.split(",").map(Number);return{r,c,d,x:c*4,z:r*4}}).filter(p=>ch(p.r,p.c)==="."&&p.d>=2&&(!ex||Math.hypot(p.x-ex.x,p.z-ex.z)>5));
}
function distribute(level){
 if(!Array.isArray(items)||!items.length)return;
 const movable=items.filter(item=>["K","N","B","X"].includes(item.k));
 if(!movable.length)return;
 const fixed=items.filter(item=>!movable.includes(item)),occupied=fixed.map(item=>({x:item.x,z:item.z}));
 const candidates=reachableCells().filter(p=>!physics.overlapsCircle(p.x,p.z,.42)&&occupied.every(q=>Math.hypot(q.x-p.x,q.z-p.z)>2.65));
 const random=rngFor(level,0x51f15e);for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]]}
 let cursor=0;
 for(const item of movable){
  let chosen=null;
  while(cursor<candidates.length){const p=candidates[cursor++];if(occupied.every(q=>Math.hypot(q.x-p.x,q.z-p.z)>2.65)){chosen=p;break}}
  if(!chosen)continue;
  occupied.push(chosen);item.x=chosen.x;item.z=chosen.z;
  if(item.m){item.m.position.x=chosen.x;item.m.position.z=chosen.z}
 }
}
const originalBuild=build;
build=function(level){originalBuild(level);distribute(level);if(typeof refreshDynamicObjective==="function")refreshDynamicObjective()};
const originalPick=pick;
pick=function(item){originalPick(item);if(item&&item.k==="N"){const list=lore[lv]||lore[0],index=(Math.max(0,(SG&&SG.lore)||0)+Math.max(0,Number(item.x+item.z)||0))%list.length;note(list[Math.floor(index)%list.length],10500)}};
const originalNewGame=newG;
newG=function(){runSeed=makeSeed();try{localStorage.setItem(STORAGE_KEY,String(runSeed))}catch(_){}return originalNewGame()};
const originalCapture=captureSavePayload;
captureSavePayload=function(){const payload=originalCapture();payload.seed=runSeed;return payload};
const originalLoadSlot=loadSaveSlot;
loadSaveSlot=function(slot){const result=GameSaveSystem.read(slot);if(result.ok&&Number(result.payload.seed)){runSeed=Number(result.payload.seed)>>>0;try{localStorage.setItem(STORAGE_KEY,String(runSeed))}catch(_){}}return originalLoadSlot(slot)};
const originalContinue=cont;
cont=function(){const result=GameSaveSystem.read(activeSaveSlot);if(result.ok&&Number(result.payload.seed)){runSeed=Number(result.payload.seed)>>>0;try{localStorage.setItem(STORAGE_KEY,String(runSeed))}catch(_){}}return originalContinue()};
function refreshDynamicObjective(){
 let el=document.getElementById("run-seed");
 if(!el){el=document.createElement("div");el.id="run-seed";Object.assign(el.style,{position:"fixed",top:"94px",left:"50%",transform:"translateX(-50%)",zIndex:"24",font:"10px/1.4 system-ui,sans-serif",letterSpacing:".12em",color:"rgba(220,205,185,.42)",pointerEvents:"none"});document.body.appendChild(el)}
 el.textContent="SEMENTE DA PARTIDA · "+runSeed.toString(16).toUpperCase();
}
root.GameDynamicWorld=Object.freeze({getSeed:()=>runSeed,getLore:level=>(lore[level]||[]).slice(),refresh:refreshDynamicObjective});
})(typeof window!=="undefined"?window:globalThis);
