#!/usr/bin/env node

/**
 * ONBOARDING TEST DATA GENERATOR
 *
 * This script generates realistic test data for the onboarding flow testing.
 * It creates job postings, contractor profiles, and test scenarios to validate
 * the new optimized onboarding experience.
 *
 * Usage:
 *   node scripts/generate-onboarding-test-data.js [options]
 *
 * Options:
 *   --reset     Reset all test data before generating new data
 *   --jobs=N    Number of job postings to create (default: 50)
 *   --users=N   Number of test users to create (default: 20)
 *   --env=ENV   Environment (development, staging, production)
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '../.env') });

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    '❌ Missing Supabase configuration. Please check your .env file.'
  );
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  reset: args.includes('--reset'),
  jobs:
    parseInt(args.find((arg) => arg.startsWith('--jobs='))?.split('=')[1]) ||
    50,
  users:
    parseInt(args.find((arg) => arg.startsWith('--users='))?.split('=')[1]) ||
    20,
  env:
    args.find((arg) => arg.startsWith('--env='))?.split('=')[1] ||
    'development',
};

// Test data templates
const DISTRICTS = [
  {
    id: 'miraflores',
    name: 'Miraflores',
    province: 'Lima',
    coords: { lat: -12.1211, lng: -77.0282 },
  },
  {
    id: 'san_isidro',
    name: 'San Isidro',
    province: 'Lima',
    coords: { lat: -12.0931, lng: -77.0465 },
  },
  {
    id: 'surco',
    name: 'Surco',
    province: 'Lima',
    coords: { lat: -12.1391, lng: -76.9938 },
  },
  {
    id: 'san_borja',
    name: 'San Borja',
    province: 'Lima',
    coords: { lat: -12.1089, lng: -77.0003 },
  },
  {
    id: 'barranco',
    name: 'Barranco',
    province: 'Lima',
    coords: { lat: -12.1464, lng: -77.0206 },
  },
  {
    id: 'la_molina',
    name: 'La Molina',
    province: 'Lima',
    coords: { lat: -12.0865, lng: -76.9581 },
  },
  {
    id: 'pueblo_libre',
    name: 'Pueblo Libre',
    province: 'Lima',
    coords: { lat: -12.0742, lng: -77.0631 },
  },
  {
    id: 'magdalena',
    name: 'Magdalena del Mar',
    province: 'Lima',
    coords: { lat: -12.0964, lng: -77.0748 },
  },
  {
    id: 'jesus_maria',
    name: 'Jesús María',
    province: 'Lima',
    coords: { lat: -12.0742, lng: -77.0489 },
  },
  {
    id: 'lince',
    name: 'Lince',
    province: 'Lima',
    coords: { lat: -12.0889, lng: -77.0364 },
  },
];

const JOB_CATEGORIES = {
  plumbing: {
    name: 'Plumbing',
    icon: '🔧',
    skills: ['pipe repair', 'leak fixing', 'installation', 'maintenance'],
    jobs: [
      'Fix kitchen sink leak',
      'Install new bathroom fixtures',
      'Repair water heater',
      'Unclog drain pipes',
      'Replace toilet',
      'Install shower head',
      'Fix pipe burst',
      'Water pressure adjustment',
    ],
  },
  electrical: {
    name: 'Electrical',
    icon: '⚡',
    skills: ['wiring', 'installation', 'repair', 'maintenance'],
    jobs: [
      'Install ceiling fan',
      'Fix electrical outlet',
      'Replace light switches',
      'Install security lighting',
      'Repair circuit breaker',
      'Install smart home devices',
      'Fix power outage',
      'Install outdoor lighting',
    ],
  },
  painting: {
    name: 'Painting',
    icon: '🎨',
    skills: [
      'interior painting',
      'exterior painting',
      'wall preparation',
      'color consultation',
    ],
    jobs: [
      'Paint living room walls',
      'Exterior house painting',
      'Touch up wall scratches',
      'Paint kitchen cabinets',
      'Bedroom makeover',
      'Office space painting',
      'Fence painting',
      'Ceiling painting',
    ],
  },
  carpentry: {
    name: 'Carpentry',
    icon: '🪚',
    skills: [
      'furniture repair',
      'custom builds',
      'installation',
      'restoration',
    ],
    jobs: [
      'Build custom shelves',
      'Repair wooden furniture',
      'Install kitchen cabinets',
      'Fix squeaky doors',
      'Build outdoor deck',
      'Install crown molding',
      'Repair window frames',
      'Custom closet build',
    ],
  },
  gardening: {
    name: 'Gardening',
    icon: '🌱',
    skills: ['landscaping', 'plant care', 'lawn maintenance', 'garden design'],
    jobs: [
      'Lawn mowing service',
      'Garden landscaping',
      'Tree pruning',
      'Plant installation',
      'Weed removal',
      'Garden maintenance',
      'Irrigation system setup',
      'Seasonal cleanup',
    ],
  },
  cleaning: {
    name: 'Cleaning',
    icon: '🧽',
    skills: [
      'deep cleaning',
      'regular maintenance',
      'specialized cleaning',
      'organization',
    ],
    jobs: [
      'Deep house cleaning',
      'Office cleaning service',
      'Post-construction cleanup',
      'Window cleaning',
      'Carpet cleaning',
      'Move-in cleaning',
      'Regular weekly cleaning',
      'Event cleanup',
    ],
  },
  appliance: {
    name: 'Appliance Repair',
    icon: '🔨',
    skills: [
      'appliance repair',
      'maintenance',
      'installation',
      'troubleshooting',
    ],
    jobs: [
      'Fix washing machine',
      'Repair refrigerator',
      'Install dishwasher',
      'Fix air conditioner',
      'Repair microwave',
      'Install new oven',
      'Fix dryer issues',
      'Appliance maintenance',
    ],
  },
  locksmith: {
    name: 'Locksmith',
    icon: '🔐',
    skills: [
      'lock installation',
      'key cutting',
      'security systems',
      'emergency lockout',
    ],
    jobs: [
      'Change door locks',
      'Emergency lockout service',
      'Install security system',
      'Duplicate keys',
      'Repair broken lock',
      'Install smart locks',
      'Safe installation',
      'Security consultation',
    ],
  },
  tutoring: {
    name: 'Tutoring',
    icon: '📚',
    skills: [
      'academic tutoring',
      'test preparation',
      'language teaching',
      'skill development',
    ],
    jobs: [
      'Math tutoring sessions',
      'English language lessons',
      'University exam prep',
      'Computer skills training',
      'Music lessons',
      'Art instruction',
      'Science tutoring',
      'Language conversation practice',
    ],
  },
  beauty: {
    name: 'Beauty Services',
    icon: '💅',
    skills: ['hair styling', 'nail care', 'makeup', 'skincare'],
    jobs: [
      'Hair cut and styling',
      'Manicure and pedicure',
      'Makeup for events',
      'Facial treatment',
      'Hair coloring',
      'Eyebrow shaping',
      'Wedding makeup',
      'Skincare consultation',
    ],
  },
  fitness: {
    name: 'Fitness Training',
    icon: '💪',
    skills: [
      'personal training',
      'group fitness',
      'nutrition coaching',
      'specialized training',
    ],
    jobs: [
      'Personal training sessions',
      'Group fitness classes',
      'Nutrition consultation',
      'Weight loss coaching',
      'Strength training',
      'Yoga instruction',
      'Running coaching',
      'Sports training',
    ],
  },
};

const CLIENT_NAMES = [
  'María González',
  'Carlos Rodríguez',
  'Ana López',
  'José Martínez',
  'Carmen Silva',
  'Luis Fernández',
  'Rosa Morales',
  'Miguel Torres',
  'Elena Vargas',
  'Pedro Castillo',
  'Lucía Herrera',
  'Roberto Jiménez',
  'Isabel Ruiz',
  'Francisco Mendoza',
  'Patricia Ramos',
  'Diego Flores',
  'Sofía Guerrero',
  'Andrés Peña',
  'Valentina Cruz',
  'Alejandro Vega',
];

const CONTRACTOR_NAMES = [
  'Juan Pérez',
  'María Rodríguez',
  'Carlos López',
  'Ana Martínez',
  'Luis García',
  'Carmen Fernández',
  'José Silva',
  'Rosa Torres',
  'Miguel Vargas',
  'Elena Morales',
  'Pedro Herrera',
  'Lucía Jiménez',
  'Roberto Ruiz',
  'Isabel Mendoza',
  'Francisco Ramos',
  'Patricia Flores',
  'Diego Guerrero',
  'Sofía Peña',
  'Andrés Cruz',
  'Valentina Vega',
];

// Utility functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function generateEmail(name, domain = 'test.com') {
  return (
    name
      .toLowerCase()
      .replace(/\s+/g, '.')
      .replace(/[áàäâ]/g, 'a')
      .replace(/[éèëê]/g, 'e')
      .replace(/[íìïî]/g, 'i')
      .replace(/[óòöô]/g, 'o')
      .replace(/[úùüû]/g, 'u')
      .replace(/ñ/g, 'n') +
    '@' +
    domain
  );
}

function generatePhone() {
  return `+51 9${randomInt(10000000, 99999999)}`;
}

function generatePastDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(1, daysAgo));
  return date.toISOString();
}

// Data generation functions
async function resetTestData() {
  console.log('🗑️  Resetting test data...');

  try {
    // Delete test data (users with test emails)
    const { error: analyticsError } = await supabase
      .from('onboarding_analytics')
      .delete()
      .like('user_id', '%test%');

    const { error: performanceError } = await supabase
      .from('onboarding_performance')
      .delete()
      .like('user_id', '%test%');

    const { error: applicationsError } = await supabase
      .from('job_applications')
      .delete()
      .like('contractor_id', '%test%');

    const { error: skillsError } = await supabase
      .from('user_skills')
      .delete()
      .like('user_id', '%test%');

    const { error: abTestError } = await supabase
      .from('ab_test_assignments')
      .delete()
      .like('user_id', '%test%');

    // Delete test jobs
    const { error: jobsError } = await supabase
      .from('job_postings')
      .delete()
      .or('title.ilike.%TEST%,title.ilike.%DEMO%');

    // Delete test users
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .or('email.ilike.%test.com%,email.ilike.%demo.com%');

    console.log('✅ Test data reset completed');
  } catch (error) {
    console.error('❌ Error resetting test data:', error);
  }
}

async function generateTestUsers(count) {
  console.log(`👥 Generating ${count} test users...`);

  const users = [];
  const clients = [];
  const contractors = [];

  for (let i = 0; i < count; i++) {
    const isContractor = i < count * 0.7; // 70% contractors, 30% clients
    const name = isContractor
      ? randomChoice(CONTRACTOR_NAMES)
      : randomChoice(CLIENT_NAMES);
    const district = randomChoice(DISTRICTS);
    const flowVersion = Math.random() < 0.7 ? 'v2' : 'v1'; // 70% new flow, 30% current

    const user = {
      id: `test-user-${i + 1}-${Date.now()}`,
      email: generateEmail(name, 'test.com'),
      phone: generatePhone(),
      full_name: name,
      user_type: isContractor ? 'contractor' : 'client',
      onboarding_completed: Math.random() < 0.8, // 80% completion rate
      onboarding_step: randomInt(0, 5),
      onboarding_flow_version: flowVersion,
      location_district: district.id,
      location_coordinates: `POINT(${district.coords.lng} ${district.coords.lat})`,
      location_detection_method: randomChoice(['gps', 'manual', 'skipped']),
      created_at: generatePastDate(30),
      updated_at: generatePastDate(7),
    };

    users.push(user);

    if (isContractor) {
      contractors.push(user);
    } else {
      clients.push(user);
    }
  }

  // Insert users
  const { data: insertedUsers, error } = await supabase
    .from('users')
    .insert(users)
    .select();

  if (error) {
    console.error('❌ Error inserting users:', error);
    return { users: [], clients: [], contractors: [] };
  }

  console.log(`✅ Generated ${insertedUsers.length} test users`);
  return {
    users: insertedUsers,
    clients: insertedUsers.filter((u) => u.user_type === 'client'),
    contractors: insertedUsers.filter((u) => u.user_type === 'contractor'),
  };
}

async function generateUserSkills(contractors) {
  console.log('🛠️  Generating user skills...');

  const skills = [];

  for (const contractor of contractors) {
    const numSkills = randomInt(1, 4);
    const selectedCategories = [];

    for (let i = 0; i < numSkills; i++) {
      const categoryKey = randomChoice(Object.keys(JOB_CATEGORIES));
      if (!selectedCategories.includes(categoryKey)) {
        selectedCategories.push(categoryKey);

        const category = JOB_CATEGORIES[categoryKey];
        const skill = {
          user_id: contractor.id,
          skill_name: categoryKey,
          experience_level: randomChoice([
            'beginner',
            'intermediate',
            'advanced',
            'expert',
          ]),
          years_experience: randomInt(0, 10),
          is_primary: i === 0,
          verified: Math.random() < 0.3,
          added_during_onboarding: Math.random() < 0.8,
        };

        skills.push(skill);
      }
    }
  }

  const { error } = await supabase.from('user_skills').insert(skills);

  if (error) {
    console.error('❌ Error inserting skills:', error);
    return;
  }

  console.log(`✅ Generated ${skills.length} user skills`);
}

async function generateJobPostings(clients, count) {
  console.log(`💼 Generating ${count} job postings...`);

  const jobs = [];

  for (let i = 0; i < count; i++) {
    const client = randomChoice(clients);
    const categoryKey = randomChoice(Object.keys(JOB_CATEGORIES));
    const category = JOB_CATEGORIES[categoryKey];
    const jobTitle = randomChoice(category.jobs);
    const district = randomChoice(DISTRICTS);

    const budgetMin = randomInt(50, 500);
    const budgetMax = budgetMin + randomInt(50, 300);

    const job = {
      id: `test-job-${i + 1}-${Date.now()}`,
      client_id: client.id,
      title: jobTitle,
      description: generateJobDescription(jobTitle, category),
      category_name: categoryKey,
      subcategory: randomChoice(category.skills),
      budget_min: budgetMin,
      budget_max: budgetMax,
      budget_type: randomChoice(['fixed', 'hourly', 'negotiable']),
      location_text: `${district.name}, ${district.province}`,
      location_district: district.id,
      location_coordinates: `POINT(${district.coords.lng} ${district.coords.lat})`,
      urgency_level: randomChoice(['low', 'normal', 'high', 'urgent']),
      status: randomChoice([
        'open',
        'open',
        'open',
        'in_progress',
        'completed',
      ]), // More open jobs
      required_skills: [
        categoryKey,
        ...randomChoice(category.skills, randomInt(1, 3)),
      ],
      estimated_duration: randomChoice([
        '1-2 hours',
        '2-4 hours',
        '4-8 hours',
        '1 day',
        '2-3 days',
        '1 week',
      ]),
      images:
        Math.random() < 0.3
          ? [`https://picsum.photos/400/300?random=${i}`]
          : [],
      created_at: generatePastDate(14),
      updated_at: generatePastDate(7),
      expires_at: new Date(
        Date.now() + randomInt(7, 30) * 24 * 60 * 60 * 1000
      ).toISOString(),
    };

    jobs.push(job);
  }

  const { data: insertedJobs, error } = await supabase
    .from('job_postings')
    .insert(jobs)
    .select();

  if (error) {
    console.error('❌ Error inserting jobs:', error);
    return [];
  }

  console.log(`✅ Generated ${insertedJobs.length} job postings`);
  return insertedJobs;
}

function generateJobDescription(title, category) {
  const descriptions = {
    plumbing: [
      'Experienced plumber needed for reliable repair work.',
      'Looking for professional plumbing services with quality guarantee.',
      'Need urgent plumbing assistance for residential property.',
      'Seeking skilled plumber for installation and maintenance work.',
    ],
    electrical: [
      'Licensed electrician required for safe electrical work.',
      'Need professional electrical services for home improvement.',
      'Looking for experienced electrician with proper certifications.',
      'Electrical work needed - safety and quality are priorities.',
    ],
    painting: [
      'Professional painter needed for interior/exterior work.',
      'Looking for quality painting services with attention to detail.',
      'Need experienced painter for residential painting project.',
      'Seeking reliable painting contractor for home makeover.',
    ],
    carpentry: [
      'Skilled carpenter needed for custom woodwork project.',
      'Looking for experienced carpenter with quality craftsmanship.',
      'Need professional carpentry services for home improvement.',
      'Seeking reliable carpenter for furniture and installation work.',
    ],
    gardening: [
      'Professional gardener needed for landscape maintenance.',
      'Looking for experienced gardening services for property care.',
      'Need reliable gardener for regular lawn and garden maintenance.',
      'Seeking skilled landscaper for garden design and care.',
    ],
    cleaning: [
      'Professional cleaning service needed for thorough work.',
      'Looking for reliable cleaning team with attention to detail.',
      'Need experienced cleaners for regular maintenance service.',
      'Seeking quality cleaning services for residential property.',
    ],
    appliance: [
      'Experienced technician needed for appliance repair.',
      'Looking for reliable appliance repair service.',
      'Need professional appliance maintenance and repair.',
      'Seeking skilled technician for appliance installation.',
    ],
    locksmith: [
      'Professional locksmith needed for security services.',
      'Looking for reliable locksmith with emergency availability.',
      'Need experienced locksmith for lock installation and repair.',
      'Seeking certified locksmith for security system work.',
    ],
    tutoring: [
      'Experienced tutor needed for academic support.',
      'Looking for qualified instructor for personalized lessons.',
      'Need professional tutoring services for skill development.',
      'Seeking knowledgeable tutor for educational assistance.',
    ],
    beauty: [
      'Professional beauty services needed for special occasion.',
      'Looking for experienced stylist for beauty treatments.',
      'Need skilled beauty professional for personal care services.',
      'Seeking qualified beauty specialist for professional service.',
    ],
    fitness: [
      'Certified fitness trainer needed for personal training.',
      'Looking for experienced fitness professional for coaching.',
      'Need qualified trainer for fitness and wellness program.',
      'Seeking professional fitness instructor for training sessions.',
    ],
  };

  const baseDescription = randomChoice(
    descriptions[category.name.toLowerCase()] || descriptions.plumbing
  );
  return `${title} - ${baseDescription} Please contact for more details and scheduling.`;
}

async function generateJobApplications(contractors, jobs) {
  console.log('📝 Generating job applications...');

  const applications = [];

  // Generate applications for about 30% of job-contractor combinations
  for (const job of jobs.slice(0, Math.min(jobs.length, 20))) {
    // Limit to first 20 jobs
    const numApplications = randomInt(1, 5);
    const appliedContractors = [];

    for (
      let i = 0;
      i < numApplications && appliedContractors.length < contractors.length;
      i++
    ) {
      const contractor = randomChoice(contractors);

      if (!appliedContractors.includes(contractor.id)) {
        appliedContractors.push(contractor.id);

        const application = {
          job_id: job.id,
          contractor_id: contractor.id,
          status: randomChoice(['pending', 'pending', 'accepted', 'rejected']), // More pending
          proposal_text: generateProposalText(job.title),
          proposed_budget: randomFloat(
            job.budget_min * 0.9,
            job.budget_max * 1.1
          ),
          estimated_completion_time: randomChoice([
            'Same day',
            '1-2 days',
            '3-5 days',
            '1 week',
          ]),
          applied_during_onboarding: Math.random() < 0.4,
          created_at: generatePastDate(10),
          updated_at: generatePastDate(5),
        };

        applications.push(application);
      }
    }
  }

  const { error } = await supabase
    .from('job_applications')
    .insert(applications);

  if (error) {
    console.error('❌ Error inserting applications:', error);
    return;
  }

  console.log(`✅ Generated ${applications.length} job applications`);
}

function generateProposalText(jobTitle) {
  const proposals = [
    `I have extensive experience with ${jobTitle.toLowerCase()} and can complete this work efficiently. I use quality materials and provide warranty on my work.`,
    `Professional service for ${jobTitle.toLowerCase()}. I'm available to start immediately and will ensure the job is done right the first time.`,
    `Experienced in ${jobTitle.toLowerCase()} with excellent customer reviews. I provide free estimates and competitive pricing.`,
    `Quality workmanship for ${jobTitle.toLowerCase()}. I'm licensed, insured, and committed to customer satisfaction.`,
    `Reliable service for ${jobTitle.toLowerCase()}. I have all necessary tools and can work around your schedule.`,
  ];

  return randomChoice(proposals);
}

async function generateABTestAssignments(users) {
  console.log('🧪 Generating A/B test assignments...');

  const assignments = [];

  for (const user of users) {
    // Onboarding flow test (70% new, 30% current)
    const flowVariant = Math.random() < 0.7 ? 'new_flow' : 'current_flow';

    assignments.push({
      user_id: user.id,
      test_name: 'onboarding_flow_test',
      variant: flowVariant,
      assigned_at: user.created_at,
    });

    // Location detection test (50/50)
    if (Math.random() < 0.5) {
      assignments.push({
        user_id: user.id,
        test_name: 'location_detection_method',
        variant: Math.random() < 0.5 ? 'auto_detect' : 'manual_select',
        assigned_at: user.created_at,
      });
    }
  }

  const { error } = await supabase
    .from('ab_test_assignments')
    .insert(assignments);

  if (error) {
    console.error('❌ Error inserting A/B test assignments:', error);
    return;
  }

  console.log(`✅ Generated ${assignments.length} A/B test assignments`);
}

async function generateOnboardingAnalytics(users) {
  console.log('📊 Generating onboarding analytics...');

  const analytics = [];

  for (const user of users) {
    const sessionId = `session-${user.id}-${Date.now()}`;
    const flowVersion = user.onboarding_flow_version;

    // Generate events for onboarding flow
    const events = [
      { type: 'onboarding_started', step: 0, timeSpent: 0 },
      { type: 'location_prompt_shown', step: 1, timeSpent: randomInt(5, 30) },
      { type: 'location_selected', step: 1, timeSpent: randomInt(10, 60) },
      { type: 'jobs_displayed', step: 2, timeSpent: randomInt(15, 45) },
      { type: 'job_viewed', step: 2, timeSpent: randomInt(20, 90) },
      { type: 'skill_selection_shown', step: 3, timeSpent: randomInt(30, 120) },
      { type: 'profile_form_shown', step: 4, timeSpent: randomInt(60, 300) },
      { type: 'onboarding_completed', step: 5, timeSpent: randomInt(120, 600) },
    ];

    let cumulativeTime = 0;
    const completedSteps = user.onboarding_step;

    for (let i = 0; i <= completedSteps && i < events.length; i++) {
      const event = events[i];
      cumulativeTime += event.timeSpent;

      const analytic = {
        user_id: user.id,
        session_id: sessionId,
        flow_version: flowVersion,
        event_type: event.type,
        event_data: generateEventData(event.type, user),
        step_number: event.step,
        time_spent_seconds: event.timeSpent,
        timestamp: new Date(
          new Date(user.created_at).getTime() + cumulativeTime * 1000
        ).toISOString(),
        user_agent: randomChoice([
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          'Mozilla/5.0 (Android 11; Mobile; rv:68.0)',
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        ]),
        device_type: randomChoice(['mobile', 'desktop', 'tablet']),
        screen_size: randomChoice(['small', 'medium', 'large']),
      };

      analytics.push(analytic);
    }
  }

  const { error } = await supabase
    .from('onboarding_analytics')
    .insert(analytics);

  if (error) {
    console.error('❌ Error inserting analytics:', error);
    return;
  }

  console.log(`✅ Generated ${analytics.length} analytics events`);
}

function generateEventData(eventType, user) {
  const eventData = {
    onboarding_started: { flow_version: user.onboarding_flow_version },
    location_prompt_shown: { method_options: ['gps', 'manual'] },
    location_selected: {
      method: user.location_detection_method,
      district: user.location_district,
      success: user.location_detection_method !== 'skipped',
    },
    jobs_displayed: {
      count: randomInt(3, 12),
      categories: randomChoice(Object.keys(JOB_CATEGORIES), randomInt(1, 3)),
    },
    job_viewed: {
      job_category: randomChoice(Object.keys(JOB_CATEGORIES)),
      view_duration: randomInt(10, 120),
    },
    skill_selection_shown: { available_skills: Object.keys(JOB_CATEGORIES) },
    profile_form_shown: { required_fields: ['name', 'phone', 'skills'] },
    onboarding_completed: {
      total_time: randomInt(300, 1800),
      completion_rate: 100,
    },
  };

  return eventData[eventType] || {};
}

async function generateOnboardingPerformance(users) {
  console.log('⚡ Generating onboarding performance metrics...');

  const performance = [];

  for (const user of users) {
    if (user.onboarding_completed) {
      const totalTime = randomInt(300, 1800); // 5-30 minutes
      const timeToFirstValue = randomInt(30, 180); // 30 seconds to 3 minutes

      const perf = {
        user_id: user.id,
        flow_version: user.onboarding_flow_version,
        total_time_seconds: totalTime,
        time_to_first_value_seconds: timeToFirstValue,
        steps_completed: 5,
        total_steps: 5,
        completion_rate: 100,
        drop_off_step: null,
        jobs_viewed: randomInt(3, 15),
        jobs_applied: randomInt(0, 3),
        location_detection_time_seconds: randomInt(5, 60),
        location_detection_success:
          user.location_detection_method !== 'skipped',
        profile_completion_percentage: 100,
        created_at: user.created_at,
      };

      performance.push(perf);
    }
  }

  const { error } = await supabase
    .from('onboarding_performance')
    .insert(performance);

  if (error) {
    console.error('❌ Error inserting performance metrics:', error);
    return;
  }

  console.log(`✅ Generated ${performance.length} performance metrics`);
}

// Main execution function
async function main() {
  console.log('🚀 Starting onboarding test data generation...');
  console.log(`📋 Configuration:`, options);

  try {
    // Reset data if requested
    if (options.reset) {
      await resetTestData();
    }

    // Generate test users
    const { users, clients, contractors } = await generateTestUsers(
      options.users
    );

    if (users.length === 0) {
      console.error('❌ No users generated. Exiting.');
      return;
    }

    // Generate user skills for contractors
    if (contractors.length > 0) {
      await generateUserSkills(contractors);
    }

    // Generate job postings
    const jobs = await generateJobPostings(clients, options.jobs);

    // Generate job applications
    if (jobs.length > 0 && contractors.length > 0) {
      await generateJobApplications(contractors, jobs);
    }

    // Generate A/B test assignments
    await generateABTestAssignments(users);

    // Generate onboarding analytics
    await generateOnboardingAnalytics(users);

    // Generate performance metrics
    await generateOnboardingPerformance(users);

    console.log('\n🎉 Test data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(
      `   👥 Users: ${users.length} (${contractors.length} contractors, ${clients.length} clients)`
    );
    console.log(`   💼 Jobs: ${jobs.length}`);
    console.log(`   🧪 A/B Tests: Onboarding flow assignments created`);
    console.log(`   📈 Analytics: Event tracking data generated`);
    console.log(`   ⚡ Performance: Metrics for completed onboardings`);

    console.log('\n🔗 Next steps:');
    console.log(
      '   1. Run the testing guide: docs/ONBOARDING_TESTING_GUIDE.md'
    );
    console.log('   2. Start the app: npm run dev');
    console.log('   3. Test onboarding flows with generated data');
    console.log(
      '   4. Run performance benchmarks: node scripts/benchmark-onboarding-performance.js'
    );
  } catch (error) {
    console.error('❌ Error during data generation:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  generateTestUsers,
  generateUserSkills,
  generateJobPostings,
  generateJobApplications,
  generateABTestAssignments,
  generateOnboardingAnalytics,
  generateOnboardingPerformance,
  resetTestData,
};
