import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lqcenter.com' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@lqcenter.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin created:', admin.email)

  // Create sample santri
  const santriPassword = await bcrypt.hash('santri123', 12)
  const santri = await prisma.user.upsert({
    where: { email: 'santri@lqcenter.com' },
    update: {},
    create: {
      name: 'Ahmad Faruq',
      email: 'santri@lqcenter.com',
      nim: 'LQ-2024-001',
      password: santriPassword,
      role: 'SANTRI',
      phone: '081234567890',
    },
  })
  console.log('✅ Santri created:', santri.email)

  // Create sample products
  const kitab1 = await prisma.product.upsert({
    where: { id: 'prod-jurmiyah' },
    update: {},
    create: {
      id: 'prod-jurmiyah',
      name: 'Kitab Al-Jurumiyah',
      type: 'KITAB',
      price: 25000,
      description: 'Kitab nahwu dasar untuk pemula',
      isActive: true,
    },
  })

  const kitab2 = await prisma.product.upsert({
    where: { id: 'prod-imriti' },
    update: {},
    create: {
      id: 'prod-imriti',
      name: 'Kitab Al-Imriti',
      type: 'KITAB',
      price: 35000,
      description: 'Kitab nahwu tingkat menengah',
      isActive: true,
    },
  })

  const altulis1 = await prisma.product.upsert({
    where: { id: 'prod-buku-tulis' },
    update: {},
    create: {
      id: 'prod-buku-tulis',
      name: 'Buku Tulis 40 Lembar',
      type: 'ALAT_TULIS',
      price: 5000,
      description: 'Buku tulis polos 40 lembar',
      isActive: true,
    },
  })

  const paket1 = await prisma.product.upsert({
    where: { id: 'prod-paket-dasar' },
    update: {},
    create: {
      id: 'prod-paket-dasar',
      name: 'Paket Kitab Dasar',
      type: 'PAKET',
      price: 70000,
      description: 'Paket lengkap untuk santri baru',
      isActive: true,
    },
  })

  // Create package details
  await prisma.packageDetail.upsert({
    where: { packageId_productId: { packageId: 'prod-paket-dasar', productId: 'prod-jurmiyah' } },
    update: {},
    create: {
      packageId: 'prod-paket-dasar',
      productId: 'prod-jurmiyah',
      quantity: 1,
    },
  })

  await prisma.packageDetail.upsert({
    where: { packageId_productId: { packageId: 'prod-paket-dasar', productId: 'prod-buku-tulis' } },
    update: {},
    create: {
      packageId: 'prod-paket-dasar',
      productId: 'prod-buku-tulis',
      quantity: 3,
    },
  })

  console.log('✅ Products seeded:', [kitab1.name, kitab2.name, altulis1.name, paket1.name])
  console.log('\n🎉 Seed completed!')
  console.log('\nLogin credentials:')
  console.log('Admin: admin@lqcenter.com / admin123')
  console.log('Santri: santri@lqcenter.com / santri123')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
