import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const FILE_PATH = path.join(process.cwd(), 'data.json');

// --- 1. 初始化逻辑：尝试从文件读取数据 ---
let notes: any[] = [];
try {
  if (fs.existsSync(FILE_PATH)) {
    const fileData = fs.readFileSync(FILE_PATH, 'utf-8');
    notes = JSON.parse(fileData);
  } else {
    // 如果文件不存在，就用初始数据
    notes = [
      { id: 1, title: '来自后端的数据', content: '我是存在磁盘文件里的！' }
    ];
    fs.writeFileSync(FILE_PATH, JSON.stringify(notes, null, 2));
  }
} catch (err) {
  console.error('读取文件失败', err);
}

// --- 2. 封装保存函数 ---
const saveToDisk = () => {
  fs.writeFileSync(FILE_PATH, JSON.stringify(notes, null, 2));
};

// --- 3. 路由设置 ---
// 获取
app.get('/api/notes', (req, res) => {
  res.json(notes);
});

app.get('/api/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  const note = notes.find(item => item.id === id);
  if (note) {
    res.json(note);
  } else {
    res.status(404).json({ message: '记忆已丢失' });
  }
});

// 添加
app.post('/api/notes', (req, res) => {
  notes.unshift(req.body);
  saveToDisk(); // 数据变动，立刻存盘
  res.json({ message: '保存成功！' });
});

// 删除
app.delete('/api/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = notes.findIndex(item => item.id === id);
  
  if (index !== -1) {
    notes.splice(index, 1);
    saveToDisk(); // 删完也存盘
    res.json({ message: '后端删除成功' });
  } else {
    res.status(404).json({ message: '没找到这条数据' });
  }
});

// --- 4. 启动 ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`服务器启动了！地址是 http://localhost:${PORT}`);
  });
}

startServer();
