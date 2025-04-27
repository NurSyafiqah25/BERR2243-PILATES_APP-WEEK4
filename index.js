const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/pilatesDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB', err));

// Define Schemas
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  blocked: { type: Boolean, default: false }
});

const TrainerSchema = new mongoose.Schema({
  name: String,
  specialty: String,
  availability: { type: Boolean, default: true }
});

const ClassSchema = new mongoose.Schema({
  title: String,
  schedule: String
});

const BookingSchema = new mongoose.Schema({
  userId: String,
  classId: String
});

const PaymentSchema = new mongoose.Schema({
  userId: String,
  amount: Number,
  date: { type: Date, default: Date.now }
});

const MembershipSchema = new mongoose.Schema({
  userId: String,
  status: String
});

const AdminSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String
});

const User = mongoose.model('User', UserSchema);
const Trainer = mongoose.model('Trainer', TrainerSchema);
const Class = mongoose.model('Class', ClassSchema);
const Booking = mongoose.model('Booking', BookingSchema);
const Payment = mongoose.model('Payment', PaymentSchema);
const Membership = mongoose.model('Membership', MembershipSchema);
const Admin = mongoose.model('Admin', AdminSchema);

// ✅ Member:

// 1. Member registration
app.post('/users', async (req, res) => {
  const user = new User(req.body);
  await user.save();
  res.status(201).json({
    message: 'Member registered successfully',
    userId: user._id  // Return user ID here
  });
});

// 2. Member login
app.post('/user/login', (req, res) => {
  res.status(200).send('Member login successful');
});

// 3. Booking classes
app.post('/bookings', async (req, res) => {
  const booking = new Booking(req.body);
  await booking.save();
  res.status(201).send('Class booked successfully');
});

// ✅ Trainers:

// 4. Trainer registration
app.post('/trainers', async (req, res) => {
  const trainer = new Trainer(req.body);
  await trainer.save();
  res.status(201).json({
    message: 'Trainer registered successfully',
    trainerId: trainer._id  // Return trainer ID
  });
});

// 5. Trainer login
app.post('/trainer/login', (req, res) => {
  res.status(200).send('Trainer login successful');
});

// ✅ Admin:

// 6. Admin registration
app.post('/admins', async (req, res) => {
  const admin = new Admin(req.body);
  await admin.save();
  res.status(201).json({
    message: 'Admin registered successfully',
    adminId: admin._id,     // Return admin ID
    name: admin.name,       // Return admin name
    email: admin.email,     // Return admin email
  });
});

// 7. Admin login
app.post('/admin/login', (req, res) => {
  res.status(200).send('Admin login successful');
});

// 8. Manage memberships
app.put('/memberships/:id', async (req, res) => {
  await Membership.findByIdAndUpdate(req.params.id, req.body);
  res.status(200).send(`Membership ID ${req.params.id} updated`);
});

// 9. Create class
app.post('/classes', async (req, res) => {
  const pilatesClass = new Class(req.body);
  await pilatesClass.save();
  res.status(201).json({
    message: 'Class created',
    classId: pilatesClass._id  // Return class ID here
  });
});

// 10. Update class
app.put('/classes/:id', async (req, res) => {
  await Class.findByIdAndUpdate(req.params.id, req.body);
  res.status(200).send(`Class ID ${req.params.id} updated`);
});

// 11. Delete class
app.delete('/classes/:id', async (req, res) => {
  await Class.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// Start the server
app.listen(port, () => {
  console.log(`Pilates server running at http://localhost:${port}`);
});
