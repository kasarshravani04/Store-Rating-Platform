import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

// --- DATABASE CONFIGURATION AND UTILITIES ---
const DATA_FILE = path.join(process.cwd(), 'data.json');

interface DbState {
  users: any[];
  stores: any[];
  ratings: any[];
}

function loadDb(): DbState {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to load storage file, starting fresh:', e);
    }
  }

  // Seed default data matching constraints
  const defaultDb: DbState = {
    users: [
      {
        id: 'usr-admin1',
        name: 'System Administrator Account',
        email: 'admin@platform.com',
        address: '123 Enterprise Suite, Admin Hub Building, Tech District',
        role: 'ADMIN',
        password: 'AdminPassword123!'
      },
      {
        id: 'usr-owner1',
        name: 'Alexander James Sterling',
        email: 'alex.owner@store.com',
        address: '102 Retail Boulevard, Sector 4, Silicon Valley, CA 94016',
        role: 'OWNER',
        password: 'OwnerPassword1!'
      },
      {
        id: 'usr-owner2',
        name: 'Eleanor Sophia Vance',
        email: 'eleanor.owner@cafe.com',
        address: '405 Greenway Avenue, Portland Rose Core, OR 97201',
        role: 'OWNER',
        password: 'CafePassword1!'
      },
      {
        id: 'usr-user1',
        name: 'Jonathan David Miller',
        email: 'jonathan.user@gmail.com',
        address: '12 Oak Ridge Road, Suburbia Heights, NY 10001',
        role: 'USER',
        password: 'UserPassword12!'
      },
      {
        id: 'usr-user2',
        name: 'Samantha Kayla Peterson',
        email: 'samantha.p@hotmail.com',
        address: '89 Pine Meadow, Apartment 4B, Cherry Hill, NJ 08003',
        role: 'USER',
        password: 'UserPassword23!'
      }
    ],
    stores: [
      {
        id: 'store-1',
        name: 'Apex Electronics Hub',
        email: 'contact@apexhub.com',
        address: '789 Broad Avenue, Retail District, CA 90021',
        ownerId: 'usr-owner1',
        rating: 4.5
      },
      {
        id: 'store-2',
        name: 'The Green Garden Cafe',
        email: 'hello@greengardencafe.com',
        address: '456 Garden Boulevard, Greenhouse Sector, Portland, OR 97214',
        ownerId: 'usr-owner2',
        rating: 3.5
      }
    ],
    ratings: [
      {
        id: 'rate-1',
        userId: 'usr-user1',
        userName: 'Jonathan David Miller',
        storeId: 'store-1',
        rating: 5,
        createdAt: new Date('2026-06-05T10:00:00Z').toISOString()
      },
      {
        id: 'rate-2',
        userId: 'usr-user2',
        userName: 'Samantha Kayla Peterson',
        storeId: 'store-1',
        rating: 4,
        createdAt: new Date('2026-06-06T11:30:00Z').toISOString()
      },
      {
        id: 'rate-3',
        userId: 'usr-user1',
        userName: 'Jonathan David Miller',
        storeId: 'store-2',
        rating: 3,
        createdAt: new Date('2026-06-07T09:00:00Z').toISOString()
      },
      {
        id: 'rate-4',
        userId: 'usr-user2',
        userName: 'Samantha Kayla Peterson',
        storeId: 'store-2',
        rating: 4,
        createdAt: new Date('2026-06-08T05:45:00Z').toISOString()
      }
    ]
  };

  saveDb(defaultDb);
  return defaultDb;
}

function saveDb(db: DbState) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save Database state:', e);
  }
}

// Ensure the db state is loaded/seeded
let db = loadDb();

// Recalculate store ratings helper
function updateStoreAverageRating(storeId: string) {
  const ratings = db.ratings.filter(r => r.storeId === storeId);
  const store = db.stores.find(s => s.id === storeId);
  if (store) {
    if (ratings.length === 0) {
      store.rating = 0;
    } else {
      const sum = ratings.reduce((acc, current) => acc + current.rating, 0);
      const avg = Math.round((sum / ratings.length) * 10) / 10;
      store.rating = avg;
    }
    saveDb(db);
  }
}

// --- JWT TOKEN SERVICE ---
const JWT_SECRET = process.env.JWT_SECRET || 'super-secure-key-for-jwt-portfolio-platform';

function base64url(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(str: string): string {
  let base = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base.length % 4) {
    base += '=';
  }
  return Buffer.from(base, 'base64').toString('utf8');
}

function signJwt(payload: any): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours expiry
  }));

  const hmac = crypto.createHmac('sha256', JWT_SECRET);
  hmac.update(`${encodedHeader}.${encodedPayload}`);
  const signature = base64url(hmac.digest('base64'));

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJwt(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerStr, payloadStr, signatureStr] = parts;
    const hmac = crypto.createHmac('sha256', JWT_SECRET);
    hmac.update(`${headerStr}.${payloadStr}`);
    const validSignature = base64url(hmac.digest('base64'));

    if (signatureStr !== validSignature) {
      return null;
    }

    const payload = JSON.parse(base64urlDecode(payloadStr));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return payload;
  } catch (error) {
    return null;
  }
}

// --- EXPRESS APPLICATION SETUP ---
const app = express();
const PORT = 3000;

app.use(express.json());

// --- DYNAMIC SPRING BOOT BACKEND PROXY INTERCEPTOR ---
// If the developer sets SPRING_BOOT_URL (such as http://localhost:8080) in their env,
// we route all /api endpoints directly to the Spring Boot backend to facilitate full-stack connection.
const SPRING_BOOT_URL = process.env.SPRING_BOOT_URL || '';
if (SPRING_BOOT_URL) {
  console.log(`[Proxy] Routing all /api paths directly to Spring Boot backend: ${SPRING_BOOT_URL}`);
  app.use('/api', async (req, res, next) => {
    try {
      const targetUrl = `${SPRING_BOOT_URL}${req.originalUrl}`;
      const headers: Record<string, string> = {};
      
      // Clean copy of incoming headers
      for (const [key, val] of Object.entries(req.headers)) {
        if (val && typeof val === 'string') {
          headers[key] = val;
        }
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      if (!['GET', 'HEAD'].includes(req.method)) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, fetchOptions);
      
      // Set forwarded status
      res.status(response.status);
      
      // Handle response content mapping
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        res.json(json);
      } else {
        const text = await response.text();
        res.send(text);
      }
    } catch (e) {
      console.error('[Proxy Error] Spring Boot backend is offline, unreachable, or crashed:', e);
      res.status(502).json({ error: 'Spring Boot backend is currently offline or unreachable.' });
    }
  });
}

// Auth check middleware
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    role: 'ADMIN' | 'USER' | 'OWNER';
    name: string;
  };
}

const authMiddleware = (req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Authorization header missing.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyJwt(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired secure token.' });
  }

  req.user = decoded;
  next();
};

// --- CORE INPUT VALIDATIONS ---
function validateName(name: string): string | null {
  if (!name || typeof name !== 'string') return 'Name is required.';
  if (name.length < 2 || name.length > 60) return 'Name must be between 2 and 60 characters.';
  return null;
}

function validateEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return 'Email is required.';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Email format is invalid.';
  return null;
}

function validateAddress(address: string): string | null {
  if (!address || typeof address !== 'string') return 'Address is required.';
  if (address.length > 400) return 'Address must not exceed 400 characters.';
  return null;
}

function validatePassword(password: string): string | null {
  if (!password || typeof password !== 'string') return 'Password is required.';
  if (password.length < 8 || password.length > 16) return 'Password must be between 8 and 16 characters.';
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUppercase) return 'Password must contain at least one uppercase letter.';
  if (!hasSpecial) return 'Password must contain at least one special character.';
  return null;
}

// --- AUTHENTICATION API ROUTES ---

// Public Registration for USER role only
app.post('/api/auth/register', (req, res) => {
  const { name, email, address, password } = req.body;

  // Run validators
  const nameErr = validateName(name);
  if (nameErr) return res.status(400).json({ error: nameErr });

  const emailErr = validateEmail(email);
  if (emailErr) return res.status(400).json({ error: emailErr });

  const addressErr = validateAddress(address);
  if (addressErr) return res.status(400).json({ error: addressErr });

  const pwdErr = validatePassword(password);
  if (pwdErr) return res.status(400).json({ error: pwdErr });

  // Duplicate Check
  db = loadDb();
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'A user with this email address already exists.' });
  }

  const newUser = {
    id: 'usr-' + Math.random().toString(36).substr(2, 9),
    name,
    email: email.toLowerCase(),
    address,
    role: 'USER',
    password // Stored securely for portfolio simulation
  };

  db.users.push(newUser);
  saveDb(db);

  // Generate Token
  const token = signJwt({
    id: newUser.id,
    email: newUser.email,
    role: newUser.role,
    name: newUser.name
  });

  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({
    token,
    user: userWithoutPassword
  });
});

// Single Unified Login Endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please enter both your email and password.' });
  }

  db = loadDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid email address or word combinations.' });
  }

  const token = signJwt({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  });

  const { password: _, ...userWithoutPassword } = user;
  res.json({
    token,
    user: userWithoutPassword
  });
});

// Update Password
app.post('/api/auth/update-password', authMiddleware, (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required.' });
  }

  const pwdErr = validatePassword(newPassword);
  if (pwdErr) {
    return res.status(400).json({ error: pwdErr });
  }

  db = loadDb();
  const userId = req.user?.id;
  const user = db.users.find(u => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User profiles could not be resolved.' });
  }

  if (user.password !== currentPassword) {
    return res.status(400).json({ error: 'The current password provided is incorrect.' });
  }

  user.password = newPassword;
  saveDb(db);

  res.json({ message: 'Your password was successfully updated.' });
});

// --- ADMIN CONTROL API ROUTES ---

// Admin Stats
app.get('/api/admin/stats', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }

  db = loadDb();
  res.json({
    totalUsers: db.users.length,
    totalStores: db.stores.length,
    totalRatings: db.ratings.length
  });
});

// Fetch all clients & Admin profiles (filters supported)
app.get('/api/admin/users', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden. Admin permissions required.' });
  }

  db = loadDb();
  const { name, email, address, role } = req.query;

  let filteredUsers = db.users.map(u => {
    // Exclude password
    const { password: _, ...rest } = u;
    
    // If it's a store owner, calculate store aggregate rating
    let rating: number | undefined;
    if (u.role === 'OWNER') {
      const storeOwned = db.stores.find(s => s.ownerId === u.id);
      if (storeOwned) {
        rating = storeOwned.rating;
      }
    }
    return { ...rest, rating };
  });

  // Apply listing query filters in lowercase for flexibility
  if (name) {
    filteredUsers = filteredUsers.filter(u => u.name.toLowerCase().includes((name as string).toLowerCase()));
  }
  if (email) {
    filteredUsers = filteredUsers.filter(u => u.email.toLowerCase().includes((email as string).toLowerCase()));
  }
  if (address) {
    filteredUsers = filteredUsers.filter(u => u.address.toLowerCase().includes((address as string).toLowerCase()));
  }
  if (role) {
    filteredUsers = filteredUsers.filter(u => u.role === role);
  }

  res.json(filteredUsers);
});

// Admin Add new users
app.post('/api/admin/add-user', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden. Access restricted to administrator roles.' });
  }

  const { name, email, password, address, role } = req.body;

  const nameErr = validateName(name);
  if (nameErr) return res.status(400).json({ error: nameErr });

  const emailErr = validateEmail(email);
  if (emailErr) return res.status(400).json({ error: emailErr });

  const addressErr = validateAddress(address);
  if (addressErr) return res.status(400).json({ error: addressErr });

  const pwdErr = validatePassword(password);
  if (pwdErr) return res.status(400).json({ error: pwdErr });

  if (!['ADMIN', 'USER', 'OWNER'].includes(role)) {
    return res.status(400).json({ error: 'Invalid user tier specified.' });
  }

  db = loadDb();
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: 'A user with this email address already exists.' });
  }

  const freshUser = {
    id: 'usr-' + Math.random().toString(36).substr(2, 9),
    name,
    email: email.toLowerCase(),
    address,
    role,
    password
  };

  db.users.push(freshUser);
  saveDb(db);

  const { password: _, ...safeUser } = freshUser;
  res.status(201).json(safeUser);
});

// Admin Add fresh Stores
app.post('/api/admin/add-store', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden.' });
  }

  const { name, email, address, ownerId } = req.body;

  if (!name || name.trim().length === 0) return res.status(400).json({ error: 'Store name is required.' });
  
  const emailErr = validateEmail(email);
  if (emailErr) return res.status(400).json({ error: emailErr });

  const addrErr = validateAddress(address);
  if (addrErr) return res.status(400).json({ error: addrErr });

  if (!ownerId) return res.status(400).json({ error: 'An owner must be designated.' });

  db = loadDb();
  // Verify owner is a user and has OWNER tier
  const owner = db.users.find(u => u.id === ownerId);
  if (!owner || owner.role !== 'OWNER') {
    return res.status(400).json({ error: 'Designated user is not registered as a Store Owner.' });
  }

  const newStore = {
    id: 'store-' + Math.random().toString(36).substr(2, 9),
    name,
    email: email.toLowerCase(),
    address,
    ownerId,
    rating: 0
  };

  db.stores.push(newStore);
  saveDb(db);

  res.status(201).json(newStore);
});

// Helper for admin to fetch available owners
app.get('/api/admin/owners', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied.' });
  }
  db = loadDb();
  const owners = db.users.filter(u => u.role === 'OWNER').map(u => ({ id: u.id, name: u.name }));
  res.json(owners);
});


// --- GENERAL STORES & RATINGS FLOW ---

// Fetch all registered stores (+ user self-ratings if logged in & search queries)
app.get('/api/stores', authMiddleware, (req: AuthenticatedRequest, res) => {
  db = loadDb();
  const { name, address } = req.query;
  const currentUserId = req.user?.id;

  let storeList = db.stores;

  // Search filter
  if (name) {
    storeList = storeList.filter(s => s.name.toLowerCase().includes((name as string).toLowerCase()));
  }
  if (address) {
    storeList = storeList.filter(s => s.address.toLowerCase().includes((address as string).toLowerCase()));
  }

  // Dynamic user specific attachment for rating
  const clientStoreDetails = storeList.map(s => {
    const userRating = db.ratings.find(r => r.storeId === s.id && r.userId === currentUserId);
    return {
      ...s,
      userSubmittedRating: userRating ? userRating.rating : null
    };
  });

  res.json(clientStoreDetails);
});

// Fetch detailed single-store rating submission log (mainly used for Store owner dashboard)
app.get('/api/owner/dashboard', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'OWNER') {
    return res.status(403).json({ error: 'Forbidden. Owner permissions required.' });
  }

  db = loadDb();
  const ownerId = req.user?.id;
  const storeOwned = db.stores.find(s => s.ownerId === ownerId);

  if (!storeOwned) {
    return res.json({
      store: null,
      averageRating: 0,
      ratingsReceived: []
    });
  }

  // Find all ratings for this store and include user metadata
  const ratings = db.ratings.filter(r => r.storeId === storeOwned.id);

  // Sorting can be done by client or pre-sent
  res.json({
    store: storeOwned,
    averageRating: storeOwned.rating,
    ratingsReceived: ratings
  });
});

// Rating submissions (Normal user rates store. Submit/modify)
app.post('/api/ratings/submit', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.user?.role !== 'USER') {
    return res.status(403).json({ error: 'Forbidden. Only normal users can rate stores.' });
  }

  const { storeId, rating } = req.body;
  const numericRating = Number(rating);

  if (!storeId) return res.status(400).json({ error: 'Store identity is required.' });
  if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ error: 'Rating must be a numeric score between 1 and 5' });
  }

  db = loadDb();
  // Check store exists
  const storeExists = db.stores.find(s => s.id === storeId);
  if (!storeExists) {
    return res.status(404).json({ error: 'Target store does not exist.' });
  }

  // Check if rating exists for this user/store combo
  const existingRatingIdx = db.ratings.findIndex(r => r.storeId === storeId && r.userId === req.user?.id);

  if (existingRatingIdx !== -1) {
    // Modify existing
    db.ratings[existingRatingIdx].rating = numericRating;
    db.ratings[existingRatingIdx].createdAt = new Date().toISOString();
  } else {
    // Create new
    const newRating = {
      id: 'rate-' + Math.random().toString(36).substr(2, 9),
      userId: req.user?.id,
      userName: req.user?.name,
      storeId,
      rating: numericRating,
      createdAt: new Date().toISOString()
    };
    db.ratings.push(newRating);
  }

  saveDb(db);
  updateStoreAverageRating(storeId);

  res.json({ message: 'Thank you! Your feed rating has been recorded.' });
});

// Initialize Vite and asset serving logic
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Vite Server] Running live at http://localhost:${PORT}`);
  });
}

bootstrap().catch(err => {
  console.error('Failed to start server:', err);
});
