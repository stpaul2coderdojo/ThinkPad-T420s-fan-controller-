# Hosting on Render (render.com) 🌐

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

This guide walks you through deploying the **ThinkPad T420s Antigravity Thermal Agent** onto **[Render](https://render.com/)** for free.

---

## ⚡ Quick Method 1: Deploy with Render Blueprint (`render.yaml`)

1. Push your repository to **GitHub** or **GitLab**.
2. Log into [dashboard.render.com](https://dashboard.render.com/).
3. Click **New +** and select **Blueprint**.
4. Connect your GitHub/GitLab repository.
5. Render will automatically detect the `render.yaml` file in the root of the project.
6. Click **Apply**.
7. Render will automatically:
   - Install dependencies (`npm ci`)
   - Build the production bundle (`npm run build`)
   - Start the Express server (`npm start`)
   - Monitor health checks via `/healthz`

Your dashboard will be live at `https://thinkpad-t420s-thermal-agent.onrender.com`!

---

## 🖥️ Method 2: Manual Web Service (Node.js)

If you prefer configuring through the Render UI manually:

1. Click **New +** > **Web Service**.
2. Connect your repository.
3. Configure the following fields:
   - **Name**: `thinkpad-t420s-thermal-agent`
   - **Region**: Choose closest to you (e.g., Oregon, Ohio, Frankfurt, Singapore).
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
4. Under **Advanced**:
   - Add Environment Variable: `NODE_ENV` = `production`
   - Health Check Path: `/healthz`
5. Click **Create Web Service**.

---

## 📦 Method 3: Deploy as a Render Static Site (100% Free CDN)

If you only want the client-side SPA served on Render's global CDN:

1. Click **New +** > **Static Site**.
2. Connect your repository.
3. Configure:
   - **Name**: `thinkpad-t420s-agent`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `./dist`
4. Under **Redirects/Rewrites**:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
5. Click **Create Static Site**.

---

## 🔗 Connecting to Real ThinkPad T420s Hardware from Render

When your app is hosted in the cloud on Render, it can still control your physical ThinkPad T420s at home/office!

1. Open your hosted Render app URL (`https://your-app.onrender.com`).
2. Run the companion bridge on your physical ThinkPad:
   - **Linux**: `sudo python3 scripts/thinkpad_bridge.py`
   - **Windows 10/11**: Double-click `windows/run-windows-app.bat`
3. In the Render app, click **Real Hardware ACPI** > **Probe Localhost Bridge (:9090)**.
4. The cloud-hosted dashboard will communicate securely with your local ThinkPad via browser loopback (`localhost:9090`).

---

## 👨‍🔬 Author & License
- **Author**: Dr. Bheemaiah Anil K, Director, Synergy Robotics Seattle
- **License**: MIT License
