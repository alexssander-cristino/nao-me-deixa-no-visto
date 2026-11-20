# Relatório técnico — Operação Não Me Deixa no Visto

**Data:** 20/11/2026  
**Branch:** `main`  
**Repositório:** https://github.com/alexssander-cristino/nao-me-deixa-no-visto

## Resumo executivo

A base Three.js r128 + Electron foi preservada. Foram integrados quatro módulos novos, corrigidos pontos de persistência e colisão, melhoradas as reações da IA e substituído o loading temporizado por etapas de trabalho assíncronas.

**A operação ainda não está integralmente concluída.** Os sistemas implementados abaixo passaram por testes automatizados, mas o jogo ainda precisa de playtest visual prolongado, medição de desempenho na RTX 3050 Laptop e validação da distribuição Windows final.

## Arquivos criados

- `player-animation.js`
  - Corpo procedural articulado de primeira pessoa, com tronco, braços, antebraços, mãos, pernas, joelhos e pés.
  - Sincronização com posição, yaw, velocidade, corrida e agachamento.
  - Animação de alcance durante interação e reações corporais de medo.
  - Ocultação durante esconderijos; cabeça omitida para não bloquear a câmera.
- `enemy-animation.js`
  - Animação procedural com blending por estado, marcha, corrida, respiração e movimento de cabeça.
- `enemy-ai.js`
  - Percepção explícita por visão e audição. A entidade só atualiza a última posição conhecida quando vê o jogador ou recebe um ruído válido.
- `loading-manager.js`
  - Gerenciador assíncrono de tarefas ponderadas, com progresso emitido após cada tarefa real e tratamento de falhas.

## Arquivos modificados

- `index.html`
  - Integração do corpo do jogador, animação da Valdirene e módulo de percepção.
  - Passos, corrida, portas e objetos empurrados emitem eventos sonoros investigáveis.
  - Ataque final animado da Valdirene dentro do ambiente 3D, com aproximação, pose de ataque, câmera e áudio sincronizados.
  - Loading com etapas reais: construção do cenário/colisões, compilação de materiais/iluminação e primeiro render.
  - Salvamento ampliado com dificuldade, qualidade, FOV, sensibilidade, acessibilidade, posição vertical, agachamento, itens, portas e estado da entidade.
  - Restauração de portas também atualiza os colliders físicos.
  - Callbacks de áudio atrasados são invalidados ao pausar, morrer ou sair da partida, impedindo reprodução atrasada após retomar.
- `main.cjs`
  - Validação de payloads, rejeição de arrays, limite de 1 MB e escrita temporária exclusiva com limpeza em caso de erro.
- `tests/game-systems.test.cjs`
  - Testes para corpo do jogador, animação da Valdirene, loading, percepção, ataque, salvamentos, colisões e áudio.
- `.github/workflows/game-tests.yml`
  - Matriz Linux/Windows, testes em ambas as plataformas, empacotamento Linux e build portátil Windows com artefatos.
- `package.json`
  - Removido o maker Squirrel, que falhou no runner Windows por ferramenta externa ausente. Mantido o pacote ZIP portátil com o executável e os recursos necessários.

## Resultado dos testes automatizados

Workflow mais recente:  
https://github.com/alexssander-cristino/nao-me-deixa-no-visto/actions/runs/44821077423

- Ubuntu: **38 testes aprovados, 0 falhas**; empacotamento Electron Linux aprovado.
- Windows: **38 testes aprovados, 0 falhas**.
- Build portátil Windows: **aprovado**; executável e ZIP gerados e artefato publicado.
- `npm audit`: 0 vulnerabilidades reportadas no último pipeline concluído.
- O pipeline anterior identificou que o maker Squirrel falhava no runner Windows. Ele foi removido; a distribuição configurada agora é ZIP portátil contendo o executável.

## Estado real dos sistemas

| Sistema | Situação |
|---|---|
| Corpo 3D do jogador | Procedural e integrado; sem rig externo, cabeça visível ou animações mocap |
| Animação da Valdirene | Rig procedural existente com blending de patrulha, busca e perseguição |
| Jumpscare | Ataque em ambiente 3D, com aproximação, animação, áudio e transição para morte; ainda sem captura de movimento |
| IA | Visão/audição explícitas, última posição conhecida, investigação de ruídos, busca e perseguição; pathfinding e estados legados ainda precisam de refinamento |
| Física do jogador | Cápsula 3D e colisões com geometria estática; degraus, escadas e rampas precisam de playtest |
| Física de objetos | Solver AABB 3D com gravidade, impulsos, colisões e sono; não é solver 6DOF com juntas |
| Interações | Coleta, portas e esconderijos integrados; gavetas, armários com inventário próprio e mecanismos adicionais não estão completos |
| Salvamento | Cinco slots, validação, gravação atômica no Electron, estado do jogador, itens, portas, entidade e configurações; não há estado de gavetas/mecanismos ainda inexistentes |
| Loading | Etapas reais de construção, compilação e primeiro render; não mede individualmente cada textura/modelo/arquivo de áudio |
| Áudio | Áudio posicional existente, ruídos investigáveis e invalidação de callbacks ao pausar; mixagem avançada por estado ainda parcial |
| Cenário | Geometria e materiais procedurais existentes; pipeline completo de assets PBR/LOD não foi criado |
| Lanterna | SpotLight, bateria, oscilação e falhas existentes; reflexos e volumetria física não implementados |
| HUD/UI | Menus, inventário, pausa, configurações e slots existentes; revisão visual geral pendente |
| Desempenho | Perfis gráficos e limite de FPS existentes; RTX 3050 Laptop ainda não medida |
| Electron | Isolamento de contexto, preload e salvamentos IPC existentes; Linux empacotado |
| Windows | Testes automatizados passaram; build portátil está em validação no workflow. A abertura interativa em desktop Windows ainda não foi observada |

## Como executar no Windows

Na pasta do repositório:

```powershell
npm install
npm start
```

Executar testes:

```powershell
npm test
```

Gerar o pacote portátil Windows:

```powershell
npm run make
```

O ZIP e os arquivos empacotados são gerados em `out/`. Extraia o ZIP e execute o arquivo `.exe` dentro da pasta do aplicativo. Não é necessário instalar Node.js ou ferramentas de desenvolvimento na máquina de destino.

## Validação manual ainda necessária

1. Abrir o jogo no Windows e percorrer os cinco capítulos.
2. Verificar clipping, visibilidade e proporções do corpo em primeira pessoa.
3. Testar a Valdirene em corredores, portas, esconderijos e perseguições.
4. Confirmar o ataque e a tela de morte em execução real.
5. Salvar e carregar cada tipo de estado do ambiente.
6. Testar escadas, degraus, rampas, portas e objetos empurráveis.
7. Medir FPS, frame time, VRAM e estabilidade na RTX 3050 Laptop de 6 GB.
8. Confirmar que o ZIP portátil abre em uma instalação limpa do Windows.

## Critério de conclusão

Esta entrega melhora e integra sistemas reais, mas não declara o jogo completo. A conclusão exige a validação manual acima e a implementação dos sistemas ainda parciais, especialmente gavetas/mecanismos, física avançada, assets visuais finais e testes de desempenho em hardware-alvo.


---

## Aditivo — etapa de mecanismos interativos (20/11/2026)

### Auditoria confrontada com o código
A leitura deste relatório e dos módulos atuais confirmou que o jogo ainda usa:
- portas de passagem com rotação e collider atualizados;
- esconderijos de armário sem portas individuais;
- props dinâmicos por solver AABB 3D;
- salvamento de portas, itens e jogador, mas sem estado individual de mecanismos;
- personagens procedurais, sem esqueleto/mocap externo;
- cenário procedural, sem pipeline de assets PBR/LOD completo.

### Implementações desta etapa

| Item | Classificação | Resultado |
|---|---|---|
| Motor genérico de mecanismos | **PARCIAL** | Registro por ID, tipos hinge/drawer/switch/lever/button/lock, limites, animação temporal, chave opcional e serialização |
| Portas de armário | **PARCIAL** | Duas portas articuladas por armário, animação suave, geometria própria, colisores OBB atualizados e áudio posicional |
| Gavetas | **PARCIAL** | Duas gavetas por armário, deslocamento linear, limites, colisores atualizados e áudio posicional |
| Seleção individual | **PARCIAL** | Alvo de interação calculado por posição para cada porta/gaveta |
| Persistência | **PARCIAL** | Progresso, destino, bloqueio e habilitação de cada mecanismo entram no payload de salvamento; IDs são reconstruídos de coordenadas estáveis do cenário |
| Itens dentro de gavetas | **PARCIAL** | Primeira gaveta inferior do primeiro armário do capítulo contém uma bateria coletável; demais gavetas sem loot individual | Gavetas ainda não possuem loot individual coletável nem integração de chave/cadeado no cenário |
| Disjuntores, interruptores e alavancas no cenário | **PENDENTE** | Tipos suportados pelo motor, mas não existem objetivos/malhas/efeitos de gameplay integrados |
| Física de objetos | **PARCIAL** | Solver AABB 3D existente preservado; não foi convertido em solver 6DOF nem recebeu rampas/escadas físicas |
| Rig humano esquelético | **PENDENTE** | Rig atual continua procedural por pivôs; não há esqueleto externo, skinning completo ou mocap |
| Valdirene e animações | **PARCIAL** | Blending procedural existente preservado; não há nova animação de busca específica de armário nem mocap |
| Modelos e ambientes PBR/LOD | **PENDENTE** | Esta etapa acrescentou detalhes funcionais às portas/gavetas; não substitui o pipeline de arte final |
| Salvamentos antigos | **PARCIAL** | Campos novos são opcionais; saves anteriores sem `mechanisms` continuam carregando sem restaurar estados inexistentes |
| Testes automatizados | **CONCLUÍDO** | 43 testes aprovados em Linux e Windows no workflow 44824993583 |
| Teste visual prolongado no Windows | **NÃO VALIDADO** | Não foi executado nesta sessão; CI não substitui playtest visual |
| Benchmark RTX 3050 Laptop 6 GB | **NÃO VALIDADO** | Nenhum FPS, frame time, RAM ou VRAM foi medido; não há números estimados apresentados como medição |

### Arquivos desta etapa
- Criado `mechanisms.js`: motor de estados, animação, travas opcionais e snapshot/restore.
- Criado `tests/mechanisms.test.cjs`: testes de gaveta, dobradiça, chave, ID único, restauração e limites.
- Modificado `index.html`: criação de portas e gavetas nos armários existentes, interação por proximidade, áudio, colisores e persistência.
- Este relatório atualizado com o estado real, sem elevar itens parciais a concluídos.

### Limitações e riscos ainda abertos
1. As portas e gavetas foram integradas aos armários existentes, mas não há itens coletáveis gerados dentro delas.
2. O inventário atual do jogo não possui uma coleção de chaves; por isso, a capacidade de cadeado do motor é testada isoladamente, não usada numa missão.
3. O sistema não cria automaticamente mecanismos de história, disjuntores ou alavancas: esses elementos exigem objetivos e efeitos narrativos específicos por capítulo.
4. A colisão das portas/gavetas usa OBB 2D no plano do cenário, coerente com a arquitetura atual; não é colisão rígida 6DOF.
5. A qualidade visual geral, rig esquelético, física de rampas/escadas e otimização GPU continuam sem implementação/validação suficientes.
6. Os novos estados de mecanismo só podem ser considerados validados após CI e playtest no executável Windows.

### Estado da operação
**A operação permanece aberta.** A integração de portas e gavetas é um avanço funcional, não a conclusão absoluta solicitada. CI, validação visual real no Windows e benchmark físico da RTX 3050 ainda são critérios bloqueadores.


### Resultado de validação automatizada após a integração

Workflow: https://github.com/alexssander-cristino/nao-me-deixa-no-visto/actions/runs/44824652262  
Commit de código testado: `14f1e96d94d65d20fbd3f5e2d1df030c43d0b97d`

- Linux: **42 testes aprovados, 0 falhas**; pacote Electron Linux gerado.
- Windows: **42 testes aprovados, 0 falhas**; build portátil Windows aprovado.
- Artefatos `game-build-Windows` e `game-build-Linux` publicados pelo workflow.
- Execução concluída com **success**.
- O primeiro CI da integração encontrou apenas uma asserção antiga que esperava `schema:3`; a expectativa foi atualizada para o payload `schema:4` com snapshot de mecanismos. Nenhum teste foi removido.
- Essa aprovação comprova testes automatizados e empacotamento, não comprova playtest visual no desktop nem benchmark de hardware.

Classificação atualizada: **testes automatizados — CONCLUÍDO** para o commit acima; **build portátil Windows — CONCLUÍDO** em CI; **teste manual Windows e RTX 3050 — NÃO VALIDADO**.


### Extensão de loot e validação incremental (20/11/2026)

- A primeira gaveta inferior do primeiro armário de cada capítulo agora pode revelar uma pilha coletável. O item reutiliza o fluxo existente de bateria/inventário e não é duplicado quando já consta no progresso coletado.
- Ao carregar um save com a gaveta aberta, o loot é reconstruído se ainda não foi coletado; se já foi coletado, permanece ausente.
- Foi adicionado teste de regressão para spawn, coleta e restauração sem duplicação.
- Workflow atual: https://github.com/alexssander-cristino/nao-me-deixa-no-visto/actions/runs/44824993583
- Os testes automatizados Linux e Windows passaram nesta execução; o build/artefato Windows ainda estava em execução no momento deste registro.
- O loot continua **PARCIAL**: só há um ponto de loot por capítulo; não há tabela de itens aleatórios, chaves de missão ou conteúdo individual em todas as gavetas.


### Resultado final do workflow após o loot de gaveta

Workflow: https://github.com/alexssander-cristino/nao-me-deixa-no-visto/actions/runs/44824993583  
Commit de código: `4a27e978777ecae0ab845a135f6c16bccb7b1d20`

- Linux: **43 testes aprovados, 0 falhas**.
- Windows: **43 testes aprovados, 0 falhas**.
- Empacotamento portátil Windows: **success**.
- Artefatos `game-build-Windows` (aprox. 333 MB) e `game-build-Linux` (aprox. 132 MB) publicados.
- Workflow completo: **completed / success**.

Aprovação do workflow cobre testes automatizados e build, mas não altera as classificações de playtest manual e benchmark: ambos continuam **NÃO VALIDADO**.


---

## Aditivo técnico — implementação das pendências (20/11/2026)

Esta atualização registra o que foi efetivamente implementado no código. As classificações abaixo substituem o estado anterior para os sistemas listados; não representam validação visual de execução.

### Estado consolidado

| Sistema | Situação | Implementação realizada | Testes |
|---|---|---|---|
| Gavetas e armários | **PARCIAL** | Duas portas articuladas e duas gavetas por armário, animação progressiva, colisores atualizados durante o movimento, sons separados e loot persistente na gaveta inferior do primeiro armário | Testes de mecanismos, limites, colisão e restauração |
| Chaves e cadeados | **PARCIAL** | Inventário de chaves por ID; chave coletável na gaveta; fechadura do armário-alvo consome a chave correta; restauração impede abrir fechadura por snapshot inconsistente | Testes de inventário, chave incompatível, consumo e save corrompido |
| Disjuntores | **PARCIAL** | Dois interruptores independentes por capítulo: iluminação e saída; luzes e indicadores mudam de estado; sons de acionamento; ambos os circuitos são persistidos | Teste de switch, callback, serialização e restauração |
| Integração com missões | **PARCIAL** | Chave abre o armário designado; os dois circuitos precisam ser religados para liberar a saída; Valdirene pode abrir uma porta de armário desbloqueada durante uma busca por jogador escondido | Testes de integração e regressão de estados |
| Física de objetos | **PARCIAL** | Mantido o solver 3D existente com massa, gravidade, atrito, restituição e colisões; caixas podem ser empurradas e arrastadas com G; ruídos dos objetos alimentam a percepção da IA; posição e rotação das caixas são salvas | Testes de gravidade, impulso, colisão, repouso, arrasto integrado e persistência |
| Rampas e escadas | **PARCIAL** | CharacterPhysicsWorld ganhou superfícies inclinadas contínuas, suporte de chão e transição de subida/descida; mantém a tolerância de degrau existente | Testes automatizados de subida, descida, suporte e prevenção de penetração; não há geometria de rampa/escada adicionada aos capítulos |
| Rig humano | **PARCIAL** | Hierarquia nomeada de ossos para jogador e Valdirene: raiz, pelve, coluna, pescoço, cabeça, ombros e quadris; partes visuais existentes foram ligadas aos ossos e continuam sendo animadas | Testes de hierarquia, relações entre ossos e partes articuladas |
| Animações da Valdirene | **PARCIAL** | Animação procedural existente passou a dirigir o rig hierárquico; integração de abertura de armário com estado de busca da IA | Testes de animação e rig; sem captura de movimento ou playtest visual |
| Modelos 3D | **PARCIAL** | Modelos procedurais existentes foram preservados e ligados ao novo rig; não foram substituídos por placeholders | Testes de construção do modelo e rig; qualidade artística não validada visualmente |
| Materiais PBR | **PARCIAL** | Geradores de mapas de normal e roughness em DataTexture, aplicados às paredes e pisos; materiais continuam usando MeshStandardMaterial | Teste de geração, variação e aplicação dos mapas |
| LOD | **PARCIAL** | LOD de duas distâncias para caixas móveis; paredes estáticas agrupadas com InstancedMesh para reduzir draw calls | Testes de integração do LOD e do instanciamento |
| Salvamento | **PARCIAL** | Payload schema 5 salva mecanismos, chaves, circuitos e transformações das caixas; continuação do slot ativo restaura esses dados; saves antigos são sanitizados e continuam carregáveis | Testes de serialização, restauração, compatibilidade e validação de dados |
| Testes automatizados | **CONCLUÍDO** | Cobertura ampliada sem remover a suíte existente | 57 aprovados, 0 falhas em Linux e Windows no workflow mais recente |
| Testes visuais Windows | **NÃO VALIDADO** | Build/testes automatizados no runner Windows não equivalem a jogar interativamente no desktop | Não foi realizada sessão visual interativa |
| Desempenho | **NÃO VALIDADO** | Instancing e LOD foram implementados, mas não há benchmark medido na RTX 3050 física | FPS, 1% low, frametime, VRAM e RAM não medidos |

### Arquivos criados

- gameplay-systems.js — inventário persistente de chaves por identificador.
- materials.js — geração e aplicação de mapas PBR procedurais.
- tests/gameplay-systems.test.cjs — testes de inventário, duplicidade, restauração e validação de IDs.

### Arquivos modificados

- index.html — integração dos mecanismos, painel elétrico com dois circuitos, progressão, IA de busca de armário, inventário, save schema 5, arrasto e restauração de caixas, PBR, instancing e LOD.
- mechanisms.js — restauração segura de fechaduras e estado dos mecanismos.
- physics.js — suporte contínuo para rampas no controlador FPS.
- models.js — rig hierárquico da Valdirene.
- player-animation.js — rig hierárquico do corpo do jogador.
- tests/game-systems.test.cjs — regressões de integração, rig, PBR, LOD, mecanismos e persistência.
- tests/mechanisms.test.cjs — circuitos e validação de snapshots de fechaduras.
- tests/physics.test.cjs — subida e descida em rampas.
- RELATORIO-OPERACAO-2026-11-20.md — este aditivo.

### Resultados automatizados e problemas corrigidos

- O workflow executou npm test em ubuntu-latest e windows-latest.
- Na execução de código imediatamente anterior à separação dos dois circuitos, foram confirmados 57/57 testes em Linux e 57/57 em Windows, além de build portátil Windows e artefatos de build.
- Workflow final do commit com dois circuitos e indicadores alinhados: https://github.com/alexssander-cristino/nao-me-deixa-no-visto/actions/runs/44829520233 — completed / success.
- Linux: 57 testes aprovados, 0 falhas. Windows: 57 testes aprovados, 0 falhas.
- Build portátil Windows: success. Artefatos publicados: game-build-Windows (317,7 MB) e game-build-Linux (126,3 MB).
- Uma asserção antiga do teste de save esperava o payload schema 4. Ela foi atualizada para schema 5 e para incluir o snapshot de objetos; os testes subsequentes passaram.
- A restauração de saves ativos foi corrigida para hidratar chaves, mecanismos, circuitos, configurações, estado do jogador e posições dos objetos — não apenas o progresso básico.
- A restauração de fechaduras foi endurecida para não aceitar um estado desbloqueado sem comprovação de uso da chave.

### Limitações restantes

1. O solver continua sendo uma física de corpos rígidos simplificada com colisões AABB e rotação limitada; não é um motor 6DOF completo.
2. Rampas têm suporte no controlador, mas ainda não foram construídas como geometria jogável nos capítulos; escadas físicas não foram adicionadas aos cenários.
3. O rig é uma hierarquia óssea que conduz partes rígidas existentes; não é um pipeline completo de skinning, pesos de vértices ou mocap.
4. A IA abre uma porta de armário desbloqueada quando procura o jogador escondido; não há investigação completa de todos os armários nem animação de alcance manual sincronizada.
5. O loot permanece concentrado na gaveta inferior do primeiro armário; não existe tabela variável de conteúdo para todas as gavetas.
6. Os mapas PBR estão aplicados às superfícies principais; não há mapas AO/normal/roughness individualizados para todos os móveis, personagens e objetos.
7. O LOD foi aplicado às caixas móveis; os demais modelos ainda não têm níveis de detalhe próprios.
8. O salvamento de objetos cobre as caixas físicas atuais, não qualquer objeto arbitrário que venha a ser movimentado.
9. O runner Windows comprova testes e empacotamento, não uma sessão visual interativa no computador do usuário.
10. Não há métricas de desempenho da RTX 3050 física; qualquer benchmark continua pendente.

**Conclusão técnica:** os mecanismos de chave, armário, dois circuitos elétricos, progressão, arrasto de caixas, persistência desses estados, rig hierárquico, mapas PBR principais e otimizações de instancing/LOD foram implementados e integrados. A operação geral permanece **PARCIAL** porque qualidade visual final, física 6DOF, geometria de rampas/escadas, skinning completo, playtest visual no Windows e benchmark físico ainda não foram comprovados ou concluídos.
