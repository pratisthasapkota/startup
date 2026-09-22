import mongoose from 'mongoose';
import normalizeEmail from 'validator/lib/normalizeEmail.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { User } from './models/User.js';
import { Category } from './models/Category.js';
import { Product } from './models/Product.js';
import { getSettings } from './models/Setting.js';

const CATEGORIES = [
  { name: 'Microcontrollers', icon: '🎛️', order: 1, description: 'Arduino, ESP32, ESP8266, Raspberry Pi Pico and development boards for every project.' },
  { name: 'Cameras & Vision', icon: '📷', order: 2, description: 'ESP32-CAM, OV7670 and camera modules for IoT and computer vision builds.' },
  { name: 'Sensors & Modules', icon: '🌡️', order: 3, description: 'Temperature, distance, motion, gas and GPS sensors for your electronics projects.' },
  { name: 'Robotics & Motors', icon: '🤖', order: 4, description: 'Servo motors, steppers, motor drivers and wheels to build your bot.' },
  { name: 'Power & Batteries', icon: '🔋', order: 5, description: 'Batteries, charging modules, adapters and clean power for your circuits.' },
  { name: 'Tools & Components', icon: '🔧', order: 6, description: 'Breadboards, jumper wires, multimeters, LCDs and essential components.' },
  { name: 'Books & Learning', icon: '📚', order: 7, description: 'Hand-picked electronics and programming books for makers of every level.' },
];

// [category, title, price, stock, condition, brand, placeholder image, tags]
const PRODUCTS = [
  ['Microcontrollers', 'Arduino Uno R3 (Compatible)', 1350, 25, 'new', 'Arduino', 'ph-microcontroller', ['arduino', 'uno', 'board', 'avr']],
  ['Microcontrollers', 'Arduino Nano V3.0 (ATmega328P)', 850, 40, 'new', 'Arduino', 'ph-microcontroller', ['arduino', 'nano', 'avr', 'breadboard']],
  ['Microcontrollers', 'Arduino Mega 2560 R3', 2900, 12, 'new', 'Arduino', 'ph-microcontroller', ['arduino', 'mega', '2560', 'avr']],
  ['Microcontrollers', 'ESP32 DEVKIT V1 (DOIT, 30 pin)', 1300, 30, 'new', 'Espressif', 'ph-microcontroller', ['esp32', 'wifi', 'bluetooth', 'iot']],
  ['Microcontrollers', 'NodeMCU ESP8266 CP2102 WiFi Board', 950, 35, 'new', 'Espressif', 'ph-microcontroller', ['esp8266', 'nodemcu', 'wifi', 'iot']],
  ['Microcontrollers', 'Raspberry Pi Pico (RP2040)', 1000, 20, 'new', 'Raspberry Pi', 'ph-microcontroller', ['pico', 'rp2040', 'micropython']],
  ['Microcontrollers', 'Wemos D1 Mini ESP8266', 750, 30, 'new', 'Espressif', 'ph-microcontroller', ['esp8266', 'wemos', 'd1mini', 'wifi']],
  ['Microcontrollers', 'STM32F103C8T6 Blue Pill', 900, 18, 'new', 'STMicroelectronics', 'ph-microcontroller', ['stm32', 'cortex', 'arm']],
  ['Cameras & Vision', 'ESP32-CAM Module (OV2640 + FTDI adapter)', 1750, 22, 'new', 'Espressif', 'ph-camera', ['esp32cam', 'esp32', 'camera', 'ip']],
  ['Cameras & Vision', 'OV7670 Camera Module (VGA)', 850, 15, 'new', 'OmniVision', 'ph-camera', ['camera', 'ov7670', 'vga']],
  ['Sensors & Modules', 'DHT11 Temperature & Humidity Sensor', 250, 50, 'new', 'Aosong', 'ph-sensor', ['dht11', 'temperature', 'humidity']],
  ['Sensors & Modules', 'HC-SR04 Ultrasonic Distance Sensor', 180, 45, 'new', 'Generic', 'ph-sensor', ['ultrasonic', 'distance', 'hc-sr04']],
  ['Sensors & Modules', 'PIR Motion Detection Sensor HC-SR501', 220, 35, 'new', 'Generic', 'ph-sensor', ['pir', 'motion', 'security']],
  ['Sensors & Modules', 'BMP280 Barometric Pressure Sensor', 500, 20, 'new', 'Bosch', 'ph-sensor', ['bmp280', 'pressure', 'altimeter']],
  ['Sensors & Modules', 'MQ-2 Smoke & Gas Sensor Module', 380, 25, 'new', 'Generic', 'ph-sensor', ['mq2', 'gas', 'smoke']],
  ['Sensors & Modules', 'NEO-6M GPS Module with Antenna', 950, 15, 'new', 'u-blox', 'ph-sensor', ['gps', 'neo6m', 'tracker']],
  ['Robotics & Motors', 'SG90 9g Micro Servo Motor', 350, 30, 'new', 'Tower Pro', 'ph-robot', ['servo', 'sg90', 'robot']],
  ['Robotics & Motors', 'L298N Motor Driver Module', 480, 25, 'new', 'Generic', 'ph-robot', ['motor', 'driver', 'l298n']],
  ['Robotics & Motors', '28BYJ-48 Stepper Motor + ULN2003 Driver', 650, 18, 'new', 'Generic', 'ph-robot', ['stepper', '28byj48']],
  ['Power & Batteries', '18650 Lithium-ion Battery 3.7V (2000mAh)', 350, 60, 'new', 'Generic', 'ph-power', ['18650', 'lithium', 'battery']],
  ['Power & Batteries', 'TP4056 Li-ion Charging Module', 120, 40, 'new', 'Generic', 'ph-power', ['tp4056', 'charger', 'battery']],
  ['Power & Batteries', '5V 2A Micro USB Power Adapter', 400, 30, 'new', 'Generic', 'ph-power', ['adapter', 'power', '5v']],
  ['Tools & Components', '830-Point Solderless Breadboard', 300, 30, 'new', 'Generic', 'ph-tools', ['breadboard', '830']],
  ['Tools & Components', 'Jumper Wire Kit (M-M, M-F, F-F, 120 pcs)', 250, 40, 'new', 'Generic', 'ph-tools', ['jumper', 'wires']],
  ['Tools & Components', '16x2 LCD Display with I2C Module', 650, 20, 'new', 'Generic', 'ph-tools', ['lcd', 'i2c', '1602']],
  ['Tools & Components', 'DT830D Digital Multimeter', 780, 15, 'new', 'Generic', 'ph-tools', ['multimeter', 'voltage', 'test']],
  ['Books & Learning', 'Programming Arduino: Getting Started with Sketches', 1650, 10, 'new', 'McGraw-Hill', 'ph-book', ['arduino', 'book', 'c', 'sketches']],
  ['Books & Learning', 'Arduino Project Handbook - Volume 1', 1900, 8, 'new', 'No Starch Press', 'ph-book', ['arduino', 'projects', 'book']],
  ['Books & Learning', 'IoT Projects with ESP32', 2200, 6, 'new', 'Packt', 'ph-book', ['esp32', 'iot', 'book']],
  ['Books & Learning', 'Make: Electronics (2nd Edition)', 2400, 7, 'new', 'O\'Reilly', 'ph-book', ['electronics', 'book', 'hands-on']],
  ['Books & Learning', 'Practical Electronics for Inventors (4th Edition)', 3200, 5, 'new', 'McGraw-Hill', 'ph-book', ['electronics', 'reference', 'inventors']],
  ['Books & Learning', 'Raspberry Pi Projects for the Evil Genius', 1900, 8, 'new', 'McGraw-Hill', 'ph-book', ['raspberrypi', 'projects', 'book']],
  ['Books & Learning', 'The Robot Builder\'s Bonanza (4th Edition)', 2300, 5, 'new', 'McGraw-Hill', 'ph-book', ['robotics', 'build', 'book']],
];

const buildDescription = (title, category, tags) =>
  `${title} — a reliable, student-friendly pick for school, college and professional electronics projects.\n\n` +
  `Listed by a verified seller on VoltMart, this item ships across Nepal with Cash on Delivery available. ` +
  `Tested before dispatch and backed by our 7-day return policy.\n\n` +
  `Ideal for: robotics, IoT, home automation, smart agriculture and electronics labs. ` +
  `Related: ${tags.join(', ')}.`;

const upsertUser = async ({ name, email, password, passwordHash, role }) => {
  const normalizedEmail = normalizeEmail(email) || email;
  const creds = passwordHash || password;
  let user = await User.findOne({ email: normalizedEmail });
  if (user) {
    user.name = name;
    user.role = role;
    user.status = 'active';
    if (creds) user.password = creds;
    await user.save();
    return user;
  }
  return User.create({ name, email: normalizedEmail, password: creds, role });
};

const run = async () => {
  await connectDB();

  console.log('\n[seed] creating admin + demo accounts…');
  const admin = await upsertUser({
    name: env.admin.name,
    email: env.admin.email,
    password: env.admin.password,
    passwordHash: env.admin.passwordHash,
    role: 'admin',
  });
  const seller = await upsertUser({
    name: 'Demo Seller',
    email: 'seller@voltmart.demo',
    password: 'seller123',
    role: 'seller',
  });
  seller.shopName = 'Circuit House Nepal';
  await seller.save();
  await upsertUser({
    name: 'Demo Buyer',
    email: 'buyer@voltmart.demo',
    password: 'buyer123',
    role: 'buyer',
  });

  console.log('[seed] admin  ->', env.admin.email, '/', env.admin.password);
  console.log('[seed] seller -> seller@voltmart.demo / seller123');
  console.log('[seed] buyer  -> buyer@voltmart.demo / buyer123');

  console.log('\n[seed] ensuring categories…');
  const catBySlug = {};
  for (const c of CATEGORIES) {
    const slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const cat = await Category.findOneAndUpdate(
      { slug },
      { $set: { name: c.name, icon: c.icon, order: c.order, description: c.description, isActive: true } },
      { new: true, upsert: true }
    );
    catBySlug[slug] = cat;
  }

  console.log('[seed] seeding products…');
  const existing = await Product.countDocuments({});
  let created = 0;
  for (const [catName, title, price, stock, condition, brand, ph, tags] of PRODUCTS) {
    const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const category = catBySlug[slug];
    const exists = await Product.findOne({ title });
    if (exists) continue;
    await Product.create({
      title,
      description: buildDescription(title, catName, tags),
      shortDescription: `${title} — ${tags.slice(0, 3).join(', ')} for your next build.`,
      price,
      compareAtPrice: 0,
      currency: 'NPR',
      stock,
      category: category._id,
      condition,
      brand,
      images: [`/images/${ph}.svg`],
      tags,
      seller: admin._id,
      status: 'approved',
      approvedBy: admin._id,
      approvedAt: new Date(),
      featured: true,
    });
    created += 1;
  }
  console.log(`[seed] products: ${existing} existing, ${created} created (total ${existing + created})`);

  console.log('[seed] ensuring site settings…');
  const settings = await getSettings();
  settings.siteName = 'VoltMart';
  settings.tagline = 'Buy & sell electronics, hardware and books at fair prices';
  settings.contactEmail = env.admin.email;
  settings.contactPhone = '+977-9800000000';
  settings.address = 'Baneshwor, Kathmandu, Nepal';
  settings.shippingFee = 100;
  settings.freeShippingThreshold = 3000;
  settings.commissionRate = 10;
  await settings.save();

  console.log('\n[seed] done ✓');
  await disconnectDB();
  process.exit(0);
};

run().catch(async (err) => {
  console.error('[seed] failed:', err);
  try {
    if (mongoose.connection.readyState) await disconnectDB();
  } catch {}
  process.exit(1);
});