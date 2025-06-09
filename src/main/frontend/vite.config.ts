import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/MessagingHub',
  server: {
    proxy: {
      '/messaging': {
        target: 'http://localhost:5555',
        changeOrigin: true,
        secure: false
      }
    }
  }
})


// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
//
// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   base: '/MessagingHub',
// })
