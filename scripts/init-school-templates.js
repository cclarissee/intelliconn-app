/**
 * One-time script to initialize School of Computer Studies templates in Firestore
 * Run this with: node scripts/init-school-templates.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const DEFAULT_SCHOOL_TEMPLATES = [
  // ============================================
  // ANNOUNCEMENTS (6 templates)
  // ============================================
  {
    id: 'announcement_enrollment',
    name: 'Enrollment Reminder',
    category: 'Announcements',
    subject: 'Enrollment Period',
    content: '📢 Reminder: Enrollment for the upcoming semester is now open! Visit the School of Computer Studies office for registration assistance.\n\n📅 Deadline: [Date]\n📍 Location: SCS Office, [Building]\n\n#SCS #Enrollment #ComputerStudies',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 1,
  },
  {
    id: 'announcement_class_schedule',
    name: 'Class Schedule Release',
    category: 'Announcements',
    subject: 'Schedule Update',
    content: '📋 Class schedules for the [Semester] semester are now available!\n\nStudents can view their schedules through the student portal or visit the SCS office.\n\n🔗 Portal: [Link]\n📍 Office: [Building & Room]\n\n#SCS #ClassSchedule #ComputerStudies',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 2,
  },
  {
    id: 'announcement_exam_schedule',
    name: 'Examination Schedule',
    category: 'Announcements',
    subject: 'Exam Period',
    content: '📚 Midterm/Finals Examination Schedule is now posted!\n\n📅 Exam Period: [Start Date] - [End Date]\n📄 View schedule: [Link/Location]\n\n⚠️ Please review your schedule carefully and report any conflicts immediately.\n\nGood luck, future tech leaders! 💻\n\n#SCS #Exams #StudyHard',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 3,
  },
  {
    id: 'announcement_no_classes',
    name: 'Class Suspension',
    category: 'Announcements',
    subject: 'No Classes',
    content: '⚠️ ANNOUNCEMENT: No classes today, [Date], due to [Reason].\n\n📚 Students are advised to use this time for self-study and project work.\n\n📢 Regular classes will resume on [Date].\n\n#SCS #ClassSuspension #Announcement',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 4,
  },
  {
    id: 'announcement_requirements',
    name: 'Requirements Deadline',
    category: 'Announcements',
    subject: 'Requirements Reminder',
    content: '⏰ Deadline Reminder!\n\n[Requirement Name] must be submitted by:\n📅 [Date]\n📍 [Submission Location/Method]\n\n⚠️ Late submissions will not be accepted.\n\nFor questions, contact: [Email/Office]\n\n#SCS #Deadline #Requirements',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 5,
  },
  {
    id: 'announcement_facility_maintenance',
    name: 'Facility Maintenance',
    category: 'Announcements',
    subject: 'Maintenance Notice',
    content: '🔧 Facility Maintenance Notice\n\nThe [Computer Lab/Room Name] will be temporarily unavailable for maintenance:\n\n📅 Date: [Start] to [End]\n🕐 Time: [Time Range]\n\nClasses scheduled in this area will be relocated to [Alternative Location].\n\nThank you for your understanding!\n\n#SCS #Maintenance #Announcement',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 6,
  },

  // ============================================
  // EVENTS (7 templates)
  // ============================================
  {
    id: 'event_seminar',
    name: 'Tech Seminar Announcement',
    category: 'Events',
    subject: 'Upcoming Seminar',
    content: '🎯 Join us for an exciting seminar!\n\n📢 Topic: "[Seminar Title]"\n👤 Speaker: [Speaker Name & Title]\n📅 Date: [Date]\n🕐 Time: [Time]\n📍 Venue: [Location]\n\nOpen to all SCS students! Don\'t miss this opportunity to learn from industry experts! 💻\n\nRegister: [Link]\n\n#SCS #TechSeminar #Learning',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 7,
  },
  {
    id: 'event_workshop',
    name: 'Coding Workshop',
    category: 'Events',
    subject: 'Workshop Invitation',
    content: '💻 Coding Workshop Alert!\n\nEnhance your skills in [Technology/Language]!\n\n📋 Workshop: "[Title]"\n👨‍🏫 Facilitator: [Name]\n📅 Date: [Date]\n🕐 Time: [Start] - [End]\n📍 Venue: [Room/Lab]\n\nLimited slots available! Register now: [Link]\n\n#SCS #Workshop #Coding #TechSkills',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 8,
  },
  {
    id: 'event_hackathon',
    name: 'Hackathon Announcement',
    category: 'Events',
    subject: 'Hackathon',
    content: '🚀 SCS HACKATHON [Year]!\n\nAre you ready to code, innovate, and compete? 💻\n\n🏆 Theme: [Theme]\n📅 Date: [Date]\n⏰ Duration: [Hours] hours\n📍 Venue: [Location]\n💰 Prizes: [Prize Details]\n\n👥 Form teams of [Number] and register now!\n🔗 [Registration Link]\n\n#SCSHackathon #Coding #Innovation #TechCompetition',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 9,
  },
  {
    id: 'event_job_fair',
    name: 'Career Fair Announcement',
    category: 'Events',
    subject: 'Job Fair',
    content: '💼 SCS CAREER FAIR [Year]\n\nConnect with top tech companies looking for talented graduates!\n\n📅 Date: [Date]\n🕐 Time: [Start] - [End]\n📍 Venue: [Location]\n\n🏢 Participating Companies:\n• [Company 1]\n• [Company 2]\n• [Company 3]\n• And more!\n\nBring your resume and dress professionally! 👔\n\n#SCS #CareerFair #TechJobs #Opportunities',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 10,
  },
  {
    id: 'event_orientation',
    name: 'Student Orientation',
    category: 'Events',
    subject: 'Orientation Program',
    content: '🎓 Welcome to the School of Computer Studies!\n\nNew students are invited to our Orientation Program:\n\n📅 Date: [Date]\n🕐 Time: [Start Time]\n📍 Venue: [Location]\n\n📋 Agenda:\n• Campus Tour\n• Program Overview\n• Meet Your Faculty\n• Student Handbook\n• Q&A Session\n\nSee you there! 🎉\n\n#SCS #Orientation #WelcomeStudents #ComputerStudies',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 11,
  },
  {
    id: 'event_competition',
    name: 'Programming Competition',
    category: 'Events',
    subject: 'Coding Competition',
    content: '🏆 PROGRAMMING COMPETITION!\n\nTest your coding skills and compete for amazing prizes!\n\n💻 Competition: [Name]\n📅 Date: [Date]\n⏰ Time: [Start] - [End]\n📍 Venue: [Location]\n\n🎯 Categories:\n• [Category 1]\n• [Category 2]\n• [Category 3]\n\n🏅 Prizes worth [Amount]!\n\nRegister now: [Link]\n\n#SCS #ProgrammingCompetition #CodeChallenge',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 12,
  },
  {
    id: 'event_tech_talk',
    name: 'Industry Tech Talk',
    category: 'Events',
    subject: 'Tech Talk Series',
    content: '🎤 SCS TECH TALK SERIES\n\nLearn from industry professionals!\n\n📢 "[Talk Title]"\n👤 Speaker: [Name], [Position] at [Company]\n📅 Date: [Date]\n🕐 Time: [Time]\n📍 Venue: [Location]\n\n✨ Topics:\n• [Topic 1]\n• [Topic 2]\n• [Topic 3]\n\nFree admission for all SCS students!\n\n#SCS #TechTalk #IndustryExperts #CareerDevelopment',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 13,
  },

  // ============================================
  // ACHIEVEMENTS (5 templates)
  // ============================================
  {
    id: 'achievement_competition_win',
    name: 'Competition Victory',
    category: 'Achievements',
    subject: 'Competition Win',
    content: '🏆 PROUD MOMENT FOR SCS!\n\nCongratulations to our students for winning [Position] place in [Competition Name]!\n\n⭐ Team/Student: [Names]\n🎯 Competition: [Name]\n📅 Date: [Date]\n\nYour dedication and hard work made us proud! 🎉\n\nKeep inspiring future tech leaders! 💻\n\n#SCS #Achievement #ProudMoment #Excellence',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 14,
  },
  {
    id: 'achievement_certification',
    name: 'Certification Achievement',
    category: 'Achievements',
    subject: 'Professional Certification',
    content: '🎓 EXCELLENCE IN CERTIFICATION!\n\nCongratulations to [Student Name(s)] for earning:\n\n✅ [Certification Name]\n🏢 Issued by: [Certifying Body]\n📅 Achieved: [Date]\n\nThis achievement demonstrates exceptional dedication to professional growth! 💯\n\n#SCS #Certification #ProfessionalDevelopment #Success',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 15,
  },
  {
    id: 'achievement_research',
    name: 'Research Publication',
    category: 'Achievements',
    subject: 'Research Success',
    content: '📚 RESEARCH MILESTONE!\n\nProud to announce that our faculty/students have published their research:\n\n📄 Title: "[Research Title]"\n✍️ Authors: [Names]\n📰 Published in: [Journal/Conference]\n📅 Date: [Publication Date]\n\nContributing to the advancement of technology! 🚀\n\n#SCS #Research #AcademicExcellence #Innovation',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 16,
  },
  {
    id: 'achievement_project',
    name: 'Outstanding Project',
    category: 'Achievements',
    subject: 'Project Recognition',
    content: '💡 INNOVATION SPOTLIGHT!\n\nCongratulations to our students for their outstanding capstone project:\n\n🚀 Project: "[Project Name]"\n👥 Team: [Student Names]\n🎯 Impact: [Brief Description]\n📅 Presented: [Date]\n\nYour creativity and technical skills are truly impressive! 🌟\n\n#SCS #CapstoneProject #Innovation #StudentSuccess',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 17,
  },
  {
    id: 'achievement_accreditation',
    name: 'Accreditation Success',
    category: 'Achievements',
    subject: 'Accreditation',
    content: '🌟 MILESTONE ACHIEVEMENT!\n\nThe School of Computer Studies has been awarded [Accreditation Level] by [Accrediting Body]!\n\n✅ Level: [Level/Status]\n📅 Valid until: [Date]\n\nThis recognition reflects our commitment to quality education and continuous improvement! 🎓\n\nThank you to our dedicated faculty, staff, and students! 🙌\n\n#SCS #Accreditation #QualityEducation #Excellence',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 18,
  },

  // ============================================
  // NEWS (5 templates)
  // ============================================
  {
    id: 'news_faculty_addition',
    name: 'New Faculty Member',
    category: 'News',
    subject: 'Faculty Update',
    content: '👨‍🏫 WELCOMING NEW FACULTY!\n\nPlease join us in welcoming [Name] to the School of Computer Studies!\n\n📚 Position: [Position/Title]\n🎓 Expertise: [Specialization]\n💼 Background: [Brief Background]\n\n[He/She] will be teaching [Courses] this semester.\n\nWelcome to the SCS family! 🎉\n\n#SCS #NewFaculty #Welcome #Education',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 19,
  },
  {
    id: 'news_facility_upgrade',
    name: 'Facility Upgrade',
    category: 'News',
    subject: 'Infrastructure Update',
    content: '🖥️ EXCITING UPGRADE!\n\nThe School of Computer Studies is upgrading our facilities!\n\n✨ New Features:\n• [Upgrade 1]\n• [Upgrade 2]\n• [Upgrade 3]\n\n📅 Available: [Date]\n📍 Location: [Building/Lab]\n\nEnhancing your learning experience with state-of-the-art technology! 💻\n\n#SCS #FacilityUpgrade #Technology #Education',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 20,
  },
  {
    id: 'news_partnership',
    name: 'Industry Partnership',
    category: 'News',
    subject: 'Partnership Announcement',
    content: '🤝 NEW PARTNERSHIP!\n\nThe School of Computer Studies is proud to announce our partnership with [Company Name]!\n\n💼 Collaboration includes:\n• [Benefit 1]\n• [Benefit 2]\n• [Benefit 3]\n\nThis partnership opens new opportunities for our students in:\n🎯 [Opportunity 1]\n🎯 [Opportunity 2]\n\n#SCS #Partnership #IndustryCollaboration #Opportunities',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 21,
  },
  {
    id: 'news_program_launch',
    name: 'New Program Launch',
    category: 'News',
    subject: 'Program Announcement',
    content: '🚀 INTRODUCING NEW PROGRAM!\n\nThe School of Computer Studies is launching a new program:\n\n📚 Program: [Program Name]\n🎯 Focus: [Specialization]\n📅 Starting: [Semester/Year]\n\n✨ Highlights:\n• [Feature 1]\n• [Feature 2]\n• [Feature 3]\n\nApplications open: [Date]\nMore info: [Link/Contact]\n\n#SCS #NewProgram #Education #TechCareers',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 22,
  },
  {
    id: 'news_alumni_success',
    name: 'Alumni Success Story',
    category: 'News',
    subject: 'Alumni Spotlight',
    content: '⭐ ALUMNI SPOTLIGHT!\n\nProud to share the success of our alumnus/alumna [Name]!\n\n🎓 Graduated: [Year]\n💼 Currently: [Position] at [Company]\n🏆 Achievement: [Recent Achievement]\n\n[He/She] continues to make the SCS community proud! 🌟\n\n"[Inspirational Quote or Message]"\n\n#SCS #AlumniSuccess #Inspiration #ProudMoment',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 23,
  },

  // ============================================
  // PROMOTIONAL (7 templates)
  // ============================================
  {
    id: 'promo_open_house',
    name: 'Open House Invitation',
    category: 'Promotional',
    subject: 'Open House',
    content: '🎉 SCS OPEN HOUSE!\n\nDiscover your future in technology! Join us for an exciting open house!\n\n📅 Date: [Date]\n🕐 Time: [Start] - [End]\n📍 Location: [Building/Campus]\n\n✨ Experience:\n• Campus tour\n• Meet faculty & students\n• See our labs & facilities\n• Learn about programs\n• Q&A session\n\nFREE admission! Bring your family!\n\n#SCS #OpenHouse #FutureTechLeaders #Admissions',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 24,
  },
  {
    id: 'promo_scholarship',
    name: 'Scholarship Opportunity',
    category: 'Promotional',
    subject: 'Scholarship Program',
    content: '🎓 SCHOLARSHIP OPPORTUNITY!\n\nThe School of Computer Studies is offering scholarships for qualified students!\n\n💰 Scholarship: [Name]\n📊 Coverage: [Details]\n🎯 Available slots: [Number]\n\n✅ Qualifications:\n• [Requirement 1]\n• [Requirement 2]\n• [Requirement 3]\n\n📅 Application deadline: [Date]\n🔗 Apply: [Link]\n\nDon\'t miss this chance! 🌟\n\n#SCS #Scholarship #Education #Opportunity',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 25,
  },
  {
    id: 'promo_program_benefits',
    name: 'Program Benefits Highlight',
    category: 'Promotional',
    subject: 'Why Choose SCS',
    content: '💻 Why Choose SCS?\n\nTransform your passion for technology into a rewarding career!\n\n✨ What makes us different:\n🎯 Industry-aligned curriculum\n👨‍🏫 Expert faculty members\n🖥️ State-of-the-art facilities\n💼 Industry partnerships\n🌍 Global opportunities\n🏆 Award-winning programs\n\nStart your tech journey with us! 🚀\n\nVisit: [Link]\n\n#SCS #ComputerStudies #TechEducation #FutureReady',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 26,
  },
  {
    id: 'promo_admission',
    name: 'Admission Campaign',
    category: 'Promotional',
    subject: 'Now Accepting Applications',
    content: '📢 ADMISSIONS NOW OPEN!\n\nSchool of Computer Studies - [Academic Year]\n\n🎓 Programs Available:\n• [Program 1]\n• [Program 2]\n• [Program 3]\n• [Program 4]\n\n📅 Application Period: [Start] - [End]\n📋 Requirements: [Link]\n💻 Apply online: [Application Link]\n\nStart your tech journey today! 🚀\n\nFor inquiries:\n📧 [Email]\n📞 [Phone]\n\n#SCS #Admissions #EnrollNow #TechEducation',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 27,
  },
  {
    id: 'promo_free_training',
    name: 'Free Training Program',
    category: 'Promotional',
    subject: 'Free Training Offer',
    content: '🎁 FREE TRAINING PROGRAM!\n\nThe School of Computer Studies invites you to join our FREE training:\n\n📚 Course: [Course Name]\n⏱️ Duration: [Duration]\n📅 Schedule: [Dates/Times]\n📍 Venue: [Location]\n\n✅ Who can join:\n• [Eligibility 1]\n• [Eligibility 2]\n\n🎯 What you\'ll learn:\n• [Skill 1]\n• [Skill 2]\n• [Skill 3]\n\n📝 Register: [Link]\nLimited slots! First come, first served!\n\n#SCS #FreeTraining #TechSkills #Learning',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 28,
  },
  {
    id: 'promo_certification_program',
    name: 'Certification Program Promo',
    category: 'Promotional',
    subject: 'Certification Offering',
    content: '🎓 PROFESSIONAL CERTIFICATION PROGRAM!\n\nGet certified and boost your career! SCS offers:\n\n✅ [Certification Name]\n📚 Includes:\n• [Module 1]\n• [Module 2]\n• [Module 3]\n• Industry-recognized certificate\n\n👨‍🏫 Taught by: [Instructor background]\n📅 Next batch: [Date]\n💰 Fee: [Amount]\n\n🎯 Early bird discount until [Date]!\n\nEnroll now: [Link]\n\n#SCS #Certification #ProfessionalDevelopment #SkillUp',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 29,
  },
  {
    id: 'promo_facilities_tour',
    name: 'Virtual Facilities Tour',
    category: 'Promotional',
    subject: 'Campus Tour',
    content: '🎥 VIRTUAL CAMPUS TOUR!\n\nCan\'t visit in person? Take a virtual tour of our world-class facilities! 💻\n\n✨ Explore:\n🖥️ Computer laboratories\n🔬 Innovation labs\n📚 Tech library\n🎯 Student lounges\n🏢 Smart classrooms\n\nSee where innovation happens! 🚀\n\n🔗 Watch tour: [Link]\n📍 Schedule in-person visit: [Link]\n\n#SCS #CampusTour #TechFacilities #StudentLife',
    platform: ['Twitter', 'Facebook', 'Instagram'],
    isSchoolTemplate: true,
    schoolDepartment: 'School of Computer Studies',
    order: 30,
  },
];

async function initializeSchoolTemplates() {
  try {
    console.log('[School Templates] Starting initialization...');

    const collection = db.collection('schoolTemplates');
    const existingDocs = await collection.get();

    if (!existingDocs.empty) {
      console.warn(
        '[School Templates] Templates already exist in database. Skipping initialization.'
      );
      process.exit(0);
    }

    const batch = db.batch();

    for (const template of DEFAULT_SCHOOL_TEMPLATES) {
      const docRef = collection.doc(template.id);
      batch.set(docRef, {
        ...template,
        createdAt: new Date(),
      });
    }

    await batch.commit();

    console.log(
      `[School Templates] ✅ Successfully initialized ${DEFAULT_SCHOOL_TEMPLATES.length} templates`
    );
    console.log('\n[School Templates] Template Summary:');
    console.log('  • Announcements: 6 templates');
    console.log('  • Events: 7 templates');
    console.log('  • Achievements: 5 templates');
    console.log('  • News: 5 templates');
    console.log('  • Promotional: 7 templates');
    console.log('\nAll templates are ready for the School of Computer Studies!');
    process.exit(0);
  } catch (error) {
    console.error('[School Templates] ❌ Error initializing templates:', error);
    process.exit(1);
  }
}

initializeSchoolTemplates();
