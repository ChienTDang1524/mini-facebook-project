import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Khởi tạo
const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

// 🎯 SỬA LẠI ĐƯỜNG DẪN UPLOAD - DÙNG ĐƯỜNG DẪN TUYỆT ĐỐI
const UPLOAD_BASE_PATH = 'D:/DEMO_SOF308/minifacebook-project/minifacebook-backend/uploads';

// Tạo thư mục uploads nếu chưa tồn tại
const ensureUploadDirs = () => {
  const dirs = [
    UPLOAD_BASE_PATH,
    path.join(UPLOAD_BASE_PATH, 'images'),
    path.join(UPLOAD_BASE_PATH, 'videos')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log('✅ Đã tạo thư mục:', dir);
    }
  });
};

ensureUploadDirs();

// 🎯 SERVE STATIC FILES - QUAN TRỌNG: Sửa lại để phục vụ file từ thư mục chính xác
app.use('/uploads', express.static(UPLOAD_BASE_PATH));

// Kết nối MySQL
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'minifacebook'
}

let db;
async function connectDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('✅ Kết nối database thành công');
    } catch (error) {
        console.error('❌ Kết nối database thất bại:', error.message);
    }
}

// 🎯 CẤU HÌNH MULTER ĐỂ UPLOAD FILE - SỬA LẠI
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Phân loại file ảnh/video
    if (file.mimetype.startsWith('image/')) {
      cb(null, path.join(UPLOAD_BASE_PATH, 'images'));
    } else if (file.mimetype.startsWith('video/')) {
      cb(null, path.join(UPLOAD_BASE_PATH, 'videos'));
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh và video!'), null);
    }
  },
  filename: (req, file, cb) => {
    // Tạo tên file duy nhất
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const filename = 'post-' + uniqueSuffix + fileExtension;
    console.log('📄 Tạo file mới:', filename);
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Sửa lỗi: 'images/' -> 'image/', 'videos/' -> 'video/'
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF) và video (MP4, MOV)!'), false);
    }
  }
});

// Middleware xác thực token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token không tồn tại' });
    }

    jwt.verify(token, 'minifacebook_secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token không hợp lệ' });
        }
        req.user = user;
        next();
    });
};

// API Đăng ký
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;

        console.log('👤 Đăng ký user mới:', { username, email });

        const [existingUsers] = await db.execute(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                error: 'Username hoặc email đã tồn tại'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, full_name]
        );

        const token = jwt.sign(
            {
                id: result.insertId,
                username: username,
                email: email
            },
            'minifacebook_secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Đăng ký thành công',
            token: token,
            user: {
                id: result.insertId,
                username: username,
                email: email,
                full_name: full_name
            }
        });

        console.log('✅ Đăng ký thành công cho user:', username);

    } catch (error) {
        console.error('❌ Lỗi đăng ký:', error);
        res.status(500).json({
            error: 'Lỗi server'
        });
    }
});

// API Đăng nhập
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log('🔐 Đăng nhập với:', username);

        const [users] = await db.execute(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (users.length === 0) {
            return res.status(400).json({
                error: 'Tên đăng nhập hoặc mật khẩu không đúng'
            });
        }

        const user = users[0];

        // Kiểm tra password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                error: 'Tên đăng nhập hoặc mật khẩu không đúng'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email
            },
            'minifacebook_secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                avatar: user.avatar
            }
        });

        console.log('✅ Đăng nhập thành công:', user.username);

    } catch (error) {
        console.error('❌ Lỗi đăng nhập:', error);
        res.status(500).json({
            error: 'Lỗi server'
        });
    }
});

// API Lấy thông tin user hiện tại
app.get('/api/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, username, email, full_name, avatar FROM users WHERE id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User không tồn tại!' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('❌ Lỗi lấy thông tin user:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// 🎯 API TẠO BÀI VIẾT MỚI - ĐÃ SỬA LỖI
app.post('/api/posts', authenticateToken, upload.array('media', 10), async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.id;
    const files = req.files || [];

    console.log('📝 Tạo bài viết mới:', {
      userId: userId,
      contentLength: content?.length || 0,
      fileCount: files.length
    });

    // Kiểm tra có nội dung hoặc file không
    if (!content?.trim() && files.length === 0) {
      return res.status(400).json({ 
        error: 'Bài viết cần có nội dung hoặc ảnh/video!' 
      });
    }

    // 1. Tạo bài viết mới
    const [postResult] = await db.execute(
      'INSERT INTO posts (user_id, content) VALUES (?, ?)',
      [userId, content?.trim() || '']
    );

    const postId = postResult.insertId;
    console.log('✅ Đã tạo post ID:', postId);

    // 2. Xử lý file - SỬA LẠI PHÂN LOẠI FILE
    if (files.length > 0) {
      for (const file of files) {
        // Tạo đường dẫn đúng để lưu vào database
        const filePath = `/uploads/${file.mimetype.startsWith('image/') ? 'images' : 'videos'}/${file.filename}`;
        
        if (file.mimetype.startsWith('image/')) {
          await db.execute(
            'INSERT INTO post_images (post_id, image_url) VALUES (?, ?)',
            [postId, filePath]
          );
          console.log('✅ Đã lưu ảnh:', file.filename, 'với đường dẫn:', filePath);
        } else if (file.mimetype.startsWith('video/')) {
          await db.execute(
            'INSERT INTO post_videos (post_id, video_url) VALUES (?, ?  )',
            [postId, filePath]
          );
          console.log('✅ Đã lưu video:', file.filename, 'với đường dẫn:', filePath);
        }
      }
    }

    console.log('✅ Bài viết đã được lưu thành công!');

    // 3. Lấy thông tin bài viết vừa tạo
    const [posts] = await db.execute(`
      SELECT p.*, u.username, u.full_name, u.avatar,
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [postId]);

    if (posts.length === 0) {
      throw new Error('Không tìm thấy bài viết vừa tạo');
    }

    const post = posts[0];

    // Lấy danh sách ảnh
    const [postImages] = await db.execute(
      'SELECT image_url FROM post_images WHERE post_id = ?', 
      [postId]
    );
    
    // Lấy danh sách video  
    const [postVideos] = await db.execute(
      'SELECT video_url FROM post_videos WHERE post_id = ?', 
      [postId]
    );

    post.images = postImages.map(img => img.image_url);
    post.videos = postVideos.map(vid => vid.video_url);
    post.comments = [];
    post.is_liked = false;

    res.json({
      success: true,
      message: '🎉 Đăng bài thành công!',
      post: post
    });

  } catch (error) {
    console.error('❌ Lỗi tạo bài viết:', error);
    
    // Xóa file đã upload nếu có lỗi
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) console.error('Lỗi xóa file:', err);
        });
      });
    }
    
    res.status(500).json({ 
      error: 'Lỗi server khi tạo bài viết: ' + error.message
    });
  }
});

// 🎯 API LẤY DANH SÁCH BÀI VIẾT
app.get('/api/posts', authenticateToken, async (req, res) => {
  try {
    console.log('📖 Lấy danh sách bài viết');

    const [posts] = await db.execute(`
      SELECT p.*, u.username, u.full_name, u.avatar,
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
             EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [req.user.id]);

    console.log(`✅ Tìm thấy ${posts.length} bài viết`);

    // Lấy ảnh, video và comments cho mỗi bài viết
    for (let post of posts) {
      // Lấy ảnh
      const [images] = await db.execute(
        'SELECT image_url FROM post_images WHERE post_id = ?', 
        [post.id]
      );
      
      // Lấy video
      const [videos] = await db.execute(
        'SELECT video_url FROM post_videos WHERE post_id = ?', 
        [post.id]
      );
      
      // Lấy comments
      const [comments] = await db.execute(`
        SELECT c.*, u.username, u.full_name, u.avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.post_id = ?
        ORDER BY c.created_at ASC
      `, [post.id]);

      post.images = images.map(img => img.image_url);
      post.videos = videos.map(vid => vid.video_url);
      post.comments = comments;
    }

    res.json({
      success: true,
      posts: posts
    });

  } catch (error) {
    console.error('❌ Lỗi lấy danh sách bài viết:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi lấy bài viết: ' + error.message
    });
  }
});

// 🎯 API XÓA BÀI VIẾT
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    console.log('🗑 Xóa bài viết ID:', postId);

    // Kiểm tra quyền sở hữu
    const [posts] = await db.execute(
      'SELECT user_id FROM posts WHERE id = ?', 
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Bài viết không tồn tại!' });
    }

    if (posts[0].user_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa bài viết này!' });
    }

    await db.execute('DELETE FROM posts WHERE id = ?', [postId]);

    console.log('✅ Đã xóa bài viết ID:', postId);

    res.json({
      success: true,
      message: 'Đã xóa bài viết thành công!'
    });

  } catch (error) {
    console.error('❌ Lỗi xóa bài viết:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi xóa bài viết!' 
    });
  }
});

// 🎯 API THÍCH/BỎ THÍCH BÀI VIẾT
app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    console.log('❤️ Xử lý like cho post ID:', postId);

    // Kiểm tra bài viết tồn tại
    const [posts] = await db.execute('SELECT id FROM posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Bài viết không tồn tại!' });
    }

    // Kiểm tra đã thích chưa
    const [existingLikes] = await db.execute(
      'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );

    if (existingLikes.length > 0) {
      // Bỏ thích
      await db.execute(
        'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
        [postId, userId]
      );
      
      // Cập nhật likes_count
      await db.execute(
        'UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = ?',
        [postId]
      );

      console.log('💔 Đã bỏ thích post ID:', postId);

      res.json({
        success: true,
        liked: false,
        message: 'Đã bỏ thích bài viết'
      });

    } else {
      // Thêm like
      await db.execute(
        'INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)',
        [postId, userId]
      );
      
      // Cập nhật likes_count
      await db.execute(
        'UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?',
        [postId]
      );

      console.log('❤️ Đã thích post ID:', postId);

      res.json({
        success: true,
        liked: true,
        message: 'Đã thích bài viết'
      });
    }

  } catch (error) {
    console.error('❌ Lỗi xử lý like:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi xử lý like!' 
    });
  }
});

// 🎯 API THÊM BÌNH LUẬN
app.post('/api/posts/:id/comments', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    console.log('💬 Thêm comment cho post ID:', postId);

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Nội dung bình luận không được để trống!' });
    }

    // Kiểm tra bài viết tồn tại
    const [posts] = await db.execute('SELECT id FROM posts WHERE id = ?', [postId]);
    if (posts.length === 0) {
      return res.status(404).json({ error: 'Bài viết không tồn tại!' });
    }

    // Thêm bình luận
    const [result] = await db.execute(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, userId, content.trim()]
    );

    // Lấy thông tin bình luận vừa tạo
    const [comments] = await db.execute(`
      SELECT c.*, u.username, u.full_name, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.insertId]);

    console.log('✅ Đã thêm comment ID:', result.insertId);

    res.json({
      success: true,
      message: 'Đã thêm bình luận!',
      comment: comments[0]
    });

  } catch (error) {
    console.error('❌ Lỗi thêm comment:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi thêm bình luận!' 
    });
  }
});

// 🎯 API XÓA BÌNH LUẬN
app.delete('/api/comments/:id', authenticateToken, async (req, res) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.id;

    console.log('🗑 Xóa comment ID:', commentId);

    // Kiểm tra quyền sở hữu
    const [comments] = await db.execute(
      'SELECT user_id FROM comments WHERE id = ?', 
      [commentId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ error: 'Bình luận không tồn tại!' });
    }

    if (comments[0].user_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa bình luận này!' });
    }

    await db.execute('DELETE FROM comments WHERE id = ?', [commentId]);

    console.log('✅ Đã xóa comment ID:', commentId);

    res.json({
      success: true,
      message: 'Đã xóa bình luận thành công!'
    });

  } catch (error) {
    console.error('❌ Lỗi xóa comment:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi xóa bình luận!' 
    });
  }
});

// API Cập nhật bài viết
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    console.log('✏️ Cập nhật bài viết ID:', postId);

    // Kiểm tra quyền sở hữu
    const [posts] = await db.execute(
      'SELECT user_id FROM posts WHERE id = ?', 
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: 'Bài viết không tồn tại!' });
    }

    if (posts[0].user_id !== userId) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa bài viết này!' });
    }

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Nội dung không được để trống!' });
    }

    // Cập nhật bài viết
    await db.execute(
      'UPDATE posts SET content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [content.trim(), postId]
    );

    console.log('✅ Đã cập nhật bài viết ID:', postId);

    // Lấy thông tin bài viết đã cập nhật
    const [updatedPosts] = await db.execute(`
      SELECT p.*, u.username, u.full_name, u.avatar,
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count,
             EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as is_liked
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [userId, postId]);

    const updatedPost = updatedPosts[0];

    // Lấy ảnh và video
    const [postImages] = await db.execute(
      'SELECT image_url FROM post_images WHERE post_id = ?', 
      [postId]
    );
    
    const [postVideos] = await db.execute(
      'SELECT video_url FROM post_videos WHERE post_id = ?', 
      [postId]
    );
    
    const [comments] = await db.execute(`
      SELECT c.*, u.username, u.full_name, u.avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [postId]);

    updatedPost.images = postImages.map(img => img.image_url);
    updatedPost.videos = postVideos.map(vid => vid.video_url);
    updatedPost.comments = comments;

    res.json({
      success: true,
      message: 'Đã cập nhật bài viết!',
      post: updatedPost
    });

  } catch (error) {
    console.error('❌ Lỗi cập nhật bài viết:', error);
    res.status(500).json({ 
      error: 'Lỗi server khi cập nhật bài viết!' 
    });
  }
});

// Route xử lý 404 cho API
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint không tồn tại!',
    path: req.originalUrl,
    method: req.method
  });
});

// Route xử lý 404 cho tất cả các route khác
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route không tồn tại!',
    path: req.originalUrl,
    method: req.method
  });
});

// Xử lý lỗi global
app.use((error, req, res, next) => {
  console.error('❌ Lỗi server:', error);
  res.status(500).json({
    success: false,
    error: 'Lỗi server nội bộ!',
    message: error.message
  });
});

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server đang chạy trên port ${PORT}`);
        console.log(`📁 Đường dẫn upload: ${UPLOAD_BASE_PATH}`);
        console.log(`🌐 URL static files: http://localhost:${PORT}/uploads/`);
        console.log('✅ Server MiniFacebook đã khởi động thành công!');
    });
});