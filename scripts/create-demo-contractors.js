/**
 * Script to create 50 realistic demo contractors with complete profile data
 * Run with: node scripts/create-demo-contractors.js
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Supabase configuration
const SUPABASE_URL = 'https://qdyjtebjyktxundpqzqt.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkeWp0ZWJqeWt0eHVuZHBxenF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNjExOTksImV4cCI6MjA1OTczNzE5OX0.jvTyXXPD2afnoOKW-PFYA9XTSBZPDO-22j3SqGVF_tw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Available services/skills from the database
const availableSkills = [
  'AC Repair',
  'Appliance Installation',
  'Carpentry',
  'Deep Cleaning',
  'Electrical Repairs',
  'English Lessons',
  'Furniture Assembly',
  'Guitar Lessons',
  'Lawn Mowing',
  'Locksmith',
  'Manicure',
  'Math Tutoring',
  'Mobile Haircut',
  'Office Cleaning',
  'Painting (Interior)',
  'Pedicure',
  'Planting Services',
  'Plumbing Fixes',
  'Standard Home Cleaning',
  'Weed Removal',
  'Window Cleaning',
];

// Lima districts for realistic locations
const limaDistricts = [
  'Lima',
  'Ancón',
  'Ate',
  'Barranco',
  'Breña',
  'Carabayllo',
  'Chaclacayo',
  'Chorrillos',
  'Cieneguilla',
  'Comas',
  'El Agustino',
  'Independencia',
  'Jesús María',
  'La Molina',
  'La Victoria',
  'Lince',
  'Los Olivos',
  'Lurigancho',
  'Lurín',
  'Magdalena del Mar',
  'Miraflores',
  'Pachacámac',
  'Pucusana',
  'Pueblo Libre',
  'Puente Piedra',
  'Punta Hermosa',
  'Punta Negra',
  'Rímac',
  'San Bartolo',
  'San Borja',
  'San Isidro',
  'San Juan de Lurigancho',
  'San Juan de Miraflores',
  'San Luis',
  'San Martín de Porres',
  'San Miguel',
  'Santa Anita',
  'Santa María del Mar',
  'Santa Rosa',
  'Santiago de Surco',
  'Surquillo',
  'Villa El Salvador',
  'Villa María del Triunfo',
];

// Realistic Peruvian names
const firstNames = [
  'Carlos',
  'María',
  'José',
  'Ana',
  'Luis',
  'Carmen',
  'Miguel',
  'Rosa',
  'Juan',
  'Elena',
  'Pedro',
  'Lucía',
  'Antonio',
  'Isabel',
  'Francisco',
  'Patricia',
  'Manuel',
  'Teresa',
  'Alejandro',
  'Mónica',
  'Ricardo',
  'Silvia',
  'Fernando',
  'Andrea',
  'Roberto',
  'Claudia',
  'Jorge',
  'Beatriz',
  'Raúl',
  'Gabriela',
  'Eduardo',
  'Verónica',
  'Sergio',
  'Natalia',
  'Daniel',
  'Paola',
  'Óscar',
  'Lorena',
  'Víctor',
  'Mariana',
  'Arturo',
  'Valeria',
  'Enrique',
  'Cristina',
  'Guillermo',
  'Alejandra',
  'Rodrigo',
  'Sofía',
  'Andrés',
  'Daniela',
];

const lastNames = [
  'García',
  'Rodríguez',
  'López',
  'Martínez',
  'González',
  'Pérez',
  'Sánchez',
  'Ramírez',
  'Cruz',
  'Torres',
  'Flores',
  'Rivera',
  'Gómez',
  'Díaz',
  'Reyes',
  'Morales',
  'Jiménez',
  'Herrera',
  'Medina',
  'Castro',
  'Vargas',
  'Ortega',
  'Ramos',
  'Delgado',
  'Aguilar',
  'Mendoza',
  'Vásquez',
  'Castillo',
  'Guerrero',
  'Rojas',
  'Muñoz',
  'Mendez',
  'Chávez',
  'Paredes',
  'Quispe',
  'Mamani',
  'Huamán',
  'Condori',
  'Apaza',
  'Ccopa',
  'Vilca',
  'Yupanqui',
  'Inca',
  'Puma',
  'Chuya',
  'Llanos',
  'Vega',
  'Salinas',
  'Espinoza',
  'Cabrera',
];

// Professional headshot URLs (using placeholder service)
const profileImages = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=150&h=150&fit=crop&crop=face',
];

// Bio templates for different skill categories
const bioTemplates = {
  home_repair: [
    'Experienced contractor with {years} years in home improvement and repair services. Specializing in {skills}, I take pride in delivering quality workmanship and excellent customer service.',
    'Professional handyman with extensive experience in {skills}. {years} years of helping Lima families maintain and improve their homes with reliable, affordable services.',
    'Dedicated home improvement specialist focusing on {skills}. With {years} years of experience, I ensure every project is completed to the highest standards.',
  ],
  cleaning: [
    'Professional cleaning specialist with {years} years of experience providing {skills} services. Committed to creating spotless, healthy environments for families and businesses.',
    'Experienced cleaning professional offering {skills} services. {years} years of trusted service in Lima, using eco-friendly products and thorough techniques.',
    'Reliable cleaning expert specializing in {skills}. {years} years of experience ensuring your space is clean, fresh, and welcoming.',
  ],
  education: [
    'Qualified instructor with {years} years of experience in {skills}. Passionate about helping students achieve their learning goals through personalized, effective teaching methods.',
    'Professional educator specializing in {skills}. {years} years of experience providing engaging, results-oriented lessons for students of all levels.',
    'Experienced tutor offering {skills} services. {years} years of helping students build confidence and achieve academic success.',
  ],
  beauty: [
    'Licensed beauty professional with {years} years of experience in {skills}. Committed to helping clients look and feel their best with quality, personalized services.',
    'Skilled beauty specialist offering {skills} services. {years} years of experience providing professional treatments in the comfort of your home.',
    'Professional beauty expert specializing in {skills}. {years} years of experience delivering exceptional results with attention to detail and hygiene.',
  ],
  technical: [
    'Certified technician with {years} years of experience in {skills}. Providing reliable, professional service with quick response times and guaranteed workmanship.',
    'Experienced technical specialist offering {skills} services. {years} years of solving problems efficiently and professionally for residential and commercial clients.',
    'Professional technician specializing in {skills}. {years} years of experience ensuring safe, reliable solutions for all your technical needs.',
  ],
};

// Utility functions
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generatePhoneNumber() {
  const prefixes = ['9', '8', '7'];
  const prefix = getRandomElement(prefixes);
  const number = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}${number}`;
}

function categorizeSkills(skills) {
  const homeRepair = [
    'AC Repair',
    'Appliance Installation',
    'Carpentry',
    'Electrical Repairs',
    'Furniture Assembly',
    'Locksmith',
    'Plumbing Fixes',
  ];
  const cleaning = [
    'Deep Cleaning',
    'Office Cleaning',
    'Standard Home Cleaning',
    'Window Cleaning',
  ];
  const education = ['English Lessons', 'Guitar Lessons', 'Math Tutoring'];
  const beauty = ['Manicure', 'Mobile Haircut', 'Pedicure'];
  const technical = ['AC Repair', 'Electrical Repairs', 'Locksmith'];
  const gardening = ['Lawn Mowing', 'Planting Services', 'Weed Removal'];

  if (skills.some((skill) => homeRepair.includes(skill))) return 'home_repair';
  if (skills.some((skill) => cleaning.includes(skill))) return 'cleaning';
  if (skills.some((skill) => education.includes(skill))) return 'education';
  if (skills.some((skill) => beauty.includes(skill))) return 'beauty';
  if (skills.some((skill) => technical.includes(skill))) return 'technical';
  return 'home_repair'; // default
}

function generateBio(skills, yearsExperience) {
  const category = categorizeSkills(skills);
  const template = getRandomElement(bioTemplates[category]);
  const skillsText =
    skills.length > 1
      ? skills.slice(0, -1).join(', ') + ' and ' + skills[skills.length - 1]
      : skills[0];

  return template
    .replace('{skills}', skillsText.toLowerCase())
    .replace('{years}', yearsExperience);
}

function generateContractor() {
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const fullName = `${firstName} ${lastName}`;
  const skills = getRandomElements(
    availableSkills,
    Math.floor(Math.random() * 3) + 2
  ); // 2-4 skills
  const yearsExperience = Math.floor(Math.random() * 15) + 1; // 1-15 years
  const district = getRandomElement(limaDistricts);
  const rating = (Math.random() * 1.5 + 3.5).toFixed(1); // 3.5-5.0 rating
  const profileImageUrl = getRandomElement(profileImages);
  const bio = generateBio(skills, yearsExperience);
  const phoneNumber = generatePhoneNumber();

  // Generate service areas (current district + 1-3 nearby districts)
  const serviceAreas = [district];
  const additionalAreas = getRandomElements(
    limaDistricts.filter((d) => d !== district),
    Math.floor(Math.random() * 3) + 1
  );
  serviceAreas.push(...additionalAreas);

  return {
    id: randomUUID(),
    full_name: fullName,
    bio: bio,
    skills: skills,
    years_experience: `${yearsExperience}+ years`,
    contact_phone: phoneNumber,
    profile_picture_url: profileImageUrl,
    service_areas: serviceAreas,
    role: 'contractor',
    service_ids: [], // Will be populated based on skills
    work_photo_urls: [], // Can be added later
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Portfolio sample data
const portfolioSamples = [
  {
    title: 'Kitchen Renovation',
    description:
      'Complete kitchen makeover including cabinet installation and electrical work',
    category: 'Carpentry',
    status: 'completed',
    rating: 5.0,
    client_feedback: 'Excellent work! Very professional and finished on time.',
  },
  {
    title: 'Bathroom Plumbing Repair',
    description: 'Fixed leaking pipes and installed new fixtures',
    category: 'Plumbing Fixes',
    status: 'completed',
    rating: 4.8,
    client_feedback: 'Quick response and quality work. Highly recommended!',
  },
  {
    title: 'Office Deep Cleaning',
    description: 'Comprehensive cleaning of 500sqm office space',
    category: 'Office Cleaning',
    status: 'completed',
    rating: 4.9,
    client_feedback: 'Thorough and professional service. Office looks amazing!',
  },
  {
    title: 'Electrical Outlet Installation',
    description: 'Installed additional outlets in living room and bedroom',
    category: 'Electrical Repairs',
    status: 'completed',
    rating: 5.0,
    client_feedback: 'Safe and professional electrical work. Very satisfied!',
  },
  {
    title: 'Garden Landscaping',
    description: 'Planted new flowers and maintained existing garden',
    category: 'Planting Services',
    status: 'completed',
    rating: 4.7,
    client_feedback:
      'Beautiful garden transformation. Great attention to detail!',
  },
];

async function createPortfolioItem(contractorId, skills) {
  const relevantSamples = portfolioSamples.filter((sample) =>
    skills.includes(sample.category)
  );

  if (relevantSamples.length === 0) return null;

  const sample = getRandomElement(relevantSamples);
  const completedDate = new Date();
  completedDate.setDate(
    completedDate.getDate() - Math.floor(Math.random() * 365)
  ); // Random date within last year

  return {
    id: randomUUID(),
    contractor_id: contractorId,
    title: sample.title,
    description: sample.description,
    category: sample.category,
    status: sample.status,
    completed_date: completedDate.toISOString().split('T')[0],
    rating: sample.rating,
    client_feedback: sample.client_feedback,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

async function main() {
  console.log('🚀 Starting demo contractor creation...');

  try {
    // Generate 50 contractors
    const contractors = [];
    for (let i = 0; i < 50; i++) {
      contractors.push(generateContractor());
    }

    console.log('📝 Generated 50 contractor profiles');

    // Insert contractors into database
    const { data: insertedContractors, error: contractorError } = await supabase
      .from('contractor_profiles')
      .insert(contractors)
      .select();

    if (contractorError) {
      console.error('❌ Error inserting contractors:', contractorError);
      return;
    }

    console.log('✅ Successfully inserted contractors into database');

    // Create portfolio items for each contractor
    const portfolioItems = [];
    for (const contractor of contractors) {
      // Create 1-3 portfolio items per contractor
      const itemCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < itemCount; i++) {
        const portfolioItem = await createPortfolioItem(
          contractor.id,
          contractor.skills
        );
        if (portfolioItem) {
          portfolioItems.push(portfolioItem);
        }
      }
    }

    if (portfolioItems.length > 0) {
      const { error: portfolioError } = await supabase
        .from('contractor_work_portfolio')
        .insert(portfolioItems);

      if (portfolioError) {
        console.error('❌ Error inserting portfolio items:', portfolioError);
      } else {
        console.log(
          `✅ Successfully inserted ${portfolioItems.length} portfolio items`
        );
      }
    }

    console.log('🎉 Demo contractor creation completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${contractors.length} contractors created`);
    console.log(`   - ${portfolioItems.length} portfolio items created`);
    console.log(
      `   - Skills distributed across: ${[...new Set(contractors.flatMap((c) => c.skills))].length} different services`
    );
    console.log(
      `   - Locations covered: ${[...new Set(contractors.flatMap((c) => c.service_areas))].length} districts in Lima`
    );
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the script
main();
