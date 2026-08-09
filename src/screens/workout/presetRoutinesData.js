export const PRESET_ROUTINES = [
  // BEGINNER ROUTINES
  {
    id: 'beg-fb-ef',
    name: 'Beginner Full-Body (Equipment-Free)',
    level: 'BEGINNER',
    equipment: 'NONE',
    goal: 'LOSE_WEIGHT',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Day 1: Upper Body Focus',
        category: 'Upper',
        duration: 30,
        exercises: [
          { id: 'push-up', name: 'Push-up', sets: 3, reps: 10, weight: '0' },
          { id: 'plank', name: 'Plank', sets: 3, reps: 45, weight: '0' },
          { id: 'superman', name: 'Superman Hold', sets: 3, reps: 30, weight: '0' }
        ]
      },
      {
        dayName: 'Day 2: Lower Body Focus',
        category: 'Lower',
        duration: 30,
        exercises: [
          { id: 'bodyweight-squat', name: 'Bodyweight Squat', sets: 3, reps: 15, weight: '0' },
          { id: 'lunges', name: 'Lunges', sets: 3, reps: 10, weight: '0' },
          { id: 'glute-bridge', name: 'Glute Bridge', sets: 3, reps: 12, weight: '0' }
        ]
      },
      {
        dayName: 'Day 3: Cardio Focus',
        category: 'Cardio',
        duration: 35,
        exercises: [
          { id: 'mountain-climbers', name: 'Mountain Climbers', sets: 3, reps: 20, weight: '0' },
          { id: 'burpees', name: 'Burpees', sets: 3, reps: 8, weight: '0' },
          { id: 'high-knees', name: 'High Knees', sets: 3, reps: 30, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'beg-ppl-ef',
    name: 'Beginner Push/Pull/Legs (Equipment-Free)',
    level: 'BEGINNER',
    equipment: 'NONE',
    goal: 'LOSE_WEIGHT',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Day 1: Push Day',
        category: 'Push',
        duration: 30,
        exercises: [
          { id: 'push-up', name: 'Push-up', sets: 3, reps: 10, weight: '0' },
          { id: 'bench-dips', name: 'Bench Dips', sets: 3, reps: 12, weight: '0' },
          { id: 'plank', name: 'Plank', sets: 3, reps: 45, weight: '0' }
        ]
      },
      {
        dayName: 'Day 2: Pull Day',
        category: 'Pull',
        duration: 30,
        exercises: [
          { id: 'inverted-row', name: 'Inverted Row', sets: 3, reps: 8, weight: '0' },
          { id: 'superman', name: 'Superman Hold', sets: 3, reps: 30, weight: '0' },
          { id: 'bicycle-crunches', name: 'Bicycle Crunches', sets: 3, reps: 15, weight: '0' }
        ]
      },
      {
        dayName: 'Day 3: Legs Day',
        category: 'Legs',
        duration: 35,
        exercises: [
          { id: 'bodyweight-squat', name: 'Bodyweight Squat', sets: 3, reps: 15, weight: '0' },
          { id: 'lunges', name: 'Lunges', sets: 3, reps: 12, weight: '0' },
          { id: 'calf-raise', name: 'Single-Leg Calf Raise', sets: 3, reps: 10, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'beg-fb-db',
    name: 'Beginner Full-Body (Dumbbells)',
    level: 'BEGINNER',
    equipment: 'DUMBBELLS',
    goal: 'GAIN_MUSCLE',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Day 1: Strength A',
        category: 'Workout A',
        duration: 40,
        exercises: [
          { id: 'db-press', name: 'Dumbbell Bench Press', sets: 3, reps: 10, weight: '12' },
          { id: 'db-goblet-squat', name: 'Dumbbell Goblet Squat', sets: 3, reps: 12, weight: '16' },
          { id: 'db-row', name: 'Dumbbell Row', sets: 3, reps: 10, weight: '12' }
        ]
      },
      {
        dayName: 'Day 2: Strength B',
        category: 'Workout B',
        duration: 40,
        exercises: [
          { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', sets: 3, reps: 10, weight: '10' },
          { id: 'db-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', sets: 3, reps: 12, weight: '14' },
          { id: 'db-bicep-curl', name: 'Dumbbell Bicep Curl', sets: 3, reps: 12, weight: '8' }
        ]
      },
      {
        dayName: 'Day 3: Conditioning',
        category: 'Conditioning',
        duration: 45,
        exercises: [
          { id: 'db-thruster', name: 'Dumbbell Thruster', sets: 3, reps: 10, weight: '12' },
          { id: 'db-lunge', name: 'Dumbbell Lunges', sets: 3, reps: 10, weight: '10' },
          { id: 'plank', name: 'Plank', sets: 3, reps: 60, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'beg-ul-db',
    name: 'Beginner Upper/Lower (Dumbbells)',
    level: 'BEGINNER',
    equipment: 'DUMBBELLS',
    goal: 'GAIN_MUSCLE',
    routinesCount: 2,
    workouts: [
      {
        dayName: 'Day 1: Upper Body Focus',
        category: 'Upper',
        duration: 40,
        exercises: [
          { id: 'db-press', name: 'Dumbbell Bench Press', sets: 3, reps: 10, weight: '12' },
          { id: 'db-row', name: 'Dumbbell Row', sets: 3, reps: 10, weight: '12' },
          { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', sets: 3, reps: 10, weight: '8' },
          { id: 'db-bicep-curl', name: 'Dumbbell Hammer Curl', sets: 3, reps: 12, weight: '8' }
        ]
      },
      {
        dayName: 'Day 2: Lower Body Focus',
        category: 'Lower',
        duration: 40,
        exercises: [
          { id: 'db-goblet-squat', name: 'Dumbbell Goblet Squat', sets: 3, reps: 12, weight: '16' },
          { id: 'db-lunge', name: 'Dumbbell Lunges', sets: 3, reps: 10, weight: '10' },
          { id: 'db-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', sets: 3, reps: 12, weight: '14' },
          { id: 'plank', name: 'Plank', sets: 3, reps: 60, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'beg-ppl-db',
    name: 'Beginner Push/Pull/Legs (Dumbbells)',
    level: 'BEGINNER',
    equipment: 'DUMBBELLS',
    goal: 'GAIN_MUSCLE',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Day 1: Push Day',
        category: 'Push',
        duration: 40,
        exercises: [
          { id: 'db-press', name: 'Dumbbell Bench Press', sets: 3, reps: 10, weight: '12' },
          { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', sets: 3, reps: 10, weight: '10' },
          { id: 'db-lateral-raise', name: 'Dumbbell Lateral Raise', sets: 3, reps: 12, weight: '6' },
          { id: 'db-tricep-extension', name: 'Dumbbell Overhead Tricep Extension', sets: 3, reps: 12, weight: '8' }
        ]
      },
      {
        dayName: 'Day 2: Pull Day',
        category: 'Pull',
        duration: 40,
        exercises: [
          { id: 'db-row', name: 'Dumbbell Row', sets: 3, reps: 10, weight: '14' },
          { id: 'db-pullover', name: 'Dumbbell Pullover', sets: 3, reps: 10, weight: '12' },
          { id: 'db-bicep-curl', name: 'Dumbbell Hammer Curl', sets: 3, reps: 12, weight: '8' },
          { id: 'db-rear-delt-fly', name: 'Dumbbell Rear Delt Fly', sets: 3, reps: 12, weight: '6' }
        ]
      },
      {
        dayName: 'Day 3: Legs Day',
        category: 'Legs',
        duration: 45,
        exercises: [
          { id: 'db-goblet-squat', name: 'Dumbbell Goblet Squat', sets: 3, reps: 12, weight: '16' },
          { id: 'db-lunge', name: 'Dumbbell Lunges', sets: 3, reps: 10, weight: '10' },
          { id: 'db-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', sets: 3, reps: 12, weight: '14' },
          { id: 'plank', name: 'Plank', sets: 3, reps: 60, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'beg-fb-gym',
    name: 'Beginner Full-Body (Gym Equipment)',
    level: 'BEGINNER',
    equipment: 'GYM',
    goal: 'STRENGTH',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Workout A',
        category: 'Workout A',
        duration: 45,
        exercises: [
          { id: 'bench-press', name: 'Barbell Bench Press', sets: 3, reps: 10, weight: '40' },
          { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 3, reps: 10, weight: '35' },
          { id: 'leg-press', name: 'Leg Press', sets: 3, reps: 10, weight: '80' },
          { id: 'calf-raise', name: 'Standing Calf Raise', sets: 3, reps: 15, weight: '40' }
        ]
      },
      {
        dayName: 'Workout B',
        category: 'Workout B',
        duration: 45,
        exercises: [
          { id: 'squat', name: 'Barbell Squat', sets: 3, reps: 10, weight: '50' },
          { id: 'overhead-press', name: 'Barbell Overhead Press', sets: 3, reps: 10, weight: '20' },
          { id: 'barbell-row', name: 'Barbell Row', sets: 3, reps: 10, weight: '30' },
          { id: 'bicep-curl', name: 'Dumbbell Bicep Curl', sets: 3, reps: 12, weight: '10' }
        ]
      },
      {
        dayName: 'Workout C',
        category: 'Workout C',
        duration: 45,
        exercises: [
          { id: 'deadlift', name: 'Barbell Deadlift', sets: 3, reps: 8, weight: '60' },
          { id: 'incline-bench-press', name: 'Incline Bench Press', sets: 3, reps: 10, weight: '35' },
          { id: 'cable-row', name: 'Seated Cable Row', sets: 3, reps: 10, weight: '30' },
          { id: 'plank', name: 'Plank', sets: 3, reps: 60, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'beg-ul-gym',
    name: 'Beginner Upper/Lower (Gym Equipment)',
    level: 'BEGINNER',
    equipment: 'GYM',
    goal: 'GAIN_MUSCLE',
    routinesCount: 2,
    workouts: [
      {
        dayName: 'Upper Focus',
        category: 'Upper',
        duration: 40,
        exercises: [
          { id: 'bench-press', name: 'Barbell Bench Press', sets: 3, reps: 10, weight: '35' },
          { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 3, reps: 10, weight: '30' },
          { id: 'overhead-press', name: 'Barbell Overhead Press', sets: 3, reps: 10, weight: '20' },
          { id: 'bicep-curl', name: 'Dumbbell Curl', sets: 3, reps: 12, weight: '8' }
        ]
      },
      {
        dayName: 'Lower Focus',
        category: 'Lower',
        duration: 40,
        exercises: [
          { id: 'squat', name: 'Barbell Squat', sets: 3, reps: 10, weight: '45' },
          { id: 'leg-curl', name: 'Seated Leg Curl', sets: 3, reps: 12, weight: '25' },
          { id: 'leg-extension', name: 'Leg Extension', sets: 3, reps: 12, weight: '30' },
          { id: 'calf-raise', name: 'Standing Calf Raise', sets: 3, reps: 15, weight: '40' }
        ]
      }
    ]
  },
  {
    id: 'beg-ppl-gym',
    name: 'Beginner Push/Pull/Legs (Gym Equipment)',
    level: 'BEGINNER',
    equipment: 'GYM',
    goal: 'GAIN_MUSCLE',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Day 1: Push Day',
        category: 'Push',
        duration: 45,
        exercises: [
          { id: 'bench-press', name: 'Barbell Bench Press', sets: 3, reps: 10, weight: '40' },
          { id: 'overhead-press', name: 'Barbell Overhead Press', sets: 3, reps: 10, weight: '20' },
          { id: 'tricep-extension', name: 'Cable Tricep Pushdown', sets: 3, reps: 12, weight: '15' },
          { id: 'lateral-raise', name: 'Dumbbell Lateral Raise', sets: 3, reps: 12, weight: '8' }
        ]
      },
      {
        dayName: 'Day 2: Pull Day',
        category: 'Pull',
        duration: 45,
        exercises: [
          { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 3, reps: 10, weight: '35' },
          { id: 'barbell-row', name: 'Barbell Row', sets: 3, reps: 10, weight: '30' },
          { id: 'bicep-curl', name: 'Dumbbell Bicep Curl', sets: 3, reps: 12, weight: '10' },
          { id: 'shrugs', name: 'Dumbbell Shrugs', sets: 3, reps: 12, weight: '16' }
        ]
      },
      {
        dayName: 'Day 3: Legs Day',
        category: 'Legs',
        duration: 50,
        exercises: [
          { id: 'squat', name: 'Barbell Squat', sets: 3, reps: 10, weight: '50' },
          { id: 'leg-press', name: 'Leg Press', sets: 3, reps: 10, weight: '80' },
          { id: 'calf-raise', name: 'Standing Calf Raise', sets: 3, reps: 15, weight: '40' },
          { id: 'plank', name: 'Plank', sets: 3, reps: 60, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'beg-5x5',
    name: 'Beginner 5x5',
    level: 'BEGINNER',
    equipment: 'GYM',
    goal: 'STRENGTH',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Workout A: Squat/Bench/Row Focus',
        category: 'Workout A',
        duration: 50,
        exercises: [
          { id: 'squat', name: 'Barbell Squat', sets: 5, reps: 5, weight: '50' },
          { id: 'bench-press', name: 'Barbell Bench Press', sets: 5, reps: 5, weight: '40' },
          { id: 'barbell-row', name: 'Barbell Row', sets: 5, reps: 5, weight: '30' }
        ]
      },
      {
        dayName: 'Workout B: Squat/Press/Deadlift Focus',
        category: 'Workout B',
        duration: 45,
        exercises: [
          { id: 'squat', name: 'Barbell Squat', sets: 5, reps: 5, weight: '52' },
          { id: 'overhead-press', name: 'Barbell Overhead Press', sets: 5, reps: 5, weight: '22' },
          { id: 'deadlift', name: 'Barbell Deadlift', sets: 1, reps: 5, weight: '60' }
        ]
      },
      {
        dayName: 'Workout C: Squat/Bench/Row Progress',
        category: 'Workout C',
        duration: 50,
        exercises: [
          { id: 'squat', name: 'Barbell Squat', sets: 5, reps: 5, weight: '55' },
          { id: 'bench-press', name: 'Barbell Bench Press', sets: 5, reps: 5, weight: '42' },
          { id: 'barbell-row', name: 'Barbell Row', sets: 5, reps: 5, weight: '32' }
        ]
      }
    ]
  },

  // INTERMEDIATE ROUTINES
  {
    id: 'int-fb-ef',
    name: 'Intermediate Full-Body (Equipment-Free)',
    level: 'INTERMEDIATE',
    equipment: 'NONE',
    goal: 'LOSE_WEIGHT',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Workout A: Upper & Core Focus',
        category: 'Upper & Core',
        duration: 35,
        exercises: [
          { id: 'push-up', name: 'Push-up', sets: 3, reps: 15, weight: '0' },
          { id: 'pike-push-up', name: 'Pike Push-up', sets: 3, reps: 10, weight: '0' },
          { id: 'plank', name: 'Plank', sets: 3, reps: 60, weight: '0' },
          { id: 'mountain-climbers', name: 'Mountain Climbers', sets: 3, reps: 30, weight: '0' }
        ]
      },
      {
        dayName: 'Workout B: Lower & Cardio Focus',
        category: 'Lower & Cardio',
        duration: 40,
        exercises: [
          { id: 'bodyweight-squat', name: 'Bodyweight Squat', sets: 3, reps: 20, weight: '0' },
          { id: 'lunges', name: 'Lunges', sets: 3, reps: 15, weight: '0' },
          { id: 'jump-squat', name: 'Jump Squat', sets: 3, reps: 12, weight: '0' },
          { id: 'high-knees', name: 'High Knees', sets: 3, reps: 40, weight: '0' }
        ]
      },
      {
        dayName: 'Workout C: Metabolic Conditioning',
        category: 'Conditioning',
        duration: 45,
        exercises: [
          { id: 'burpees', name: 'Burpees', sets: 3, reps: 10, weight: '0' },
          { id: 'push-up', name: 'Push-up', sets: 3, reps: 15, weight: '0' },
          { id: 'bodyweight-squat', name: 'Bodyweight Squat', sets: 3, reps: 20, weight: '0' },
          { id: 'bicycle-crunches', name: 'Bicycle Crunches', sets: 3, reps: 20, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'int-ppl-ef',
    name: 'Intermediate Push/Pull/Legs (Equipment-Free)',
    level: 'INTERMEDIATE',
    equipment: 'NONE',
    goal: 'LOSE_WEIGHT',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Workout 1: Bodyweight Push',
        category: 'Push',
        duration: 35,
        exercises: [
          { id: 'push-up', name: 'Standard Push-up', sets: 4, reps: 15, weight: '0' },
          { id: 'decline-push-up', name: 'Decline Push-up', sets: 3, reps: 12, weight: '0' },
          { id: 'pike-push-up', name: 'Pike Push-up', sets: 3, reps: 10, weight: '0' },
          { id: 'bench-dips', name: 'Bench Dips', sets: 3, reps: 15, weight: '0' }
        ]
      },
      {
        dayName: 'Workout 2: Bodyweight Pull & Core',
        category: 'Pull',
        duration: 35,
        exercises: [
          { id: 'pull-up', name: 'Pull-up', sets: 3, reps: 8, weight: '0' },
          { id: 'inverted-row', name: 'Inverted Bodyweight Row', sets: 3, reps: 12, weight: '0' },
          { id: 'superman', name: 'Superman Hold', sets: 3, reps: 45, weight: '0' },
          { id: 'crunches', name: 'Ab Crunches', sets: 3, reps: 20, weight: '0' }
        ]
      },
      {
        dayName: 'Workout 3: Bodyweight Legs',
        category: 'Legs',
        duration: 40,
        exercises: [
          { id: 'bodyweight-squat', name: 'Air Squat', sets: 4, reps: 20, weight: '0' },
          { id: 'lunges', name: 'Walking Lunges', sets: 3, reps: 16, weight: '0' },
          { id: 'glute-bridge', name: 'Glute Bridge', sets: 3, reps: 15, weight: '0' },
          { id: 'calf-raise', name: 'Single-Leg Calf Raise', sets: 3, reps: 15, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'int-fb-db',
    name: 'Intermediate Full-Body (Dumbbells)',
    level: 'INTERMEDIATE',
    equipment: 'DUMBBELLS',
    goal: 'GAIN_MUSCLE',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Session A',
        category: 'Workout A',
        duration: 45,
        exercises: [
          { id: 'db-squat', name: 'Dumbbell Goblet Squat', sets: 3, reps: 12, weight: '18' },
          { id: 'db-bench-press', name: 'Dumbbell Bench Press', sets: 3, reps: 10, weight: '16' },
          { id: 'db-row', name: 'One-Arm Dumbbell Row', sets: 3, reps: 10, weight: '16' },
          { id: 'db-curl', name: 'Dumbbell Bicep Curl', sets: 3, reps: 12, weight: '10' }
        ]
      },
      {
        dayName: 'Session B',
        category: 'Workout B',
        duration: 45,
        exercises: [
          { id: 'db-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', sets: 3, reps: 12, weight: '18' },
          { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', sets: 3, reps: 10, weight: '12' },
          { id: 'db-lunges', name: 'Dumbbell Walking Lunges', sets: 3, reps: 10, weight: '12' },
          { id: 'db-tricep-kickback', name: 'Dumbbell Tricep Kickback', sets: 3, reps: 12, weight: '8' }
        ]
      },
      {
        dayName: 'Session C',
        category: 'Workout C',
        duration: 50,
        exercises: [
          { id: 'db-thruster', name: 'Dumbbell Thruster', sets: 3, reps: 10, weight: '12' },
          { id: 'db-renegade-row', name: 'Dumbbell Renegade Row', sets: 3, reps: 12, weight: '14' },
          { id: 'db-goblet-lunge', name: 'Dumbbell Goblet Lunge', sets: 3, reps: 10, weight: '16' },
          { id: 'plank-shoulder-tap', name: 'Plank Shoulder Tap', sets: 3, reps: 20, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'int-ul-db',
    name: 'Intermediate Upper/Lower (Dumbbells)',
    level: 'INTERMEDIATE',
    equipment: 'DUMBBELLS',
    goal: 'GAIN_MUSCLE',
    routinesCount: 4,
    workouts: [
      {
        dayName: 'Day 1: Upper Body A',
        category: 'Upper',
        duration: 45,
        exercises: [
          { id: 'db-chest-press', name: 'Dumbbell Bench Press', sets: 4, reps: 10, weight: '18' },
          { id: 'db-row', name: 'Dumbbell Row', sets: 4, reps: 10, weight: '18' },
          { id: 'db-lateral-raise', name: 'Dumbbell Lateral Raise', sets: 3, reps: 12, weight: '8' },
          { id: 'db-bicep-curl', name: 'Dumbbell Incline Curl', sets: 3, reps: 12, weight: '10' }
        ]
      },
      {
        dayName: 'Day 2: Lower Body A',
        category: 'Lower',
        duration: 45,
        exercises: [
          { id: 'db-goblet-squat', name: 'Dumbbell Goblet Squat', sets: 4, reps: 12, weight: '22' },
          { id: 'db-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', sets: 4, reps: 12, weight: '20' },
          { id: 'db-lunge', name: 'Dumbbell Lunges', sets: 3, reps: 10, weight: '12' },
          { id: 'db-calf-raise', name: 'Dumbbell Standing Calf Raise', sets: 3, reps: 15, weight: '16' }
        ]
      },
      {
        dayName: 'Day 3: Upper Body B',
        category: 'Upper',
        duration: 45,
        exercises: [
          { id: 'db-incline-press', name: 'Dumbbell Incline Bench Press', sets: 4, reps: 10, weight: '16' },
          { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', sets: 4, reps: 10, weight: '12' },
          { id: 'db-fly', name: 'Dumbbell Chest Fly', sets: 3, reps: 12, weight: '10' },
          { id: 'db-tricep-extension', name: 'Dumbbell Overhead Tricep Extension', sets: 3, reps: 12, weight: '10' }
        ]
      },
      {
        dayName: 'Day 4: Lower Body B',
        category: 'Lower',
        duration: 45,
        exercises: [
          { id: 'db-step-up', name: 'Dumbbell Step-Up', sets: 4, reps: 10, weight: '12' },
          { id: 'db-single-leg-deadlift', name: 'Dumbbell Single-Leg Romanian Deadlift', sets: 4, reps: 10, weight: '14' },
          { id: 'db-glute-bridge', name: 'Dumbbell Glute Bridge', sets: 3, reps: 15, weight: '24' },
          { id: 'crunches', name: 'Ab Crunches', sets: 3, reps: 20, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'int-ppl-db',
    name: 'Intermediate Push/Pull/Legs (Dumbbells)',
    level: 'INTERMEDIATE',
    equipment: 'DUMBBELLS',
    goal: 'GAIN_MUSCLE',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Workout 1: Push Day',
        category: 'Push',
        duration: 45,
        exercises: [
          { id: 'db-press', name: 'Dumbbell Bench Press', sets: 3, reps: 10, weight: '18' },
          { id: 'db-incline-press', name: 'Dumbbell Incline Press', sets: 3, reps: 10, weight: '16' },
          { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', sets: 3, reps: 10, weight: '12' },
          { id: 'db-tricep-extension', name: 'Dumbbell Overhead Tricep Extension', sets: 3, reps: 12, weight: '10' }
        ]
      },
      {
        dayName: 'Workout 2: Pull Day',
        category: 'Pull',
        duration: 45,
        exercises: [
          { id: 'db-row', name: 'Dumbbell Row', sets: 3, reps: 10, weight: '18' },
          { id: 'db-shrugs', name: 'Dumbbell Shrugs', sets: 3, reps: 12, weight: '20' },
          { id: 'db-hammer-curl', name: 'Dumbbell Hammer Curl', sets: 3, reps: 12, weight: '12' },
          { id: 'db-reverse-fly', name: 'Dumbbell Reverse Fly', sets: 3, reps: 12, weight: '8' }
        ]
      },
      {
        dayName: 'Workout 3: Legs Day',
        category: 'Legs',
        duration: 50,
        exercises: [
          { id: 'db-squat', name: 'Dumbbell Squat', sets: 3, reps: 12, weight: '22' },
          { id: 'db-lunges', name: 'Dumbbell Walking Lunges', sets: 3, reps: 10, weight: '14' },
          { id: 'db-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', sets: 3, reps: 12, weight: '20' },
          { id: 'plank', name: 'Plank', sets: 3, reps: 60, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'int-fb-gym',
    name: 'Intermediate Full-Body (Gym Equipment)',
    level: 'INTERMEDIATE',
    equipment: 'GYM',
    goal: 'STRENGTH',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Session A',
        category: 'Workout A',
        duration: 45,
        exercises: [
          { id: 'bench-press', name: 'Barbell Bench Press', sets: 3, reps: 8, weight: '50' },
          { id: 'squat', name: 'Barbell Squat', sets: 3, reps: 8, weight: '60' },
          { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 3, reps: 10, weight: '40' }
        ]
      },
      {
        dayName: 'Session B',
        category: 'Workout B',
        duration: 45,
        exercises: [
          { id: 'overhead-press', name: 'Barbell Overhead Press', sets: 3, reps: 8, weight: '30' },
          { id: 'deadlift', name: 'Barbell Deadlift', sets: 3, reps: 5, weight: '80' },
          { id: 'cable-row', name: 'Seated Cable Row', sets: 3, reps: 10, weight: '40' }
        ]
      },
      {
        dayName: 'Session C',
        category: 'Workout C',
        duration: 50,
        exercises: [
          { id: 'incline-bench-press', name: 'Incline Bench Press', sets: 3, reps: 10, weight: '45' },
          { id: 'leg-press', name: 'Leg Press', sets: 3, reps: 10, weight: '100' },
          { id: 'bicep-curl', name: 'Dumbbell Bicep Curl', sets: 3, reps: 12, weight: '12' }
        ]
      }
    ]
  },
  {
    id: 'int-ul-gym',
    name: 'Intermediate Upper/Lower (Gym Equipment)',
    level: 'INTERMEDIATE',
    equipment: 'GYM',
    goal: 'GAIN_MUSCLE',
    routinesCount: 4,
    workouts: [
      {
        dayName: 'Upper A Focus',
        category: 'Upper',
        duration: 45,
        exercises: [
          { id: 'bench-press', name: 'Barbell Bench Press', sets: 4, reps: 8, weight: '60' },
          { id: 'barbell-row', name: 'Barbell Row', sets: 4, reps: 8, weight: '40' },
          { id: 'overhead-press', name: 'Barbell Overhead Press', sets: 4, reps: 8, weight: '30' },
          { id: 'bicep-curl', name: 'Dumbbell Bicep Curl', sets: 3, reps: 12, weight: '12' }
        ]
      },
      {
        dayName: 'Lower A Focus',
        category: 'Lower',
        duration: 45,
        exercises: [
          { id: 'squat', name: 'Barbell Squat', sets: 4, reps: 8, weight: '70' },
          { id: 'leg-press', name: 'Leg Press', sets: 4, reps: 10, weight: '100' },
          { id: 'leg-curl', name: 'Lying Leg Curl', sets: 3, reps: 12, weight: '35' },
          { id: 'plank', name: 'Plank', sets: 3, reps: 60, weight: '0' }
        ]
      },
      {
        dayName: 'Upper B Focus',
        category: 'Upper',
        duration: 45,
        exercises: [
          { id: 'incline-bench-press', name: 'Incline Bench Press', sets: 4, reps: 8, weight: '50' },
          { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 4, reps: 8, weight: '45' },
          { id: 'lateral-raise', name: 'Dumbbell Lateral Raise', sets: 3, reps: 12, weight: '10' },
          { id: 'tricep-extension', name: 'Cable Overhead Tricep Extension', sets: 3, reps: 12, weight: '20' }
        ]
      },
      {
        dayName: 'Lower B Focus',
        category: 'Lower',
        duration: 45,
        exercises: [
          { id: 'deadlift', name: 'Barbell Deadlift', sets: 4, reps: 5, weight: '90' },
          { id: 'lunges', name: 'Barbell Walking Lunges', sets: 3, reps: 10, weight: '30' },
          { id: 'leg-extension', name: 'Leg Extension', sets: 3, reps: 12, weight: '45' },
          { id: 'calf-raise', name: 'Seated Calf Raise', sets: 3, reps: 15, weight: '35' }
        ]
      }
    ]
  },
  {
    id: 'int-ppl-gym',
    name: 'Intermediate Push/Pull/Legs (Gym Equipment)',
    level: 'INTERMEDIATE',
    equipment: 'GYM',
    goal: 'GAIN_MUSCLE',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Day 1: Push Day',
        category: 'Push',
        duration: 45,
        exercises: [
          { id: 'bench-press', name: 'Barbell Bench Press', sets: 3, reps: 8, weight: '50' },
          { id: 'overhead-press', name: 'Barbell Overhead Press', sets: 3, reps: 8, weight: '30' },
          { id: 'tricep-extension', name: 'Cable Tricep Pushdown', sets: 3, reps: 12, weight: '20' },
          { id: 'lateral-raise', name: 'Dumbbell Lateral Raise', sets: 3, reps: 12, weight: '10' }
        ]
      },
      {
        dayName: 'Day 2: Pull Day',
        category: 'Pull',
        duration: 45,
        exercises: [
          { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 3, reps: 10, weight: '40' },
          { id: 'barbell-row', name: 'Barbell Row', sets: 3, reps: 10, weight: '40' },
          { id: 'db-hammer-curl', name: 'Dumbbell Hammer Curl', sets: 3, reps: 12, weight: '12' },
          { id: 'face-pulls', name: 'Cable Face Pulls', sets: 3, reps: 15, weight: '15' }
        ]
      },
      {
        dayName: 'Day 3: Legs Day',
        category: 'Legs',
        duration: 50,
        exercises: [
          { id: 'squat', name: 'Barbell Squat', sets: 3, reps: 8, weight: '60' },
          { id: 'leg-press', name: 'Leg Press', sets: 3, reps: 10, weight: '100' },
          { id: 'leg-curl', name: 'Seated Leg Curl', sets: 3, reps: 12, weight: '30' },
          { id: 'calf-raise', name: 'Standing Calf Raise', sets: 3, reps: 15, weight: '40' }
        ]
      }
    ]
  },
  {
    id: 'phul-gym',
    name: '4-Day PHUL (Gym Equipment)',
    level: 'INTERMEDIATE',
    equipment: 'GYM',
    goal: 'GAIN_MUSCLE',
    routinesCount: 4,
    workouts: [
      {
        dayName: 'Day 1: Upper Power Focus',
        category: 'Upper Power',
        duration: 50,
        exercises: [
          { id: 'bench-press', name: 'Barbell Bench Press', sets: 4, reps: 5, weight: '70' },
          { id: 'barbell-row', name: 'Barbell Row', sets: 4, reps: 5, weight: '50' },
          { id: 'overhead-press', name: 'Barbell Overhead Press', sets: 3, reps: 6, weight: '35' },
          { id: 'skull-crushers', name: 'Barbell Skull Crushers', sets: 3, reps: 8, weight: '25' }
        ]
      },
      {
        dayName: 'Day 2: Lower Power Focus',
        category: 'Lower Power',
        duration: 50,
        exercises: [
          { id: 'squat', name: 'Barbell Squat', sets: 4, reps: 5, weight: '85' },
          { id: 'deadlift', name: 'Barbell Deadlift', sets: 4, reps: 5, weight: '100' },
          { id: 'leg-press', name: 'Leg Press', sets: 3, reps: 8, weight: '120' },
          { id: 'calf-raise', name: 'Standing Calf Raise', sets: 3, reps: 10, weight: '60' }
        ]
      },
      {
        dayName: 'Day 3: Upper Hypertrophy Focus',
        category: 'Upper Hypertrophy',
        duration: 45,
        exercises: [
          { id: 'incline-db-press', name: 'Dumbbell Incline Bench Press', sets: 4, reps: 10, weight: '20' },
          { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 4, reps: 10, weight: '45' },
          { id: 'lateral-raise', name: 'Dumbbell Lateral Raise', sets: 3, reps: 12, weight: '10' },
          { id: 'bicep-curl', name: 'Dumbbell Hammer Curl', sets: 3, reps: 12, weight: '12' }
        ]
      },
      {
        dayName: 'Day 4: Lower Hypertrophy Focus',
        category: 'Lower Hypertrophy',
        duration: 45,
        exercises: [
          { id: 'leg-extension', name: 'Leg Extension', sets: 4, reps: 12, weight: '40' },
          { id: 'leg-curl', name: 'Lying Leg Curl', sets: 4, reps: 12, weight: '30' },
          { id: 'db-lunge', name: 'Dumbbell Lunges', sets: 3, reps: 10, weight: '14' },
          { id: 'calf-raise-seated', name: 'Seated Calf Raise', sets: 3, reps: 15, weight: '30' }
        ]
      }
    ]
  },

  // ADVANCED ROUTINES
  {
    id: 'madcow-5x5',
    name: 'Madcow 5x5',
    level: 'ADVANCED',
    equipment: 'GYM',
    goal: 'STRENGTH',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Monday: Volume Session',
        category: 'Workout A',
        duration: 55,
        exercises: [
          { id: 'squat', name: 'Barbell Squat (5x5 ramped)', sets: 5, reps: 5, weight: '90' },
          { id: 'bench-press', name: 'Barbell Bench Press (5x5 ramped)', sets: 5, reps: 5, weight: '75' },
          { id: 'barbell-row', name: 'Barbell Row (5x5 ramped)', sets: 5, reps: 5, weight: '55' }
        ]
      },
      {
        dayName: 'Wednesday: Light Session',
        category: 'Workout B',
        duration: 45,
        exercises: [
          { id: 'squat-light', name: 'Barbell Squat (Light 4x5)', sets: 4, reps: 5, weight: '72' },
          { id: 'overhead-press', name: 'Barbell Overhead Press (4x5 ramped)', sets: 4, reps: 5, weight: '40' },
          { id: 'deadlift', name: 'Barbell Deadlift (4x5 ramped)', sets: 4, reps: 5, weight: '110' }
        ]
      },
      {
        dayName: 'Friday: Intensity Session',
        category: 'Workout C',
        duration: 55,
        exercises: [
          { id: 'squat-heavy', name: 'Barbell Squat (4x5 ramped + 1x3 heavy)', sets: 5, reps: 5, weight: '93' },
          { id: 'bench-press-heavy', name: 'Barbell Bench Press (4x5 ramped + 1x3 heavy)', sets: 5, reps: 5, weight: '78' },
          { id: 'barbell-row-heavy', name: 'Barbell Row (4x5 ramped + 1x3 heavy)', sets: 5, reps: 5, weight: '57' }
        ]
      }
    ]
  },
  {
    id: 'adv-fb-ef',
    name: 'Advanced Full-Body (Equipment-Free)',
    level: 'ADVANCED',
    equipment: 'NONE',
    goal: 'LOSE_WEIGHT',
    routinesCount: 3,
    workouts: [
      {
        dayName: 'Calisthenics Conditioning',
        category: 'Conditioning',
        duration: 40,
        exercises: [
          { id: 'push-up', name: 'Push-up (Amrap)', sets: 4, reps: 25, weight: '0' },
          { id: 'decline-push-up', name: 'Decline Push-up', sets: 4, reps: 20, weight: '0' },
          { id: 'pike-push-up', name: 'Pike Push-up', sets: 3, reps: 15, weight: '0' },
          { id: 'plank', name: 'Plank Hold', sets: 3, reps: 90, weight: '0' }
        ]
      },
      {
        dayName: 'Explosive Lower Focus',
        category: 'Lower',
        duration: 40,
        exercises: [
          { id: 'jump-squat', name: 'Explosive Jump Squat', sets: 4, reps: 20, weight: '0' },
          { id: 'lunges', name: 'Jumping Lunges', sets: 3, reps: 20, weight: '0' },
          { id: 'glute-bridge', name: 'Single-Leg Glute Bridge', sets: 3, reps: 15, weight: '0' },
          { id: 'burpees', name: 'Burpees', sets: 3, reps: 15, weight: '0' }
        ]
      },
      {
        dayName: 'Core & Endurance Mix',
        category: 'Endurance',
        duration: 45,
        exercises: [
          { id: 'push-up', name: 'Handstand Push-up (Progression)', sets: 3, reps: 8, weight: '0' },
          { id: 'mountain-climbers', name: 'Mountain Climbers', sets: 3, reps: 50, weight: '0' },
          { id: 'hollow-body', name: 'Hollow Body Hold', sets: 3, reps: 45, weight: '0' },
          { id: 'bicycle-crunches', name: 'Bicycle Crunches', sets: 3, reps: 30, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'adv-fb-db',
    name: 'Advanced Full-Body (Dumbbells)',
    level: 'ADVANCED',
    equipment: 'DUMBBELLS',
    goal: 'GAIN_MUSCLE',
    routinesCount: 4,
    workouts: [
      {
        dayName: 'Workout A: High Volume Strength',
        category: 'Strength',
        duration: 50,
        exercises: [
          { id: 'db-bench-press', name: 'Dumbbell Bench Press', sets: 4, reps: 8, weight: '24' },
          { id: 'db-squat', name: 'Dumbbell Goblet Squat', sets: 4, reps: 10, weight: '28' },
          { id: 'db-row', name: 'One-Arm Dumbbell Row', sets: 4, reps: 8, weight: '24' },
          { id: 'db-curl', name: 'Dumbbell Hammer Curl', sets: 3, reps: 12, weight: '14' }
        ]
      },
      {
        dayName: 'Workout B: Hypertrophy Split',
        category: 'Hypertrophy',
        duration: 50,
        exercises: [
          { id: 'db-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', sets: 4, reps: 10, weight: '26' },
          { id: 'db-shoulder-press', name: 'Dumbbell Seated Shoulder Press', sets: 4, reps: 8, weight: '18' },
          { id: 'db-lunge', name: 'Dumbbell Walking Lunges', sets: 3, reps: 12, weight: '16' },
          { id: 'db-tricep-overhead', name: 'Dumbbell Overhead Tricep Extension', sets: 3, reps: 12, weight: '14' }
        ]
      },
      {
        dayName: 'Workout C: Metabolic Power',
        category: 'Power',
        duration: 55,
        exercises: [
          { id: 'db-thruster', name: 'Dumbbell Thruster', sets: 4, reps: 10, weight: '16' },
          { id: 'db-renegade-row', name: 'Dumbbell Renegade Row', sets: 4, reps: 10, weight: '20' },
          { id: 'db-step-up', name: 'Dumbbell Step-Up', sets: 3, reps: 12, weight: '18' },
          { id: 'plank', name: 'Plank Hold', sets: 3, reps: 90, weight: '0' }
        ]
      },
      {
        dayName: 'Workout D: Conditioning & Core',
        category: 'Conditioning',
        duration: 45,
        exercises: [
          { id: 'db-lunge', name: 'Dumbbell Lunges', sets: 4, reps: 12, weight: '12' },
          { id: 'db-lateral-raise', name: 'Dumbbell Lateral Raise', sets: 4, reps: 12, weight: '10' },
          { id: 'russian-twist', name: 'Dumbbell Russian Twist', sets: 3, reps: 20, weight: '8' },
          { id: 'plank', name: 'Plank', sets: 3, reps: 90, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'adv-ul-db',
    name: 'Advanced Upper/Lower (Dumbbells)',
    level: 'ADVANCED',
    equipment: 'DUMBBELLS',
    goal: 'GAIN_MUSCLE',
    routinesCount: 6,
    workouts: [
      {
        dayName: 'Workout A: Upper Body Strength',
        category: 'Upper',
        duration: 45,
        exercises: [
          { id: 'db-bench-press', name: 'Dumbbell Bench Press', sets: 4, reps: 8, weight: '24' },
          { id: 'db-row', name: 'Dumbbell Row', sets: 4, reps: 8, weight: '24' },
          { id: 'db-shoulder-press', name: 'Dumbbell Seated Shoulder Press', sets: 3, reps: 8, weight: '18' },
          { id: 'db-rear-fly', name: 'Dumbbell Rear Delt Fly', sets: 3, reps: 12, weight: '10' }
        ]
      },
      {
        dayName: 'Workout B: Lower Body Strength',
        category: 'Lower',
        duration: 45,
        exercises: [
          { id: 'db-goblet-squat', name: 'Dumbbell Goblet Squat', sets: 4, reps: 10, weight: '30' },
          { id: 'db-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', sets: 4, reps: 10, weight: '26' },
          { id: 'db-lunge', name: 'Dumbbell Lunges', sets: 3, reps: 10, weight: '18' },
          { id: 'db-calf-raise', name: 'Dumbbell Standing Calf Raise', sets: 3, reps: 15, weight: '22' }
        ]
      },
      {
        dayName: 'Workout C: Upper Body Volume',
        category: 'Upper',
        duration: 45,
        exercises: [
          { id: 'db-incline-press', name: 'Dumbbell Incline Bench Press', sets: 4, reps: 12, weight: '20' },
          { id: 'db-chest-fly', name: 'Dumbbell Chest Flys', sets: 3, reps: 12, weight: '14' },
          { id: 'db-curl', name: 'Dumbbell Incline Curl', sets: 3, reps: 12, weight: '12' },
          { id: 'db-overhead-extension', name: 'Dumbbell Overhead Extension', sets: 3, reps: 12, weight: '14' }
        ]
      },
      {
        dayName: 'Workout D: Lower Body Volume',
        category: 'Lower',
        duration: 45,
        exercises: [
          { id: 'db-squat', name: 'Dumbbell Squats', sets: 4, reps: 12, weight: '24' },
          { id: 'db-step-up', name: 'Dumbbell Step-Ups', sets: 4, reps: 10, weight: '16' },
          { id: 'db-glute-bridge', name: 'Dumbbell Glute Bridges', sets: 3, reps: 15, weight: '28' },
          { id: 'leg-raise', name: 'Hanging Leg Raises', sets: 3, reps: 15, weight: '0' }
        ]
      },
      {
        dayName: 'Workout E: Core & Arms Focus',
        category: 'Arms & Core',
        duration: 40,
        exercises: [
          { id: 'db-hammer-curl', name: 'Dumbbell Hammer Curl', sets: 4, reps: 12, weight: '12' },
          { id: 'db-kickback', name: 'Dumbbell Tricep Kickback', sets: 4, reps: 12, weight: '10' },
          { id: 'plank', name: 'Plank with Shoulder Taps', sets: 3, reps: 24, weight: '0' },
          { id: 'russian-twist', name: 'Dumbbell Russian Twist', sets: 3, reps: 20, weight: '8' }
        ]
      },
      {
        dayName: 'Workout F: Conditioning Blend',
        category: 'Conditioning',
        duration: 45,
        exercises: [
          { id: 'db-thruster', name: 'Dumbbell Thruster', sets: 3, reps: 12, weight: '14' },
          { id: 'db-renegade-row', name: 'Dumbbell Renegade Row', sets: 3, reps: 12, weight: '18' },
          { id: 'mountain-climber', name: 'Mountain Climbers', sets: 3, reps: 40, weight: '0' },
          { id: 'jump-squat', name: 'Bodyweight Jump Squat', sets: 3, reps: 15, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'adv-ppl-db',
    name: 'Advanced Push/Pull/Legs (Dumbbells)',
    level: 'ADVANCED',
    equipment: 'DUMBBELLS',
    goal: 'GAIN_MUSCLE',
    routinesCount: 6,
    workouts: [
      {
        dayName: 'Push A: Strength emphasis',
        category: 'Push',
        duration: 45,
        exercises: [
          { id: 'db-bench-press', name: 'Dumbbell Bench Press', sets: 4, reps: 8, weight: '24' },
          { id: 'db-incline-press', name: 'Dumbbell Incline Bench Press', sets: 4, reps: 10, weight: '20' },
          { id: 'db-shoulder-press', name: 'Dumbbell Seated Shoulder Press', sets: 3, reps: 8, weight: '18' },
          { id: 'db-overhead-extension', name: 'Dumbbell Overhead Extension', sets: 3, reps: 12, weight: '14' }
        ]
      },
      {
        dayName: 'Pull A: Upper Back focus',
        category: 'Pull',
        duration: 45,
        exercises: [
          { id: 'db-row-chest', name: 'Chest Supported Dumbbell Row', sets: 4, reps: 10, weight: '22' },
          { id: 'db-rear-fly', name: 'Dumbbell Rear Delt Fly', sets: 3, reps: 12, weight: '10' },
          { id: 'db-hammer-curl', name: 'Dumbbell Hammer Curl', sets: 3, reps: 12, weight: '14' },
          { id: 'db-shrugs', name: 'Dumbbell Shrugs', sets: 3, reps: 12, weight: '24' }
        ]
      },
      {
        dayName: 'Legs A: Quad & Calf focus',
        category: 'Legs',
        duration: 50,
        exercises: [
          { id: 'db-squat', name: 'Dumbbell Squats', sets: 4, reps: 12, weight: '26' },
          { id: 'db-step-up', name: 'Dumbbell Step-Ups', sets: 3, reps: 10, weight: '18' },
          { id: 'db-calf-raise', name: 'Standing Calf Raise', sets: 3, reps: 15, weight: '22' },
          { id: 'plank', name: 'Plank Hold', sets: 3, reps: 90, weight: '0' }
        ]
      },
      {
        dayName: 'Push B: Shoulder & Tricep focus',
        category: 'Push',
        duration: 45,
        exercises: [
          { id: 'db-shoulder-press-heavy', name: 'Dumbbell Shoulder Press (Heavy)', sets: 4, reps: 8, weight: '20' },
          { id: 'db-incline-fly', name: 'Dumbbell Incline Chest Fly', sets: 3, reps: 12, weight: '14' },
          { id: 'db-lateral-raise', name: 'Dumbbell Lateral Raise', sets: 3, reps: 12, weight: '10' },
          { id: 'db-kickback', name: 'Dumbbell Tricep Kickback', sets: 3, reps: 12, weight: '12' }
        ]
      },
      {
        dayName: 'Pull B: Lat & Bicep focus',
        category: 'Pull',
        duration: 45,
        exercises: [
          { id: 'db-row', name: 'One-Arm Dumbbell Row', sets: 4, reps: 10, weight: '24' },
          { id: 'db-pullover', name: 'Dumbbell Pullover', sets: 3, reps: 12, weight: '18' },
          { id: 'db-incline-curl', name: 'Dumbbell Incline Bicep Curl', sets: 3, reps: 12, weight: '12' },
          { id: 'db-reverse-curl', name: 'Dumbbell Reverse Curl', sets: 3, reps: 12, weight: '10' }
        ]
      },
      {
        dayName: 'Legs B: Posterior Chain emphasis',
        category: 'Legs',
        duration: 50,
        exercises: [
          { id: 'db-romanian-deadlift', name: 'Dumbbell Romanian Deadlift', sets: 4, reps: 12, weight: '24' },
          { id: 'db-glute-bridge', name: 'Dumbbell Glute Bridge', sets: 4, reps: 15, weight: '28' },
          { id: 'db-lunge', name: 'Dumbbell Lunges', sets: 3, reps: 10, weight: '16' },
          { id: 'bicycle-crunches', name: 'Bicycle Crunches', sets: 3, reps: 30, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'adv-fb-gym',
    name: 'Advanced Full-Body (Gym Equipment)',
    level: 'ADVANCED',
    equipment: 'GYM',
    goal: 'STRENGTH',
    routinesCount: 5,
    workouts: [
      {
        dayName: 'Workout 1: Strength A Focus',
        category: 'Workout A',
        duration: 55,
        exercises: [
          { id: 'squat', name: 'Barbell Squat', sets: 4, reps: 6, weight: '100' },
          { id: 'bench-press', name: 'Barbell Bench Press', sets: 4, reps: 6, weight: '80' },
          { id: 'barbell-row', name: 'Barbell Row', sets: 4, reps: 8, weight: '60' },
          { id: 'dips', name: 'Weighted Chest Dips', sets: 3, reps: 8, weight: '10' }
        ]
      },
      {
        dayName: 'Workout 2: Strength B Focus',
        category: 'Workout B',
        duration: 55,
        exercises: [
          { id: 'deadlift', name: 'Barbell Deadlift', sets: 4, reps: 5, weight: '120' },
          { id: 'overhead-press', name: 'Barbell Overhead Press', sets: 4, reps: 6, weight: '45' },
          { id: 'weighted-pullup', name: 'Weighted Pull-up', sets: 4, reps: 6, weight: '10' },
          { id: 'plank', name: 'Weighted Plank', sets: 3, reps: 60, weight: '10' }
        ]
      },
      {
        dayName: 'Workout 3: Volume A Focus',
        category: 'Workout C',
        duration: 50,
        exercises: [
          { id: 'bench-press-vol', name: 'Barbell Bench Press (Volume)', sets: 4, reps: 10, weight: '70' },
          { id: 'cable-row', name: 'Seated Cable Row', sets: 4, reps: 10, weight: '50' },
          { id: 'squat-vol', name: 'Barbell Squat (Volume)', sets: 4, reps: 10, weight: '80' },
          { id: 'bicep-curl', name: 'Barbell Bicep Curl', sets: 3, reps: 12, weight: '30' }
        ]
      },
      {
        dayName: 'Workout 4: Volume B Focus',
        category: 'Workout D',
        duration: 50,
        exercises: [
          { id: 'front-squat', name: 'Barbell Front Squat', sets: 4, reps: 8, weight: '60' },
          { id: 'incline-bench-press', name: 'Incline Bench Press', sets: 4, reps: 10, weight: '45' },
          { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 4, reps: 10, weight: '55' },
          { id: 'tricep-extension', name: 'Cable Tricep Pushdown', sets: 3, reps: 12, weight: '25' }
        ]
      },
      {
        dayName: 'Workout 5: Power Focus',
        category: 'Workout E',
        duration: 50,
        exercises: [
          { id: 'clean-press', name: 'Barbell Power Clean & Press', sets: 4, reps: 5, weight: '40' },
          { id: 'thrusters', name: 'Barbell Thrusters', sets: 4, reps: 8, weight: '30' },
          { id: 'hanging-leg-raise', name: 'Hanging Leg Raises', sets: 3, reps: 15, weight: '0' },
          { id: 'burpees', name: 'Burpees', sets: 3, reps: 15, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'adv-ppl-gym',
    name: 'Advanced Push/Pull/Legs (Gym Equipment)',
    level: 'ADVANCED',
    equipment: 'GYM',
    goal: 'GAIN_MUSCLE',
    routinesCount: 6,
    workouts: [
      {
        dayName: 'Push A: Chest priority',
        category: 'Push',
        duration: 50,
        exercises: [
          { id: 'bench-press', name: 'Barbell Bench Press', sets: 4, reps: 6, weight: '85' },
          { id: 'incline-db-press', name: 'Dumbbell Incline Bench Press', sets: 4, reps: 8, weight: '25' },
          { id: 'overhead-press', name: 'Barbell Overhead Press', sets: 3, reps: 8, weight: '45' },
          { id: 'dips', name: 'Chest Dips', sets: 3, reps: 10, weight: '0' }
        ]
      },
      {
        dayName: 'Pull A: Width priority',
        category: 'Pull',
        duration: 50,
        exercises: [
          { id: 'weighted-pullups', name: 'Weighted Pull-ups', sets: 4, reps: 6, weight: '10' },
          { id: 'barbell-row', name: 'Barbell Row', sets: 4, reps: 8, weight: '65' },
          { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 3, reps: 10, weight: '55' },
          { id: 'db-curl', name: 'Dumbbell Hammer Curl', sets: 3, reps: 12, weight: '14' }
        ]
      },
      {
        dayName: 'Legs A: Squat emphasis',
        category: 'Legs',
        duration: 55,
        exercises: [
          { id: 'squat', name: 'Barbell Squat', sets: 4, reps: 6, weight: '110' },
          { id: 'hack-squat', name: 'Hack Squat Machine', sets: 3, reps: 10, weight: '80' },
          { id: 'leg-curl', name: 'Lying Leg Curl', sets: 3, reps: 12, weight: '35' },
          { id: 'calf-raise', name: 'Standing Calf Raise', sets: 3, reps: 15, weight: '50' }
        ]
      },
      {
        dayName: 'Push B: Shoulder priority',
        category: 'Push',
        duration: 50,
        exercises: [
          { id: 'overhead-press-heavy', name: 'Barbell Overhead Press (Heavy)', sets: 4, reps: 6, weight: '50' },
          { id: 'incline-bench-press', name: 'Incline Bench Press', sets: 4, reps: 8, weight: '60' },
          { id: 'lateral-raise', name: 'Dumbbell Lateral Raise', sets: 3, reps: 12, weight: '12' },
          { id: 'cable-pushdown', name: 'Cable Tricep Pushdown', sets: 3, reps: 12, weight: '25' }
        ]
      },
      {
        dayName: 'Pull B: Thickness priority',
        category: 'Pull',
        duration: 50,
        exercises: [
          { id: 'deadlift', name: 'Barbell Deadlift', sets: 4, reps: 5, weight: '130' },
          { id: 'seated-row', name: 'Seated Cable Row', sets: 4, reps: 8, weight: '60' },
          { id: 'face-pulls', name: 'Cable Face Pulls', sets: 3, reps: 15, weight: '20' },
          { id: 'preacher-curl', name: 'Preacher Curl Machine', sets: 3, reps: 12, weight: '25' }
        ]
      },
      {
        dayName: 'Legs B: Deadlift/Posterior emphasis',
        category: 'Legs',
        duration: 55,
        exercises: [
          { id: 'stiff-leg-deadlift', name: 'Stiff-Legged Deadlift', sets: 4, reps: 8, weight: '90' },
          { id: 'leg-press', name: 'Leg Press Machine', sets: 4, reps: 10, weight: '150' },
          { id: 'leg-extension', name: 'Leg Extension', sets: 3, reps: 12, weight: '50' },
          { id: 'plank', name: 'Weighted Plank', sets: 3, reps: 60, weight: '15' }
        ]
      }
    ]
  },
  {
    id: 'adv-ul-gym',
    name: 'Advanced Upper/Lower (Gym Equipment)',
    level: 'ADVANCED',
    equipment: 'GYM',
    goal: 'GAIN_MUSCLE',
    routinesCount: 6,
    workouts: [
      {
        dayName: 'Upper A Focus',
        category: 'Upper',
        duration: 50,
        exercises: [
          { id: 'bench-press', name: 'Barbell Bench Press', sets: 4, reps: 6, weight: '85' },
          { id: 'barbell-row', name: 'Barbell Row', sets: 4, reps: 8, weight: '65' },
          { id: 'overhead-press', name: 'Barbell Overhead Press', sets: 3, reps: 8, weight: '45' },
          { id: 'weighted-chinup', name: 'Weighted Chin-ups', sets: 3, reps: 8, weight: '10' }
        ]
      },
      {
        dayName: 'Lower A Focus',
        category: 'Lower',
        duration: 50,
        exercises: [
          { id: 'squat', name: 'Barbell Squat', sets: 4, reps: 6, weight: '110' },
          { id: 'romanian-deadlift', name: 'Barbell Romanian Deadlift', sets: 4, reps: 8, weight: '80' },
          { id: 'lunges', name: 'Barbell Walking Lunges', sets: 3, reps: 10, weight: '40' },
          { id: 'calf-raise', name: 'Seated Calf Raise', sets: 3, reps: 15, weight: '40' }
        ]
      },
      {
        dayName: 'Upper B Focus',
        category: 'Upper',
        duration: 50,
        exercises: [
          { id: 'incline-bench-press', name: 'Incline Bench Press', sets: 4, reps: 8, weight: '70' },
          { id: 'tbar-row', name: 'T-Bar Row Machine', sets: 4, reps: 8, weight: '50' },
          { id: 'lateral-raise', name: 'Dumbbell Lateral Raise', sets: 3, reps: 12, weight: '12' },
          { id: 'tricep-extension', name: 'Cable Overhead Tricep Extension', sets: 3, reps: 12, weight: '25' }
        ]
      },
      {
        dayName: 'Lower B Focus',
        category: 'Lower',
        duration: 50,
        exercises: [
          { id: 'deadlift', name: 'Barbell Deadlift', sets: 4, reps: 5, weight: '125' },
          { id: 'hack-squat', name: 'Hack Squat Machine', sets: 3, reps: 10, weight: '90' },
          { id: 'leg-curl', name: 'Lying Leg Curl', sets: 3, reps: 12, weight: '40' },
          { id: 'plank', name: 'Plank Hold', sets: 3, reps: 90, weight: '0' }
        ]
      },
      {
        dayName: 'Upper C Focus',
        category: 'Upper',
        duration: 45,
        exercises: [
          { id: 'db-flat-press', name: 'Dumbbell Bench Press', sets: 4, reps: 10, weight: '24' },
          { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 4, reps: 10, weight: '50' },
          { id: 'cable-cross', name: 'Cable Crossover', sets: 3, reps: 12, weight: '20' },
          { id: 'preacher-curl', name: 'Preacher Curl Machine', sets: 3, reps: 12, weight: '25' }
        ]
      },
      {
        dayName: 'Lower C Focus',
        category: 'Lower',
        duration: 45,
        exercises: [
          { id: 'leg-press', name: 'Leg Press Machine', sets: 4, reps: 12, weight: '140' },
          { id: 'leg-extension', name: 'Leg Extension', sets: 3, reps: 12, weight: '45' },
          { id: 'glute-bridge', name: 'Barbell Glute Bridge', sets: 3, reps: 12, weight: '80' },
          { id: 'crunches', name: 'Ab Crunches', sets: 3, reps: 20, weight: '0' }
        ]
      }
    ]
  },
  {
    id: 'phul-6day-gym',
    name: '6-Day PHUL (Gym Equipment)',
    level: 'ADVANCED',
    equipment: 'GYM',
    goal: 'GAIN_MUSCLE',
    routinesCount: 6,
    workouts: [
      {
        dayName: 'Day 1: Upper Power Focus',
        category: 'Upper Power',
        duration: 50,
        exercises: [
          { id: 'bench-press', name: 'Barbell Bench Press', sets: 4, reps: 5, weight: '70' },
          { id: 'barbell-row', name: 'Barbell Row', sets: 4, reps: 5, weight: '50' },
          { id: 'overhead-press', name: 'Barbell Overhead Press', sets: 3, reps: 6, weight: '35' },
          { id: 'skull-crushers', name: 'Barbell Skull Crushers', sets: 3, reps: 8, weight: '25' }
        ]
      },
      {
        dayName: 'Day 2: Lower Power Focus',
        category: 'Lower Power',
        duration: 50,
        exercises: [
          { id: 'squat', name: 'Barbell Squat', sets: 4, reps: 5, weight: '85' },
          { id: 'deadlift', name: 'Barbell Deadlift', sets: 4, reps: 5, weight: '100' },
          { id: 'leg-press', name: 'Leg Press', sets: 3, reps: 8, weight: '120' },
          { id: 'calf-raise', name: 'Standing Calf Raise', sets: 3, reps: 10, weight: '60' }
        ]
      },
      {
        dayName: 'Day 3: Push Hypertrophy Focus',
        category: 'Push',
        duration: 45,
        exercises: [
          { id: 'incline-bench-press', name: 'Incline Bench Press', sets: 4, reps: 10, weight: '45' },
          { id: 'db-fly', name: 'Dumbbell Chest Fly', sets: 3, reps: 12, weight: '12' },
          { id: 'db-shoulder-press', name: 'Dumbbell Shoulder Press', sets: 3, reps: 10, weight: '16' },
          { id: 'tricep-extension', name: 'Cable Tricep Pushdown', sets: 3, reps: 12, weight: '20' }
        ]
      },
      {
        dayName: 'Day 4: Pull Hypertrophy Focus',
        category: 'Pull',
        duration: 45,
        exercises: [
          { id: 'lat-pulldown', name: 'Lat Pulldown', sets: 4, reps: 10, weight: '45' },
          { id: 'seated-row', name: 'Seated Cable Row', sets: 3, reps: 10, weight: '45' },
          { id: 'lateral-raise', name: 'Dumbbell Lateral Raise', sets: 3, reps: 12, weight: '10' },
          { id: 'bicep-curl', name: 'Dumbbell Bicep Curl', sets: 3, reps: 12, weight: '12' }
        ]
      },
      {
        dayName: 'Day 5: Legs Hypertrophy Focus',
        category: 'Legs',
        duration: 50,
        exercises: [
          { id: 'squat-vol', name: 'Barbell Squat', sets: 4, reps: 10, weight: '70' },
          { id: 'leg-curl', name: 'Lying Leg Curl', sets: 4, reps: 12, weight: '30' },
          { id: 'db-lunge', name: 'Dumbbell Lunges', sets: 3, reps: 10, weight: '14' },
          { id: 'calf-raise-seated', name: 'Seated Calf Raise', sets: 3, reps: 15, weight: '30' }
        ]
      },
      {
        dayName: 'Day 6: Arms & Core Focus',
        category: 'Arms & Core',
        duration: 40,
        exercises: [
          { id: 'db-hammer-curl', name: 'Dumbbell Hammer Curl', sets: 4, reps: 12, weight: '12' },
          { id: 'db-kickback', name: 'Dumbbell Tricep Kickback', sets: 4, reps: 12, weight: '10' },
          { id: 'hanging-leg-raise', name: 'Hanging Leg Raises', sets: 3, reps: 15, weight: '0' },
          { id: 'plank', name: 'Plank', sets: 3, reps: 60, weight: '0' }
        ]
      }
    ]
  }
];
