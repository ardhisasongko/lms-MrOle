// Skenario latihan speaking: role-play percakapan dengan AI dan
// kalimat target untuk latihan pengucapan. Judul & situasi dwibahasa
// (id/en) mengikuti bahasa antarmuka; aiRole & openingLine berbahasa
// Inggris karena dipakai sebagai konteks percakapan dengan model.

export const SPEAKING_SCENARIOS = [
  {
    id: 'self-introduction',
    title: { id: 'Perkenalan Diri', en: 'Self Introduction' },
    situation: {
      id: 'Kamu baru masuk kelas baru dan berkenalan dengan teman sebangku.',
      en: 'You have just joined a new class and are getting to know the classmate sitting next to you.',
    },
    aiRole: 'a friendly new classmate named Bima who just joined the class',
    openingLine: "Hi! I'm Bima, I just joined this class. What's your name?",
    targetSentences: [
      { text: 'Hello, my name is Nadia.', difficulty: 'easy' },
      { text: 'I am from Jakarta, Indonesia.', difficulty: 'easy' },
      { text: 'I like reading books and playing football.', difficulty: 'medium' },
      { text: 'My dream is to become a teacher.', difficulty: 'medium' },
      { text: 'Nice to meet you, I hope we can be good friends.', difficulty: 'medium' },
    ],
  },
  {
    id: 'ordering-food',
    title: { id: 'Memesan Makanan di Restoran', en: 'Ordering Food at a Restaurant' },
    situation: {
      id: 'Kamu sedang makan malam di restoran dan memesan makanan kepada pelayan.',
      en: 'You are having dinner at a restaurant and ordering food from the waiter.',
    },
    aiRole: 'a polite waiter at a cozy Indonesian restaurant',
    openingLine: 'Good evening! Welcome to Warung Nusantara. Are you ready to order?',
    targetSentences: [
      { text: 'Can I see the menu, please?', difficulty: 'easy' },
      { text: 'I would like fried rice and iced tea.', difficulty: 'easy' },
      { text: 'How much is the grilled chicken?', difficulty: 'medium' },
      { text: 'Please make it not too spicy.', difficulty: 'medium' },
      { text: 'Thank you, that was delicious.', difficulty: 'medium' },
    ],
  },
  {
    id: 'asking-directions',
    title: { id: 'Bertanya Arah Jalan', en: 'Asking for Directions' },
    situation: {
      id: 'Kamu tersesat di kota yang baru pertama kali kamu kunjungi dan bertanya kepada warga setempat.',
      en: 'You are lost in a city you are visiting for the first time and ask a local person for help.',
    },
    aiRole: 'a helpful local person standing near the town square',
    openingLine: 'Hello! You look a little lost. Can I help you?',
    targetSentences: [
      { text: 'Excuse me, where is the train station?', difficulty: 'easy' },
      { text: 'Is it far from here?', difficulty: 'easy' },
      { text: 'Should I turn left or right at the traffic light?', difficulty: 'medium' },
      { text: 'How long does it take on foot?', difficulty: 'medium' },
      { text: 'Thank you so much for your help.', difficulty: 'medium' },
    ],
  },
  {
    id: 'scholarship-interview',
    title: { id: 'Wawancara Beasiswa', en: 'Scholarship Interview' },
    situation: {
      id: 'Kamu mengikuti wawancara beasiswa sekolah dan menjawab pertanyaan pewawancara.',
      en: 'You are attending a school scholarship interview and answering the interviewer\'s questions.',
    },
    aiRole: 'a kind scholarship interviewer at a school office',
    openingLine: 'Good morning. Please have a seat. Can you tell me about yourself?',
    targetSentences: [
      { text: 'Good morning, thank you for this opportunity.', difficulty: 'easy' },
      { text: 'I study hard and join the English club at school.', difficulty: 'medium' },
      { text: 'My biggest strength is that I never give up easily.', difficulty: 'medium' },
      { text: 'I want this scholarship to help my parents.', difficulty: 'medium' },
      { text: 'In the future, I want to study at a good university.', difficulty: 'medium' },
    ],
  },
];
