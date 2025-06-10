import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/MessagingHub',
  // uncomment for local development cors fix (port 5555 is the default for the WM IS)
  // server: {
  //   proxy: {
  //     '/messaging': {
  //       target: 'http://localhost:5555',
  //       changeOrigin: true,
  //       secure: false
  //     }
  //   }
  // }
})

