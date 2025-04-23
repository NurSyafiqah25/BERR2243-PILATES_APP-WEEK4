const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const port = 3000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const JWT_SECRET = 'your_jwt_secret_key';
const MONGO_URL = 'mongodb://localhost:27017';
const DB_NAME = 'fitnessDB';

let db;
let client;

// MongoDB Connection
async function connectToMongoDB() {
    client = new MongoClient(MONGO_URL);

    try {
        await client.connect();
        console.log("Connected to MongoDB!");
        db = client.db(DB_NAME);
        
        // Create indexes
        await db.collection('users').createIndex({ email: 1 }, { unique: true });
        await db.collection('classes').createIndex({ date: 1, time: 1 });
    } catch (err) {
        console.error("MongoDB Connection Error:", err);
        process.exit(1);
    }
}

// Authentication Middleware
const authenticate = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.id) });
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        req.token = token;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const authorize = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
};

// Routes

// 1. Member Registration
app.post('/users', async (req, res) => {
    try {
        const { name, email, password, role = 'member' } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 8);
        const user = {
            name,
            email,
            password: hashedPassword,
            role,
            isActive: true,
            createdAt: new Date()
        };

        const result = await db.collection('users').insertOne(user);
        
        res.status(201).json({
            _id: result.insertedId,
            name,
            email,
            role
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 2. Member Login
app.post('/user/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.collection('users').findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is blocked' });
        }

        const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, {
            expiresIn: '24h'
        });

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 3. Booking Classes
app.post('/bookings', authenticate, async (req, res) => {
    try {
        const { classId, userId } = req.body;
        
        if (!classId || !userId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const fitnessClass = await db.collection('classes').findOne({ _id: new ObjectId(classId) });
        if (!fitnessClass) {
            return res.status(404).json({ error: 'Class not found' });
        }

        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const existingBooking = await db.collection('bookings').findOne({
            classId: new ObjectId(classId),
            userId: new ObjectId(userId)
        });
        
        if (existingBooking) {
            return res.status(400).json({ error: 'Already booked this class' });
        }

        const booking = {
            classId: new ObjectId(classId),
            userId: new ObjectId(userId),
            status: 'booked',
            bookedAt: new Date()
        };

        const result = await db.collection('bookings').insertOne(booking);
        
        res.status(201).json({
            _id: result.insertedId,
            classId,
            userId,
            status: 'booked'
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 4. View Schedule
app.get('/classes/schedule', authenticate, async (req, res) => {
    try {
        const classes = await db.collection('classes')
            .find({ date: { $gte: new Date() } })
            .sort({ date: 1, time: 1 })
            .toArray();
        
        res.status(200).json(classes);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 5. Monthly Payment
app.post('/payments/monthly', authenticate, async (req, res) => {
    try {
        const { userId, amount, paymentMethod } = req.body;
        
        if (!userId || !amount || !paymentMethod) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const payment = {
            userId: new ObjectId(userId),
            amount,
            paymentMethod,
            status: 'completed',
            paymentDate: new Date(),
            expiresAt: new Date(new Date().setMonth(new Date().getMonth() + 1))
        };

        const result = await db.collection('payments').insertOne(payment);
        
        // Update user membership status
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { membershipStatus: 'active' } }
        );

        res.status(201).json({
            _id: result.insertedId,
            userId,
            amount,
            status: 'completed'
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 6. Trainer Registration
app.post('/trainers', async (req, res) => {
    try {
        const { name, email, password, specialization } = req.body;
        
        if (!name || !email || !password || !specialization) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 8);
        const user = {
            name,
            email,
            password: hashedPassword,
            role: 'trainer',
            specialization,
            isActive: true,
            createdAt: new Date()
        };

        const result = await db.collection('users').insertOne(user);
        
        res.status(201).json({
            _id: result.insertedId,
            name,
            email,
            role: 'trainer',
            specialization
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 7. Trainer Login (same as member login but checks role)
app.post('/trainer/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await db.collection('users').findOne({ email, role: 'trainer' });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ error: 'Account is blocked' });
        }

        const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, {
            expiresIn: '24h'
        });

        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 8. View Assigned Members
app.get('/trainers/:id/members', authenticate, authorize(['trainer', 'admin']), async (req, res) => {
    try {
        const trainerId = req.params.id;
        
        const bookings = await db.collection('bookings')
            .aggregate([
                {
                    $match: {
                        classId: { $exists: true }
                    }
                },
                {
                    $lookup: {
                        from: 'classes',
                        localField: 'classId',
                        foreignField: '_id',
                        as: 'class'
                    }
                },
                { $unwind: '$class' },
                {
                    $match: {
                        'class.trainerId': new ObjectId(trainerId)
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        _id: 0,
                        userId: '$user._id',
                        name: '$user.name',
                        email: '$user.email',
                        classId: '$class._id',
                        className: '$class.name',
                        classDate: '$class.date',
                        classTime: '$class.time'
                    }
                }
            ])
            .toArray();
        
        res.status(200).json(bookings);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 9. Manage Membership
app.put('/memberships/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const userId = req.params.id;
        const { status, expiryDate } = req.body;
        
        if (!status || !expiryDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { membershipStatus: status, membershipExpiry: new Date(expiryDate) } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({
            message: 'Membership updated successfully'
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 10. Block User
app.put('/users/:id/block', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const userId = req.params.id;
        const { isActive } = req.body;
        
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { isActive } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({
            message: `User ${isActive ? 'unblocked' : 'blocked'} successfully`
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 11. Create Class
app.post('/classes', authenticate, authorize(['trainer', 'admin']), async (req, res) => {
    try {
        const { name, description, date, time, duration, maxParticipants, trainerId } = req.body;
        
        if (!name || !date || !time || !trainerId) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const trainer = await db.collection('users').findOne({ 
            _id: new ObjectId(trainerId),
            role: 'trainer'
        });
        
        if (!trainer) {
            return res.status(404).json({ error: 'Trainer not found' });
        }

        const classData = {
            name,
            description: description || '',
            date: new Date(date),
            time,
            duration: duration || 60,
            maxParticipants: maxParticipants || 10,
            trainerId: new ObjectId(trainerId),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await db.collection('classes').insertOne(classData);
        
        res.status(201).json({
            _id: result.insertedId,
            ...classData
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 12. Update Class
app.put('/classes/:id', authenticate, authorize(['trainer', 'admin']), async (req, res) => {
    try {
        const classId = req.params.id;
        const updateData = req.body;
        
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'No update data provided' });
        }

        if (updateData.trainerId) {
            const trainer = await db.collection('users').findOne({ 
                _id: new ObjectId(updateData.trainerId),
                role: 'trainer'
            });
            
            if (!trainer) {
                return res.status(404).json({ error: 'Trainer not found' });
            }
            updateData.trainerId = new ObjectId(updateData.trainerId);
        }

        updateData.updatedAt = new Date();

        const result = await db.collection('classes').updateOne(
            { _id: new ObjectId(classId) },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }
        
        res.status(200).json({
            message: 'Class updated successfully'
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 13. Delete Class
app.delete('/classes/:id', authenticate, authorize(['trainer', 'admin']), async (req, res) => {
    try {
        const classId = req.params.id;
        
        // Check if there are any bookings for this class
        const bookingsCount = await db.collection('bookings').countDocuments({
            classId: new ObjectId(classId)
        });
        
        if (bookingsCount > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete class with existing bookings' 
            });
        }

        const result = await db.collection('classes').deleteOne({
            _id: new ObjectId(classId)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Class not found' });
        }
        
        res.status(204).end();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 14. Update Availability
app.put('/trainers/:id/availability', authenticate, authorize(['trainer', 'admin']), async (req, res) => {
    try {
        const trainerId = req.params.id;
        const { availability } = req.body;
        
        if (!availability || !Array.isArray(availability)) {
            return res.status(400).json({ error: 'Invalid availability data' });
        }

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(trainerId), role: 'trainer' },
            { $set: { availability } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Trainer not found' });
        }
        
        res.status(200).json({
            message: 'Availability updated successfully'
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 15. Reset Password
app.post('/users/:id/reset-password', authenticate, async (req, res) => {
    try {
        const userId = req.params.id;
        const { newPassword } = req.body;
        
        if (!newPassword) {
            return res.status(400).json({ error: 'New password is required' });
        }

        // Check if user is admin or resetting their own password
        if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 8);
        
        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { password: hashedPassword } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.status(200).json({
            message: 'Password reset successfully'
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
    }
    process.exit(0);
});

// Start server after DB connection
connectToMongoDB().then(() => {
    app.listen(port, () => {
        console.log("Server running on port " + port);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
});
