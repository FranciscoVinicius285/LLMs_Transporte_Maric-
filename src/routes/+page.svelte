<script lang="ts">
    import { Chat } from '@ai-sdk/svelte';
import { DefaultChatTransport } from 'ai';

    let input = '';

    const chat = new Chat({
	transport: new DefaultChatTransport({
		api: ''
	})
});

    function handleSubmit(event: SubmitEvent) {
        event.preventDefault();

        const message = input.trim();

        if (!message) return;

        chat.sendMessage({
            text: message
        });

        input = '';
    }
</script>


<svelte:head>
  <title>Assistente Ept</title>
  <meta
    name="description"
    content="Assistente de transporte público e rotas de ônibus"
  />
</svelte:head>
  <style>
    :root {
      --primary: #d62828;
      --primary-hover: #b91c1c;
      --bg: #ffffff;
      --foreground: #1a1a1a;
      --muted: #f4f4f5;
      --muted-foreground: #71717a;
      --border: #e4e4e7;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background: var(--muted);
      color: var(--foreground);
      display: flex;
      justify-content: center;
      min-height: 100vh;
    }
    .app {
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 480px;
      height: 100vh;
      background: var(--bg);
      border-left: 1px solid var(--border);
      border-right: 1px solid var(--border);
    }
    /* Header */
    header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
    }
    .avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--primary);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        flex-shrink: 0;
        color: #fff;
    }
    .header-info h1 { font-size: 16px; font-weight: 700; }
    .header-info span { font-size: 13px; color: black; font-weight: 500; }

    /* Messages */
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .row { display: flex; }
    .row.user { justify-content: flex-end; }
    .row.bot { justify-content: flex-start; }
    .bubble {
      max-width: 78%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    .row.user .bubble {
      background: var(--primary);
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .row.bot .bubble {
      background: var(--muted);
      color: var(--foreground);
      border: 1px solid var(--border);
      border-bottom-left-radius: 4px;
    }
    .typing { display: flex; gap: 4px; align-items: center; }
    .typing span {
      width: 7px; height: 7px; border-radius: 50%;
      background: var(--muted-foreground);
      animation: blink 1.2s infinite ease-in-out;
    }
    .typing span:nth-child(2) { animation-delay: 0.2s; }
    .typing span:nth-child(3) { animation-delay: 0.4s; }
    @keyframes blink { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }

    /* Input */
    .input-area {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      border-top: 1px solid var(--border);
      background: var(--bg);
    }
    .input-area input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: 24px;
      font-size: 14px;
      outline: none;
    }
    .input-area input:focus { border-color: var(--primary); }
    .send-btn {
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 50%;
      background: var(--primary);
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .send-btn:hover { background: var(--primary-hover); }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  </style>

<div class="app">

    <header>
        <div class="avatar" aria-hidden="true">
            EPT
        </div>

        <div class="header-info">
            <h1>Assistente Ept</h1>
            <span>Transporte público e rotas de ônibus</span>
        </div>
    </header>


    <main class="messages" aria-live="polite">
        {#each chat.messages as message, messageIndex (messageIndex)}
            {#if message.role === 'user'}
                <div class="row user">
                    <div class="bubble">
                        {#each message.parts as part}
                            {#if part.type === 'text'}
                                {part.text}
                            {/if}
                        {/each}
                    </div>
                </div>
            {:else}

                <div class="row bot">
                    <div class="bubble">
                        {#each message.parts as part}
                            {#if part.type === 'text'}
                                {part.text}
                            {/if}
                        {/each}
                    </div>
                </div>
            {/if}
        {/each}

    </main>


    <form class="input-area" onsubmit={handleSubmit}>

        <label
            for="input"
            class="sr-only"
        >
            Mensagem
        </label>

        <input
            id="input"
            type="text"
            bind:value={input}
            placeholder="Digite sua mensagem..."
            autocomplete="off"
        />

        <button
            type="submit"
            class="send-btn"
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
            >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
        </button>

    </form>

</div>

 
