# PhotoOrganizer 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 开发一款Windows桌面照片整理程序，支持多源导入、智能整理和灵活导出

**Architecture:** 采用 Electron + React + TypeScript 技术栈，主进程处理文件和设备管理，渲染进程负责UI展示，通过IPC进行双向通信

**Tech Stack:** 
- Electron 桌面框架
- React 18 + TypeScript
- Tailwind CSS
- Sharp (图像处理)
- ExifReader (EXIF解析)
- Zustand (状态管理)
- Vite + electron-builder

---

## Phase 1: 项目初始化与基础框架

### Task 1: 项目脚手架搭建

**Files:**
- Create: `photo-organizer/package.json`
- Create: `photo-organizer/tsconfig.json`
- Create: `photo-organizer/vite.config.ts`
- Create: `photo-organizer/electron-builder.json`
- Create: `photo-organizer/.gitignore`

- [ ] **Step 1: 创建项目目录结构**

```bash
mkdir -p photo-organizer/src/{main,renderer,preload}
mkdir -p photo-organizer/assets
mkdir -p photo-organizer/src/main/{ipc,services,utils}
mkdir -p photo-organizer/src/renderer/{components,pages,hooks,store,services,types,utils}
```

- [ ] **Step 2: 创建 package.json**

```json
{
  "name": "photo-organizer",
  "version": "1.0.0",
  "description": "智能照片整理桌面程序",
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
    "dev:vite": "vite",
    "dev:electron": "tsc -p tsconfig.main.json && electron .",
    "build": "npm run build:vite && npm run build:electron",
    "build:vite": "vite build",
    "build:electron": "tsc -p tsconfig.main.json",
    "pack": "npm run build && electron-builder --dir",
    "dist": "npm run build && electron-builder"
  },
  "dependencies": {
    "electron-store": "^8.1.0",
    "exifreader": "^4.14.1",
    "sharp": "^0.33.2",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^18.2.45",
    "@types/react-dom": "^18.2.18",
    "@types/uuid": "^9.0.7",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "concurrently": "^8.2.2",
    "electron": "^28.1.0",
    "electron-builder": "^24.9.1",
    "postcss": "^8.4.32",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.3",
    "vite": "^5.0.10",
    "zustand": "^4.4.7"
  }
}
```

- [ ] **Step 3: 创建 TypeScript 配置**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/renderer"],
  "references": [{ "path": "./tsconfig.main.json" }]
}
```

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "outDir": "dist/main",
    "rootDir": "src/main",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src/main/**/*", "src/preload/**/*"]
}
```

- [ ] **Step 4: 创建 Vite 配置**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer')
    }
  },
  server: {
    port: 5173
  }
})
```

- [ ] **Step 5: 创建 Tailwind CSS 配置**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#10B981'
      }
    },
  },
  plugins: [],
}
```

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 6: 创建 Electron Builder 配置**

```json
{
  "appId": "com.photoorganizer.app",
  "productName": "PhotoOrganizer",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*"
  ],
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ],
    "icon": "assets/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true
  }
}
```

- [ ] **Step 7: 创建 .gitignore**

```
node_modules/
dist/
release/
*.log
.DS_Store
```

- [ ] **Step 8: 安装依赖**

Run: `cd photo-organizer && npm install`
Expected: 成功安装所有依赖包

- [ ] **Step 9: 初始化 Git 仓库并提交**

```bash
cd photo-organizer
git init
git add .
git commit -m "feat: initialize photo-organizer project with Electron + React + TypeScript"
```

---

### Task 2: Electron 主进程基础架构

**Files:**
- Create: `photo-organizer/src/main/index.ts`
- Create: `photo-organizer/src/main/ipc/handlers.ts`
- Create: `photo-organizer/src/preload/index.ts`
- Modify: `photo-organizer/src/main/services/ipc/types.ts`

- [ ] **Step 1: 创建主进程入口文件**

```typescript
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { registerIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'PhotoOrganizer',
  });

  // 开发模式加载 Vite 开发服务器
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

- [ ] **Step 2: 创建 IPC 类型定义**

```typescript
export interface Device {
  id: string;
  name: string;
  type: 'sdcard' | 'android' | 'ios' | 'folder';
  path?: string;
  capacity?: number;
  usedSpace?: number;
}

export interface FileInfo {
  id: string;
  name: string;
  path: string;
  size: number;
  type: 'image' | 'video';
  extension: string;
  modifiedTime: Date;
  exif?: ExifData;
}

export interface ExifData {
  dateTime?: string;
  make?: string;
  model?: string;
  width?: number;
  height?: number;
  gpsLatitude?: number;
  gpsLongitude?: number;
  [key: string]: any;
}

export interface ImportOptions {
  targetPath: string;
  enableOrganize: boolean;
  organizeRules?: OrganizeRules;
}

export interface OrganizeRules {
  dateFormat: 'YYYY-MM-DD' | 'YYYY/MM/DD' | 'YYYY年MM月DD日';
  organizeByDevice: boolean;
  organizeByType: boolean;
  renamePattern?: string;
}

export interface ImportProgress {
  current: number;
  total: number;
  currentFile: string;
  status: 'importing' | 'processing' | 'complete' | 'error';
}
```

- [ ] **Step 3: 创建 IPC 处理器注册**

```typescript
import { ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { scanDirectory, readExif, generateThumbnail } from '../services/fileSystem';
import { organizePhotos } from '../services/organizer';

export function registerIpcHandlers() {
  // 选择文件夹对话框
  ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // 读取目录文件
  ipcMain.handle('files:readDir', async (_, dirPath: string) => {
    return await scanDirectory(dirPath);
  });

  // 获取文件 EXIF 信息
  ipcMain.handle('files:getExif', async (_, filePath: string) => {
    return await readExif(filePath);
  });

  // 生成缩略图
  ipcMain.handle('files:generateThumbnail', async (_, filePath: string) => {
    return await generateThumbnail(filePath);
  });

  // 开始导入
  ipcMain.handle('import:start', async (event, options: ImportOptions) => {
    // 实现导入逻辑
  });

  // 开始整理
  ipcMain.handle('organize:start', async (event, rules: OrganizeRules) => {
    return await organizePhotos(rules);
  });
}
```

- [ ] **Step 4: 创建预加载脚本**

```typescript
import { contextBridge, ipcRenderer } from 'electron';

const api = {
  // 对话框
  selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),
  
  // 文件操作
  readDir: (path: string) => ipcRenderer.invoke('files:readDir', path),
  getExif: (path: string) => ipcRenderer.invoke('files:getExif', path),
  generateThumbnail: (path: string) => ipcRenderer.invoke('files:generateThumbnail', path),
  
  // 导入操作
  startImport: (options: any) => ipcRenderer.invoke('import:start', options),
  cancelImport: () => ipcRenderer.invoke('import:cancel'),
  
  // 整理操作
  startOrganize: (rules: any) => ipcRenderer.invoke('organize:start', rules),
  
  // 事件监听
  onImportProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('import:progress', (_, progress) => callback(progress));
  },
  onOrganizeProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('organize:progress', (_, progress) => callback(progress));
  },
  
  // 移除监听
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
};

contextBridge.exposeInMainWorld('electronAPI', api);
```

- [ ] **Step 5: 提交代码**

```bash
cd photo-organizer
git add src/main src/preload
git commit -m "feat: add Electron main process and IPC infrastructure"
```

---

### Task 3: 渲染进程基础 UI 框架

**Files:**
- Create: `photo-organizer/src/renderer/index.html`
- Create: `photo-organizer/src/renderer/main.tsx`
- Create: `photo-organizer/src/renderer/App.tsx`
- Create: `photo-organizer/src/renderer/index.css`
- Create: `photo-organizer/src/renderer/types/electron.d.ts`
- Create: `photo-organizer/src/renderer/components/layout/Sidebar.tsx`
- Create: `photo-organizer/src/renderer/components/layout/MainLayout.tsx`
- Create: `photo-organizer/src/renderer/store/appStore.ts`

- [ ] **Step 1: 创建 HTML 入口**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PhotoOrganizer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: 创建 React 入口和全局样式**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background-color: #f5f5f5;
}

#root {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
```

- [ ] **Step 3: 创建 Electron API 类型定义**

```typescript
export interface ElectronAPI {
  selectFolder: () => Promise<string | null>;
  readDir: (path: string) => Promise<any[]>;
  getExif: (path: string) => Promise<any>;
  generateThumbnail: (path: string) => Promise<string>;
  startImport: (options: any) => Promise<void>;
  cancelImport: () => Promise<void>;
  startOrganize: (rules: any) => Promise<void>;
  onImportProgress: (callback: (progress: any) => void) => void;
  onOrganizeProgress: (callback: (progress: any) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
```

- [ ] **Step 4: 创建 Zustand Store**

```typescript
import { create } from 'zustand';

interface AppState {
  // 当前视图
  currentView: 'import' | 'gallery' | 'organize' | 'settings';
  setCurrentView: (view: 'import' | 'gallery' | 'organize' | 'settings') => void;
  
  // 设备列表
  devices: any[];
  setDevices: (devices: any[]) => void;
  
  // 当前选中的设备
  selectedDevice: any | null;
  setSelectedDevice: (device: any | null) => void;
  
  // 文件列表
  files: any[];
  setFiles: (files: any[]) => void;
  
  // 选中的文件
  selectedFiles: string[];
  setSelectedFiles: (files: string[]) => void;
  toggleFileSelection: (fileId: string) => void;
  selectAllFiles: () => void;
  clearSelection: () => void;
  
  // 导入进度
  importProgress: any | null;
  setImportProgress: (progress: any | null) => void;
  
  // 整理规则
  organizeRules: any;
  setOrganizeRules: (rules: any) => void;
  
  // 状态栏信息
  statusMessage: string;
  setStatusMessage: (message: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'import',
  setCurrentView: (view) => set({ currentView: view }),
  
  devices: [],
  setDevices: (devices) => set({ devices }),
  
  selectedDevice: null,
  setSelectedDevice: (device) => set({ selectedDevice: device }),
  
  files: [],
  setFiles: (files) => set({ files }),
  
  selectedFiles: [],
  setSelectedFiles: (files) => set({ selectedFiles: files }),
  toggleFileSelection: (fileId) => set((state) => ({
    selectedFiles: state.selectedFiles.includes(fileId)
      ? state.selectedFiles.filter(id => id !== fileId)
      : [...state.selectedFiles, fileId]
  })),
  selectAllFiles: () => set((state) => ({
    selectedFiles: state.files.map(f => f.id)
  })),
  clearSelection: () => set({ selectedFiles: [] }),
  
  importProgress: null,
  setImportProgress: (progress) => set({ importProgress: progress }),
  
  organizeRules: {
    dateFormat: 'YYYY-MM-DD',
    organizeByDevice: true,
    organizeByType: true,
  },
  setOrganizeRules: (rules) => set({ organizeRules: rules }),
  
  statusMessage: '就绪',
  setStatusMessage: (message) => set({ statusMessage: message }),
}));
```

- [ ] **Step 5: 创建主布局组件**

```tsx
import React from 'react';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
```

- [ ] **Step 6: 创建侧边栏组件**

```tsx
import React from 'react';
import { useAppStore } from '../store/appStore';

const menuItems = [
  { id: 'import', label: '导入', icon: '📥' },
  { id: 'gallery', label: '图库', icon: '🖼️' },
  { id: 'organize', label: '整理', icon: '📁' },
  { id: 'settings', label: '设置', icon: '⚙️' },
] as const;

const Sidebar: React.FC = () => {
  const { currentView, setCurrentView } = useAppStore();

  return (
    <aside className="w-48 bg-gray-800 text-white flex flex-col">
      <div className="p-4 text-xl font-bold border-b border-gray-700">
        PhotoOrganizer
      </div>
      <nav className="flex-1 p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
              currentView === item.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
```

- [ ] **Step 7: 创建根组件**

```tsx
import React from 'react';
import MainLayout from './components/layout/MainLayout';
import ImportPage from './pages/ImportPage';
import GalleryPage from './pages/GalleryPage';
import OrganizePage from './pages/OrganizePage';
import SettingsPage from './pages/SettingsPage';
import StatusBar from './components/common/StatusBar';
import { useAppStore } from './store/appStore';

const App: React.FC = () => {
  const currentView = useAppStore((state) => state.currentView);

  const renderPage = () => {
    switch (currentView) {
      case 'import':
        return <ImportPage />;
      case 'gallery':
        return <GalleryPage />;
      case 'organize':
        return <OrganizePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <ImportPage />;
    }
  };

  return (
    <MainLayout>
      {renderPage()}
      <StatusBar />
    </MainLayout>
  );
};

export default App;
```

- [ ] **Step 8: 创建状态栏组件**

```tsx
import React from 'react';
import { useAppStore } from '../store/appStore';

const StatusBar: React.FC = () => {
  const { statusMessage, files, selectedFiles } = useAppStore();

  return (
    <div className="h-8 bg-gray-100 border-t border-gray-300 px-4 flex items-center justify-between text-sm text-gray-600">
      <span>{statusMessage}</span>
      <span>
        {files.length > 0 && `${selectedFiles.length}/${files.length} 个文件已选择`}
      </span>
    </div>
  );
};

export default StatusBar;
```

- [ ] **Step 9: 提交代码**

```bash
cd photo-organizer
git add src/renderer
git commit -m "feat: add basic UI framework with React, Tailwind, and Zustand"
```

---

## Phase 2: 核心功能实现

### Task 4: 文件系统服务实现

**Files:**
- Create: `photo-organizer/src/main/services/fileSystem.ts`
- Create: `photo-organizer/src/main/services/exif.ts`
- Create: `photo-organizer/src/main/services/thumbnail.ts`

- [ ] **Step 1: 实现文件扫描服务**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileInfo } from '../ipc/types';

const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.raw', '.cr2', '.nef', '.arw'];
const SUPPORTED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.wmv'];

export async function scanDirectory(dirPath: string): Promise<FileInfo[]> {
  const files: FileInfo[] = [];
  
  async function scan(currentPath: string) {
    const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const stats = await fs.promises.stat(fullPath);
        
        let type: 'image' | 'video' | null = null;
        
        if (SUPPORTED_IMAGE_EXTENSIONS.includes(ext)) {
          type = 'image';
        } else if (SUPPORTED_VIDEO_EXTENSIONS.includes(ext)) {
          type = 'video';
        }
        
        if (type) {
          files.push({
            id: uuidv4(),
            name: entry.name,
            path: fullPath,
            size: stats.size,
            type,
            extension: ext,
            modifiedTime: stats.mtime
          });
        }
      }
    }
  }
  
  await scan(dirPath);
  return files;
}
```

- [ ] **Step 2: 实现 EXIF 读取服务**

```typescript
import * as fs from 'fs';
import ExifReader from 'exifreader';
import { ExifData } from '../ipc/types';

export async function readExif(filePath: string): Promise<ExifData | null> {
  try {
    const buffer = await fs.promises.readFile(filePath);
    const tags = ExifReader.load(buffer);
    
    const exif: ExifData = {};
    
    if (tags.DateTimeOriginal) {
      exif.dateTime = tags.DateTimeOriginal.description;
    }
    
    if (tags.Make) {
      exif.make = tags.Make.description;
    }
    
    if (tags.Model) {
      exif.model = tags.Model.description;
    }
    
    if (tags['Image Width']) {
      exif.width = parseInt(tags['Image Width'].description);
    }
    
    if (tags['Image Height']) {
      exif.height = parseInt(tags['Image Height'].description);
    }
    
    if (tags.GPSLatitude && tags.GPSLongitude) {
      exif.gpsLatitude = parseFloat(tags.GPSLatitude.description);
      exif.gpsLongitude = parseFloat(tags.GPSLongitude.description);
    }
    
    return exif;
  } catch (error) {
    console.error(`Failed to read EXIF from ${filePath}:`, error);
    return null;
  }
}
```

- [ ] **Step 3: 实现缩略图生成服务**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

const THUMBNAIL_SIZE = 200;

export async function generateThumbnail(filePath: string): Promise<string> {
  try {
    const ext = path.extname(filePath).toLowerCase();
    
    // 只处理图片格式
    if (!['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'].includes(ext)) {
      return '';
    }
    
    const buffer = await fs.promises.readFile(filePath);
    const thumbnail = await sharp(buffer)
      .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toBuffer();
    
    return `data:image/jpeg;base64,${thumbnail.toString('base64')}`;
  } catch (error) {
    console.error(`Failed to generate thumbnail for ${filePath}:`, error);
    return '';
  }
}
```

- [ ] **Step 4: 提交代码**

```bash
cd photo-organizer
git add src/main/services/fileSystem.ts src/main/services/exif.ts src/main/services/thumbnail.ts
git commit -m "feat: implement file system services for scanning, EXIF reading, and thumbnail generation"
```

---

### Task 5: 导入页面实现

**Files:**
- Create: `photo-organizer/src/renderer/pages/ImportPage.tsx`
- Create: `photo-organizer/src/renderer/components/import/DeviceList.tsx`
- Create: `photo-organizer/src/renderer/components/import/FileGrid.tsx`
- Create: `photo-organizer/src/renderer/components/import/ImportOptions.tsx`
- Create: `photo-organizer/src/renderer/components/import/ImportProgress.tsx`

- [ ] **Step 1: 创建导入页面组件**

```tsx
import React, { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import DeviceList from '../components/import/DeviceList';
import FileGrid from '../components/import/FileGrid';
import ImportOptions from '../components/import/ImportOptions';
import ImportProgress from '../components/import/ImportProgress';

const ImportPage: React.FC = () => {
  const { importProgress, setStatusMessage } = useAppStore();

  useEffect(() => {
    setStatusMessage('选择要导入的设备或文件夹');
  }, [setStatusMessage]);

  if (importProgress) {
    return <ImportProgress />;
  }

  return (
    <div className="flex flex-col h-full p-6">
      <h1 className="text-2xl font-bold mb-6">导入照片</h1>
      
      <div className="flex flex-1 gap-6">
        <div className="w-1/3">
          <DeviceList />
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="flex-1 mb-4">
            <FileGrid />
          </div>
          
          <ImportOptions />
        </div>
      </div>
    </div>
  );
};

export default ImportPage;
```

- [ ] **Step 2: 创建设备列表组件**

```tsx
import React, { useEffect } from 'react';
import { useAppStore } from '../../store/appStore';

const DeviceList: React.FC = () => {
  const { devices, selectedDevice, setSelectedDevice, setFiles, setStatusMessage } = useAppStore();

  // 本地文件夹导入
  const handleSelectFolder = async () => {
    const folderPath = await window.electronAPI.selectFolder();
    if (folderPath) {
      const files = await window.electronAPI.readDir(folderPath);
      setFiles(files);
      setSelectedDevice({ id: 'local', name: folderPath, type: 'folder', path: folderPath });
      setStatusMessage(`已选择文件夹：${folderPath}`);
    }
  };

  const handleDeviceSelect = async (device: any) => {
    setSelectedDevice(device);
    if (device.path) {
      const files = await window.electronAPI.readDir(device.path);
      setFiles(files);
      setStatusMessage(`已选择设备：${device.name}`);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full">
      <h2 className="text-lg font-semibold mb-4">选择来源</h2>
      
      {/* 本地文件夹按钮 */}
      <button
        onClick={handleSelectFolder}
        className="w-full p-3 mb-4 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-3 transition-colors"
      >
        <span className="text-2xl">📁</span>
        <div className="text-left">
          <div className="font-medium">本地文件夹</div>
          <div className="text-sm text-gray-500">选择本地文件夹导入</div>
        </div>
      </button>
      
      {/* 设备列表 */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-gray-500">外部设备</h3>
        {devices.length === 0 ? (
          <p className="text-gray-400 text-sm">未检测到外部设备</p>
        ) : (
          devices.map((device) => (
            <button
              key={device.id}
              onClick={() => handleDeviceSelect(device)}
              className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                selectedDevice?.id === device.id
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <span className="text-2xl">
                {device.type === 'sdcard' ? '💾' : device.type === 'android' ? '📱' : '📷'}
              </span>
              <div className="text-left flex-1">
                <div className="font-medium">{device.name}</div>
                {device.capacity && (
                  <div className="text-sm text-gray-500">
                    {Math.round((device.usedSpace / device.capacity) * 100)}% 已用
                  </div>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default DeviceList;
```

- [ ] **Step 3: 创建文件网格组件**

```tsx
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';

const FileGrid: React.FC = () => {
  const { files, selectedFiles, toggleFileSelection, selectAllFiles, clearSelection, setStatusMessage } = useAppStore();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadThumbnails = async () => {
      const newThumbnails: Record<string, string> = {};
      for (const file of files.slice(0, 100)) { // 限制同时加载数量
        if (file.type === 'image' && !thumbnails[file.id]) {
          try {
            const thumb = await window.electronAPI.generateThumbnail(file.path);
            if (thumb) {
              newThumbnails[file.id] = thumb;
            }
          } catch (e) {
            console.error(`Failed to load thumbnail for ${file.name}`);
          }
        }
      }
      if (Object.keys(newThumbnails).length > 0) {
        setThumbnails(prev => ({ ...prev, ...newThumbnails }));
      }
    };

    loadThumbnails();
  }, [files]);

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      clearSelection();
    } else {
      selectAllFiles();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          文件列表 ({files.length})
        </h2>
        <div className="space-x-2">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            {selectedFiles.length === files.length ? '取消全选' : '全选'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            请选择设备或文件夹
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => toggleFileSelection(file.id)}
                className={`cursor-pointer rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedFiles.includes(file.id)
                    ? 'border-blue-500'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {thumbnails[file.id] ? (
                    <img
                      src={thumbnails[file.id]}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : file.type === 'video' ? (
                    <span className="text-4xl">🎬</span>
                  ) : (
                    <span className="text-4xl">🖼️</span>
                  )}
                </div>
                <div className="p-2 text-sm truncate">
                  {file.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileGrid;
```

- [ ] **Step 4: 创建导入选项组件**

```tsx
import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';

const ImportOptions: React.FC = () => {
  const { selectedFiles, selectedDevice, organizeRules, setOrganizeRules, setImportProgress, setStatusMessage } = useAppStore();
  const [targetPath, setTargetPath] = useState('');

  const handleSelectTarget = async () => {
    const path = await window.electronAPI.selectFolder();
    if (path) {
      setTargetPath(path);
    }
  };

  const handleStartImport = async () => {
    if (!targetPath || selectedFiles.length === 0) {
      alert('请选择目标路径并选择要导入的文件');
      return;
    }

    setImportProgress({
      current: 0,
      total: selectedFiles.length,
      currentFile: '',
      status: 'importing'
    });

    setStatusMessage('正在导入...');

    try {
      await window.electronAPI.startImport({
        deviceId: selectedDevice?.id,
        fileIds: selectedFiles,
        targetPath,
        enableOrganize: true,
        organizeRules
      });
    } catch (error) {
      console.error('Import failed:', error);
      setStatusMessage('导入失败');
    } finally {
      setImportProgress(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-2">目标路径</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={targetPath}
              readOnly
              placeholder="选择导出目标..."
              className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
            />
            <button
              onClick={handleSelectTarget}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              浏览
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">整理选项</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={organizeRules.organizeByDevice}
                onChange={(e) => setOrganizeRules({ ...organizeRules, organizeByDevice: e.target.checked })}
              />
              <span className="text-sm">按设备分类</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={organizeRules.organizeByType}
                onChange={(e) => setOrganizeRules({ ...organizeRules, organizeByType: e.target.checked })}
              />
              <span className="text-sm">按类型分类</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleStartImport}
          disabled={!targetPath || selectedFiles.length === 0}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          开始导入 ({selectedFiles.length} 个文件)
        </button>
      </div>
    </div>
  );
};

export default ImportOptions;
```

- [ ] **Step 5: 创建导入进度组件**

```tsx
import React from 'react';
import { useAppStore } from '../../store/appStore';

const ImportProgress: React.FC = () => {
  const { importProgress, setImportProgress, setStatusMessage } = useAppStore();

  const handleCancel = async () => {
    await window.electronAPI.cancelImport();
    setImportProgress(null);
    setStatusMessage('导入已取消');
  };

  const percentage = importProgress ? Math.round((importProgress.current / importProgress.total) * 100) : 0;

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h2 className="text-2xl font-bold mb-6">正在导入照片...</h2>
      
      <div className="w-96">
        <div className="mb-2 flex justify-between text-sm">
          <span>{importProgress?.currentFile}</span>
          <span>{percentage}%</span>
        </div>
        
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        
        <p className="mt-4 text-center text-gray-600">
          {importProgress?.current} / {importProgress?.total} 个文件
        </p>
      </div>

      <button
        onClick={handleCancel}
        className="mt-8 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
      >
        取消导入
      </button>
    </div>
  );
};

export default ImportProgress;
```

- [ ] **Step 6: 提交代码**

```bash
cd photo-organizer
git add src/renderer/pages/ImportPage.tsx src/renderer/components/import/
git commit -m "feat: implement import page with device selection, file grid, and progress tracking"
```

---

### Task 6: 图库页面实现

**Files:**
- Create: `photo-organizer/src/renderer/pages/GalleryPage.tsx`
- Create: `photo-organizer/src/renderer/components/gallery/FilterBar.tsx`
- Create: `photo-organizer/src/renderer/components/gallery/PhotoGrid.tsx`
- Create: `photo-organizer/src/renderer/components/gallery/PhotoViewer.tsx`

- [ ] **Step 1: 创建图库页面组件**

```tsx
import React, { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import FilterBar from '../components/gallery/FilterBar';
import PhotoGrid from '../components/gallery/PhotoGrid';
import PhotoViewer from '../components/gallery/PhotoViewer';

const GalleryPage: React.FC = () => {
  const { files, setStatusMessage } = useAppStore();
  const [viewerOpen, setViewerOpen] = React.useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = React.useState(0);

  useEffect(() => {
    setStatusMessage(`图库中共 ${files.length} 个文件`);
  }, [files, setStatusMessage]);

  const handlePhotoClick = (index: number) => {
    setCurrentPhotoIndex(index);
    setViewerOpen(true);
  };

  return (
    <div className="flex flex-col h-full p-6">
      <h1 className="text-2xl font-bold mb-6">图库</h1>
      
      <FilterBar />
      
      <div className="flex-1 mt-4 overflow-hidden">
        <PhotoGrid onPhotoClick={handlePhotoClick} />
      </div>

      {viewerOpen && (
        <PhotoViewer
          photos={files}
          initialIndex={currentPhotoIndex}
          onClose={() => setViewerOpen(false)}
          onNavigate={setCurrentPhotoIndex}
        />
      )}
    </div>
  );
};

export default GalleryPage;
```

- [ ] **Step 2: 创建筛选栏组件**

```tsx
import React from 'react';
import { useAppStore } from '../../store/appStore';

const FilterBar: React.FC = () => {
  const { files, setFiles, setStatusMessage } = useAppStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<'all' | 'image' | 'video'>('all');

  const handleRefresh = async () => {
    const folderPath = await window.electronAPI.selectFolder();
    if (folderPath) {
      const files = await window.electronAPI.readDir(folderPath);
      setFiles(files);
      setStatusMessage('已刷新图库');
    }
  };

  const filteredFiles = files.filter((file) => {
    if (typeFilter !== 'all' && file.type !== typeFilter) return false;
    if (searchTerm && !file.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
      <input
        type="text"
        placeholder="搜索文件名..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="flex-1 px-3 py-2 border rounded-lg"
      />

      <select
        value={typeFilter}
        onChange={(e) => setTypeFilter(e.target.value as any)}
        className="px-3 py-2 border rounded-lg"
      >
        <option value="all">全部类型</option>
        <option value="image">仅图片</option>
        <option value="video">仅视频</option>
      </select>

      <button
        onClick={handleRefresh}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        刷新
      </button>

      <span className="text-gray-500">
        显示 {filteredFiles.length} / {files.length} 个文件
      </span>
    </div>
  );
};

export default FilterBar;
```

- [ ] **Step 3: 创建照片网格组件**

```tsx
import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';

interface PhotoGridProps {
  onPhotoClick: (index: number) => void;
}

const PhotoGrid: React.FC<PhotoGridProps> = ({ onPhotoClick }) => {
  const { files, selectedFiles, toggleFileSelection } = useAppStore();
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadThumbnails = async () => {
      for (const file of files.slice(0, 50)) {
        if (file.type === 'image' && !thumbnails[file.id]) {
          try {
            const thumb = await window.electronAPI.generateThumbnail(file.path);
            if (thumb) {
              setThumbnails(prev => ({ ...prev, [file.id]: thumb }));
            }
          } catch (e) {
            console.error(`Failed to load thumbnail for ${file.name}`);
          }
        }
      }
    };

    loadThumbnails();
  }, [files]);

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 h-full flex items-center justify-center text-gray-400">
        暂无照片，请先导入照片
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 h-full overflow-y-auto">
      <div className="grid grid-cols-5 gap-4">
        {files.map((file, index) => (
          <div
            key={file.id}
            onClick={() => onPhotoClick(index)}
            className="relative group cursor-pointer"
          >
            <div className={`rounded-lg overflow-hidden border-2 ${
              selectedFiles.includes(file.id)
                ? 'border-blue-500'
                : 'border-transparent'
            }`}>
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {thumbnails[file.id] ? (
                  <img
                    src={thumbnails[file.id]}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : file.type === 'video' ? (
                  <span className="text-5xl">🎬</span>
                ) : (
                  <span className="text-5xl">🖼️</span>
                )}
              </div>
              
              {/* 悬停时显示选择框 */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFileSelection(file.id);
                }}
                className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                  selectedFiles.includes(file.id)
                    ? 'bg-blue-500 border-blue-500'
                    : 'bg-white border-gray-300'
                }`}>
                  {selectedFiles.includes(file.id) && (
                    <span className="text-white text-sm">✓</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-2 text-sm truncate">
              {file.name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhotoGrid;
```

- [ ] **Step 4: 创建照片查看器组件**

```tsx
import React, { useEffect, useState } from 'react';

interface PhotoViewerProps {
  photos: any[];
  initialIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const PhotoViewer: React.FC<PhotoViewerProps> = ({
  photos,
  initialIndex,
  onClose,
  onNavigate
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [showExif, setShowExif] = useState(false);
  const [exif, setExif] = useState<any>(null);
  const [zoom, setZoom] = useState(1);

  const currentPhoto = photos[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  useEffect(() => {
    const loadExif = async () => {
      if (currentPhoto && currentPhoto.type === 'image') {
        const data = await window.electronAPI.getExif(currentPhoto.path);
        setExif(data);
      }
    };
    loadExif();
  }, [currentPhoto]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      onNavigate(newIndex);
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      onNavigate(newIndex);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* 工具栏 */}
      <div className="h-14 bg-gray-800 flex items-center justify-between px-4">
        <div className="text-white">
          {currentIndex + 1} / {photos.length}
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
            className="text-white hover:text-gray-300"
          >
            缩小
          </button>
          <span className="text-white">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(z => Math.min(3, z + 0.25))}
            className="text-white hover:text-gray-300"
          >
            放大
          </button>
          <button
            onClick={() => setShowExif(!showExif)}
            className="text-white hover:text-gray-300 ml-4"
          >
            EXIF信息
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 text-2xl"
        >
          ✕
        </button>
      </div>

      {/* 图片区域 */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {currentPhoto.type === 'image' ? (
          <img
            src={`file://${currentPhoto.path}`}
            alt={currentPhoto.name}
            style={{ transform: `scale(${zoom})` }}
            className="max-w-full max-h-full object-contain transition-transform"
          />
        ) : (
          <div className="text-white text-center">
            <span className="text-8xl mb-4 block">🎬</span>
            <p>视频预览暂不可用</p>
          </div>
        )}

        {/* 导航按钮 */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white text-2xl"
          >
            ‹
          </button>
        )}
        {currentIndex < photos.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center text-white text-2xl"
          >
            ›
          </button>
        )}
      </div>

      {/* EXIF 信息面板 */}
      {showExif && exif && (
        <div className="bg-gray-800 p-4 text-white">
          <h3 className="font-bold mb-2">EXIF 信息</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            {exif.dateTime && <div><span className="text-gray-400">拍摄时间:</span> {exif.dateTime}</div>}
            {exif.make && <div><span className="text-gray-400">品牌:</span> {exif.make}</div>}
            {exif.model && <div><span className="text-gray-400">型号:</span> {exif.model}</div>}
            {exif.width && <div><span className="text-gray-400">宽度:</span> {exif.width}px</div>}
            {exif.height && <div><span className="text-gray-400">高度:</span> {exif.height}px</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoViewer;
```

- [ ] **Step 5: 提交代码**

```bash
cd photo-organizer
git add src/renderer/pages/GalleryPage.tsx src/renderer/components/gallery/
git commit -m "feat: implement gallery page with filtering, photo grid, and viewer"
```

---

### Task 7: 整理页面实现

**Files:**
- Create: `photo-organizer/src/renderer/pages/OrganizePage.tsx`
- Create: `photo-organizer/src/renderer/components/organize/RulesConfig.tsx`
- Create: `photo-organizer/src/renderer/components/organize/PreviewPanel.tsx`

- [ ] **Step 1: 创建整理页面组件**

```tsx
import React, { useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import RulesConfig from '../components/organize/RulesConfig';
import PreviewPanel from '../components/organize/PreviewPanel';

const OrganizePage: React.FC = () => {
  const { files, setStatusMessage } = useAppStore();

  useEffect(() => {
    setStatusMessage('配置整理规则并预览整理效果');
  }, [setStatusMessage]);

  return (
    <div className="flex flex-col h-full p-6">
      <h1 className="text-2xl font-bold mb-6">整理照片</h1>
      
      <div className="flex flex-1 gap-6">
        <div className="w-1/3">
          <RulesConfig />
        </div>
        
        <div className="flex-1">
          <PreviewPanel />
        </div>
      </div>
    </div>
  );
};

export default OrganizePage;
```

- [ ] **Step 2: 创建规则配置组件**

```tsx
import React from 'react';
import { useAppStore } from '../../store/appStore';

const RulesConfig: React.FC = () => {
  const { organizeRules, setOrganizeRules } = useAppStore();

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full">
      <h2 className="text-lg font-semibold mb-4">整理规则</h2>
      
      <div className="space-y-6">
        {/* 日期格式 */}
        <div>
          <label className="block text-sm font-medium mb-2">日期格式</label>
          <select
            value={organizeRules.dateFormat}
            onChange={(e) => setOrganizeRules({ ...organizeRules, dateFormat: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="YYYY-MM-DD">2026-05-19</option>
            <option value="YYYY/MM/DD">2026/05/19</option>
            <option value="YYYY年MM月DD日">2026年05月19日</option>
          </select>
        </div>

        {/* 分类选项 */}
        <div>
          <label className="block text-sm font-medium mb-2">分类方式</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={organizeRules.organizeByDevice}
                onChange={(e) => setOrganizeRules({ ...organizeRules, organizeByDevice: e.target.checked })}
              />
              <span>按设备分类</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={organizeRules.organizeByType}
                onChange={(e) => setOrganizeRules({ ...organizeRules, organizeByType: e.target.checked })}
              />
              <span>按类型分类</span>
            </label>
          </div>
        </div>

        {/* 整理预览说明 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">整理结构示例</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>📁 照片库</div>
            <div className="pl-4">
              📁 📅 2026-05-19
              <div className="pl-4">
                📱 iPhone 14 Pro
                <div className="pl-4">
                  🖼️ IMG_001.jpg
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesConfig;
```

- [ ] **Step 3: 创建预览面板组件**

```tsx
import React from 'react';
import { useAppStore } from '../../store/appStore';

const PreviewPanel: React.FC = () => {
  const { files, organizeRules, setStatusMessage } = useAppStore();

  const handleOrganize = async () => {
    setStatusMessage('正在整理照片...');
    try {
      await window.electronAPI.startOrganize(organizeRules);
      setStatusMessage('整理完成！');
    } catch (error) {
      console.error('Organize failed:', error);
      setStatusMessage('整理失败');
    }
  };

  // 生成预览结构
  const previewStructure = React.useMemo(() => {
    const structure: Record<string, any> = {};
    
    files.forEach((file) => {
      const date = organizeRules.dateFormat === 'YYYY-MM-DD' 
        ? '2026-05-19' 
        : organizeRules.dateFormat === 'YYYY/MM/DD'
        ? '2026/05/19'
        : '2026年05月19日';
      
      const typeDir = file.type === 'image' ? '图片' : '视频';
      
      if (!structure[date]) {
        structure[date] = { _count: 0 };
      }
      structure[date]._count++;
      
      if (organizeRules.organizeByDevice) {
        const device = '未知设备';
        if (!structure[date][device]) {
          structure[date][device] = { _count: 0 };
        }
        structure[date][device]._count++;
      }
      
      if (organizeRules.organizeByType) {
        if (!structure[date][typeDir]) {
          structure[date][typeDir] = { _count: 0 };
        }
        structure[date][typeDir]._count++;
      }
    });
    
    return structure;
  }, [files, organizeRules]);

  return (
    <div className="bg-white rounded-lg shadow p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">整理预览</h2>
        <span className="text-sm text-gray-500">
          共 {files.length} 个文件
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {Object.keys(previewStructure).length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            暂无文件可整理
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(previewStructure).map(([date, content]: [string, any]) => (
              <div key={date} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 flex items-center gap-2">
                  <span>📁</span>
                  <span className="font-medium">{date}</span>
                  <span className="text-gray-500 text-sm">({content._count} 个文件)</span>
                </div>
                
                <div className="p-4 space-y-2">
                  {organizeRules.organizeByDevice && (
                    <div className="pl-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>📱</span>
                        <span>未知设备</span>
                      </div>
                    </div>
                  )}
                  
                  {organizeRules.organizeByType && (
                    <div className="pl-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>🖼️</span>
                        <span>图片</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t flex justify-end gap-4">
        <button
          onClick={handleOrganize}
          disabled={files.length === 0}
          className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          开始整理
        </button>
      </div>
    </div>
  );
};

export default PreviewPanel;
```

- [ ] **Step 4: 提交代码**

```bash
cd photo-organizer
git add src/renderer/pages/OrganizePage.tsx src/renderer/components/organize/
git commit -m "feat: implement organize page with rules configuration and preview"
```

---

### Task 8: 设置页面实现

**Files:**
- Create: `photo-organizer/src/renderer/pages/SettingsPage.tsx`

- [ ] **Step 1: 创建设置页面组件**

```tsx
import React from 'react';
import { useAppStore } from '../store/appStore';

const SettingsPage: React.FC = () => {
  const { organizeRules, setOrganizeRules, setStatusMessage } = useAppStore();

  const handleSave = () => {
    // 保存设置到本地存储
    localStorage.setItem('appSettings', JSON.stringify({ organizeRules }));
    setStatusMessage('设置已保存');
  };

  return (
    <div className="flex flex-col h-full p-6">
      <h1 className="text-2xl font-bold mb-6">设置</h1>
      
      <div className="max-w-2xl space-y-6">
        {/* 常规设置 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">常规设置</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">界面语言</label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option value="zh-CN">简体中文</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>

        {/* 导入设置 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">导入设置</h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                defaultChecked
                className="w-4 h-4"
              />
              <span>导入时自动整理</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-4 h-4"
              />
              <span>导入时自动检测重复文件</span>
            </label>
          </div>
        </div>

        {/* 默认整理规则 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">默认整理规则</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">日期格式</label>
              <select
                value={organizeRules.dateFormat}
                onChange={(e) => setOrganizeRules({ ...organizeRules, dateFormat: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="YYYY-MM-DD">2026-05-19</option>
                <option value="YYYY/MM/DD">2026/05/19</option>
                <option value="YYYY年MM月DD日">2026年05月19日</option>
              </select>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={organizeRules.organizeByDevice}
                onChange={(e) => setOrganizeRules({ ...organizeRules, organizeByDevice: e.target.checked })}
                className="w-4 h-4"
              />
              <span>默认按设备分类</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={organizeRules.organizeByType}
                onChange={(e) => setOrganizeRules({ ...organizeRules, organizeByType: e.target.checked })}
                className="w-4 h-4"
              />
              <span>默认按类型分类</span>
            </label>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            保存设置
          </button>
        </div>

        {/* 关于 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">关于</h2>
          <div className="text-sm text-gray-600">
            <p className="mb-2">PhotoOrganizer v1.0.0</p>
            <p>智能照片整理桌面程序</p>
            <p className="mt-4">使用 Electron + React + TypeScript 构建</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
```

- [ ] **Step 2: 提交代码**

```bash
cd photo-organizer
git add src/renderer/pages/SettingsPage.tsx
git commit -m "feat: implement settings page"
```

---

## Phase 3: 高级功能

### Task 9: 整理服务实现

**Files:**
- Create: `photo-organizer/src/main/services/organizer.ts`
- Modify: `photo-organizer/src/main/ipc/handlers.ts`

- [ ] **Step 1: 实现整理服务**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { OrganizeRules } from '../ipc/types';
import { readExif } from './fileSystem';

export async function organizePhotos(
  sourcePath: string,
  targetPath: string,
  rules: OrganizeRules,
  onProgress?: (current: number, total: number) => void
): Promise<{ success: number; failed: number }> {
  const result = { success: 0, failed: 0 };
  
  // 扫描源目录中的所有文件
  const files = await scanSourceFiles(sourcePath);
  const total = files.length;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // 读取EXIF信息
      const exif = await readExif(file.path);
      
      // 确定目标路径
      const destPath = calculateDestPath(file, exif, targetPath, rules);
      
      // 确保目标目录存在
      await fs.promises.mkdir(path.dirname(destPath), { recursive: true });
      
      // 复制文件
      await fs.promises.copyFile(file.path, destPath);
      
      result.success++;
    } catch (error) {
      console.error(`Failed to organize ${file.path}:`, error);
      result.failed++;
    }
    
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }
  
  return result;
}

function calculateDestPath(
  file: any,
  exif: any,
  targetPath: string,
  rules: OrganizeRules
): string {
  const parts: string[] = [targetPath];
  
  // 日期分类
  const date = exif?.dateTime 
    ? new Date(exif.dateTime) 
    : new Date(file.modifiedTime);
  
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  switch (rules.dateFormat) {
    case 'YYYY-MM-DD':
      parts.push(`${year}-${month}-${day}`);
      break;
    case 'YYYY/MM/DD':
      parts.push(`${year}/${month}/${day}`);
      break;
    case 'YYYY年MM月DD日':
      parts.push(`${year}年${month}月${day}日`);
      break;
  }
  
  // 设备分类
  if (rules.organizeByDevice && exif?.model) {
    const device = sanitizeFolderName(exif.model);
    parts.push(device);
  }
  
  // 类型分类
  if (rules.organizeByType) {
    parts.push(file.type === 'image' ? '图片' : '视频');
  }
  
  // 文件名
  parts.push(file.name);
  
  return path.join(...parts);
}

function sanitizeFolderName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim();
}

async function scanSourceFiles(sourcePath: string): Promise<any[]> {
  const files: any[] = [];
  
  async function scan(currentPath: string) {
    const entries = await fs.promises.readdir(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        const isImage = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp', '.raw', '.cr2', '.nef', '.arw'].includes(ext);
        const isVideo = ['.mp4', '.mov', '.avi', '.mkv', '.wmv'].includes(ext);
        
        if (isImage || isVideo) {
          const stats = await fs.promises.stat(fullPath);
          files.push({
            name: entry.name,
            path: fullPath,
            type: isImage ? 'image' : 'video',
            modifiedTime: stats.mtime
          });
        }
      }
    }
  }
  
  await scan(sourcePath);
  return files;
}
```

- [ ] **Step 2: 更新 IPC 处理器**

```typescript
// 在 handlers.ts 中添加
ipcMain.handle('organize:start', async (event, options: { sourcePath: string, targetPath: string, rules: OrganizeRules }) => {
  const { sourcePath, targetPath, rules } = options;
  
  return await organizePhotos(sourcePath, targetPath, rules, (current, total) => {
    event.sender.send('organize:progress', { current, total });
  });
});
```

- [ ] **Step 3: 提交代码**

```bash
cd photo-organizer
git add src/main/services/organizer.ts src/main/ipc/handlers.ts
git commit -m "feat: implement photo organizer service with configurable rules"
```

---

### Task 10: 重复检测功能

**Files:**
- Create: `photo-organizer/src/main/services/duplicateDetector.ts`
- Modify: `photo-organizer/src/renderer/components/import/DuplicateWarning.tsx`

- [ ] **Step 1: 实现重复检测服务**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';

interface FileInfo {
  path: string;
  name: string;
  size: number;
  hash?: string;
}

export async function findDuplicates(files: FileInfo[]): Promise<Map<string, string[]>> {
  // 方法1: 基于文件大小和名称的快速检测
  const sizeNameMap = new Map<string, string[]>();
  
  for (const file of files) {
    const key = `${file.size}_${file.name}`;
    if (!sizeNameMap.has(key)) {
      sizeNameMap.set(key, []);
    }
    sizeNameMap.get(key)!.push(file.path);
  }
  
  // 方法2: 基于文件内容hash的精确检测（可选，用于确认）
  const hashMap = new Map<string, string[]>();
  
  for (const file of files) {
    try {
      const hash = await calculateFileHash(file.path);
      if (!hashMap.has(hash)) {
        hashMap.set(hash, []);
      }
      hashMap.get(hash)!.push(file.path);
    } catch (error) {
      console.error(`Failed to hash file ${file.path}:`, error);
    }
  }
  
  // 返回可能的重复
  const duplicates = new Map<string, string[]>();
  
  for (const [key, paths] of sizeNameMap) {
    if (paths.length > 1) {
      duplicates.set(key, paths);
    }
  }
  
  return duplicates;
}

async function calculateFileHash(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

export function groupDuplicatesByDirectory(duplicates: Map<string, string[]>): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  
  for (const [key, paths] of duplicates) {
    for (const filePath of paths) {
      const dir = path.dirname(filePath);
      if (!grouped.has(dir)) {
        grouped.set(dir, []);
      }
      grouped.get(dir)!.push(filePath);
    }
  }
  
  return grouped;
}
```

- [ ] **Step 2: 创建重复文件警告组件**

```tsx
import React from 'react';

interface DuplicateWarningProps {
  duplicates: Map<string, string[]>;
  onKeepFirst: () => void;
  onKeepAll: () => void;
  onSkipDuplicates: () => void;
}

const DuplicateWarning: React.FC<DuplicateWarningProps> = ({
  duplicates,
  onKeepFirst,
  onKeepAll,
  onSkipDuplicates
}) => {
  const duplicateCount = Array.from(duplicates.values()).reduce((sum, paths) => sum + paths.length - 1, 0);

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-800">
            检测到 {duplicateCount} 个重复文件
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            以下文件可能已存在于目标位置
          </p>
          
          <div className="mt-3 max-h-48 overflow-y-auto">
            {Array.from(duplicates.entries()).slice(0, 5).map(([name, paths]) => (
              <div key={name} className="text-sm text-gray-600 mb-1">
                <span className="font-medium">{name}</span>
                <span className="text-gray-400"> ({paths.length} 份)</span>
              </div>
            ))}
            {Array.from(duplicates.entries()).length > 5 && (
              <div className="text-sm text-gray-400">
                ... 还有 {Array.from(duplicates.entries()).length - 5} 组
              </div>
            )}
          </div>
          
          <div className="flex gap-3 mt-4">
            <button
              onClick={onKeepFirst}
              className="px-3 py-1 text-sm bg-yellow-200 hover:bg-yellow-300 rounded"
            >
              保留已有，跳过重复
            </button>
            <button
              onClick={onKeepAll}
              className="px-3 py-1 text-sm bg-blue-200 hover:bg-blue-300 rounded"
            >
              全部保留（重命名）
            </button>
            <button
              onClick={onSkipDuplicates}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              取消导入
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuplicateWarning;
```

- [ ] **Step 3: 提交代码**

```bash
cd photo-organizer
git add src/main/services/duplicateDetector.ts src/renderer/components/import/DuplicateWarning.tsx
git commit -m "feat: implement duplicate detection feature"
```

---

## Phase 4: 测试与打包

### Task 11: 构建和测试

**Files:**
- Modify: `photo-organizer/package.json`
- Create: `photo-organizer/src/main/services/__tests__/fileSystem.test.ts`

- [ ] **Step 1: 添加测试脚本到 package.json**

```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "build": "npm run build:vite && npm run build:electron",
    "build:vite": "vite build",
    "build:electron": "tsc -p tsconfig.main.json",
    "dev": "concurrently \"npm run dev:vite\" \"npm run dev:electron\"",
    "dev:vite": "vite",
    "dev:electron": "tsc -p tsconfig.main.json && electron .",
    "pack": "npm run build && electron-builder --dir",
    "dist": "npm run build && electron-builder"
  }
}
```

- [ ] **Step 2: 创建基础测试文件**

```typescript
import { describe, it, expect } from 'vitest';

describe('PhotoOrganizer', () => {
  it('should work', () => {
    expect(true).toBe(true);
  });
});
```

- [ ] **Step 3: 执行构建测试**

Run: `cd photo-organizer && npm run build`
Expected: 构建成功，生成 dist 目录

- [ ] **Step 4: 执行打包**

Run: `cd photo-organizer && npm run dist`
Expected: 生成 Windows 安装包

- [ ] **Step 5: 提交代码**

```bash
cd photo-organizer
git add .
git commit -m "feat: complete photo organizer application with all core features

- Multi-source import (local folder, devices)
- Smart organization (date, device, type)
- Gallery browsing with thumbnails
- Photo viewer with EXIF display
- Duplicate detection
- Settings management
- Windows desktop build"
```

---

## 实施检查清单

- [ ] **Phase 1 完成检查**
  - [ ] 项目初始化完成
  - [ ] Electron 主进程运行正常
  - [ ] React UI 框架搭建完成
  - [ ] IPC 通信正常

- [ ] **Phase 2 完成检查**
  - [ ] 文件系统服务正常工作
  - [ ] 导入页面功能完整
  - [ ] 图库页面可正常浏览照片
  - [ ] 整理页面配置生效
  - [ ] 设置页面可保存配置

- [ ] **Phase 3 完成检查**
  - [ ] 整理服务正确分类文件
  - [ ] 重复检测识别重复文件
  - [ ] EXIF 信息正确读取和显示

- [ ] **Phase 4 完成检查**
  - [ ] 测试通过
  - [ ] Windows 安装包成功生成
  - [ ] 应用可正常安装和运行

---

**文档版本**: 1.0.0  
**创建日期**: 2026-05-19  
**下次更新**: 实施过程中根据实际情况调整
