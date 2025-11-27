// Script to insert demo fitness data into Firebase Firestore
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.join(__dirname, 'admin-key.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Demo user ID (use your actual Clerk user ID)
const USER_ID = 'user_2ysS5jEqPfWSwfQYG2aD0WhOVd5';

async function insertDemoData() {
  console.log('🚀 Starting demo data insertion...\n');

  try {
    // 1. Create user profile
    console.log('📝 Creating user profile...');
    await db.collection('users').doc(USER_ID).collection('profile').doc('info').set({
      email: 'demo@genxai.com',
      name: 'Ankur Mishra',
      age: 25,
      gender: 'male',
      height: '5\'10"',
      weight: '75 kg',
      fitnessGoals: 'Muscle Gain',
      currentFitnessLevel: 'Intermediate',
      workoutDays: 5,
      injuries: 'None',
      dietaryRestrictions: 'None',
      equipmentAccess: 'Gym (dumbbells, barbells, machines)',
      trainingPreferences: 'Strength training with compound movements',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ User profile created\n');

    // 2. Create demo fitness plan
    console.log('📝 Creating demo fitness plan...');
    const planRef = db.collection('users').doc(USER_ID).collection('plans').doc();
    
    await planRef.set({
      name: 'Muscle Gain Program - 5 Day Split',
      isActive: true,
      workoutPlan: {
        schedule: ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday'],
        exercises: [
          {
            day: 'Monday',
            routines: [
              { name: 'Barbell Bench Press', sets: 4, reps: 8 },
              { name: 'Incline Dumbbell Press', sets: 3, reps: 10 },
              { name: 'Cable Flyes', sets: 3, reps: 12 },
              { name: 'Tricep Dips', sets: 3, reps: 10 },
              { name: 'Overhead Tricep Extension', sets: 3, reps: 12 }
            ]
          },
          {
            day: 'Tuesday',
            routines: [
              { name: 'Deadlifts', sets: 4, reps: 6 },
              { name: 'Pull-ups', sets: 4, reps: 8 },
              { name: 'Barbell Rows', sets: 3, reps: 10 },
              { name: 'Face Pulls', sets: 3, reps: 15 },
              { name: 'Barbell Curls', sets: 3, reps: 10 }
            ]
          },
          {
            day: 'Thursday',
            routines: [
              { name: 'Squats', sets: 4, reps: 8 },
              { name: 'Leg Press', sets: 3, reps: 12 },
              { name: 'Romanian Deadlifts', sets: 3, reps: 10 },
              { name: 'Leg Curls', sets: 3, reps: 12 },
              { name: 'Calf Raises', sets: 4, reps: 15 }
            ]
          },
          {
            day: 'Friday',
            routines: [
              { name: 'Overhead Press', sets: 4, reps: 8 },
              { name: 'Lateral Raises', sets: 3, reps: 12 },
              { name: 'Front Raises', sets: 3, reps: 12 },
              { name: 'Rear Delt Flyes', sets: 3, reps: 15 },
              { name: 'Shrugs', sets: 3, reps: 12 }
            ]
          },
          {
            day: 'Saturday',
            routines: [
              { name: 'Close-Grip Bench Press', sets: 4, reps: 8 },
              { name: 'Hammer Curls', sets: 3, reps: 10 },
              { name: 'Cable Pushdowns', sets: 3, reps: 12 },
              { name: 'Concentration Curls', sets: 3, reps: 12 },
              { name: 'Planks', sets: 3, reps: 1, duration: 60 }
            ]
          }
        ]
      },
      nutritionPlan: {
        caloriesIntake: 2800,
        meals: [
          {
            name: 'Breakfast',
            foods: [
              '4 whole eggs scrambled',
              '2 slices whole wheat toast',
              '1 banana',
              'Greek yogurt with berries',
              'Black coffee'
            ]
          },
          {
            name: 'Mid-Morning Snack',
            foods: [
              'Protein shake (30g protein)',
              'Handful of almonds',
              'Apple'
            ]
          },
          {
            name: 'Lunch',
            foods: [
              '8oz grilled chicken breast',
              '1 cup brown rice',
              'Mixed vegetables (broccoli, carrots)',
              'Side salad with olive oil dressing'
            ]
          },
          {
            name: 'Pre-Workout',
            foods: [
              'Banana',
              'Rice cakes with peanut butter',
              'Pre-workout supplement'
            ]
          },
          {
            name: 'Post-Workout',
            foods: [
              'Whey protein shake (40g protein)',
              'Sweet potato',
              'Handful of berries'
            ]
          },
          {
            name: 'Dinner',
            foods: [
              '8oz lean beef or salmon',
              'Quinoa or pasta',
              'Steamed vegetables',
              'Avocado slices'
            ]
          },
          {
            name: 'Before Bed',
            foods: [
              'Casein protein shake',
              'Cottage cheese',
              'Handful of walnuts'
            ]
          }
        ]
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Fitness plan created with ID: ${planRef.id}\n`);

    // 3. Create session summary
    console.log('📝 Creating demo session summary...');
    const sessionRef = db.collection('users').doc(USER_ID).collection('sessions').doc();
    
    await sessionRef.set({
      session_id: 'demo-session-001',
      generated_at_utc: new Date().toISOString(),
      language: 'auto',
      summary: 'User discussed muscle gain goals, current intermediate fitness level, and commitment to 5-day training split. AI provided comprehensive workout and nutrition plan.',
      main_points: [
        'User wants to gain muscle mass',
        'Currently at intermediate fitness level',
        'Can commit to 5 workouts per week',
        'Has access to full gym equipment',
        'No dietary restrictions'
      ],
      fitness_topics_discussed: ['Muscle gain', 'Workout programming', 'Nutrition planning', 'Progressive overload'],
      goals_or_hopes: ['Build muscle mass', 'Increase strength', 'Improve physique'],
      action_items_suggested: ['Follow 5-day split workout', 'Track calories and protein intake', 'Get 7-8 hours sleep'],
      energy_level: 85,
      motivation_level: 90,
      workout_adherence: 'Consistent',
      recovery_quality: 'Good',
      training_focus_areas: [
        { name: 'strength_training', confidence: 0.95 },
        { name: 'nutrition_planning', confidence: 0.85 },
        { name: 'progressive_overload', confidence: 0.80 }
      ],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Session summary created with ID: ${sessionRef.id}\n`);

    console.log('🎉 Demo data insertion completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - User ID: ${USER_ID}`);
    console.log(`   - Profile: Created`);
    console.log(`   - Fitness Plan: 1 active plan (5-day split)`);
    console.log(`   - Session: 1 demo session`);
    console.log(`\n✅ You can now test the app with this data!`);

  } catch (error) {
    console.error('❌ Error inserting demo data:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
insertDemoData();
