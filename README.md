🚍 Assistente EPT
Sobre o projeto

O Assistente EPT é um chatbot desenvolvido para facilitar o acesso às informações do transporte público de Maricá/RJ por meio de uma conversa em linguagem natural.

A proposta é permitir que o usuário faça perguntas da mesma forma que faria para outra pessoa, sem precisar conhecer previamente o número da linha, o sentido ou a forma exata de pesquisar uma informação.

Por exemplo:

"Qual ônibus sai do Centro de Maricá e vai para Recanto Itaipuaçu?"

O sistema interpreta a pergunta, consulta os dados disponíveis e apresenta uma resposta de forma simples e natural.

🎯 Objetivo

O principal objetivo do projeto é tornar a consulta de informações do transporte público mais simples, rápida e acessível.

O Assistente EPT foi pensado para auxiliar o usuário na consulta de informações como:

Linhas de ônibus;
Origem e destino;
Sentidos das linhas;
Itinerários;
Vias percorridas;
Pontos de referência;
Horários.

A ideia é substituir consultas mais complexas por uma experiência de conversa.

💡 Ideia do projeto

O projeto surgiu da ideia de combinar Inteligência Artificial com dados estruturados de transporte público.

Em vez de criar um chatbot baseado apenas em perguntas e respostas previamente cadastradas, o Assistente EPT utiliza a IA para interpretar a intenção do usuário e consultar informações reais armazenadas em um banco de dados.

Dessa forma, diferentes formas de fazer a mesma pergunta podem ser compreendidas pelo sistema.

Por exemplo:

"Qual ônibus vai para o Recanto?"

"Tem ônibus do Centro para o Recanto?"

"Qual linha pega no Centro e vai para o Recanto Itaipuaçu?"

Apesar de serem perguntas diferentes, todas podem representar uma intenção semelhante.

🧠 Inteligência Artificial + Dados

Um dos principais conceitos do projeto é separar a interpretação da pergunta dos dados de transporte.

A IA é responsável por compreender o que o usuário está perguntando, enquanto as informações sobre linhas, itinerários, horários e outros dados são consultadas no banco de dados.

O fluxo funciona, de forma simplificada, assim:

Usuário
   ↓
Pergunta em linguagem natural
   ↓
Inteligência Artificial
   ↓
Interpretação da intenção
   ↓
Ferramenta de consulta
   ↓
Banco de dados
   ↓
Informações de transporte
   ↓
Resposta do Assistente

Isso permite que o sistema trabalhe com informações mais estruturadas e reduz a necessidade de cadastrar manualmente cada possível pergunta.

🛠️ Tecnologias utilizadas
Front-end

Svelte
Utilizado para construção da interface do chatbot.

SvelteKit
Framework principal da aplicação, utilizado tanto na construção da interface quanto na camada de servidor.

Tailwind CSS
Utilizado para estilização e criação da interface responsiva.

Inteligência Artificial

Vercel AI SDK
Utilizado para integrar a aplicação com o modelo de linguagem e trabalhar com conversação, streaming e ferramentas.

Groq
Utilizado como provedor para execução do modelo de Inteligência Artificial.

Ollama
Utilizado durante a etapa de desenvolvimento e testes locais.

Gemma
Modelos utilizados durante os testes com execução local através do Ollama.

Banco de dados

PostgreSQL

Responsável pelo armazenamento das informações do transporte público.

O banco contém estruturas relacionadas a:

Linhas;
Sentidos;
Origem e destino;
Itinerários;
Vias;
Horários;
Pontos de referência;
Aliases de localidades.
Aplicativo mobile

Capacitor

Utilizado para transformar a aplicação desenvolvida com tecnologias web em um aplicativo Android.

Android Studio

Utilizado para desenvolvimento, configuração e geração do aplicativo Android.

Hospedagem

Railway

Utilizado para hospedar a aplicação e disponibilizar o backend para que o aplicativo mobile possa se comunicar com o servidor pela internet.

📱 Aplicativo

Além da versão web, o projeto foi preparado para funcionar como um aplicativo Android.

A aplicação mobile se comunica com o backend hospedado, permitindo que o usuário utilize o Assistente EPT sem precisar ter o ambiente de desenvolvimento, banco de dados ou modelo de IA instalado no próprio dispositivo.
