import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'sveltekit-chat-ollama',
  webDir: 'build',
  server: {
		androidScheme: 'http'
	}
};

export default config;
