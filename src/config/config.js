export const AUTH_CONFIG = {
  enableLegacyWebviewLogin: false,
  googleWebClientId: '98784636409-tjgc2nab2tqpfrppuivhie79ulr0v8os.apps.googleusercontent.com', // Placeholder web client ID
  googleIosClientId: '98784636409-placeholder-ios-client-id.apps.googleusercontent.com', // Placeholder iOS client ID
  databaseConnection: 'Username-Password-Authentication',
};

export const Strings = {

  // Auth / Login Configuration
  Auth: {
    login: {
      welcome: 'Welcome to Swappfit',
      subtitle: 'Your fitness journey starts here',
      button: 'CONTINUE',
      legal: {
        prefix: 'By continuing, you agree to our ',
        terms: 'Terms',
        conjunction: ' & ',
        privacy: 'Privacy Policy',
      },
    },
    alerts: {
      loginError: 'Login Error',
      loginFailed: 'Login failed',
    },
  },
  // Onboarding / MemberProfile Configuration
  Onboarding: {
    steps: [
      { field: 'name', type: 'text', title: "WHAT'S YOUR NAME?", placeholder: 'Type here...' },
      { field: 'email', type: 'email', title: "WHAT'S YOUR EMAIL?", placeholder: 'your.email@example.com' },
      { field: 'age', type: 'number', title: 'HOW OLD ARE YOU?', placeholder: 'Type here...' },
      { field: 'gender', type: 'gender', title: "WHAT'S YOUR GENDER?" },
      { field: 'weight', type: 'weight', title: "WHAT'S YOUR CURRENT WEIGHT?", placeholder: 'Enter weight' },
      { field: 'height', type: 'height', title: 'WHAT\'S YOUR HEIGHT?', placeholder: 'Enter height' },
      { field: 'fitnessGoal', type: 'goal', title: 'WHAT\'S YOUR GOAL?' },
    ],
    goals: [
      { title: 'Lose Weight', subtitle: 'Reach your ideal weight', icon: '⚖️' },
      { title: 'Build Muscle', subtitle: 'Get stronger and toned', icon: '💪' },
      { title: 'Improve Endurance', subtitle: 'Boost your stamina', icon: '🏃' },
      { title: 'Stay Active', subtitle: 'Maintain a healthy lifestyle', icon: '❤️' },
    ],
    ui: {
      previous: 'Previous',
      skip: 'Skip',
      next: 'Next',
      finish: 'Finish',
      gender: {
        male: 'Male',
        female: 'Female',
      },
      bmi: {
        label: 'YOUR CURRENT BMI',
        placeholder: '00.0',
        message: 'You may need to do more workout to be better',
      },
    },
    validation: {
      required: 'Required Field',
      requiredMessage: 'Please fill out this field to continue.',
      invalidAge: 'Invalid Age',
      invalidAgeMessage: 'Please enter a valid age between 1 and 120.',
      invalidEmail: 'Invalid Email',
      invalidEmailMessage: 'Please enter a valid email address.',
    },
    alerts: {
      setupFailed: 'Profile Setup Failed',
      genericError: 'An error occurred. Please try again.',
    },
  },
  // activity Configuration
  Activity: {
    header: {
      title: 'Dashboard',
    },
    googleFit: {
      title: 'Google Fit',
      statusConnected: 'Connected',
      statusNotConnected: 'Not Connected',
      btnConnect: 'Connect',
      btnSync: 'Sync Data',
      btnConnecting: 'Connecting...',
      alerts: {
        success: 'Success',
        connectSuccessMsg: 'Connected to Google Fit successfully!',
        connectFailTitle: 'Failed',
        connectFailMsg: 'Failed to connect to Google Fit',
        errorTitle: 'Error',
        errorMsg: 'An error occurred while connecting to Google Fit',
        notConnectedTitle: 'Not Connected',
        notConnectedMsg: 'Please connect to Google Fit first',
      },
    },
    heartRate: {
      title: 'Heart Rate',
      unit: 'BPM',
      resting: 'Resting',
      max: 'Max',
      btnStart: 'Start Monitoring',
      btnStop: 'Stop Monitoring',
    },
    lastWorkout: {
      title: 'Last Workout',
      subtitle: 'Summary of your recent activity.',
      labels: {
        duration: 'Duration',
        calories: 'Calories',
        distance: 'Distance',
      },
      stats: {
        min: 'min',
        kcal: 'kcal',
        km: 'km',
      },
      actions: {
        logWorkout: 'Log Workout',
        stats: 'Stats',
      },
    },
    dailyMacros: {
      title: 'Daily Macros',
      subtitle: 'Your macronutrient intake for the day.',
      macros: {
        protein: 'Protein',
        carbs: 'Carbs',
        fats: 'Fats',
      },
      actions: {
        logMeal: 'Log Meal',
        stats: 'Stats',
      },
    },
    status: {
      workoutActive: 'Workout Active',
      dietTracking: 'Diet Tracking',
      streak: 'day streak',
    },
  },
  //   dietlog Configuration
  DietLog: {
    header: {
      title: 'Diet Tracker',
      backAccessibility: 'Go back',
    },
    stats: {
      calories: 'Calories',
      food: 'Food',
      exercise: 'Exercise',
      remaining: 'Remaining',
      goal: 'Goal',
      consumed: 'Consumed',
      macros: 'Macros',
    },
    actions: {
      addMeal: '+ Add Meal',
      syncWorkout: 'Sync Workout',
      syncAlertTitle: 'Workout synced',
      syncAlertMsg: (burned) => `${burned} kcal added to exercise`,
    },
    section: {
      title: "Today's Meals",
      loadingText: 'Loading meals...',
      emptyText: (type) => `No items logged for ${type}`,
      itemCount: 'items',
    },
    modal: {
      titleAdd: 'Add Meal',
      titleEdit: 'Edit Meal',
      input: {
        mealName: 'Food name',
        calories: 'Calories',
        protein: 'Protein (g)',
        carbs: 'Carbs (g)',
        fats: 'Fats (g)',
      },
      photo: {
        upload: 'Upload',
        takePhoto: 'Take Photo',
      },
      buttons: {
        cancel: 'Cancel',
        save: 'Add Meal',
        saveChanges: 'Save Changes',
      },
    },
    alerts: {
      validation: {
        title: 'Validation Error',
        msg: 'Please enter at least a meal name and calories.',
      },
      success: {
        title: 'Success',
        addedMsg: 'Meal added successfully! 🎉',
        updatedMsg: 'Meal updated successfully! 🎉',
        deletedMsg: 'Meal deleted successfully!',
      },
      delete: {
        title: 'Delete meal',
        msg: (name) => `Delete ${name}?`,
        confirm: 'Delete',
        cancel: 'Cancel',
      },
      error: {
        title: 'Error',
        fetchFailed: 'Failed to fetch diet logs. Please try again.',
        deleteFailed: 'Failed to delete meal. Please try again.',
        generic: 'Operation failed. Please check your internet connection.',
        warning: 'Warning',
      },
    },
    mealTypes: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'],
  },
  WorkoutLog: {
    categories: [
      { id: 'all', title: 'All' },
      { id: 'favorites', title: 'Favorites' },
      { id: 'cardio', title: 'Cardio' },
      { id: 'back', title: 'Back' },
      { id: 'chest', title: 'Chest' },
      { id: 'shoulders', title: 'Shoulders' },
    ],
    header: {
      logTitle: 'Workout Log',
      selectTitle: 'Select Exercises',
      doneBtn: 'Done',
    },
    search: {
      placeholder: 'Search...',
    },
    main: {
      videoTitle: "Hamstrings,\nChest, Biceps",
      workoutType: "🔧 Custom Workout",
      equipment: 'Equipment',
      exercises: 'Exercises',
      addBtn: 'Add',
      emptyTitle: 'No exercises added yet.',
      emptySubtitle: "Tap 'Add' to build your workout.",
      startBtn: 'Start Workout',
      // Moved from hardcoded component
      videoSource: require('../assets/video/2376809-hd_1920_1080_24fps.mp4'),
    },
    alerts: {
      saveSuccess: 'Success!',
      saveMsg: 'Your workout has been saved.',
      saveErrorTitle: 'Error',
      saveErrorMsg: 'Could not save your workout session.',
      removeExerciseTitle: 'Remove Exercise',
      removeExerciseMsg: 'Are you sure you want to remove this exercise from your workout?',
      removeSuccess: 'Success',
      removeSuccessMsg: 'Exercise removed from workout',
      removeError: 'Could not remove exercise from workout',
      removeErrorDetail: 'Cannot remove exercise: missing log ID. Please refresh and try again.',
      deleteSessionTitle: 'Delete Workout',
      deleteSessionMsg: 'Are you sure you want to delete this workout session?',
      deleteSuccess: 'Workout session deleted',
      deleteError: 'Could not delete workout session',
      noSessionError: 'No session to delete',
      genericError: 'Error',
    },
    // Added missing Actions to fix crashes
    actions: {
      cancel: 'Cancel',
      confirm: 'Delete', // Renamed from 'Confirm' to be clearer for deletion
    },
    tags: {
      default: 'General',
    },
    // Moved from hardcoded component
    tagColors: {
      default: '#452829', chest: '#FF5252', glutes: '#FFA000', quadriceps: '#FFA000',
      shoulders: '#FF6B35', back: '#00C8C8', triceps: '#FF5252', biceps: '#9C27B0',
      core: '#2196F3', cardio: '#4CAF50',
    },
    // Moved from hardcoded component
    equipmentList: [
      { id: 1, source: require('../assets/image/eq1.jpg') },
      { id: 2, source: require('../assets/image/eq2.jpg') },
      { id: 3, source: require('../assets/image/eq3.jpg') },
      { id: 4, source: require('../assets/image/eq4.jpg') },
      { id: 5, source: require('../assets/image/eq5.jpg') },
      { id: 6, source: require('../assets/image/eq6.jpg') }
    ],
    // Data updated to include image paths directly
    data: [
      {
        name: 'Bench Press',
        type: 'chest',
        equipment: ['Barbell'],
        difficulty: 'Intermediate',
        image: require('../assets/image/chest.jpg')
      },
      {
        name: 'Backward Lunge',
        type: 'glutes',
        equipment: ['Bodyweight'],
        difficulty: 'Beginner',
        image: require('../assets/image/gultes.jpg')
      },
      {
        name: 'Arm Circles',
        type: 'shoulders',
        equipment: ['Bodyweight'],
        difficulty: 'Beginner',
        image: require('../assets/image/arm.jpg')
      },
      {
        name: 'Pull Up',
        type: 'back',
        equipment: ['Bodyweight'],
        difficulty: 'Intermediate',
        image: require('../assets/image/pullup.jpg')
      },
      {
        name: 'Pike Push-Up',
        type: 'shoulders',
        equipment: ['Bodyweight'],
        difficulty: 'Intermediate',
        image: require('../assets/image/pickpush.jpg')
      },
      {
        name: 'Front raise',
        type: 'shoulders',
        equipment: ['Dumbbell'],
        difficulty: 'Intermediate',
        image: require('../assets/image/frontraise.jpg')
      },
    ],
  },
  //   ollama Configuration
  Ollama: {
    header: {
      title: '🤖 llava:7b Chat',
    },
    sidebar: {
      title: 'Chat History',
      newChatBtn: 'New Chat',
      untitled: 'Untitled Chat',
    },
    chat: {
      welcomeTitle: '👋 Welcome to AI Chat',
      welcomeSubtext1: "I'm llava:7b! I can see images and help with anything.",
      welcomeSubtext2: '📷 Send photos with questions for visual analysis',
      imageProgress: '📷 Image selection in progress...',
      inputPlaceholder: "Type your message or add an image...",
      thinking: 'AI is thinking...',
    },
    alerts: {
      deleteChatTitle: 'Delete Chat',
      deleteChatMsg: 'Are you sure you want to delete this chat?',
      deleteSuccess: 'Chat deleted successfully',
      clearChatTitle: 'Clear Chat',
      clearChatMsg: 'Are you sure you want to clear this chat?',
      clearBtn: 'Clear',
      errorSelectChat: 'Failed to select chat',
      errorCreateChat: 'Failed to create new chat',
      errorDeleteChat: 'Failed to delete chat',
      imageSelectionTitle: 'Select Image',
      imageSelectionMsg: 'Choose an option',
      cameraOption: '📷 Take Photo',
      galleryOption: '🖼️ Choose from Gallery',
      cameraPermission: 'Permission to access camera is required!',
      cameraError: 'Failed to open camera',
      galleryError: 'Failed to open gallery',
      genericError: 'Error',
      chatNotFound: 'Chat not found',
    },
    common: {
      cancel: 'Cancel',
      delete: 'Delete',
    },
  },
  //   DietStats Configuration
  DietStats: {
    header: {
      title: 'Diet Stats',
    },
    summary: {
      calories: 'Calories',
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
      unitCal: 'cal',
      unitGram: 'g',
      goal: 'goal',
    },
    tabs: ['Today', 'Yesterday', '7D Avg'],
    macros: {
      protein: 'Protein',
      carbs: 'Carbs',
      fat: 'Fat',
    },
    chart: {
      title: 'Weekly Calories',
    },
    fabIcon: '🤖',
  },
  //   WorkoutStats Configuration
  WorkoutStats: {
    header: {
      title: 'Dashboard',
    },
    googleFit: {
      title: 'Google Fit',
      connected: 'Connected',
      syncButton: 'Sync Data',
    },
    heartRate: {
      title: 'Heart Rate',
      bpm: 'BPM',
      resting: 'Resting',
      max: 'Max',
      restingIcon: '🧘',
      maxIcon: '📈',
    },
    stats: {
      calories: 'Calories',
      workouts: 'Workouts',
      streak: 'Day Streak',
    },
    progress: {
      title: 'Monthly Goal',
      complete: '% complete — ',
      toGo: 'cal to go',
    },
    tabs: ['Week', 'Month', 'All Time'],
    recent: {
      title: 'Recent Workouts',
      unitCal: 'cal',
      unitMin: 'min',
      unitHr: 'hr',
    },
    fabIcon: '🤖',
    // Chart labels specific to views
    chartLabels: {
      week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      month: ['W1', 'W2', 'W3', 'W4'],
      allTime: ['2022', '2023', '2024', '2025'],
    },
  },
  //  Community Configuration
  Community: {
    header: {
      title: 'Community',
    },
    tabs: [
      { id: 'posts', title: 'Community Posts' },
      { id: 'trainers', title: 'Find Trainers' },
    ],
    postModal: {
      title: 'Create a New Post',
      imagePicker: 'Select an Image',
      captionPlaceholder: 'Write a caption...',
      postButton: 'Post',
      cancelButton: 'Cancel',
    },
    post: {
      emptyList: 'No posts yet. Be the first to share!',
      anonymous: 'Anonymous',
      addCommentPlaceholder: 'Add a comment...',
      you: 'You',
      viewAllComments: 'View all',
      commentsCount: 'comments',
    },
    alerts: {
      fetchError: 'Could not fetch community posts.',
      likeError: 'Could not update like status.',
      commentError: 'Could not add your comment.',
      incompletePost: 'Incomplete Post',
      incompletePostMsg: 'Please select an image and write a caption.',
      uploadErrorTitle: 'Upload Error',
      uploadErrorMsg: 'Could not create post.',
      genericError: 'Error',
      imageError: 'An unknown error occurred',
      permissions: {
        title: 'Permission Required',
        message: 'Please grant camera and storage permissions to select images. You can enable them in your device settings.',
        settings: 'Settings',
        cancel: 'Cancel',
      },
    },
  },
  //  Find Trainers Configuration
  FindTrainers: {
    loading: 'Loading Trainers...',
    error: 'Failed to load trainers. Please try again later.',
    empty: 'No trainers found at moment.',
    retry: 'Try Again',
    card: {
      online: 'Online',
      yearsExp: 'years experience',
      viewProfileBtn: 'View Profile & Plans',
      defaultSpecialty: 'Fitness Expert',
      defaultBio: 'No bio available.',
    },
    alerts: {
      loadProfileError: 'Could not load trainer details. Please try again.',
    },
  },
  //  TrainerModal (Quick View) Configuration
  TrainerModal: {
    reviewText: 'reviews',
    viewAllBtn: 'View all',
    sections: {
      about: 'About',
      gallery: 'Gallery',
      plans: 'Training Plans',
    },
    noPlans: 'This trainer has not listed any plans yet.',
    contactTrainer: 'Contact Trainer',
    subscribed: {
      title: 'You have an active subscription with this trainer.',
      badgeText: 'Active',
    },
    plan: {
      defaultDesc: 'Custom training plan',
      subscribeBtn: 'Subscribe',
    },
    alerts: {
      subscriptionError: 'Could not start subscription. Please try again later.',
      subscribeError: 'Could not initiate subscription.',
    },
    viewFullProfile: 'View Full Profile',
  },
  //  TrainerDetailsModal Configuration
  TrainerDetailsModal: {
    defaultTags: ['Strength Training', 'Yoga', 'Nutrition'],
    about: 'About',
    gallery: 'Gallery',
    trainingPlans: 'Training Plans',
    noPlans: 'No plans available for this trainer',
    subscribedMsg: 'You are subscribed to this trainer.',
    subscribeBtn: 'Subscribe',
    startChatBtn: 'Start Chat',
    viewFullProfileBtn: 'View Full Profile',
    yearsExp: 'years of experience',
    reviewsCount: 'reviews',
    alerts: {
      authRequired: 'Authentication Required',
      authMsg: 'Please log in to start a conversation.',
      sessionExpired: 'Session Expired',
      sessionExpiredMsg: 'Your session may have expired. Please log in again.',
      sessionExpiredMsg2: 'Your session has expired. Please log in again.',
      conversationError: 'Could not start conversation. Please try again.',
      unexpectedError: 'An unexpected error occurred. Please try again.',
      genericError: 'Error',
    },
  },
  //  ChatScreen Configuration
  ChatScreen: {
    header: {
      online: 'Online',
    },
    input: {
      placeholder: 'Type a message...',
    },
    status: {
      connecting: 'Connecting...',
      error: 'Connection error',
    },
    auth: {
      required: 'Authentication Required',
      requiredMsg: 'You need to log in to continue chatting.',
      tokenNotFound: 'Your session may have expired. Please log in again.',
      tokenExpired: 'Your session has expired. Please log in again.',
      loginBtn: 'Log In',
      logoutBtn: 'Cancel',
    },
    alerts: {
      loadError: 'Failed to load messages: ',
      invalidData: 'Received invalid message data. Please try again.',
      serverError: 'Server error. Our team has been notified. Please try again later.',
      notFound: 'Conversation not found or you don\'t have access to it.',
      sendError: 'Failed to send message. Please try again.',
      sendSocketError: 'Failed to initialize chat: ',
      generic: 'Error',
    },
    emptyState: {
      title: 'No messages yet. Start a conversation!',
      loading: 'Loading messages...',
      loginRequired: 'Authentication Required',
      loginSubtext: 'Please log in to continue chatting',
    },
    actions: {
      retry: 'Retry',
      close: 'Close',
    },
  },

  // Providers Configuration
  Providers: {
    List: {
      loading: 'Loading partners...',
      loadMore: 'Load More',
    },
    DetailsModal: {
      alerts: {
        checkInSuccess: 'Check-in Successful!',
        checkInFailed: 'Check-in Failed',
        subscriptionError: 'Could not start subscription. Please try again later.',
        initSubscriptionError: 'Could not initiate subscription.',
        unknownError: 'An unknown error occurred.',
      },
      sections: {
        amenities: 'Amenities',
        plans: 'Membership Plans',
      },
      amenities: {
        swimmingPool: 'Swimming Pool',
        sauna: 'Sauna',
        wifi: 'Free Wi-Fi',
        parking: 'Parking',
        gear: 'Modern Equipment',
      },
      plans: {
        empty: 'This provider has not listed any plans yet.',
        subscribed: 'You have an active membership with this partner.',
        active: 'Active',
        subscribe: 'Subscribe',
        checkIn: 'Check In Now',
        viewDetails: 'View Full Details',
      },
      welcome: (name) => `Welcome to ${name}.`,
    },
  },
  // Location Configuration

  Location: {
    Header: {
      title: 'Camera',
    },
    Permissions: {
      title: 'Permission to use camera',
      message: 'We need your permission to use your camera',
      positive: 'Ok',
      negative: 'Cancel',
    },
    Modes: {
      checkin: 'Check-in',
      checkout: 'Check-out',
      diet: 'Diet Log',
    },
    Alerts: {
      checkinSuccess: 'Success!',
      checkinMessage: 'You have successfully checked in!',
      checkoutSuccess: 'Success!',
      checkoutMessage: 'You have successfully checked out!',
      photoCaptured: 'Photo Captured!',
      mealSuccess: 'Your meal has been logged successfully!',
      saveSuccess: 'Picture saved successfully!',
      error: 'Error',
      takePictureError: 'Failed to take picture',
    },
    Camera: {
      headerSubtitle: (mode) => mode === 'checkin' ? 'Check-in to your partner' : mode === 'checkout' ? 'Check-out from your partner' : 'Log your meal',
      previewTitle: 'Photo Preview',
      previewPlaceholder: '📸',
      previewText: 'Photo captured successfully!',
      retake: 'Retake',
      save: 'Save',
      checkIn: 'Check In Now',
    },
    Instructions: {
      title: 'Instructions',
      checkin: 'Point camera at partner\'s QR code or entrance to check-in',
      checkout: 'Point camera at exit QR code to check-out',
      diet: 'Take a photo of your meal to log it in your diet tracker',
    },
    Filter: {
      title: 'Filter & Sort',
      filterBy: 'Filter By',
      sortBy: 'Sort By',
      options: {
        all: 'All',
        premium: 'Premium',
      },
      sortOptions: {
        distance: 'Distance',
        rating: 'Rating',
      },
      // UPDATED SECTION: Moved reset and apply into 'actions' object
      actions: {
        reset: 'Reset',
        apply: 'Apply Filters',
      },
    },
    List: {
      loading: 'Loading partners...',
      loadMore: 'Load More',
      empty: 'No partners found. Try expanding your search area.',
    },
    GymCard: {
      viewDetails: 'View Full Profile',
      checkIn: 'Check In Now',
      online: 'Online',
      yearsExp: 'years experience',
      defaultSpecialty: 'Fitness Expert',
      defaultBio: 'No bio available.',
      milesAway: 'miles away',
      distanceNotAvailable: 'Distance not available',
      viewDetailsBtn: 'View Full Profile & Plans',
    },
    Permission: {
      title: 'Location Access',
      message: 'Enable location access to discover nearby partners.',
      buttons: {
        skip: 'Skip for now',
        enable: 'Enable Location Access',
      },
      required: 'Location Access Required',
      requiredMsg: 'Enable location to find nearby partners.',
    },
    Search: {
      title: 'Search Partners',
      placeholder: 'Search by name, location...',
    },
    Status: {
      loading: 'Getting your location...',
      nearYou: 'Find Partners Near You',
      actions: { retry: 'Try Again' },
    },
  },

  // Cart Configuration
  Cart: {
    Modal: {
      title: 'My Cart',
    },
    Empty: {
      title: 'Your cart is empty',
      icon: 'cart-outline', // Icon name
    },
    Item: {
      remove: 'Remove',
      quantity: 'Quantity', // Label if needed
    },
    Footer: {
      subtotal: 'Subtotal',
      tax: 'Tax',
      total: 'Total',
    },
    Checkout: {
      button: 'Checkout',
      processing: 'Processing...',
      alerts: {
        processingTitle: 'Processing',
        processingMessage: 'Creating your secure checkout page...',
        urlSuccessTitle: 'Checkout Opened',
        urlSuccessMessage: 'You have been redirected to our secure payment page. Complete your purchase there and you will be redirected back to the app.',
        oneTimeErrorTitle: 'Checkout Failed',
        oneTimeErrorMessage: 'One-time checkout is not enabled. Please contact support or try again later.',
        genericErrorTitle: 'Error',
        genericErrorMessage: 'Could not initiate checkout. Please try again later.',
        linkErrorTitle: 'Error',
        linkErrorMessage: (url) => `Unable to open this URL: ${url}`,
        ok: 'OK',
      },
    },
    Actions: {
      updateErrorTitle: 'Error',
      updateErrorMessage: (msg) => `Could not update item. ${msg}`,
      removeErrorTitle: 'Error',
      removeErrorMessage: (msg) => `Could not remove item. ${msg}`,
    },
  },

  // Store Configuration
  Store: {
    header: {
      title: 'Shop',
    },
    tabs: [
      { id: 'shop', title: 'Shop', icon: 'bag-handle' },
    ],
    categories: {
      all: 'Supplements',
      equipment: 'Apparel',
      electronics: 'Equipment',
      clothing: 'Accessories',
    },
    search: {
      placeholder: 'Search supplements, gear...',
    },
    filter: {
      title: 'Filters & Sort',
      sortByTitle: 'Sort By',
      options: {
        popular: 'Popular',
        priceLowToHigh: 'Price: Low to High',
        priceHighToLow: 'Price: High to Low',
        rating: 'Rating',
        newest: 'Newest',
      },
      applyButton: 'Apply Filters',
    },
    product: {
      actions: {
        addToCart: 'Add to Cart',
        outOfStock: 'Out of Stock',
      },
      states: {
        empty: 'No products found.',
        loadError: 'Failed to load products. Please check your connection.',
        criticalError: 'An unexpected error occurred. Please restart the app.',
      },
    },
    alerts: {
      addToCart: {
        successTitle: 'Success',
        successMessage: (name) => `${name} has been added to your cart.`,
        errorTitle: 'Error',
        errorPrefix: 'Could not add item to cart.',
        genericMessage: 'Please try again later.',
        noResponseMessage: 'No response from server. Please check your connection.',
        defaultMessage: (msg) => msg,
      },
    },
  },

  // Profile Configuration
  Profile: {
    tabs: [
      { id: 'profile', title: 'Profile' },
      { id: 'providers', title: 'My Partners' },
      { id: 'trainers', title: 'Trainers' },
      { id: 'multi-provider', title: 'Multi-Provider' },
    ],
    actions: {
      logout: {
        confirmTitle: 'Confirm Logout',
        confirmMessage: 'Are you sure you want to log out?',
        cancel: 'Cancel',
        confirm: 'Log Out',
      },
      billing: {
        noSubscriptionTitle: 'No Subscription Found',
        noSubscriptionMessage: 'You do not have any active subscriptions to manage.',
        errorTitle: 'Error',
        errorMessage: 'An error occurred. Please try again later.',
      },
    },
    states: {
      loading: 'Loading...',
      fallbackName: 'User',
      retry: 'Try Again',
      errors: {
        loadFailed: 'Failed to load profile.',
        unexpected: 'An unexpected error occurred. Please try again.',
      },
    },
    notifications: {
      overflowLabel: '99+',
    },
  },
  ProvidersTab: {
    sections: {
      myProviders: 'My Partners',
      history: 'All Check-ins',
    },
    emptyState: {
      myProviders: {
        title: 'No partners subscribed',
        subtitle: 'When you subscribe to a partner, it will appear here.',
        action: 'Explore Partners',
      },
      history: {
        title: 'No check-in history',
        subtitle: 'Your check-in history will be displayed here.',
      },
    },
    providerCard: {
      statusPrefix: 'Checked in at',
      actions: {
        checkIn: 'Check In',
        checkOut: 'Check Out',
      },
    },
    historyCard: {
      labels: {
        checkIn: 'Check-in: ',
        checkOut: 'Check-out: ',
        active: 'Currently checked in',
      },
    },
    alerts: {
      error: {
        title: 'Error',
        loadProviders: 'Failed to load your partners. Please try again.',
        checkInFailed: 'Check-in Failed',
        checkOutFailed: 'Check-out Failed',
        generic: 'An unknown error occurred.',
      },
      checkIn: {
        successTitle: 'Check-in Successful!',
        successMessage: (name) => `Welcome to ${name}.`,
      },
      checkOut: {
        successTitle: 'Check-out Successful!',
        successMessage: 'You have successfully checked out.',
      },
    },
  },
  MultiProviderTab: {
    sections: {
      accessibleProviders: (count) => `Your Accessible Partners (${count})`,
      choosePlan: 'Choose Your Plan',
    },
    tiers: [
      {
        id: 'silver',
        name: 'Silver',
        price: 49.99,
        badge: '🥈',
        description: 'Perfect for fitness enthusiasts',
        features: ['Access to 50+ Silver tier partners', 'Basic amenities access', 'Group classes access'],
        popular: false,
      },
      {
        id: 'gold',
        name: 'Gold',
        price: 79.99,
        badge: '🥇',
        description: 'Most popular choice',
        features: [
          'Access to 100+ Gold tier partners',
          'Premium amenities access',
          'Unlimited group classes',
          '1 personal training session/month',
        ],
        popular: true,
      },
      {
        id: 'platinum',
        name: 'Platinum',
        price: 119.99,
        badge: '💎',
        description: 'Ultimate fitness experience',
        features: [
          'Access to ALL partner locations',
          'VIP amenities access',
          'Unlimited group classes',
          '2 personal training sessions/month',
          'Spa & wellness access',
        ],
        popular: false,
      },
    ],
    subscription: {
      activeTitle: (badge, name) => `${badge} ${name} Pass Active`,
      checkIn: {
        title: 'Currently Checked In At:',
        since: 'Since',
        button: 'Check In',
        status: 'Checked In',
      },
      manageButton: 'Manage Subscription',
    },
    states: {
      loading: 'Loading...',
      emptyProviders: 'No accessible partners found',
      emptyProvidersSubtext: 'Please check back later for new locations.',
      popularBadge: 'MOST POPULAR',
      subscribeButton: 'Subscribe Now',
    },
    alerts: {
      loadFailed: 'Failed to load data. Please try again.',
      checkIn: {
        success: 'Checked in successfully!',
        failed: 'Failed to check in.',
      },
      checkOut: {
        success: 'Checked out successfully!',
        failed: 'Failed to check out.',
      },
      purchase: {
        failedTitle: 'Error',
        failedMessage: 'Failed to open payment page.',
        failedTier: 'Failed to purchase tier.',
      },
    },
  },
  Notifications: {
    header: 'Notifications',
    empty: {
      title: 'No notifications',
      subtitle: "You're all caught up!",
    },
    alerts: {
      error: 'Error',
      markReadFailed: 'Failed to mark notification as read',
      deleteFailed: 'Failed to delete notification',
    },
  },
  TrainersTab: {
    sections: {
      myTrainers: 'My Trainers',
    },
    empty: {
      member: {
        title: 'No trainers subscribed',
        subtitle: 'Subscribe to trainers to see them here',
      },
      trainer: {
        title: "You haven't been assigned any clients yet",
        subtitle: 'Clients will appear here when they subscribe to your plans',
      },
    },
    card: {
      yearsExp: 'years of experience',
      chat: 'Chat',
      fallbackName: 'Trainer',
    },
    alerts: {
      load: 'Failed to load your trainers. Please try again.',
      chat: 'Failed to start conversation',
    },
  },
  UserProfile: {
    sections: {
      personalInfo: 'Personal Information',
      accountSettings: 'Account Settings',
    },
    fields: {
      height: 'Height',
      weight: 'Weight',
      age: 'Age',
      email: 'Email',
      password: 'Password',
    },
    placeholders: {
      password: '**********',
      height: '175 cm',
      weight: '72 kg',
      age: '28',
    },
    actions: {
      manageSubscription: 'Manage Subscription',
      logout: 'Log Out',
    },
  },
};