import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function loadJSON(fileName) {
  const filePath = path.join(process.cwd(), "src", "data", fileName);
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

// Helper to insert or update records
async function upsertMany(
  model,
  records,
  idField = "id",
  transform = (r) => r
) {
  for (const record of records) {
    await model.upsert({
      where: { [idField]: record[idField] },
      update: {},
      create: transform(record),
    });
  }
}

async function main() {
  console.log("🌱 Starting database seeding...");

  // --- Load JSON Data ---
  const users = (await loadJSON("users.json")).users;
  const hosts = (await loadJSON("hosts.json")).hosts;
  const properties = (await loadJSON("properties.json")).properties;
  const bookings = (await loadJSON("bookings.json")).bookings;
  const reviews = (await loadJSON("reviews.json")).reviews;
  const amenities = (await loadJSON("amenities.json")).amenities;

  // --- Users ---
  console.log("👥 Seeding users...");
  await upsertMany(prisma.user, users, "id", (u) => ({
    id: u.id,
    username: u.username,
    password: bcrypt.hashSync(u.password, 10),
    name: u.name,
    email: u.email,
    phoneNumber: u.phoneNumber,
    pictureUrl: u.pictureUrl,
    role: u.role ?? "USER",
  }));

  // --- Hosts ---
  console.log("🏠 Seeding hosts...");
  await upsertMany(prisma.host, hosts, "id", (h) => ({
    id: h.id,
    username: h.username,
    password: bcrypt.hashSync(h.password, 10),
    name: h.name,
    email: h.email,
    phoneNumber: h.phoneNumber,
    pictureUrl: h.pictureUrl,
    aboutMe: h.aboutMe,
    role: h.role ?? "HOST",
  }));

  // --- Properties ---
  console.log("🏡 Seeding properties...");
  await upsertMany(prisma.property, properties, "id", (p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    location: p.location,
    pricePerNight: parseFloat(p.pricePerNight),
    bedroomCount: p.bedroomCount,
    bathRoomCount: p.bathRoomCount,
    maxGuestCount: p.maxGuestCount,
    hostId: p.hostId,
    rating: p.rating,
  }));

  // --- Bookings ---
  console.log("📅 Seeding bookings...");
  await upsertMany(prisma.booking, bookings, "id", (b) => ({
    id: b.id,
    userId: b.userId,
    propertyId: b.propertyId,
    checkinDate: new Date(b.checkinDate),
    checkoutDate: new Date(b.checkoutDate),
    numberOfGuests: b.numberOfGuests,
    totalPrice: parseFloat(b.totalPrice),
    bookingStatus: b.bookingStatus,
  }));

  // --- Reviews ---
  console.log("⭐ Seeding reviews...");
  await upsertMany(prisma.review, reviews, "id", (r) => ({
    id: r.id,
    userId: r.userId,
    propertyId: r.propertyId,
    rating: r.rating,
    comment: r.comment,
  }));

  // --- Amenities ---
  console.log("💎 Seeding amenities...");
  await upsertMany(prisma.amenity, amenities, "id", (a) => ({
    id: a.id,
    name: a.name,
  }));

  // --- Negative test mode ---
  if (process.env.NODE_ENV === "negative") {
    console.log("⚙️  Adjusting data for negative tests...");

    // Consciously delete the test records that use the negative tests
    await prisma.property.deleteMany({
      where: {
        id: {
          in: ["h0123456-78f0-1234-5678-9abcdef01234"],
        },
      },
    });

    await prisma.booking.deleteMany({
      where: {
        id: {
          in: ["f0123456-78ab-cdef-0123-456789abcdef"],
        },
      },
    });

    await prisma.review.deleteMany({
      where: {
        id: {
          in: ["j0123456-78f0-1234-5678-9abcdef01234"],
        },
      },
    });

    console.log("🧹 Negative data adjustments done.");
  }

  console.log("✅ Seeding completed successfully!");
}

// Start the seeding
main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
