import CreatePost from '@/components/CreatePost';
import FloatingHeader from '@/components/FloatingHeader';
import CreateTemplate from '@/components/ui/CreateTemplate';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { db } from '@/firebase';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { Plus } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Animated, FlatList,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';

/* =======================
   EMOJI CATEGORIES
======================= */
const categories = [
  { id: 'all', label: 'All', emoji: '📋', color: '#9CA3AF' },

  { id: 'events', label: 'Events', emoji: '📅', color: '#22C55E' },
  { id: 'announcements', label: 'Announcements', emoji: '📣', color: '#3B82F6' },
  { id: 'academics', label: 'Academics', emoji: '📚', color: 'rgb(59,130,246)' },
  { id: 'achievements', label: 'Achievements', emoji: '🏆', color: '#EAB308' },
  { id: 'admissions', label: 'Admissions', emoji: '🎓', color: '#A855F7' },
  { id: 'community', label: 'Community', emoji: '🤝', color: '#EC4899' },
  { id: 'sports', label: 'Sports', emoji: '🏀', color: '#F97316' },
];


/* =======================
   TYPES
======================= */
interface Template {
  id: string;
  name: string;
  category: string;
  content: string;
  platform: string[];
  public: boolean;
  userId: string;
  createdAt: Date;
}

/* =======================
   SYSTEM TEMPLATES
======================= */
const baseTemplates = [

  
  /* =========================
     📅 EVENTS (5) – GREEN
  ========================= */

  {
    id: 'e1',
    name: '📅 Birthday Celebration',
    category: 'events',
    content: "🎉 Let's come together to celebrate {NAME}'s special day! {NAME} has been an inspiring part of our {DEPARTMENT} family, always sharing creativity, passion, and kindness with everyone. May your birthday be filled with laughter, good memories, and all the happiness you deserve! 💫 Let's make this day truly unforgettable! #HappyBirthday  #Celebrate #JouyfulMoments"  },
  {
    id: 'e2',
    name: '📅 School Anniversary',
    category: 'events',
    content:
"🎊 Celebrating {YEARS} years of excellence! Today we commemorate the founding of {SCHOOL_NAME}, a journey filled with remarkable achievements, outstanding students, and dedicated educators. {ACHIEVEMENT_HIGHLIGHTS} Thank you to everyone who has been part of our legacy. Here's to many more years of academic excellence, innovation, and community building! Join us in celebrating this milestone! 🏫✨ #SchoolAnniversary #ProudHistory #Excellence"  },
  {
    id: 'e3',
    name: '📅 Foundation Day',
    category: 'events',
    content:
"🏫 Happy Foundation Day! Today marks another year since {SCHOOL_NAME} opened its doors to inspire minds and shape futures. {HISTORY_HIGHLIGHT} We honor our founders' vision and celebrate the countless students, teachers, and staff who have made our school the amazing place it is today. {EVENT_DETAILS} Let's continue building on this proud tradition of academic excellence! 🌟 #FoundationDay #Collaborate #GreatStories #HaveFun"  },
  {
    id: 'e4',
    name: '📅 Holiday Celebration',
    category: 'events',
    content:
"🎄 Warmest {HOLIDAY} wishes from {SCHOOL_NAME}! As we celebrate this special season, we want to thank our amazing students, dedicated teachers, supportive parents, and entire school community. {HOLIDAY_MESSAGE} May this holiday bring you joy, peace, and quality time with loved ones. See you all next year! ✨ #HappyHolidays #ValueofTogetherness #SchoolCommunity #SeasonsOfJoy"  },
  {
    id: 'e5',
    name: '📅 Graduation Ceremony',
    category: 'events',
    content:"🎓 Congratulations to the Class of {YEAR}! Today we celebrate the achievements of our graduates as they embark on their next journey. {GRADUATION_MESSAGE} Your hard work, dedication, and perseverance have brought you to this momentous occasion. {SPEAKER_HIGHLIGHT} We are proud of everything you have accomplished and excited to see the amazing things you will do! Best wishes from all of us at {SCHOOL_NAME}! 🌟 #Graduation #ClassOf{YEAR} #ProudGraduates"  },

  /* =========================
     📣 ANNOUNCEMENTS (5) – BLUE 500
  ========================= */

  {
    id: 'a1',
    name: '📣 General Announcement',
    category: 'announcements',
    content:
      "📢 Important Announcement: {DETAILS}. Please take note of the updated information and stay informed through our official communication channels. Thank you for your cooperation! #Announcement #BeInformed #Attention",
  },
  {
    id: 'a2',
    name: '📣 Class Suspension Notice',
    category: 'announcements',
    content:"⚠️ Class Suspension Notice: Due to {REASON}, classes are suspended on {DATE}. {ADDITIONAL_DETAILS} Students and parents, please stay safe. Alternative learning arrangements: {ARRANGEMENTS} For updates, monitor our official channels. Stay informed and take care! 🏫 #ClassSuspension #SchoolUpdate #SafetyFirst"  },
  {
    id: 'a3',
    name: '📣 Schedule Update',
    category: 'announcements',
    content:
      "📅 Please be informed of changes in our school schedule effective {DATE}. Kindly adjust your activities accordingly. For questions, contact {CONTACT_PERSON}. #ScheduleUpdate",
  },
  {
    id: 'a4',
    name: '📣 Policy Update',
    category: 'announcements',
    content:
      "📋 We have updated our {POLICY_NAME} policy effective {DATE}. These changes are implemented to ensure better compliance and safety within our institution. Key changes include: {CHANGES_LIST} {REASON_FOR_UPDATE} For full details, please review {DOCUMENT_LINK}. Questions? Contact {CONTACT_INFO}. #PolicyUpdate",
  },
  {
    id: 'a5',
    name: '📣 Facility Maintenance',
    category: 'announcements',
    content:
      "🏗️ Ongoing maintenance at {FACILITY_NAME}. Some areas may have limited access from {DATE}. Thank you for your patience as we improve our campus facilities.  Expected completion: {DATE}. {IMPACT_ON_OPERATIONS} This enhancement will provide better {BENEFITS} for our students and staff. Thank you for your patience and understanding! #SchoolImprovement #FacilityUpdate",
  },

  /* =========================
     📚 ACADEMICS (5) – RGB 59,130,246
  ========================= */

  {
    id: 'ac1',
    name: '📚 Exam Schedule',
    category: 'academics',
    content:
      "📚 Exams will be conducted from {START_DATE} to {END_DATE}. Please review the complete exam schedule and prepare accordingly. Best of luck to all students! #ExamSeason",
  },
  {
    id: 'ac2',
    name: '📚 Academic Excellence',
    category: 'academics',
    content: "🌟 Academic Excellence Spotlight! We're proud to announce that {STUDENT_NAME} from {GRADE_LEVEL} has achieved {ACHIEVEMENT}! {ACHIEVEMENT_DETAILS} This outstanding performance demonstrates dedication, hard work, and a commitment to learning. {ADDITIONAL_RECOGNITION} Keep inspiring others with your academic excellence! Congratulations! 📖✨ #AcademicAchievement #Excellence #ProudMoment"  },
  {
    id: 'ac3',
    name: '📚 New Semester Announcement',
    category: 'academics',
    content: "📆 {SEMESTER} Semester Schedule Now Available! The academic calendar for {SEMESTER} is here: {SCHEDULE_HIGHLIGHTS} Important dates: {KEY_DATES} {ENROLLMENT_INFO} Please mark your calendars and plan accordingly. {ADDITIONAL_NOTES} Let's make this semester our best yet! For the complete calendar, visit {LINK}. #NewSemester #AcademicCalendar"  },
  {
    id: 'ac4',
    name: '📚 Parent-Teacher Meeting',
    category: 'academics',
    content:
      "👥 Parent-Teacher Conference Reminder: Join us on {DATE} from {TIME} for meaningful discussions about your child's academic progress. {CONFERENCE_DETAILS} Topics to cover: {TOPICS_LIST} {REGISTRATION_INFO} Your participation is valuable in supporting your child's education. {ADDITIONAL_NOTES} See you there! 📋 #ParentTeacherConference #AcademicProgress #Partnership",
  },
  {
    id: 'ac5',
    name: '📚 Honor Roll Announcement',
    category: 'academics',
    content:
      "🏆 Congratulations to our Honor Roll students for {PERIOD}! These exceptional students have demonstrated outstanding academic performance: {HONOR_ROLL_LIST} {RECOGNITION_CRITERIA} Your dedication to excellence inspires the entire school community. {SPECIAL_RECOGNITION} Keep up the excellent work! Parents and students, you should be incredibly proud! 🌟 #HonorRoll #AcademicExcellence #ProudStudents",
  },

  /* =========================
     🏆 ACHIEVEMENTS (4) – YELLOW 500
  ========================= */

  {
    id: 'ach1',
    name: '🏆 Student Award',
    category: 'achievements',
    content:
      "🏅 Student Award Recognition! Please join us in celebrating {STUDENT_NAME} who has been awarded {AWARD_NAME}! This prestigious recognition honors {ACHIEVEMENT_DESCRIPTION}. {STUDENT_NAME}'s exceptional {QUALITIES} have made a significant impact on our school community. {AWARD_DETAILS} Your dedication and talent inspire everyone around you. Congratulations on this well-deserved honor! We can't wait to see what you accomplish next! 🌟 #StudentAward #Excellence",
  },
  {
    id: 'ach2',
    name: '🏆 Competition Victory',
    category: 'achievements',
    content:
      "🥇 Competition Champions! Our {TEAM_NAME} has won {COMPETITION_NAME}! {VICTORY_DETAILS} Competing against {NUMBER} schools, our talented students showcased {SKILLS_DEMONSTRATED}. {HIGHLIGHTS} Special recognition to {COACHES_NAMES} for their guidance. This victory represents months of hard work and dedication. Congratulations to all participants! 🎉 #CompetitionWin #Champions #SchoolPride",
  },
  {
    id: 'ach3',
    name: '🏆 Teacher Recognition',
    category: 'achievements',
    content:
      "👏 Teacher Appreciation Spotlight: Today we honor {TEACHER_NAME}, {SUBJECT} teacher, who has been recognized with {AWARD_NAME}! {RECOGNITION_DETAILS} {TEACHER_NAME}'s dedication to student success, innovative teaching methods, and passion for education make a real difference every day. {IMPACT_DESCRIPTION} Thank you for inspiring minds and shaping futures! We're fortunate to have you! 🍎 #TeacherAppreciation #EducatorExcellence",
  },
  {
    id: 'ach4',
    name: '🏆 School Milestone',
    category: 'achievements',
    content:
      "🎯 Major School Milestone Achieved! We're thrilled to announce that {SCHOOL_NAME} has reached {MILESTONE}! {MILESTONE_DETAILS} This achievement reflects the hard work of our students, dedication of our teachers, and support of our community. {SIGNIFICANCE} {CELEBRATION_PLANS} Thank you to everyone who contributed to this success. Here's to continued growth and excellence! 🌟 #SchoolMilestone #Achievement #CommunitySuccess",
  },

  /* =========================
     🎓 ADMISSIONS (4) – PURPLE 500
  ========================= */

  {
    id: 'ad1',
    name: '🎓 Enrollment Open',
    category: 'admissions',
    content:
      "📝 Enrollment Now Open for {SCHOOL_YEAR}! We are excited to welcome new students to our {SCHOOL_NAME} family! Applications are being accepted from {START_DATE} to {END_DATE} for {GRADE_LEVELS}. {ENROLLMENT_DETAILS} Join a community where academic excellence meets character development, where every child's potential is nurtured. Limited slots available! {APPLICATION_PROCESS} Secure your child's future with quality education. Enroll today! 🎒 #EnrollmentOpen #QualityEducation #JoinUs",
  },
  {
    id: 'ad2',
    name: '🎓 Scholarship Program',
    category: 'admissions',
    content:
      "💰 Scholarship Opportunities Available! {SCHOOL_NAME} is proud to offer {SCHOLARSHIP_NAME} for {SCHOOL_YEAR}. {SCHOLARSHIP_DETAILS} Eligibility: {CRITERIA} Award amount: {AMOUNT} Application deadline: {DEADLINE} {APPLICATION_PROCESS} We believe every deserving student should have access to quality education. {ADDITIONAL_INFO} Don't miss this opportunity! Apply now! 📚 #Scholarship #EducationOpportunity #FinancialAid",
  },
  {
    id: 'ad3',
    name: '🎓 Campus Tour',
    category: 'admissions',
    content:
      "🚶 Campus Tour Invitation! Experience {SCHOOL_NAME} firsthand with our guided campus tours! {TOUR_DETAILS} Schedule: {AVAILABLE_TIMES} See our {FACILITIES_LIST} Meet students and faculty, and get answers to all your questions! {REGISTRATION_INFO} Discover why {SCHOOL_NAME} is the perfect place for your child to learn and grow. {SPECIAL_FEATURES} Book your tour today! 🏫 #CampusTour #VisitUs #DiscoverOurSchool",
  },
  {
    id: 'ad4',
    name: '🎓 Admission Reminder',
    category: 'admissions',
    content:
      "⏰ Reminder: Submit your admission requirements before {DEADLINE}. We look forward to welcoming you! #Admissions",
  },

  /* =========================
     🤝 COMMUNITY (4) – PINK 500
  ========================= */

  {
    id: 'c1',
    name: '🤝 Community Service',
    category: 'community',
    content:
      "🤝 Community Service Initiative: Our students are making a difference! {PROJECT_DESCRIPTION} On {DATE}, our {DEPARTMENT} students participated in {COMMUNITY_SERVICE_ACTIVITY} benefiting {BENEFICIARIES}. {IMPACT_DETAILS} Through this initiative, our students learned valuable lessons about compassion, leadership, and civic responsibility. We believe in nurturing not just academic excellence, but also character and social consciousness. Thank you to all participants and supporters! 💙 #CommunityService #MakingADifference #ServiceLearning",
  },
  {
    id: 'c2',
    name: '🤝 Partnership Announcement',
    category: 'community',
    content:
      "🤝 Exciting Partnership News! {SCHOOL_NAME} is proud to announce our collaboration with {PARTNER_NAME}! {PARTNERSHIP_DETAILS} This partnership will provide {BENEFITS_TO_STUDENTS} including {OPPORTUNITIES_LIST}. {PARTNERSHIP_GOALS} Together, we're creating more opportunities for our students to excel. {LAUNCH_DETAILS} Thank you {PARTNER_NAME} for believing in our students' potential! 🌟 #Partnership #Collaboration #EducationExcellence",
  },
  {
    id: 'c3',
    name: '🤝 Alumni Spotlight',
    category: 'community',
    content:
      "⭐ Alumni Success Story! Meet {ALUMNI_NAME}, Class of {YEAR}, now {CURRENT_POSITION}! {ALUMNI_JOURNEY} During their time at {SCHOOL_NAME}, {HIGHLIGHTS_AT_SCHOOL} Today, {CURRENT_ACHIEVEMENTS} {ALUMNI_MESSAGE} Your success inspires current students to dream big and work hard. {SCHOOL_PRIDE_MESSAGE} Proud of you, {ALUMNI_NAME}! 🎓 #AlumniSpotlight #SuccessStory #ProudAlumni",
  },
  {
    id: 'c4',
    name: '🤝 Volunteer Opportunity',
    category: 'community',
    content:
      "🙋 Volunteer Opportunity! {SCHOOL_NAME} needs YOUR help! We're looking for volunteers for {VOLUNTEER_ACTIVITY} on {DATE}. {ACTIVITY_DETAILS} No experience necessary - just bring your enthusiasm and willingness to help! {VOLUNTEER_BENEFITS} {REGISTRATION_INFO} Your time and effort make a real difference in our students' lives. Join our community of dedicated volunteers! 💪 #Volunteer #CommunitySupport #GetInvolved",
  },

  /* =========================
     🏀 SPORTS (4) – ORANGE 500
  ========================= */

  {
    id: 's1',
    name: '🏀 Game Announcement',
    category: 'sports',
    content:
      "🏀 Game Day! Come support our {TEAM_NAME} as they take on {OPPONENT} on {DATE} at {TIME}! The game will be held at {LOCATION}. {GAME_DETAILS} Let's pack the stands and show our school spirit! Wear your {SCHOOL_COLORS} and bring your energy! {TICKET_INFO} Your support means everything to our athletes. Let's make some noise and cheer our team to victory! See you there! 📣 #GameDay #SchoolSpirit #GoTeam",
  },
  {
    id: 's2',
    name: '🏀 Championship Win',
    category: 'sports',
    content:
      "Win🎉 Game Recap: What a game! Our {TEAM_NAME} {RESULT} against {OPPONENT} with a final score of {SCORE}! {GAME_HIGHLIGHTS} Star performers: {PLAYER_HIGHLIGHTS} {COACH_QUOTE} Thank you to everyone who came out to support! {NEXT_GAME_INFO} Let's keep this momentum going! 💪 #GameRecap #TeamVictory #AthleticPride",
  },
  {
    id: 's3',
    name: '🏀 Season Opening',
    category: 'sports',
    content:
      "⚽ The {SPORT} season officially begins! Check the schedule and support our players. #NewSeason",
  },
  {
    id: 's4',
    name: '🏀 Season Announcement',
    category: 'sports',
    content:
      "⚽ {SPORT} Season Kicks Off! Get ready for an exciting {SPORT} season! {SEASON_DETAILS} Our {TEAM_NAME} is ready to compete! Schedule highlights: {GAME_SCHEDULE} Home games at {VENUE}. {TEAM_INFO} Come support our athletes as they represent {SCHOOL_NAME} with pride and sportsmanship! {SEASON_GOALS} Let's make this our best season yet! 🏅 #NewSeason #{SPORT} #GoTeam",
  },
];

const defaultTemplates: Template[] = baseTemplates.map(t => ({
  ...t,
  platform: [],
  public: true,
  userId: 'system',
  createdAt: new Date(),
}));


/* =======================
   COMPONENT
======================= */
export default function TemplateScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [postTemplate, setPostTemplate] = useState<Template | null>(null);
  const getCount = (id: string) => {
  if (id === 'all') return templates.length;
  return templates.filter(t => t.category === id).length;
};

const getCategory = (id: string) =>
  categories.find(c => c.id === id);

  /* =======================
     FETCH
  ======================= */
  const fetchTemplates = useCallback(async () => {
    if (!user) {
      setTemplates(defaultTemplates);
      return;
    }

    try {
      const q = query(
        collection(db, 'templates'),
        where('userId', '==', user.uid)
      );

      const snap = await getDocs(q);
      const userTemplates: Template[] = [];

      snap.forEach(docSnap => {
        const data = docSnap.data();
        userTemplates.push({
          id: docSnap.id,
          name: data.name,
          category: data.category,
          content: data.content,
          platform: data.platform || [],
          public: data.public,
          userId: data.userId,
          createdAt: data.createdAt.toDate(),
        });
      });

      setTemplates([...defaultTemplates, ...userTemplates]);
    } catch {
      setTemplates(defaultTemplates);
    }
  }, [user]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  /* =======================
     FILTER
  ======================= */
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
const filteredTemplates =
  templates
    .filter(t =>
      selectedCategory === 'all'
        ? true
        : t.category === selectedCategory
    )
    .filter(t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
      const handleCopy = async (content: string) => {
  await Clipboard.setStringAsync(content);
  Alert.alert('Copied!', 'Template content copied to clipboard.');
};

const [showSuccess, setShowSuccess] = useState(false);
const showSuccessMessage = () => {
  setShowSuccess(true);

  Animated.timing(fadeAnim, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }).start();

  setTimeout(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setShowSuccess(false);
    });
  }, 4000);
};

const fadeAnim = useState(new Animated.Value(0))[0];

const handleDelete = async (template: Template) => {
  if (template.userId === 'system') {
    Alert.alert('Not allowed', 'System templates cannot be deleted.');
    return;
  }

  Alert.alert(
    'Delete Template',
    'Are you sure you want to delete this template?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, 'templates', template.id));
            fetchTemplates();
            showSuccessMessage();
          } catch {
            Alert.alert('Error', 'Failed to delete template.');
          }
        },
      },
    ]
  );
};


  /* =======================
     RENDER CARD
  ======================= */
const renderItem = ({ item }: { item: Template }) => {
  const cat = getCategory(item.category);
  
  const isSystem = item.userId === 'system';

  return (
    <View style={styles.cardWrapper}>
      <View
        style={[
          styles.card,
          { backgroundColor: isDark ? '#1E293B' : '#fff' },
        ]}
      >
        {/* HEADER */}
        <View
          style={[
            styles.cardHeader,
            { backgroundColor: cat?.color || '#6B7280' },
          ]}
        >
           <View>
    {/* Category Label */}
    <Text style={styles.cardHeaderText}>
      {cat?.label}
    </Text>

    {/* Template Name UNDER category */}
    <Text style={styles.cardHeaderName}>
      {item.name}
    </Text>
  </View>

          {isSystem && (
            <View style={styles.systemBadge}>
              <Text style={styles.systemBadgeText}> 📖</Text>
            </View>
          )}
        </View>


{/* SCROLLABLE CONTENT ONLY */}
<View style={styles.scrollContainer}>
  <ScrollView
    nestedScrollEnabled
    showsVerticalScrollIndicator
  >
    <Text
      style={[
        styles.cardContent,
        { color: isDark ? '#CBD5E1' : '#6B7280' },
      ]}
    >
      {item.content}
    </Text>
  </ScrollView>
</View>

<View style={styles.actionRow}>
  {/* USE TEMPLATE */}
  <TouchableOpacity
    style={[
      styles.useButton,
      { backgroundColor: cat?.color || '#111827' }
    ]}
    onPress={() => {
      setPostTemplate(item);
      setShowCreatePostModal(true);
    }}
  >
    <Text style={styles.useButtonText}>Use Template</Text>
  </TouchableOpacity>

  {/* COPY ICON */}
  <TouchableOpacity
    style={styles.iconButton}
    onPress={() => handleCopy(item.content)}
  >
    <Ionicons name="copy-outline" size={22} color="#374151" />
  </TouchableOpacity>

  {/* DELETE ICON (ONLY USER TEMPLATES) */}
  {item.userId !== 'system' && (
    <TouchableOpacity
      style={styles.iconButton}
      onPress={() => handleDelete(item)}
    >
      <Ionicons name="trash-outline" size={22} color="#DC2626" />
    </TouchableOpacity>
  )}
</View>
      </View>
    </View>
  );
};


  return (
    <View style={[
      styles.container,
      { backgroundColor: isDark ? '#0F172A' : '#F9FAFB' }
    ]}>
      <FloatingHeader />

      {showSuccess && (
  <Animated.View
    style={[
      styles.successBanner,
      { opacity: fadeAnim },
    ]}
  >
    <Ionicons name="checkmark-circle" size={20} color="#fff" />
    <Text style={styles.successText}>
      You’ve successfully deleted the template!
    </Text>
  </Animated.View>
)}
     <FlatList
        data={filteredTemplates}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingTop: 120, paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            {/* Title */}
<View style={styles.headerSection}>

  <View style={styles.titleRow}>
    <Text style={styles.title}>Content Templates</Text>

    <TouchableOpacity
      style={styles.searchIconButton}
      onPress={() => setShowSearch(prev => !prev)}
    >
      <Ionicons name="search-outline" size={22} color="#374151" />
    </TouchableOpacity>
  </View>

  {showSearch && (
    <View style={styles.searchContainer}>
      <Ionicons name="search-outline" size={18} color="#9CA3AF" />
      <TextInput
        placeholder="Search templates..."
        placeholderTextColor="#9CA3AF"
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.searchInput}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <Ionicons name="close-circle" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  )}

  <Text style={styles.subtitle}>
    Create, manage, and reuse social media templates.
  </Text>

</View>

            {/* Emoji Categories */}
            
            <View style={styles.categoryGrid}>
  {categories.map(cat => {
    const active = selectedCategory === cat.id;

    <View
  style={[
    styles.cardHeader,
    { backgroundColor: cat?.color || '#6B7280' },
  ]}
>
  <Text style={styles.cardHeaderText}>
    {cat?.emoji} {cat?.label}
  </Text>
</View>

    return (
      <TouchableOpacity
        key={cat.id}
        onPress={() => setSelectedCategory(cat.id)}
        style={[
          styles.categoryPill,
          { backgroundColor: active ? cat.color : '#E5E7EB' }
        ]}
      >
        <Text style={styles.categoryEmoji}>{cat.emoji}</Text>

        <Text
          style={[
            styles.categoryCount,
            { color: active ? '#fff' : '#111' }
          ]}
        >
          {getCount(cat.id)}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>

          </>
        }
      />

      {/* Floating Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      {/* Create Template */}
      <CreateTemplate
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onTemplateCreated={fetchTemplates}
      />
      
      {/* Create Post */}
      <CreatePost
        visible={showCreatePostModal}
        onClose={() => {
          setShowCreatePostModal(false);
          setPostTemplate(null);
        }}
        post={
          postTemplate
            ? {
                id: '',
                title: postTemplate.name,
                content: postTemplate.content,
                platforms: postTemplate.platform,
                userId: user?.uid || '',
                  createdAt: new Date(),
              }
            : null
        }
      />
    </View>
  );
}

/* =======================
   STYLES
======================= */
const styles = StyleSheet.create({
  container: { flex: 1 },

  headerSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 6,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
  },

  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  categoryPill: {
    width: 70,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 18,
  },

  categoryEmoji: {
    fontSize: 18,
  },

  categoryLabel: {
    fontWeight: '700',
    fontSize: 13,
  },

  cardWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

card: {
  borderRadius: 22,
  overflow: 'hidden',
  backgroundColor: '#fff',
  elevation: 8,
  shadowColor: '#000',
  shadowOpacity: 0.1,
  shadowRadius: 20,
  shadowOffset: { width: 0, height: 10 },
},

cardHeader: {
  paddingVertical: 14,
  paddingHorizontal: 16,
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

cardHeaderText: {
  color: '#fff',
  fontSize: 13,
  fontWeight: '700',
  letterSpacing: 0.5,
},

cardHeaderName: {
  color: '#fff',
  fontSize: 15,
  fontWeight: '600',
  marginTop: 3,
  opacity: 0.95,
},

systemBadge: {
  backgroundColor: '#ffffff33',
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 999,
},

systemBadgeText: {
  color: '#fff',
  fontSize: 10,
  fontWeight: '700',
},

scrollContainer: {
  height: 95,      
  paddingHorizontal: 16,
  paddingTop: 16,
},

cardTitle: {
  fontSize: 16,
  fontWeight: '800',
  marginBottom: 8,
},

cardContent: {
  fontSize: 13,
  lineHeight: 16,
},

useButtonText: {
  color: '#fff',
  fontWeight: '700',
},

floatingButton: {
  position: 'absolute',
  bottom: 98,
  right: 12,
  backgroundColor: '#2563EB',
  width: 55,
  height: 55,
  borderRadius: 30,
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 12,
},

modalHeader: {
  width: '100%',
  alignItems: 'flex-end',
  marginBottom: 10,
},

closeButton: {
  width: 35,
  height: 35,
  borderRadius: 20,
  backgroundColor: '#E5E7EB',
  justifyContent: 'center',
  alignItems: 'center',
},

closeText: {
  fontSize: 18,
  fontWeight: '700',
  color: '#111827',
},

categoryCount: {
  fontWeight: '700',
  fontSize: 13,
},

actionRow: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 10,
  gap: 10,
},

iconButton: {
  width: 42,
  height: 42,
  borderRadius: 12,
  backgroundColor: '#F3F4F6',
  justifyContent: 'center',
  alignItems: 'center',
},

useButton: {
  flex: 1,
  paddingVertical: 12,
  borderRadius: 12,
  alignItems: 'center',
},

successBanner: {
  position: 'absolute',
  top: 110,
  left: 20,
  right: 20,
  backgroundColor: '#16A34A',
  paddingVertical: 12,
  paddingHorizontal: 16,
  borderRadius: 14,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  elevation: 10,
  zIndex: 999,
},

successText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 14,
},

titleRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

searchIconButton: {
  width: 36,
  height: 36,
  borderRadius: 10,
  backgroundColor: '#F3F4F6',
  justifyContent: 'center',
  alignItems: 'center',
},

searchContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#F3F4F6',
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 8,
  marginTop: 12,
  gap: 8,
},

searchInput: {
  flex: 1,
  fontSize: 14,
  color: '#111827',
},

});