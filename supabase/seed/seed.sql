-- Seed data for development

-- Categories (skip if already exist)
INSERT INTO categories (name, slug, description, icon, display_order)
SELECT * FROM (VALUES
  ('Grammar', 'grammar', 'English grammar rules and structures', 'BookOpen', 1),
  ('Vocabulary', 'vocabulary', 'English words and their meanings', 'Book', 2),
  ('Reading', 'reading', 'Reading comprehension skills', 'FileText', 3),
  ('Listening', 'listening', 'Listening comprehension skills', 'Headphones', 4),
  ('Speaking', 'speaking', 'Speaking and communication skills', 'Mic', 5),
  ('Writing', 'writing', 'Writing skills and composition', 'PenTool', 6)
) AS v(name, slug, description, icon, display_order)
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE categories.slug = v.slug);

-- ============================================================
-- GRAMMAR
-- ============================================================

-- Grammar - Easy
WITH cat AS (SELECT id FROM categories WHERE slug = 'grammar')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'She ___ a student.',
   '[{"label": "A", "text": "am"}, {"label": "B", "text": "is"}, {"label": "C", "text": "are"}, {"label": "D", "text": "be"}]',
   'B', 'Subjek "She" menggunakan to be "is".'),

  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'They ___ playing football now.',
   '[{"label": "A", "text": "is"}, {"label": "B", "text": "am"}, {"label": "C", "text": "are"}, {"label": "D", "text": "be"}]',
   'C', 'Subjek "They" menggunakan to be "are" untuk present continuous.'),

  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'I ___ a book every night.',
   '[{"label": "A", "text": "read"}, {"label": "B", "text": "reads"}, {"label": "C", "text": "reading"}, {"label": "D", "text": "am read"}]',
   'A', 'Subjek "I" menggunakan verb base form (read) untuk simple present.'),

  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   '___ you like coffee?',
   '[{"label": "A", "text": "Does"}, {"label": "B", "text": "Do"}, {"label": "C", "text": "Is"}, {"label": "D", "text": "Are"}]',
   'B', 'Subjek "you" menggunakan auxiliary verb "Do" untuk pertanyaan simple present.'),

  ((SELECT id FROM cat), 'easy', 'short_answer',
   'She ___ (go) to school every day. (isi dengan bentuk kata yang benar)',
   NULL,
   'goes', 'Subjek "She" pada simple present harus ditambah -es: goes.');

-- Grammar - Medium
WITH cat AS (SELECT id FROM categories WHERE slug = 'grammar')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'If I ___ rich, I would travel the world.',
   '[{"label": "A", "text": "am"}, {"label": "B", "text": "was"}, {"label": "C", "text": "were"}, {"label": "D", "text": "be"}]',
   'C', 'Conditional type 2 menggunakan "were" untuk semua subjek.'),

  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'The book ___ written by J.K. Rowling.',
   '[{"label": "A", "text": "is"}, {"label": "B", "text": "was"}, {"label": "C", "text": "were"}, {"label": "D", "text": "has"}]',
   'B', 'Kalimat passive voice past tense: was + verb3 (written).'),

  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'She has been studying English ___ 2019.',
   '[{"label": "A", "text": "since"}, {"label": "B", "text": "for"}, {"label": "C", "text": "from"}, {"label": "D", "text": "during"}]',
   'A', '"Since" digunakan untuk titik waktu spesifik (2019).'),

  ((SELECT id FROM cat), 'medium', 'short_answer',
   'They ___ (not/eat) dinner yet. (isi dengan bentuk present perfect negative)',
   NULL,
   'haven''t eaten', 'Present perfect negative: have/has + not + verb3.'),

  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'I wish I ___ how to swim.',
   '[{"label": "A", "text": "know"}, {"label": "B", "text": "knew"}, {"label": "C", "text": "known"}, {"label": "D", "text": "would know"}]',
   'B', 'Setelah "wish" menggunakan past tense (knew) untuk situasi sekarang.');

-- Grammar - Hard
WITH cat AS (SELECT id FROM categories WHERE slug = 'grammar')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'Had I known earlier, I ___ a different decision.',
   '[{"label": "A", "text": "would make"}, {"label": "B", "text": "would have made"}, {"label": "C", "text": "will make"}, {"label": "D", "text": "made"}]',
   'B', 'Inverted conditional type 3: would have + verb3 untuk past unreal situation.'),

  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'It is imperative that every student ___ the rules.',
   '[{"label": "A", "text": "follows"}, {"label": "B", "text": "follow"}, {"label": "C", "text": "following"}, {"label": "D", "text": "followed"}]',
   'B', 'Setelah "imperative that" menggunakan subjunctive (verb base form).'),

  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'Never ___ I seen such a beautiful sunset.',
   '[{"label": "A", "text": "have"}, {"label": "B", "text": "had"}, {"label": "C", "text": "did"}, {"label": "D", "text": "was"}]',
   'A', 'Inversion dengan negative adverb "Never": Never + auxiliary + subject + verb.'),

  ((SELECT id FROM cat), 'hard', 'short_answer',
   'The report needs to ___ (submit) by Friday. (isi dengan passive infinitive)',
   NULL,
   'be submitted', 'Passive infinitive: to be + verb3.');

-- ============================================================
-- VOCABULARY
-- ============================================================

-- Vocabulary - Easy
WITH cat AS (SELECT id FROM categories WHERE slug = 'vocabulary')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'What is the meaning of "happy"?',
   '[{"label": "A", "text": "Sedih"}, {"label": "B", "text": "Marah"}, {"label": "C", "text": "Senang"}, {"label": "D", "text": "Cepat"}]',
   'C', '"Happy" berarti senang atau bahagia dalam bahasa Indonesia.'),

  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'The opposite of "big" is ___',
   '[{"label": "A", "text": "Large"}, {"label": "B", "text": "Small"}, {"label": "C", "text": "Tall"}, {"label": "D", "text": "Wide"}]',
   'B', 'Lawan kata (opposite) dari "big" (besar) adalah "small" (kecil).'),

  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'What does "beautiful" mean?',
   '[{"label": "A", "text": "Jelek"}, {"label": "B", "text": "Cantik"}, {"label": "C", "text": "Cepat"}, {"label": "D", "text": "Kuat"}]',
   'B', '"Beautiful" berarti cantik atau indah.'),

  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'Which word means "to move quickly"?',
   '[{"label": "A", "text": "Walk"}, {"label": "B", "text": "Run"}, {"label": "C", "text": "Sit"}, {"label": "D", "text": "Sleep"}]',
   'B', '"Run" berarti berlari atau bergerak dengan cepat.'),

  ((SELECT id FROM cat), 'easy', 'short_answer',
   'What is the English word for "buku"?',
   NULL,
   'book', '"Buku" dalam bahasa Inggris adalah "book".');

-- Vocabulary - Medium
WITH cat AS (SELECT id FROM categories WHERE slug = 'vocabulary')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'The synonym of "difficult" is ___',
   '[{"label": "A", "text": "Easy"}, {"label": "B", "text": "Simple"}, {"label": "C", "text": "Hard"}, {"label": "D", "text": "Light"}]',
   'C', 'Sinonim (synonym) dari "difficult" adalah "hard" (sulit).'),

  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'What does "generous" mean?',
   '[{"label": "A", "text": "Pelit"}, {"label": "B", "text": "Dermawan"}, {"label": "C", "text": "Pemarah"}, {"label": "D", "text": "Pemalu"}]',
   'B', '"Generous" berarti dermawan atau murah hati.'),

  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'The word "abandon" most closely means ___',
   '[{"label": "A", "text": "Keep"}, {"label": "B", "text": "Leave"}, {"label": "C", "text": "Find"}, {"label": "D", "text": "Love"}]',
   'B', '"Abandon" berarti meninggalkan atau menelantarkan.'),

  ((SELECT id FROM cat), 'medium', 'short_answer',
   'What is the noun form of "strong"?',
   NULL,
   'strength', 'Bentuk noun dari "strong" adalah "strength" (kekuatan).'),

  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'If something is "fragile", it is easily ___',
   '[{"label": "A", "text": "Broken"}, {"label": "B", "text": "Fixed"}, {"label": "C", "text": "Found"}, {"label": "D", "text": "Hidden"}]',
   'A', '"Fragile" berarti mudah pecah atau rapuh (easily broken).');

-- Vocabulary - Hard
WITH cat AS (SELECT id FROM categories WHERE slug = 'vocabulary')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   '"Ubiquitous" means ___',
   '[{"label": "A", "text": "Langka"}, {"label": "B", "text": "Di mana-mana"}, {"label": "C", "text": "Berbahaya"}, {"label": "D", "text": "Tersembunyi"}]',
   'B', '"Ubiquitous" berarti ada di mana-mana atau sering ditemui.'),

  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'The word "ephemeral" is closest in meaning to ___',
   '[{"label": "A", "text": "Permanent"}, {"label": "B", "text": "Sementara"}, {"label": "C", "text": "Kuat"}, {"label": "D", "text": "Lambat"}]',
   'B', '"Ephemeral" berarti sementara atau berumur pendek.'),

  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   '"Ambiguous" means ___',
   '[{"label": "A", "text": "Jelas"}, {"label": "B", "text": "Bermakna ganda"}, {"label": "C", "text": "Pendek"}, {"label": "D", "text": "Panjang"}]',
   'B', '"Ambiguous" berarti ambigu atau bermakna ganda.'),

  ((SELECT id FROM cat), 'hard', 'short_answer',
   'What is the adjective form of "empathy"?',
   NULL,
   'empathetic', 'Bentuk adjective dari "empathy" adalah "empathetic" (empati).');

-- ============================================================
-- READING
-- ============================================================

-- Reading - Easy
WITH cat AS (SELECT id FROM categories WHERE slug = 'reading')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'Teks: "Anna wakes up at 6 AM every day. She brushes her teeth and eats breakfast. Then she goes to school."
   Pertanyaan: What does Anna do after brushing her teeth?',
   '[{"label": "A", "text": "Goes to school"}, {"label": "B", "text": "Wakes up"}, {"label": "C", "text": "Eats breakfast"}, {"label": "D", "text": "Goes to sleep"}]',
   'C', 'Teks mengatakan: "She brushes her teeth and eats breakfast." Makan dilakukan setelah gosok gigi.'),

  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'Teks: "The cat is on the mat. The mat is red and soft. The cat is sleeping."
   Pertanyaan: What color is the mat?',
   '[{"label": "A", "text": "Blue"}, {"label": "B", "text": "Red"}, {"label": "C", "text": "Green"}, {"label": "D", "text": "Black"}]',
   'B', 'Teks menyatakan: "The mat is red and soft."'),

  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'Teks: "Budi is 10 years old. He lives in Jakarta with his parents. He loves playing football."
   Pertanyaan: How old is Budi?',
   '[{"label": "A", "text": "8 years old"}, {"label": "B", "text": "9 years old"}, {"label": "C", "text": "10 years old"}, {"label": "D", "text": "11 years old"}]',
   'C', 'Teks jelas menyatakan: "Budi is 10 years old."'),

  ((SELECT id FROM cat), 'easy', 'short_answer',
   'Teks: "Indonesia has two seasons: rainy season and dry season."
   Pertanyaan: How many seasons does Indonesia have? (jawab dengan angka)',
   NULL,
   'two', 'Teks mengatakan Indonesia memiliki dua musim.');

-- Reading - Medium
WITH cat AS (SELECT id FROM categories WHERE slug = 'reading')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'Teks: "Plastic pollution is one of the biggest environmental problems today. Millions of tons of plastic waste end up in the ocean every year, harming marine life. Scientists estimate that by 2050, there will be more plastic than fish in the sea."
   Pertanyaan: What is the main idea of the text?',
   '[{"label": "A", "text": "Plastic is useful"}, {"label": "B", "text": "Plastic pollution is a serious problem"}, {"label": "C", "text": "Fish are disappearing"}, {"label": "D", "text": "Scientists study the ocean"}]',
   'B', 'Ide utama teks adalah polusi plastik sebagai masalah lingkungan serius.'),

  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'Teks: "Social media has changed how people communicate. While it helps us stay connected with friends far away, it can also reduce face-to-face interactions. Many experts worry that excessive social media use can lead to anxiety and loneliness."
   Pertanyaan: What is a negative effect of social media mentioned in the text?',
   '[{"label": "A", "text": "It is expensive"}, {"label": "B", "text": "It can cause anxiety"}, {"label": "C", "text": "It is difficult to use"}, {"label": "D", "text": "It takes too much time"}]',
   'B', 'Teks menyebutkan bahwa penggunaan media sosial berlebihan dapat menyebabkan kecemasan.'),

  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'Teks: "The word ''photosynthesis'' comes from Greek. ''Photo'' means light, and ''synthesis'' means putting together. Plants use sunlight, water, and carbon dioxide to make their own food through this process."
   Pertanyaan: What does "photo" mean in Greek?',
   '[{"label": "A", "text": "Plant"}, {"label": "B", "text": "Food"}, {"label": "C", "text": "Light"}, {"label": "D", "text": "Water"}]',
   'C', 'Teks menjelaskan: "''Photo'' means light."'),

  ((SELECT id FROM cat), 'medium', 'short_answer',
   'Teks: "The first airplane was invented by the Wright brothers in 1903."
   Pertanyaan: Who invented the first airplane?',
   NULL,
   'the Wright brothers', 'Teks menyatakan Wright brothers sebagai penemu pesawat pertama.');

-- Reading - Hard
WITH cat AS (SELECT id FROM categories WHERE slug = 'reading')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'Teks: "Despite decades of research, the exact mechanisms of memory formation remain elusive. However, neuroscientists have identified that the hippocampus plays a crucial role in converting short-term memories into long-term ones. This process, known as consolidation, is particularly active during sleep."
   Pertanyaan: What can be inferred about memory consolidation?',
   '[{"label": "A", "text": "It only happens during the day"}, {"label": "B", "text": "It occurs most actively during sleep"}, {"label": "C", "text": "The hippocampus is not involved"}, {"label": "D", "text": "It is fully understood by scientists"}]',
   'B', 'Teks menyatakan proses konsolidasi "particularly active during sleep."'),

  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'Teks: "The Industrial Revolution, which began in Britain in the late 18th century, fundamentally transformed society. It shifted economies from agriculture-based to industry-based, leading to urbanization. However, this transition came at a cost: poor working conditions, child labor, and environmental degradation were rampant."
   Pertanyaan: What does the author imply about the Industrial Revolution?',
   '[{"label": "A", "text": "It only had positive effects"}, {"label": "B", "text": "It had both positive and negative impacts"}, {"label": "C", "text": "It did not affect the economy"}, {"label": "D", "text": "It started in America"}]',
   'B', 'Penulis menyebutkan transformasi positif (urbanisasi) dan dampak negatif (kondisi kerja buruk).'),

  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'Teks: "Cognitive dissonance refers to the mental discomfort experienced when holding two contradictory beliefs. When this occurs, individuals are motivated to reduce the inconsistency, often by changing one of their beliefs or rationalizing their behavior."
   Pertanyaan: How do people typically resolve cognitive dissonance according to the text?',
   '[{"label": "A", "text": "By ignoring the problem"}, {"label": "B", "text": "By changing a belief or rationalizing"}, {"label": "C", "text": "By seeking more information"}, {"label": "D", "text": "By avoiding the situation"}]',
   'B', 'Teks menyebutkan resolusi dengan "changing one of their beliefs or rationalizing their behavior."'),

  ((SELECT id FROM cat), 'hard', 'short_answer',
   'Teks: "The Great Barrier Reef, located off the coast of Queensland, Australia, is the world''s largest coral reef system. It is composed of over 2,900 individual reef systems and supports an extraordinary diversity of marine life."
   Pertanyaan: Where is the Great Barrier Reef located?',
   NULL,
   'off the coast of Queensland Australia', 'Teks menyatakan lokasi: "off the coast of Queensland, Australia."');

-- ============================================================
-- LISTENING (text-based simulation)
-- ============================================================

-- Listening - Easy
WITH cat AS (SELECT id FROM categories WHERE slug = 'listening')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'Transkrip: "Woman: Hello, can I order a pizza please? Man: Sure, what size would you like?"
   Pertanyaan: What does the woman want to do?',
   '[{"label": "A", "text": "Buy a pizza"}, {"label": "B", "text": "Sell a pizza"}, {"label": "C", "text": "Cook a pizza"}, {"label": "D", "text": "Make a pizza"}]',
   'A', 'Woman berkata "can I order a pizza" yang berarti memesan (buy).'),

  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'Transkrip: "Boy: Mom, where is my bag? Mom: It is under your bed."
   Pertanyaan: Where is the bag?',
   '[{"label": "A", "text": "On the table"}, {"label": "B", "text": "Under the bed"}, {"label": "C", "text": "In the closet"}, {"label": "D", "text": "Next to the door"}]',
   'B', 'Ibu berkata: "It is under your bed."'),

  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'Transkrip: "Announcement: Flight GA 712 to Bali will depart from Gate 3 at 2:30 PM."
   Pertanyaan: What time does the flight depart?',
   '[{"label": "A", "text": "2:00 PM"}, {"label": "B", "text": "2:30 PM"}, {"label": "C", "text": "3:00 PM"}, {"label": "D", "text": "3:30 PM"}]',
   'B', 'Pengumuman: "depart from Gate 3 at 2:30 PM."'),

  ((SELECT id FROM cat), 'easy', 'short_answer',
   'Transkrip: "Man: What is your favorite color? Girl: My favorite color is blue."
   Pertanyaan: What is the girl''s favorite color?',
   NULL,
   'blue', 'Gadis berkata: "My favorite color is blue."');

-- Listening - Medium
WITH cat AS (SELECT id FROM categories WHERE slug = 'listening')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'Transkrip: "Teacher: For homework, please read chapter 5 and answer questions 1 to 10. The assignment is due next Monday."
   Pertanyaan: What is the deadline for the homework?',
   '[{"label": "A", "text": "Next Friday"}, {"label": "B", "text": "Next Monday"}, {"label": "C", "text": "Tomorrow"}, {"label": "D", "text": "Next Wednesday"}]',
   'B', 'Guru berkata: "The assignment is due next Monday."'),

  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'Transkrip: "Doctor: You should take this medicine three times a day after meals. Also, drink lots of water and get plenty of rest."
   Pertanyaan: How many times should the patient take the medicine?',
   '[{"label": "A", "text": "Once a day"}, {"label": "B", "text": "Twice a day"}, {"label": "C", "text": "Three times a day"}, {"label": "D", "text": "Four times a day"}]',
   'C', 'Dokter: "take this medicine three times a day."'),

  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'Transkrip: "Woman: I lost my wallet yesterday. Man: Did you check the restaurant? Woman: Yes, but they didn''t find it. Man: You should report it to the police."
   Pertanyaan: What did the man suggest?',
   '[{"label": "A", "text": "Check the restaurant again"}, {"label": "B", "text": "Report to the police"}, {"label": "C", "text": "Buy a new wallet"}, {"label": "D", "text": "Go home"}]',
   'B', 'Pria menyarankan: "You should report it to the police."'),

  ((SELECT id FROM cat), 'medium', 'short_answer',
   'Transkrip: "Receptionist: Your appointment with Dr. Smith is on Thursday at 10 AM."
   Pertanyaan: What day is the appointment?',
   NULL,
   'Thursday', 'Resepsionis: "appointment with Dr. Smith is on Thursday."');

-- Listening - Hard
WITH cat AS (SELECT id FROM categories WHERE slug = 'listening')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'Transkrip: "Professor: The findings suggest that climate change is accelerating faster than previously predicted. If current trends continue, we could see a sea-level rise of one meter by the end of the century, displacing millions of people."
   Pertanyaan: What is the professor''s main concern?',
   '[{"label": "A", "text": "The cost of research"}, {"label": "B", "text": "The accuracy of predictions"}, {"label": "C", "text": "The rapid acceleration of climate change"}, {"label": "D", "text": "The lack of funding"}]',
   'C', 'Profesor khawatir tentang perubahan iklim yang "accelerating faster than previously predicted."'),

  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'Transkrip: "News Anchor: A major breakthrough in renewable energy was announced today. Scientists have developed a new solar panel that is 40% more efficient than current models, potentially revolutionizing the industry."
   Pertanyaan: What makes the new solar panel significant?',
   '[{"label": "A", "text": "It is cheaper"}, {"label": "B", "text": "It is 40% more efficient"}, {"label": "C", "text": "It is smaller"}, {"label": "D", "text": "It lasts longer"}]',
   'B', 'Panel surya baru "40% more efficient than current models."'),

  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'Transkrip: "Interviewer: What inspired you to become a writer? Author: Growing up, my grandfather would tell me stories every night. Those stories sparked my imagination and made me want to create my own."
   Pertanyaan: Who inspired the author to become a writer?',
   '[{"label": "A", "text": "His teacher"}, {"label": "B", "text": "His grandfather"}, {"label": "C", "text": "His mother"}, {"label": "D", "text": "His friend"}]',
   'B', 'Penulis: "my grandfather would tell me stories every night. Those stories sparked my imagination."'),

  ((SELECT id FROM cat), 'hard', 'short_answer',
   'Transkrip: "Lecture: The term ''renaissance'' means rebirth. It refers to a period in European history from the 14th to the 17th century marked by a revival of art, culture, and learning."
   Pertanyaan: What does the word ''renaissance'' mean?',
   NULL,
   'rebirth', 'Kuliah menjelaskan: "The term ''renaissance'' means rebirth."');

-- ============================================================
-- SPEAKING
-- ============================================================

-- Speaking - Easy
WITH cat AS (SELECT id FROM categories WHERE slug = 'speaking')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'How do you greet someone in the morning?',
   '[{"label": "A", "text": "Good night"}, {"label": "B", "text": "Good morning"}, {"label": "C", "text": "Good evening"}, {"label": "D", "text": "Goodbye"}]',
   'B', '"Good morning" adalah salam yang tepat untuk pagi hari.'),

  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'What do you say when you meet someone for the first time?',
   '[{"label": "A", "text": "How dare you"}, {"label": "B", "text": "Nice to meet you"}, {"label": "C", "text": "See you later"}, {"label": "D", "text": "Thank you"}]',
   'B', '"Nice to meet you" adalah ungkapan yang tepat saat bertemu pertama kali.'),

  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'How do you ask someone''s name?',
   '[{"label": "A", "text": "Where are you?"}, {"label": "B", "text": "What is your name?"}, {"label": "C", "text": "How old are you?"}, {"label": "D", "text": "How are you?"}]',
   'B', '"What is your name?" adalah cara yang benar untuk menanyakan nama.'),

  ((SELECT id FROM cat), 'easy', 'short_answer',
   'What do you say when someone helps you? (one word)',
   NULL,
   'thank you', '"Thank you" atau "thanks" adalah ungkapan terima kasih.');

-- Speaking - Medium
WITH cat AS (SELECT id FROM categories WHERE slug = 'speaking')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'You are in a restaurant. How do you order food politely?',
   '[{"label": "A", "text": "Give me food now!"}, {"label": "B", "text": "May I have the menu, please?"}, {"label": "C", "text": "I want food"}, {"label": "D", "text": "Food here!"}]',
   'B', '"May I have the menu, please?" adalah cara sopan untuk memesan.'),

  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'You didn''t hear what someone said. What do you say?',
   '[{"label": "A", "text": "What?"}, {"label": "B", "text": "I don''t care"}, {"label": "C", "text": "Sorry, could you repeat that?"}, {"label": "D", "text": "Speak louder"}]',
   'C', '"Sorry, could you repeat that?" adalah ungkapan sopan untuk meminta pengulangan.'),

  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'How do you politely decline an invitation?',
   '[{"label": "A", "text": "No way"}, {"label": "B", "text": "I''m busy, sorry"}, {"label": "C", "text": "That''s a bad idea"}, {"label": "D", "text": "I hate that"}]',
   'B', '"I''m busy, sorry" atau "I''d love to but I can''t" adalah cara sopan menolak undangan.'),

  ((SELECT id FROM cat), 'medium', 'short_answer',
   'What do you say when you want to apologize? (common phrase)',
   NULL,
   'I''m sorry', '"I''m sorry" adalah ungkapan standar untuk meminta maaf.');

-- Speaking - Hard
WITH cat AS (SELECT id FROM categories WHERE slug = 'speaking')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'You are giving a presentation. How do you transition to the next point?',
   '[{"label": "A", "text": "Next!"}, {"label": "B", "text": "Moving on to the next point..."}, {"label": "C", "text": "Shut up and listen"}, {"label": "D", "text": "That''s it"}]',
   'B', '"Moving on to the next point" adalah transisi profesional dalam presentasi.'),

  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'How do you express disagreement in a formal meeting?',
   '[{"label": "A", "text": "You''re wrong"}, {"label": "B", "text": "That''s stupid"}, {"label": "C", "text": "I see your point, but I think differently"}, {"label": "D", "text": "No"}]',
   'C', '"I see your point, but I think differently" adalah cara sopan untuk menyampaikan perbedaan pendapat.'),

  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'You are in a job interview. How do you describe your strength?',
   '[{"label": "A", "text": "I''m perfect at everything"}, {"label": "B", "text": "My greatest strength is my ability to solve problems efficiently"}, {"label": "C", "text": "I don''t have any weaknesses"}, {"label": "D", "text": "I''m better than everyone"}]',
   'B', 'Jawaban profesional: sebutkan kekuatan spesifik dengan contoh konkret.'),

  ((SELECT id FROM cat), 'hard', 'short_answer',
   'What phrase do you use to give an opinion politely? (3 words starting with "In my...")',
   NULL,
   'In my opinion', '"In my opinion" adalah frase standar untuk menyampaikan pendapat.');

-- ============================================================
-- WRITING
-- ============================================================

-- Writing - Easy
WITH cat AS (SELECT id FROM categories WHERE slug = 'writing')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'Which sentence is written correctly?',
   '[{"label": "A", "text": "she like apple"}, {"label": "B", "text": "She likes apples"}, {"label": "C", "text": "She like apples"}, {"label": "D", "text": "she likes apple"}]',
   'B', 'Kalimat yang benar: diawali huruf kapital, subjek "She" + verb + s (likes), dan plural "apples".'),

  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'Which is the correct way to write a sentence?',
   '[{"label": "A", "text": "i am a student"}, {"label": "B", "text": "I am a student."}, {"label": "C", "text": "am i a student"}, {"label": "D", "text": "I am student"}]',
   'B', 'Penulisan benar: huruf kapital di awal, subjek + verb + objek, diakhiri titik.'),

  ((SELECT id FROM cat), 'easy', 'multiple_choice',
   'Which word can complete the sentence: "I ___ a teacher."',
   '[{"label": "A", "text": "is"}, {"label": "B", "text": "am"}, {"label": "C", "text": "are"}, {"label": "D", "text": "be"}]',
   'B', 'Subjek "I" menggunakan to be "am".'),

  ((SELECT id FROM cat), 'easy', 'short_answer',
   'Correct this sentence: "they goes to school" (write the corrected version)',
   NULL,
   'They go to school', 'Subjek "They" menggunakan verb tanpa s, dan huruf kapital di awal.');

-- Writing - Medium
WITH cat AS (SELECT id FROM categories WHERE slug = 'writing')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'Which sentence has the correct word order?',
   '[{"label": "A", "text": "I to school every day go"}, {"label": "B", "text": "I go to school every day"}, {"label": "C", "text": "Go I to school every day"}, {"label": "D", "text": "Every day I to school go"}]',
   'B', 'Urutan kata yang benar: Subject + Verb + Object + Adverb (I go to school every day).'),

  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'Choose the most appropriate opening for a formal email:',
   '[{"label": "A", "text": "Hey!"}, {"label": "B", "text": "Dear Mr. Smith,"}, {"label": "C", "text": "What''s up?"}, {"label": "D", "text": "Hello there"}]',
   'B', '"Dear Mr. Smith," adalah pembuka formal yang tepat untuk email resmi.'),

  ((SELECT id FROM cat), 'medium', 'multiple_choice',
   'Which sentence uses the correct punctuation?',
   '[{"label": "A", "text": "How are you?"}, {"label": "B", "text": "how are you."}, {"label": "C", "text": "How are you"}, {"label": "D", "text": "How are you,"}]',
   'A', 'Kalimat tanya harus diakhiri tanda tanya (?) dan diawali huruf kapital.'),

  ((SELECT id FROM cat), 'medium', 'short_answer',
   'Combine these sentences with "because": "I am happy. I passed the exam."',
   NULL,
   'I am happy because I passed the exam', 'Kata "because" menghubungkan sebab (passed the exam) dan akibat (happy).');

-- Writing - Hard
WITH cat AS (SELECT id FROM categories WHERE slug = 'writing')
INSERT INTO questions (category_id, difficulty, type, question, options, correct_answer, explanation) VALUES
  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'Which sentence demonstrates correct use of parallelism?',
   '[{"label": "A", "text": "She likes swimming, to run, and biking"}, {"label": "B", "text": "She likes swimming, running, and biking"}, {"label": "C", "text": "She likes to swim, running, and biking"}, {"label": "D", "text": "She likes swimming, to run, and to biking"}]',
   'B', 'Parallel structure: semua kata kerja dalam bentuk -ing (swimming, running, biking).'),

  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'Which sentence is a correct complex sentence?',
   '[{"label": "A", "text": "I went home and ate dinner."}, {"label": "B", "text": "Although it was raining, we went outside."}, {"label": "C", "text": "The cat sat on the mat."}, {"label": "D", "text": "Dogs and cats"}]',
   'B', 'Complex sentence memiliki independent clause + dependent clause (Although it was raining...).'),

  ((SELECT id FROM cat), 'hard', 'multiple_choice',
   'Identify the correctly cited direct speech:',
   '[{"label": "A", "text": "She said I am tired"}, {"label": "B", "text": "She said, \"I am tired.\""}, {"label": "C", "text": "She said: I am tired"}, {"label": "D", "text": "She said - I am tired"}]',
   'B', 'Direct speech menggunakan koma setelah said dan tanda kutip di awal/akhir ucapan.'),

  ((SELECT id FROM cat), 'hard', 'short_answer',
   'Change to passive voice: "The chef cooks the meal."',
   NULL,
   'The meal is cooked by the chef', 'Passive voice: Object + to be (is) + verb3 + by + subject.');
