import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import chalk from "chalk";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import adminRoutes from './routes/adminRoutes.js';

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== 'production';

const startServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    console.log(chalk.magenta(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ☕ Coffee Shop API       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`));

    // CORS configuration
    const corsOptions = {
      origin: function(origin, callback) {
        // อนุญาตทุก origin ในโหมด development
        if (process.env.NODE_ENV === 'development') {
          callback(null, true);
          return;
        }

        const allowedOrigins = [
          'http://localhost:4200',
          'http://localhost:4000',
          'http://localhost:3000',
          'http://127.0.0.1:4200',
          'http://127.0.0.1:4000',
          'http://127.0.0.1:3000',
          'http://13.239.242.215:5000',
          'https://13.239.242.215:5000',
          'http://13.239.242.215',
          'https://13.239.242.215'
        ];
        
        // อนุญาต requests ที่ไม่มี origin หรือ origin ที่อยู่ในรายการที่อนุญาต
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log('Origin not allowed:', origin);
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Access-Control-Request-Method',
        'Access-Control-Request-Headers'
      ],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      credentials: true,
      maxAge: 86400,
      preflightContinue: false,
      optionsSuccessStatus: 204
    };
    
    // Middleware
    app.use(cors(corsOptions));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/uploads', express.static('uploads'));

    // Enable pre-flight requests for all routes
    app.options('*', cors(corsOptions));

    // Routes
    app.use("/api/users", userRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/cart", cartRoutes);
    app.use("/api/orders", orderRoutes);
    app.use("/api/payments", paymentRoutes);
    app.use('/api/admin', adminRoutes);

    // Default Route with Beautiful HTML Page
    app.get("/", (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html lang="th">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Coffee Shop API</title>
            <style>
                body {
                    font-family: 'Kanit', sans-serif;
                    margin: 0;
                    padding: 0;
                    min-height: 100vh;
                    background: linear-gradient(135deg, #6e4a2c 0%, #3c2415 100%);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: #fff;
                }
                .container {
                    text-align: center;
                    padding: 2rem;
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 15px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                }
                h1 {
                    font-size: 2.5rem;
                    margin-bottom: 1rem;
                    color: #fff;
                }
                .status {
                    font-size: 1.2rem;
                    color: #4ade80;
                    margin: 1rem 0;
                }
                .info {
                    margin: 1.5rem 0;
                    padding: 1rem;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                }
                .endpoints {
                    text-align: left;
                    margin: 1rem 0;
                }
                .endpoint {
                    margin: 0.5rem 0;
                    color: #93c5fd;
                }
                .coffee-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                .footer {
                    margin-top: 2rem;
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.7);
                }
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                .status.active {
                    animation: pulse 2s infinite;
                }
            </style>
            <link href="https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500&display=swap" rel="stylesheet">
        </head>
        <body>
            <div class="container">
                <div class="coffee-icon">☕</div>
                <h1>Coffee Shop API</h1>
                <div class="status active">
                    🟢 ระบบกำลังทำงาน
                </div>
                <div class="info">
                    <p>เวลาระบบ: ${new Date().toLocaleString('th-TH')}</p>
                    <p>โหมด: ${process.env.NODE_ENV || 'development'}</p>
                    <p>พอร์ต: ${PORT}</p>
                </div>
                <div class="endpoints">
                    <h3>🔗 API Endpoints:</h3>
                    <div class="endpoint">📍 /api/users - จัดการผู้ใช้</div>
                    <div class="endpoint">📍 /api/products - จัดการสินค้า</div>
                    <div class="endpoint">📍 /api/cart - จัดการตะกร้า</div>
                    <div class="endpoint">📍 /api/orders - จัดการคำสั่งซื้อ</div>
                    <div class="endpoint">📍 /api/payments - จัดการการชำระเงิน</div>
                    <div class="endpoint">📍 /api/admin - จัดการระบบ</div>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Coffee Shop API - พัฒนาด้วย ❤️</p>
                </div>
            </div>
        </body>
        </html>
      `);
    });

    // Global Error Handling
    app.use((err, req, res, next) => {
      if (isDev) {
        console.error(chalk.red('🚨 Error:'), err.stack);
      }
      res.status(500).json({ 
        message: 'เกิดข้อผิดพลาดในระบบ',
        error: isDev ? err.message : {}
      });
    });

    // Start Server
    app.listen(PORT, () => {
      console.log(chalk.yellow('🔧 Mode: ') + chalk.yellow.bold(process.env.NODE_ENV || 'development'));
      console.log(chalk.green('🚀 Server: ') + chalk.green.bold(`http://localhost:${PORT}`));
      console.log(chalk.cyan('🗄️  Database: ') + chalk.cyan.bold('Connected Successfully'));
      console.log(chalk.blue('⌚ Time: ') + chalk.blue.bold(new Date().toLocaleString('th-TH')));
      console.log(chalk.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));

      // แสดง API Routes ที่พร้อมใช้งาน
      if (isDev) {
        console.log(chalk.green('📚 Available API Routes:'));
        console.log(chalk.blue('   └─📍 /api/users'));
        console.log(chalk.blue('   └─📍 /api/products'));
        console.log(chalk.blue('   └─📍 /api/cart'));
        console.log(chalk.blue('   └─📍 /api/orders'));
        console.log(chalk.blue('   └─📍 /api/payments'));
        console.log(chalk.blue('   └─📍 /api/admin'));
        console.log(chalk.magenta('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
      }
    });

  } catch (error) {
    console.error(chalk.red('❌ Startup Error:'), chalk.red.bold(error.message));
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(chalk.red('❌ Unhandled Promise Rejection:'), chalk.red.bold(err.message));
  if (isDev) {
    console.error(chalk.red('Stack:'), err.stack);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(chalk.red('❌ Uncaught Exception:'), chalk.red.bold(err.message));
  if (isDev) {
    console.error(chalk.red('Stack:'), err.stack);
  }
  process.exit(1);
});

startServer();