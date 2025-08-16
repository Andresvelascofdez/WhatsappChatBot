import { createDatabaseClient, setTenantContext } from './client';
import { TenantRepository, ServiceRepository, FAQRepository } from './repositories';

interface SeedConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
}

export async function seedDatabase(config: SeedConfig): Promise<void> {
  console.log('🌱 Starting database seeding...');

  // Initialize database client
  createDatabaseClient({
    url: config.supabaseUrl,
    serviceRoleKey: config.supabaseServiceKey,
  });

  const tenantRepo = new TenantRepository();
  const serviceRepo = new ServiceRepository();
  const faqRepo = new FAQRepository();

  // Create demo tenants
  const demoTenants = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Peluquería Bella Vista',
      tz: 'Europe/Madrid',
      phone_masked: '+34600123456',
      locale: 'es',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002', 
      name: 'Tattoo Studio Dark Art',
      tz: 'Europe/Madrid',
      phone_masked: '+34600654321',
      locale: 'es',
    }
  ];

  for (const tenant of demoTenants) {
    console.log(`Creating tenant: ${tenant.name}`);
    
    await setTenantContext(tenant.id);
    
    // Insert tenant
    const { error: tenantError } = await (tenantRepo as any).db
      .from('tenants')
      .upsert(tenant);
    
    if (tenantError) {
      console.error(`Failed to create tenant ${tenant.name}:`, tenantError);
      continue;
    }

    // Create services for this tenant
    const services = tenant.name.includes('Peluquería') ? [
      {
        tenant_id: tenant.id,
        name: 'Corte de pelo',
        duration_min: 30,
        price_cents: 2500, // 25€
        slot_granularity_min: 30,
        buffer_min: 10,
      },
      {
        tenant_id: tenant.id,
        name: 'Corte + Lavado',
        duration_min: 45,
        price_cents: 3500, // 35€
        slot_granularity_min: 30,
        buffer_min: 15,
      },
      {
        tenant_id: tenant.id,
        name: 'Tinte completo',
        duration_min: 120,
        price_cents: 8000, // 80€
        slot_granularity_min: 30,
        buffer_min: 30,
      }
    ] : [
      {
        tenant_id: tenant.id,
        name: 'Tatuaje pequeño',
        duration_min: 60,
        price_cents: 10000, // 100€
        slot_granularity_min: 30,
        buffer_min: 15,
      },
      {
        tenant_id: tenant.id,
        name: 'Tatuaje mediano',
        duration_min: 120,
        price_cents: 25000, // 250€
        slot_granularity_min: 30,
        buffer_min: 30,
      },
      {
        tenant_id: tenant.id,
        name: 'Sesión diseño',
        duration_min: 45,
        price_cents: 5000, // 50€
        slot_granularity_min: 30,
        buffer_min: 15,
      }
    ];

    for (const service of services) {
      const { error: serviceError } = await (serviceRepo as any).db
        .from('services')
        .upsert(service);
      
      if (serviceError) {
        console.error(`Failed to create service ${service.name}:`, serviceError);
      }
    }

    // Create FAQs for this tenant
    const faqs = [
      {
        tenant_id: tenant.id,
        key: 'prices',
        content_text: `💰 *Precios de ${tenant.name}*\n\n${services.map(s => 
          `• ${s.name}: ${(s.price_cents / 100).toFixed(2)}€`
        ).join('\n')}\n\n¡Consulta disponibilidad escribiendo "reservar"!`
      },
      {
        tenant_id: tenant.id,
        key: 'services',
        content_text: `✨ *Servicios de ${tenant.name}*\n\n${services.map(s => 
          `• ${s.name} (${s.duration_min} min)`
        ).join('\n')}\n\n¿Quieres reservar? Escribe "reservar"`
      },
      {
        tenant_id: tenant.id,
        key: 'address',
        content_text: `📍 *Ubicación*\n\nCalle Principal 123\n28001 Madrid\n\n🚇 Metro: Sol (Línea 1, 2, 3)\n🅿️ Parking disponible en la zona`
      },
      {
        tenant_id: tenant.id,
        key: 'hours',
        content_text: `🕒 *Horarios*\n\n• Lunes a Viernes: 10:00 - 20:00\n• Sábados: 10:00 - 18:00\n• Domingos: Cerrado\n\n📞 También puedes llamarnos al ${tenant.phone_masked}`
      }
    ];

    for (const faq of faqs) {
      const { error: faqError } = await (faqRepo as any).db
        .from('faqs')
        .upsert(faq);
      
      if (faqError) {
        console.error(`Failed to create FAQ ${faq.key}:`, faqError);
      }
    }

    // Create WhatsApp channel
    const channel = {
      tenant_id: tenant.id,
      type: 'whatsapp' as const,
      provider: '360dialog',
      business_number: tenant.phone_masked,
      webhook_secret: `webhook_secret_${tenant.id}`,
      is_live: false,
    };

    const { error: channelError } = await (serviceRepo as any).db
      .from('channels')
      .upsert(channel);
    
    if (channelError) {
      console.error(`Failed to create channel:`, channelError);
    }

    console.log(`✅ Tenant ${tenant.name} seeded successfully`);
  }

  console.log('🎉 Database seeding completed!');
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const config: SeedConfig = {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  };

  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('- SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  seedDatabase(config).catch(error => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
}
