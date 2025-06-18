import { useAuth } from '../composables/useAuth.js';

/**
 * API service for onboarding-related operations
 */
export class OnboardingAPI {
  constructor() {
    const { getSupabaseClient } = useAuth();
    this.supabase = getSupabaseClient();
  }

  /**
   * Get job statistics for a specific location
   */
  async getJobStats(location) {
    try {
      const { data: jobs, error } = await this.supabase
        .from('job_postings')
        .select(
          'category_name as service_type, budget_min, budget_max, created_at'
        )
        .eq('status', 'open')
        .ilike('location_text', `%${location}%`)
        .limit(100);

      if (error) throw error;

      return this.aggregateJobStats(jobs || []);
    } catch (error) {
      console.error('Error fetching job stats:', error);
      return this.getMockJobStats(location);
    }
  }

  /**
   * Get filtered jobs by skill and location
   */
  async getFilteredJobs(skill, location, limit = 10, offset = 0) {
    try {
      let query = this.supabase
        .from('job_postings')
        .select(
          `
          id,
          description,
          budget_min,
          budget_max,
          location_text,
          created_at,
          category_name,
          urgency_level
        `
        )
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Filter by skill if not general
      if (skill !== 'general') {
        query = query.eq('category_name', skill);
      }

      // Filter by location if available
      if (location) {
        query = query.ilike('location_text', `%${location}%`);
      }

      const { data: jobs, error } = await query;

      if (error) throw error;

      return this.formatJobs(jobs || []);
    } catch (error) {
      console.error('Error fetching filtered jobs:', error);
      return this.getMockJobs(skill, location);
    }
  }

  /**
   * Save quick profile data
   */
  async saveQuickProfile(profileData, userId) {
    try {
      const dataToSave = {
        user_id: userId,
        full_name: profileData.fullName,
        phone: profileData.phone,
        years_experience: profileData.yearsExperience,
        skills: profileData.skills || [],
        service_areas: profileData.serviceAreas || [],
        onboarding_step: 'profile_completed',
        onboarding_completed_at: new Date().toISOString(),
        profile_completion_percentage:
          this.calculateCompletionPercentage(profileData),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('contractor_profiles')
        .upsert(dataToSave, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      return { success: true, profileId: data.id, data };
    } catch (error) {
      console.error('Error saving quick profile:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit job application
   */
  async submitJobApplication(jobId, contractorId, source = 'onboarding') {
    try {
      const { data, error } = await this.supabase
        .from('job_applications')
        .insert({
          job_id: jobId,
          contractor_id: contractorId,
          status: 'pending',
          applied_at: new Date().toISOString(),
          source,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, applicationId: data.id, data };
    } catch (error) {
      console.error('Error submitting job application:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Track job view
   */
  async trackJobView(jobId, userId, sessionId, source = 'onboarding') {
    try {
      await this.supabase.from('job_views').insert({
        job_id: jobId,
        user_id: userId,
        session_id: sessionId,
        viewed_at: new Date().toISOString(),
        source,
      });

      return { success: true };
    } catch (error) {
      console.warn('Error tracking job view:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Award credits to contractor
   */
  async awardCredits(contractorId, amount, source) {
    try {
      // Insert credit record
      await this.supabase.from('contractor_credits').insert({
        contractor_id: contractorId,
        credits: amount,
        earned_from: source,
        earned_at: new Date().toISOString(),
      });

      // Update total credits in contractor profile
      const { error: updateError } = await this.supabase
        .from('contractor_profiles')
        .update({
          credits: this.supabase.raw('COALESCE(credits, 0) + ?', [amount]),
        })
        .eq('id', contractorId);

      if (updateError) throw updateError;

      return { success: true };
    } catch (error) {
      console.error('Error awarding credits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Private helper methods
   */
  aggregateJobStats(jobs) {
    const statsMap = new Map();
    const skillMapping = this.getSkillMapping();

    jobs.forEach((job) => {
      const serviceType = job.service_type || 'general';
      const skill = skillMapping[serviceType] || {
        name: serviceType,
        icon: '🛠️',
      };

      if (!statsMap.has(serviceType)) {
        statsMap.set(serviceType, {
          skill: serviceType,
          name: skill.name,
          icon: skill.icon,
          jobCount: 0,
          totalBudget: 0,
          budgets: [],
        });
      }

      const stat = statsMap.get(serviceType);
      stat.jobCount++;

      if (job.budget_min && job.budget_max) {
        const avgBudget = (job.budget_min + job.budget_max) / 2;
        stat.budgets.push(avgBudget);
        stat.totalBudget += avgBudget;
      }
    });

    return Array.from(statsMap.values())
      .map((stat) => ({
        ...stat,
        avgBudget:
          stat.budgets.length > 0
            ? Math.round(stat.totalBudget / stat.budgets.length)
            : 0,
        budgetRange:
          stat.budgets.length > 0
            ? `S/${Math.min(...stat.budgets).toFixed(0)}-${Math.max(...stat.budgets).toFixed(0)}`
            : 'Budget varies',
      }))
      .sort((a, b) => b.jobCount - a.jobCount);
  }

  formatJobs(jobs) {
    return jobs.map((job) => ({
      id: job.id,
      title: job.description?.substring(0, 50) + '...' || 'Job Posting',
      description: job.description,
      budget:
        job.budget_min && job.budget_max
          ? `S/${job.budget_min}-${job.budget_max}`
          : 'Budget negotiable',
      location: job.location_text,
      postedAt: job.created_at,
      serviceType: job.category_name,
      urgency: job.urgency_level,
      clientName: 'Client',
      isUrgent: job.urgency_level === 'urgent',
    }));
  }

  calculateCompletionPercentage(profileData) {
    let percentage = 0;

    // Basic info (40 points)
    if (profileData.fullName) percentage += 10;
    if (profileData.phone) percentage += 10;
    if (profileData.skills?.length > 0) percentage += 10;
    if (profileData.serviceAreas?.length > 0) percentage += 10;

    // Experience (20 points)
    if (profileData.yearsExperience) percentage += 20;

    // Additional fields would add more percentage

    return percentage;
  }

  getSkillMapping() {
    return {
      plumbing: { name: 'Plumbing', icon: '🔧' },
      electrical: { name: 'Electrical', icon: '⚡' },
      painting: { name: 'Painting', icon: '🎨' },
      carpentry: { name: 'Carpentry', icon: '🪚' },
      gardening: { name: 'Gardening', icon: '🌱' },
      cleaning: { name: 'Cleaning', icon: '🧽' },
      appliance: { name: 'Appliance Repair', icon: '🔨' },
      locksmith: { name: 'Locksmith', icon: '🔐' },
      tutoring: { name: 'Tutoring', icon: '📚' },
      beauty: { name: 'Beauty Services', icon: '💅' },
      fitness: { name: 'Fitness Training', icon: '💪' },
      general: { name: 'General Services', icon: '🛠️' },
    };
  }

  /**
   * Mock data for demo purposes
   */
  getMockJobStats(location) {
    return [
      {
        skill: 'plumbing',
        name: 'Plumbing',
        icon: '🔧',
        jobCount: 12,
        avgBudget: 175,
        budgetRange: 'S/150-200',
      },
      {
        skill: 'electrical',
        name: 'Electrical',
        icon: '⚡',
        jobCount: 8,
        avgBudget: 215,
        budgetRange: 'S/180-250',
      },
      {
        skill: 'painting',
        name: 'Painting',
        icon: '🎨',
        jobCount: 15,
        avgBudget: 150,
        budgetRange: 'S/120-180',
      },
      {
        skill: 'carpentry',
        name: 'Carpentry',
        icon: '🪚',
        jobCount: 6,
        avgBudget: 190,
        budgetRange: 'S/160-220',
      },
    ];
  }

  getMockJobs(skill, location) {
    const skillMapping = this.getSkillMapping();
    const skillInfo = skillMapping[skill] || skillMapping.general;

    return [
      {
        id: `mock-${skill}-1`,
        title: `${skillInfo.name} Service Needed`,
        description: `Professional ${skillInfo.name.toLowerCase()} service required. Quality work expected.`,
        budget: 'S/150-200',
        location: location || 'Miraflores',
        postedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        serviceType: skill,
        clientName: 'Maria C.',
        isUrgent: false,
      },
      {
        id: `mock-${skill}-2`,
        title: `Emergency ${skillInfo.name} Repair`,
        description: `Urgent ${skillInfo.name.toLowerCase()} repair needed. Immediate response required.`,
        budget: 'S/120-180',
        location: 'San Isidro',
        postedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        serviceType: skill,
        clientName: 'Carlos R.',
        isUrgent: true,
      },
    ];
  }
}

// Export singleton instance
export const onboardingAPI = new OnboardingAPI();

// Export individual functions for convenience
export const {
  getJobStats,
  getFilteredJobs,
  saveQuickProfile,
  submitJobApplication,
  trackJobView,
  awardCredits,
} = onboardingAPI;
