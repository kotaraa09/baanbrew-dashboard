import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // GitHub Pages เสิร์ฟที่ /baanbrew-dashboard/ ส่วน dev ยังใช้ /
  base: process.env.GITHUB_PAGES ? "/baanbrew-dashboard/" : "/",
  plugins: [react(), tailwindcss()],
});
