# NÃO ME DEIXA NO VISTO

<p align="center">
  <strong>Ela sabe que você está aí.</strong><br>
  Um jogo de terror psicológico em primeira pessoa.
</p>

---

## Sobre o jogo

**Não Me Deixa no Visto** é um jogo de terror psicológico em primeira pessoa, desenvolvido com JavaScript, Electron e Three.js.

Explore ambientes abandonados, encontre objetos, resolva enigmas e sobreviva à presença de Valdirene, uma entidade que reage aos movimentos, sons e comportamentos do jogador. O jogo combina exploração, suspense, perseguição, investigação e narrativa ambiental.

## História

Você está preso em lugares onde alguma coisa parece profundamente errada. Enquanto tenta descobrir o que aconteceu, uma presença começa a acompanhar seus passos. Ela observa, investiga ruídos, procura por você e pode surgir quando menos se espera.

Essa presença é Valdirene.

Sobreviver não significa apenas correr. É necessário prestar atenção ao ambiente, administrar recursos, compreender pistas e descobrir como escapar.

## Fases

A campanha possui **15 fases**, divididas entre os cenários originais e a expansão da campanha:

| Fase | Cenário | Objetivo principal |
|---|---|---|
| 01 | A Casa | Reconstruir o código do quadro |
| 02 | Corredor Infinito | Restaurar os circuitos do corredor |
| 03 | Mercado Abandonado | Rastrear o enxoval desaparecido |
| 04 | Motel Decadente | Rastrear a ligação do quarto 13 |
| 05 | Igreja Abandonada | Reacender o altar |
| 06 | O Prédio Vazio | Liberar o prédio vazio |
| 07 | A Escola Fechada | Encontrar a chamada correta |
| 08 | A Clínica | Reativar a ala clínica |
| 09 | O Estacionamento | Restaurar a saída do estacionamento |
| 10 | A Estação | Liberar a plataforma |
| 11 | A Casa de Festas | Preparar a saída da festa |
| 12 | O Hotel 13 | Abrir a rota do hotel |
| 13 | O Subsolo | Controlar a pressão do subsolo |
| 14 | A Maternidade | Reunir as pulseiras |
| 15 | A Igreja Invertida | Completar o ritual invertido |

Cada fase possui cenário, ambientação, desafios e objetivos próprios. Os desafios de capítulo exigem a conclusão de uma sequência de três interações para liberar o progresso.

## Valdirene

Valdirene é a principal entidade antagonista. Sua inteligência artificial utiliza diferentes mecanismos de percepção e comportamento:

- **Visão:** identifica o jogador conforme distância e condições de visibilidade.
- **Audição:** investiga ruídos produzidos durante a exploração.
- **Investigação:** verifica locais onde identificou possíveis evidências.
- **Perseguição:** tenta alcançar o jogador quando identifica sua presença.
- **Busca:** procura o jogador após perder contato visual.
- **Memória:** mantém evidências temporárias com diferentes níveis de confiança.
- **Dificuldade:** ajusta parâmetros de percepção e comportamento.

O comportamento da entidade busca criar situações imprevisíveis sem depender exclusivamente de sustos programados.

## Principais mecânicas

- Exploração em primeira pessoa.
- Movimentação, corrida e agachamento.
- Colisões e física de objetos.
- Interação com portas, gavetas e mecanismos.
- Coleta e utilização de itens.
- Chaves e mecanismos de desbloqueio.
- Enigmas e objetivos por capítulo.
- Sistema de esconderijos.
- Lanterna e gerenciamento de bateria.
- Eventos dinâmicos de terror.
- Áudio espacial.
- Salvamento e recuperação de progresso.
- Animações procedurais de personagens.
- Iluminação e materiais dinâmicos.

## Tecnologia

| Tecnologia | Aplicação |
|---|---|
| JavaScript | Lógica principal do jogo |
| Electron | Aplicativo desktop |
| Three.js | Renderização e ambientes 3D |
| HTML5 | Interface e estrutura |
| CSS3 | Estilização e efeitos visuais |
| Web Audio API | Áudio e efeitos sonoros |
| Node.js | Ambiente de execução |
| GitHub Actions | Integração contínua e testes |

## Requisitos

- Node.js instalado.
- npm.
- Windows, Linux ou ambiente compatível com Electron.
- GPU com suporte a WebGL para renderização 3D.

O desempenho pode variar de acordo com o hardware e as configurações gráficas.

## Instalação

Clone o repositório:

```bash
git clone https://github.com/alexssander-cristino/nao-me-deixa-no-visto.git
```

Entre na pasta:

```bash
cd nao-me-deixa-no-visto
```

Instale as dependências:

```bash
npm install
```

Execute o jogo:

```bash
npm start
```

## Testes

O projeto possui testes automatizados utilizando o test runner nativo do Node.js.

Para executar:

```bash
npm test
```

A integração contínua utiliza GitHub Actions para validar o projeto em ambientes Windows e Linux e verificar o processo de empacotamento.

## Estrutura do projeto

Principais módulos do projeto:

```text
nao-me-deixa-no-visto/
├── index.html
├── main.cjs
├── preload.cjs
├── package.json
├── enemy-ai.js
├── enemy-animation.js
├── player-animation.js
├── physics.js
├── controller.js
├── models.js
├── materials.js
├── rendering.js
├── mechanisms.js
├── gameplay-systems.js
├── dynamic-world.js
├── scare-director.js
├── chapter-objectives.js
├── campaign-expansion.js
├── valdirene-dialogue.js
├── audio-manager.js
├── audio/
│   └── valdirene/
├── save-system.js
├── loading-manager.js
└── tests/
    └── game-systems.test.cjs
```

## Desenvolvimento

O jogo está em desenvolvimento contínuo. As principais frentes de evolução incluem:

- Aprimoramento da inteligência artificial de Valdirene.
- Evolução das animações e modelos 3D.
- Melhorias de iluminação e ambientação.
- Expansão dos efeitos sonoros e diálogos.
- Refinamento das mecânicas de exploração.
- Otimização de desempenho.
- Melhorias de estabilidade e cobertura de testes.

## Projeto

**Repositório:** [alexssander-cristino/nao-me-deixa-no-visto](https://github.com/alexssander-cristino/nao-me-deixa-no-visto)

**Desenvolvimento:** Alexssander Cristino

---

<p align="center">
  <strong>Não Me Deixa no Visto</strong><br>
  Você pode até fechar a porta. Mas ela já sabe onde você está.
</p>
