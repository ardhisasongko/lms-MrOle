#!/usr/bin/env node
/* global console, process */

import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Usage: node scripts/generate-question-bank.mjs [generate|check]
// The SQL targets the additive session contract on public.questions:
// stimulus, prompt, status, content_metadata, content_hash, batch_id, batch_metadata.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = join(ROOT, 'supabase', 'migrations', '202608010008_question_bank_2000_v2.sql');
const VERSION = '2.0.0';
const BATCH_ID = 'english-bank-2000-v2';
const LABELS = ['A', 'B', 'C', 'D'];
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const TARGETS = {
  grammar: { easy: 112, medium: 111, hard: 111 },
  vocabulary: { easy: 111, medium: 112, hard: 111 },
  reading: { easy: 111, medium: 111, hard: 111 },
  listening: { easy: 111, medium: 111, hard: 111 },
  speaking: { easy: 111, medium: 111, hard: 111 },
  writing: { easy: 111, medium: 111, hard: 111 },
};

const names = ['Aisha', 'Ben', 'Clara', 'Dimas', 'Elena', 'Farah', 'George', 'Hana', 'Ivan', 'Julia', 'Kai', 'Lina', 'Mateo', 'Nora', 'Omar', 'Priya'];
const places = ['library', 'science lab', 'community garden', 'train station', 'art studio', 'sports hall', 'bookshop', 'city museum'];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const times = ['8:00 a.m.', '9:15 a.m.', '10:30 a.m.', '1:00 p.m.', '2:45 p.m.', '4:10 p.m.', '5:30 p.m.', '7:00 p.m.'];
const projects = ['recycling drive', 'history display', 'reading club', 'robotics workshop', 'food fair', 'tree-planting day', 'music recital', 'health campaign'];
const objects = ['notebook', 'camera', 'umbrella', 'lunch box', 'bicycle', 'dictionary', 'backpack', 'water bottle'];
const reasons = ['the roads were flooded', 'the main speaker was ill', 'the equipment arrived late', 'the hall needed repairs', 'several volunteers were absent', 'the weather became unsafe', 'the power was interrupted', 'the permit was delayed'];

const vocabulary = {
  easy: [
    ['ancient', 'very old', 'The guide showed us an ancient coin from a kingdom that ended centuries ago.'],
    ['brave', 'willing to face danger', 'The brave firefighter entered the smoky room to help a child.'],
    ['calm', 'peaceful and not worried', 'Mira remained calm and spoke slowly during the emergency.'],
    ['depart', 'leave a place', 'Our bus will depart from the terminal at noon.'],
    ['enormous', 'very large', 'An enormous whale surfaced beside the small boat.'],
    ['fragile', 'easily broken', 'The parcel is marked fragile because it contains thin glass.'],
    ['generous', 'willing to give or share', 'The generous neighbor donated books to every child.'],
    ['honest', 'truthful', 'Rafi was honest and admitted that he had made the mistake.'],
    ['improve', 'make better', 'Daily practice can improve your pronunciation.'],
    ['journey', 'a trip from one place to another', 'Their train journey across the island lasted six hours.'],
    ['local', 'connected with a nearby area', 'We bought fruit from a local farmer who lives nearby.'],
    ['narrow', 'not wide', 'Only one bicycle could pass through the narrow lane.'],
    ['observe', 'watch carefully', 'The students observe the butterfly without touching it.'],
    ['protect', 'keep safe from harm', 'A helmet helps protect your head.'],
    ['rapid', 'very fast', 'The rapid growth of the plant surprised the class.'],
    ['silent', 'making no sound', 'The audience became silent when the film began.'],
    ['tidy', 'neat and orderly', 'Her desk is tidy, with every pencil in its place.'],
    ['useful', 'helpful for a purpose', 'This map is useful when you visit an unfamiliar town.'],
    ['vanish', 'disappear suddenly', 'The rainbow seemed to vanish when the clouds returned.'],
    ['weary', 'very tired', 'After the long hike, the weary walkers rested.'],
    ['accurate', 'correct and exact', 'The clock is accurate and never gains or loses a minute.'],
    ['borrow', 'take temporarily and return later', 'May I borrow your ruler and return it after class?'],
    ['combine', 'join things together', 'Combine the flour and water in one bowl.'],
    ['distant', 'far away', 'We could see distant mountains beyond the lake.'],
    ['eager', 'excited and ready', 'The children were eager to open the new library.'],
    ['frequent', 'happening often', 'Frequent buses make the route convenient.'],
    ['grateful', 'thankful', 'I am grateful for your patient help.'],
    ['permit', 'allow', 'The rules permit students to use dictionaries.'],
  ],
  medium: [
    ['adapt', 'change to suit new conditions', 'The team adapted its plan when the weather changed.'],
    ['concise', 'brief but clear', 'Her concise summary covered the key points in two sentences.'],
    ['deteriorate', 'become worse', 'Without repairs, the old bridge will deteriorate.'],
    ['elaborate', 'detailed and carefully developed', 'The architect presented an elaborate model with tiny working lights.'],
    ['feasible', 'possible and practical', 'The committee decided that a weekend survey was feasible.'],
    ['hinder', 'make progress difficult', 'Poor lighting can hinder careful reading.'],
    ['inevitable', 'certain to happen', 'With dark clouds overhead, a delay seemed inevitable.'],
    ['justify', 'give good reasons for', 'Writers must justify their claims with evidence.'],
    ['meticulous', 'very careful about details', 'The meticulous editor checked every date and name twice.'],
    ['novel', 'new and original', 'The engineer proposed a novel way to collect rainwater.'],
    ['obsolete', 'no longer useful because something newer exists', 'Digital maps made many printed route charts obsolete.'],
    ['plausible', 'seeming reasonable or likely', 'Her explanation was plausible because the records supported it.'],
    ['reluctant', 'unwilling or hesitant', 'He was reluctant to speak before such a large audience.'],
    ['sustain', 'keep something continuing', 'Regular funding will sustain the after-school program.'],
    ['tentative', 'not final or certain', 'The organizers announced a tentative date that might change.'],
    ['undermine', 'weaken gradually', 'Repeated errors can undermine trust in a report.'],
    ['validate', 'confirm that something is sound or accurate', 'A second experiment helped validate the first result.'],
    ['allocate', 'distribute for a particular purpose', 'The council allocated more funds to public libraries.'],
    ['coherent', 'logical and well organized', 'Transitions made the argument coherent and easy to follow.'],
    ['diverse', 'including many different types', 'The festival attracted a diverse group of performers.'],
    ['explicit', 'stated clearly and directly', 'The instructions were explicit about the deadline.'],
    ['fluctuate', 'rise and fall irregularly', 'Ticket prices fluctuate during the holiday season.'],
    ['impartial', 'fair and not favoring either side', 'An impartial judge listened to both teams.'],
    ['infer', 'reach a conclusion from evidence', 'Readers can infer her concern from the questions she asks.'],
    ['retain', 'continue to have or keep', 'The sponge can retain water for several hours.'],
    ['subtle', 'not obvious and requiring attention to notice', 'A subtle change in tone signaled his doubt.'],
    ['transform', 'change greatly in form or character', 'The renovation transformed the warehouse into a theater.'],
    ['viable', 'capable of working successfully', 'Tests showed that solar power was a viable option.'],
  ],
  hard: [
    ['ambivalent', 'having conflicting feelings', 'She felt ambivalent about the promotion: pleased by the trust but worried about the travel.'],
    ['cogent', 'clear, logical, and convincing', 'The lawyer offered a cogent argument supported by reliable records.'],
    ['conundrum', 'a difficult problem with no obvious solution', 'Balancing lower prices with fair wages created a conundrum.'],
    ['disparate', 'fundamentally different', 'The report combines disparate sources, from diaries to satellite images.'],
    ['equivocal', 'deliberately unclear or open to interpretation', 'The spokesperson gave an equivocal reply that neither confirmed nor denied the rumor.'],
    ['exacerbate', 'make a problem worse', 'Cutting bus services could exacerbate traffic congestion.'],
    ['fastidious', 'very attentive to accuracy and detail', 'A fastidious conservator documented every crack in the painting.'],
    ['immutable', 'unable to be changed', 'The policy was treated as immutable despite changing circumstances.'],
    ['juxtapose', 'place side by side for comparison or contrast', 'The exhibition juxtaposes modern photographs with historic maps.'],
    ['lucid', 'expressed clearly and easy to understand', 'Her lucid explanation made the complex process accessible.'],
    ['mitigate', 'reduce the severity of something harmful', 'Shade trees can mitigate extreme heat in cities.'],
    ['nuanced', 'showing subtle distinctions', 'His nuanced account acknowledged benefits as well as risks.'],
    ['ostensibly', 'apparently, though perhaps not actually', 'The meeting was ostensibly about budgets, but staffing dominated the discussion.'],
    ['paradoxical', 'seemingly contradictory yet possibly true', 'It seems paradoxical that slowing down can improve productivity.'],
    ['pragmatic', 'focused on practical results', 'The mayor chose a pragmatic compromise that both groups could implement.'],
    ['refute', 'prove a claim to be false', 'New measurements refuted the earlier estimate.'],
    ['scrutinize', 'examine very closely', 'Reviewers scrutinized the data before approving publication.'],
    ['tenuous', 'weak or uncertain', 'The link between the two events remained tenuous.'],
    ['ubiquitous', 'present or found everywhere', 'Smartphones have become ubiquitous on public transport.'],
    ['vindicate', 'show that someone or something was right', "Later evidence vindicated the researcher's original warning."],
    ['arbitrary', 'based on chance rather than reason', 'The cutoff seemed arbitrary because no evidence supported that number.'],
    ['corroborate', 'confirm with additional evidence', 'Several witnesses corroborated her account.'],
    ['delineate', 'describe or mark precisely', "The contract delineates each partner's responsibilities."],
    ['empirical', 'based on observation or experiment', 'The proposal lacked empirical support from field studies.'],
    ['incongruous', 'out of place or not in harmony', 'The cheerful music felt incongruous during the solemn scene.'],
    ['perfunctory', 'done with little care or interest', 'He gave the form a perfunctory glance before signing it.'],
    ['proliferate', 'increase rapidly in number', 'Small delivery services began to proliferate across the city.'],
    ['resilient', 'able to recover from difficulty', 'The resilient community rebuilt after repeated storms.'],
  ],
};

function pick(list, i, step = 1) {
  // The quotient prevents short cycles when a blueprint samples every fourth item.
  return list[(i * step + Math.floor(i / list.length)) % list.length];
}

const blueprintOccurrences = new Map();

function makeOptions(correct, distractors, correctIndex, seed) {
  const choices = [correct, ...distractors].slice(0, 4);
  if (new Set(choices.map((value) => value.trim().toLowerCase())).size !== 4) {
    throw new Error(`Duplicate option text before rotation: ${JSON.stringify(choices)}`);
  }
  const distractorShift = Math.floor(seed / LABELS.length) % distractors.length;
  const ordered = distractors.slice(distractorShift).concat(distractors.slice(0, distractorShift)).slice(0, 3);
  ordered.splice(correctIndex, 0, correct);
  const options = ordered.map((text, index) => ({ label: LABELS[index], text }));
  return { options, correctAnswer: options.find(({ text }) => text === correct).label };
}

function question(category, difficulty, index, blueprint, stimulus, prompt, correct, distractors, explanation) {
  const occurrenceKey = `${category}/${difficulty}/${blueprint}`;
  const occurrence = blueprintOccurrences.get(occurrenceKey) ?? 0;
  blueprintOccurrences.set(occurrenceKey, occurrence + 1);
  const answerOffset = createHash('sha256').update(occurrenceKey).digest()[0] % LABELS.length;
  const { options, correctAnswer } = makeOptions(correct, distractors, (occurrence + answerOffset) % LABELS.length, index);
  const promptVariant = Math.floor(occurrence / 8) % 4;
  const promptLead = category === 'listening' ? 'According to the transcript, ' : category === 'reading' ? 'Based on the passage, ' : 'Considering the full context, ';
  const variedPrompt = promptVariant === 0 ? prompt
    : promptVariant === 1 ? `${promptLead}${prompt[0].toLowerCase()}${prompt.slice(1)}`
      : promptVariant === 2 ? `Select the best answer: ${prompt}`
        : `After reviewing all four options, ${prompt[0].toLowerCase()}${prompt.slice(1)}`;
  return {
    category,
    difficulty,
    type: 'multiple_choice',
    stimulus,
    question: variedPrompt,
    prompt: variedPrompt,
    options,
    correct_answer: correctAnswer,
    explanation,
    status: 'published',
    content_metadata: { stimulus_type: category === 'listening' ? 'transcript' : 'text', blueprint },
    batch_id: BATCH_ID,
    source_key: `english-bank:${category}:${difficulty}:${String(index + 1).padStart(3, '0')}`,
    batch_metadata: { generator: 'scripts/generate-question-bank.mjs', version: VERSION, blueprint, ordinal: index + 1, locale: 'en' },
  };
}

function grammarQuestion(difficulty, i) {
  const name = pick(names, i, 3);
  const place = pick(places, i, 5);
  const day = pick(days, i, 2);
  const object = pick(objects, i, 7);
  const mode = i % 4;
  if (difficulty === 'easy') {
    if (mode === 0) return question('grammar', difficulty, i, 'present-simple-agreement', `${name} ___ the ${place} every ${day}.`, 'Choose the verb that completes the sentence correctly.', 'visits', ['visit', 'visiting', 'have visited'], `The singular subject ${name} takes the third-person singular form "visits" in the present simple.`);
    if (mode === 1) return question('grammar', difficulty, i, 'past-simple', `Yesterday, ${name} ___ ${object === 'umbrella' ? 'an' : 'a'} ${object} near the ${place}.`, 'Choose the correct past-tense verb.', 'found', ['find', 'finds', 'finding'], '"Yesterday" signals the simple past, and the irregular past form of "find" is "found."');
    if (mode === 2) return question('grammar', difficulty, i, 'articles', `${name} brought ___ umbrella to the ${place} on ${day}.`, 'Choose the correct article.', 'an', ['a', 'the', 'no article'], 'Use "an" before "umbrella" because it begins with a vowel sound.');
    return question('grammar', difficulty, i, 'present-continuous', `Look! ${name} and a friend ___ carrying the ${object}.`, 'Choose the form that completes the sentence.', 'are', ['is', 'am', 'be'], 'The plural subject takes "are" in the present continuous construction "are carrying."');
  }
  if (difficulty === 'medium') {
    if (mode === 0) return question('grammar', difficulty, i, 'second-conditional', `If ${name} ___ more time, the ${projects[i % projects.length]} would be ready by ${day}.`, 'Choose the form that correctly completes this hypothetical condition.', 'had', ['has', 'will have', 'would have'], 'A second conditional uses the simple past in the if-clause and "would" plus a base verb in the result clause.');
    if (mode === 1) return question('grammar', difficulty, i, 'passive-voice', `Workers repaired the ${place} before ${day}.`, 'Choose the correct passive version.', `The ${place} was repaired before ${day}.`, [`The ${place} repaired before ${day}.`, `The ${place} has repair before ${day}.`, `The ${place} was repairing before ${day}.`], 'The simple-past passive uses "was" plus the past participle "repaired."');
    if (mode === 2) return question('grammar', difficulty, i, 'reported-speech', `${name} said, "I am bringing the ${object} tomorrow."`, 'Choose the standard reported-speech version when reporting the statement later.', `${name} said that they were bringing the ${object} the next day.`, [`${name} said that I was bringing the ${object} the next day.`, `${name} said that they are bringing the ${object} yesterday.`, `${name} said that they would bring the ${object} tomorrow.`], 'In standard backshift, "am bringing" becomes "were bringing," and "tomorrow" becomes "the next day."');
    return question('grammar', difficulty, i, 'relative-clauses', `The volunteer ___ organized the ${projects[i % projects.length]} thanked ${name}.`, 'Choose the relative pronoun that refers to a person as the subject of the clause.', 'who', ['which', 'where', 'whose'], '"Who" introduces a relative clause whose antecedent is a person and functions as its subject.');
  }
  if (mode === 0) return question('grammar', difficulty, i, 'negative-inversion', `Never before ___ the ${place} been so crowded during a ${projects[i % projects.length]} on ${day}.`, 'Choose the auxiliary required after the negative adverb.', 'has', ['have', 'did', 'was'], 'A fronted negative expression triggers subject-auxiliary inversion; the singular subject takes "has."');
  if (mode === 1) return question('grammar', difficulty, i, 'mandative-subjunctive', `At the ${place}, the coordinator insisted that ${name} ___ present before the ${projects[i % projects.length]} began on ${day}.`, 'Choose the form required in formal mandative usage.', 'be', ['is', 'was', 'being'], 'After "insisted that" in mandative usage, the subjunctive uses the base form "be."');
  if (mode === 2) return question('grammar', difficulty, i, 'participle-clause', `___ by the unexpected delay on ${day}, ${name} revised the schedule for the ${projects[i % projects.length]} at the ${place}.`, 'Choose the participle that shows how the person was affected.', 'Concerned', ['Concerning', 'Having concern', 'Was concerned'], 'The past participle "Concerned" forms a reduced passive clause modifying the person.');
  return question('grammar', difficulty, i, 'correlative-agreement', `Neither the manager nor the volunteers at the ${place} ___ willing to cancel the ${projects[i % projects.length]} on ${day}.`, 'Choose the verb that follows proximity agreement.', 'were', ['was', 'is', 'has been'], 'With "neither...nor," the verb commonly agrees with the nearer subject; "volunteers" is plural, so "were" is appropriate.');
}

function vocabularyQuestion(difficulty, i) {
  const bank = vocabulary[difficulty];
  const entry = bank[i % bank.length];
  const distractors = [bank[(i + 5) % bank.length][1], bank[(i + 11) % bank.length][1], bank[(i + 17) % bank.length][1]];
  const mode = Math.floor(i / bank.length) % 4;
  const prompts = [
    `What does "${entry[0]}" most nearly mean in this context?`,
    `Which definition best matches the highlighted word "${entry[0]}"?`,
    `Choose the closest meaning of "${entry[0]}" as it is used here.`,
    `Which phrase could replace "${entry[0]}" without changing the main meaning?`,
  ];
  return question('vocabulary', difficulty, i, `context-meaning-${mode + 1}`, entry[2], prompts[mode], entry[1], distractors, `In this context, "${entry[0]}" means "${entry[1]}." The surrounding details support that meaning.`);
}

function comprehensionQuestion(category, difficulty, i) {
  const name = pick(names, i, 5);
  const place = pick(places, i, 3);
  const project = pick(projects, i, 7);
  const day = pick(days, i, 2);
  const time = pick(times, i, 5);
  const reason = pick(reasons, i, 3);
  const mode = i % 4;
  const isListening = category === 'listening';
  const source = isListening ? 'transcript' : 'passage';
  if (difficulty === 'easy') {
    const object = pick(objects, i, 3);
    const stimulus = isListening
      ? `Coordinator: "${name}, the ${project} team will meet at the ${place} on ${day}. We begin at ${time}"\n${name}: "Thanks. I'll bring ${object === 'umbrella' ? 'an' : 'a'} ${object}."`
      : `${name} planned to meet the ${project} team at the ${place} on ${day}. The meeting starts at ${time} ${name} packed ${object === 'umbrella' ? 'an' : 'a'} ${object} before leaving home.`;
    if (mode === 0) return question(category, difficulty, i, `${source}-explicit-place`, stimulus, `Where will ${name} meet the team?`, `At the ${place}`, [`At the ${pick(places, i + 1)}`, `At the ${pick(places, i + 2)}`, `At the ${pick(places, i + 4)}`], `The ${source} directly states that the meeting is at the ${place}.`);
    if (mode === 1) return question(category, difficulty, i, `${source}-explicit-day`, stimulus, 'On which day is the meeting?', day, [days[(days.indexOf(day) + 1) % 7], days[(days.indexOf(day) + 2) % 7], days[(days.indexOf(day) + 4) % 7]], `The ${source} explicitly gives ${day} as the meeting day.`);
    if (mode === 2) return question(category, difficulty, i, `${source}-explicit-time`, stimulus, 'What time does the meeting begin?', time, [times[(times.indexOf(time) + 1) % 8], times[(times.indexOf(time) + 3) % 8], times[(times.indexOf(time) + 5) % 8]], `The stated start time is ${time}`);
    const purchase = pick(objects, i);
    return question(category, difficulty, i, `${source}-purpose`, stimulus, `Why is ${name} going to the ${place}?`, `To meet the ${project} team`, [`To buy ${purchase === 'umbrella' ? 'an' : 'a'} ${purchase}`, `To ask when the ${place} closes`, `To deliver supplies to a different team`], `The purpose stated in the ${source} is to meet the ${project} team.`);
  }
  if (difficulty === 'medium') {
    const newTime = times[(times.indexOf(time) + 2) % times.length];
    const stimulus = isListening
      ? `Announcement: "This is an update about the ${project} at the ${place} on ${day}. Because ${reason}, ${name} has moved the opening from ${time} to ${newTime} Most participants accepted the change, but two requested a recording."`
      : `The ${project} was scheduled at the ${place} on ${day}. Because ${reason}, ${name} moved the opening from ${time} to ${newTime} Most participants accepted the change, although two asked for a recorded session.`;
    if (mode === 0) return question(category, difficulty, i, `${source}-cause-effect`, stimulus, 'Why was the opening moved?', reason[0].toUpperCase() + reason.slice(1), ['Too few people registered', 'The project had already finished', 'A different venue was cheaper'], `The ${source} identifies "${reason}" as the cause of the schedule change.`);
    if (mode === 1) return question(category, difficulty, i, `${source}-inference`, stimulus, 'What can reasonably be inferred about the two participants?', 'They might not be able to attend at the new time', ['They opposed the project itself', 'They had already watched the recording', 'They caused the original problem'], 'Requesting a recording suggests that the revised time may not work for them.');
    if (mode === 2) return question(category, difficulty, i, `${source}-sequence`, stimulus, 'What happened after the problem arose?', `${name} changed the opening time`, ['Two participants withdrew from the project', 'The organizers changed the event date', 'The participants selected another venue'], `After the problem, ${name} moved the opening to a later time.`);
    return question(category, difficulty, i, `${source}-main-idea`, stimulus, 'Which statement best summarizes the information?', `A problem caused the ${project} schedule to change`, [`A venue change divided the participants`, `A recording replaced the live ${project}`, `The ${project} proceeded at its original time`], 'The central idea is the schedule adjustment caused by an unexpected problem.');
  }
  const stimulus = isListening
    ? `Host: "The ${project} has clearly helped the community, but can it remain funded?"\n${name}: "Volunteer numbers are rising, so they should offset higher costs."\nReviewer: "That may happen, but the forecast relies on one unusually successful month at the ${place}."`
    : `A review of the ${project} praised its community impact but questioned its long-term funding. ${name}, the coordinator, argued that volunteer growth would offset rising costs. The reviewer acknowledged that possibility while noting that the claim relied on one unusually successful month at the ${place}.`;
  if (mode === 0) return question(category, difficulty, i, `${source}-author-attitude`, stimulus, "How does the reviewer treat the coordinator's prediction?", 'As possible but insufficiently supported', ['As likely because volunteer growth is guaranteed', 'As doubtful because community impact is unimportant', 'As convincing despite uncertainty about future costs'], 'The reviewer acknowledges the possibility but challenges the limited evidence behind it.');
  if (mode === 1) return question(category, difficulty, i, `${source}-evidence-evaluation`, stimulus, 'What weakness does the reviewer identify in the argument?', 'It generalizes from one unusually successful month', ['It measures volunteer growth without considering community impact', 'It compares current costs with those of another project', 'It assumes that funding has already been withdrawn'], 'The prediction rests on one exceptional month, which may not represent a sustainable pattern.');
  if (mode === 2) return question(category, difficulty, i, `${source}-contrast`, stimulus, 'Which tension is central to the discussion?', 'Immediate community value versus uncertain financial sustainability', ['Growing volunteer interest versus declining community value', 'Stable operating costs versus uncertain public support', 'Short-term funding losses versus proven long-term savings'], "The project's positive current impact is contrasted with doubts about future funding.");
  return question(category, difficulty, i, `${source}-function`, stimulus, 'Why does the reviewer mention the unusually successful month?', "To qualify the evidence supporting the coordinator's claim", ['To show when volunteer participation began to decline', 'To contrast the project with another funding model', 'To explain why current operating costs are unusually low'], 'The detail limits how confidently one can generalize from the evidence.');
}

function speakingQuestion(difficulty, i) {
  const name = pick(names, i, 3);
  const place = pick(places, i, 5);
  const project = pick(projects, i, 7);
  const object = pick(objects, i, 3);
  const mode = i % 4;
  if (difficulty === 'easy') {
    const situations = [
      [`${name}: "Could you tell me where the ${place} is?"`, '"Certainly. It is beside the bank."', ['"Yes, I visit it quite often."', '"It usually closes at six."', '"I think the bank is crowded today."'], 'asking for directions'],
      [`${name}: "Thank you for bringing the ${object}."`, '"You\'re welcome."', ['"It should be stored upstairs."', '"I brought it this morning."', '"Could you label it first?"'], 'responding to thanks'],
      [`${name}: "May I borrow your ${pick(objects, i)}?"`, '"Of course. Please return it after class."', ['"I used it during the last lesson."', '"You should buy one at the bookshop."', '"It belongs in the top drawer."'], 'making a polite request'],
      [`${name}: "I'm sorry I arrived late for the ${project}."`, '"That\'s all right. Please take a seat."', ['"The meeting started at nine."', '"You normally arrive by bus."', '"Please send me the agenda later."'], 'responding to an apology'],
    ];
    const [stimulus, correct, wrong, skill] = situations[mode];
    return question('speaking', difficulty, i, `functional-${skill.replaceAll(' ', '-')}`, stimulus, 'Choose the most appropriate response.', correct, wrong, `The response is polite, relevant, and appropriate for ${skill}.`);
  }
  if (difficulty === 'medium') {
    const situations = [
      [`${name}: "I think the ${project} should be held outdoors."`, '"I see your point, but rain could make that difficult."', ['"That is not the plan we discussed."', '"Indoor events are always more successful."', '"Fine, but I still prefer the current venue."'], 'polite-disagreement'],
      [`${name}: "The instructions say we should archive the draft. What does 'archive' mean here?"`, '"It means to store the draft for future reference."', ['"It means the draft has been approved."', '"It means to send the draft to every participant."', '"It means to remove all earlier versions immediately."'], 'clarification'],
      [`${name}: "We still need a venue for the ${project}."`, `"Why don't we ask whether the ${place} is available?"`, ['"The budget does not include new equipment."', '"We should confirm the date before discussing publicity."', '"The previous venue was larger than we needed."'], 'suggestion'],
      [`${name}: "Could you finish the slides by ${pick(days, i, 2)}?"`, '"I can finish them by then if I receive the data today."', ['"I have already chosen the slide template."', '"The data should include last month\'s figures."', '"I usually need several hours to check slides."'], 'negotiating-a-condition'],
    ];
    const [stimulus, correct, wrong, skill] = situations[mode];
    return question('speaking', difficulty, i, skill, stimulus, 'Choose the response that best continues the conversation.', correct, wrong, `This response addresses the speaker's purpose while using an appropriate conversational strategy: ${skill.replaceAll('-', ' ')}.`);
  }
  const situations = [
    [`Chair to ${name}: "Given the limited evidence, should we approve the ${project} now?"`, '"I recommend a small pilot first; it would test the claim without committing the full budget."', ['"I support approval because delaying may reduce public interest."', '"We should reject it until every possible risk has disappeared."', '"Let us approve it now and review the evidence afterward."'], 'qualified-recommendation'],
    [`${name}: "So you're saying the ${project} failed because volunteers were careless?"`, '"Not exactly. I\'m saying unclear instructions contributed to several errors."', ['"I am saying that the volunteers should have asked more questions."', '"The errors matter more than the reasons behind them."', '"Yes, volunteer performance was the only cause I identified."'], 'correcting-a-misinterpretation'],
    [`Interviewer to ${name}: "The short-term results for the ${project} are encouraging. Are you certain they will last?"`, '"No. They are promising, but we need data from a longer period before drawing that conclusion."', ['"Yes, the current trend is strong enough to remove any doubt."', '"Probably, because short-term results usually continue unchanged."', '"No, short-term evidence tells us nothing useful about the future."'], 'hedging-a-claim'],
    [`Moderator to ${name}: "We have heard two competing proposals for the ${project} at the ${place}. How would you move the discussion forward?"`, '"Let\'s identify the criteria we share, then compare both proposals against them."', ['"Let\'s ask each side to defend its position once more."', '"Let\'s choose the proposal with the most initial support."', '"Let\'s postpone the decision until one side withdraws."'], 'facilitating-consensus'],
  ];
  const [stimulus, correct, wrong, skill] = situations[mode];
  return question('speaking', difficulty, i, skill, stimulus, 'Choose the most effective response.', correct, wrong, `The response uses the advanced discussion skill of ${skill.replaceAll('-', ' ')} while remaining precise and constructive.`);
}

function writingQuestion(difficulty, i) {
  const name = pick(names, i, 3);
  const project = pick(projects, i, 5);
  const place = pick(places, i, 7);
  const day = pick(days, i, 2);
  const mode = i % 4;
  if (difficulty === 'easy') {
    if (mode === 0) return question('writing', difficulty, i, 'capitalization', `${name} visited the ${place} in july.`, 'Choose the correctly edited sentence.', `${name} visited the ${place} in July.`, [`In july, ${name} visited the ${place}.`, `${name} made a july visit to the ${place}.`, `The ${place} welcomed ${name} last july.`], 'Months are proper nouns and must begin with a capital letter.');
    if (mode === 1) return question('writing', difficulty, i, 'sentence-boundaries', `${name} prepared the posters the team displayed them.`, 'Choose the version with a correct sentence boundary.', `${name} prepared the posters. The team displayed them.`, [`${name} prepared the posters, the team displayed them.`, `${name} prepared. The posters the team displayed them.`, `${name} prepared the posters the team, displayed them.`], 'Two independent clauses may be separated with a period; the second sentence begins with a capital letter.');
    if (mode === 2) return question('writing', difficulty, i, 'commas-in-a-series', `${name} packed paper markers tape and string for the ${project}.`, 'Choose the sentence with correct list punctuation.', `${name} packed paper, markers, tape, and string for the ${project}.`, [`${name} packed, paper markers tape and string for the ${project}.`, `${name} packed paper markers, tape and, string for the ${project}.`, `${name} packed paper; markers; tape and string for the ${project}.`], 'Commas separate the items in a series.');
    return question('writing', difficulty, i, 'complete-sentences', `Draft notes for the ${project}:`, 'Which option is a complete sentence?', `The volunteers met at the ${place}.`, [`Before the meeting at the ${place}.`, 'Working carefully all afternoon.', `The volunteers at the ${place}.`], 'A complete sentence has a subject and a finite verb and expresses a complete thought.');
  }
  if (difficulty === 'medium') {
    if (mode === 0) return question('writing', difficulty, i, 'transitions-contrast', `The ${project} attracted many visitors. ___, it did not raise enough money to continue.`, 'Choose the transition that best signals contrast.', 'However', ['For example', 'Similarly', 'Therefore'], '"However" signals the contrast between high attendance and insufficient funds.');
    if (mode === 1) return question('writing', difficulty, i, 'conciseness', `The reason the ${project} was postponed was because ${pick(reasons, i)}.`, 'Choose the most concise revision that preserves the meaning.', `The ${project} was postponed because ${pick(reasons, i)}.`, [`The reason why the ${project} was postponed is due to the fact that ${pick(reasons, i)}.`, `Because of the reason that ${pick(reasons, i)}, the ${project} was postponed.`, `The ${project}, which was postponed, had a reason because ${pick(reasons, i)}.`], 'The revision removes redundant phrases such as "the reason ... was because."');
    if (mode === 2) return question('writing', difficulty, i, 'formal-register', `Email draft to the director: "Hey, send me the ${project} numbers ASAP."`, 'Choose the most appropriate formal revision.', `Could you please send me the ${project} figures at your earliest convenience?`, [`Send those ${project} numbers right now.`, `Yo, I need the ${project} stuff soon.`, `The numbers, you know, would be cool.`], 'The revision uses a courteous request, precise vocabulary, and an appropriately formal tone.');
    return question('writing', difficulty, i, 'topic-sentences', `Paragraph details: The ${place} added ramps, lowered one service desk, and installed signs in Braille.`, 'Choose the best topic sentence.', `The ${place} made several changes to improve accessibility.`, [`The ${place} opened on ${pick(days, i)}.`, 'Ramps can be made from several materials.', `${name} likes reading signs.`], 'The topic sentence unifies all three supporting details under the idea of improved accessibility.');
  }
  if (mode === 0) return question('writing', difficulty, i, 'logical-qualification', `${name}'s ${day} report about the ${project} at the ${place} claims: "The project succeeded because attendance rose during its final week."`, 'Choose the revision that avoids overclaiming from limited evidence.', `Higher final-week attendance suggests that the ${project} gained momentum, although other measures are needed to judge its overall success.`, [`The final week proves beyond doubt that every part of the ${project} succeeded.`, `Attendance rose, so no other evidence is relevant.`, `The ${project} succeeded in every possible way.`], 'The revision states what the evidence supports while acknowledging its limits.');
  if (mode === 1) return question('writing', difficulty, i, 'modifier-placement', `In a ${day} report about the ${project} at the ${place}, ${name} wrote: "After reviewing the records, several errors were found by me."`, 'Choose the revision that removes the dangling modifier.', `After reviewing the records, ${name} found several errors.`, [`After reviewing the records, several errors appeared.`, `Several errors, after reviewing the records, were found.`, `The records found several errors after reviewing.`], `The revision makes ${name}, the person who reviewed the records, the subject of the main clause.`);
  if (mode === 2) return question('writing', difficulty, i, 'parallel-structure', `${name}'s ${day} draft for the ${project} at the ${place} says: "The proposal aims to reduce waste, improving access, and that costs should fall."`, 'Choose the revision with parallel structure.', 'The proposal aims to reduce waste, improve access, and lower costs.', ['The proposal aims at reducing waste, to improve access, and lower costs.', 'The proposal aims to reduce waste, improving access, and lower costs.', 'The proposal aims that waste falls, improving access, and to lower costs.'], 'All three coordinated items use parallel base verbs: "reduce," "improve," and "lower."');
  return question('writing', difficulty, i, 'source-integration', `${name}'s source note for the ${project} on ${day}: A city survey found that 68 percent of residents support extending ${place} hours.`, 'Choose the sentence that integrates the evidence accurately and cautiously.', `A city survey indicates that 68 percent of residents favor longer ${place} hours.`, [`Everyone in the city demands longer ${place} hours.`, `The ${place} must stay open because 68 people said so.`, `A survey proves that extended hours will solve all access problems.`], 'The sentence reports the source and percentage accurately without turning support into certainty or unanimity.');
}

function generateQuestions() {
  blueprintOccurrences.clear();
  const generators = {
    grammar: grammarQuestion,
    vocabulary: vocabularyQuestion,
    reading: (difficulty, i) => comprehensionQuestion('reading', difficulty, i),
    listening: (difficulty, i) => comprehensionQuestion('listening', difficulty, i),
    speaking: speakingQuestion,
    writing: writingQuestion,
  };
  const questions = [];
  for (const [category, levels] of Object.entries(TARGETS)) {
    for (const difficulty of DIFFICULTIES) {
      for (let i = 0; i < levels[difficulty]; i += 1) questions.push(generators[category](difficulty, i));
    }
  }
  for (const item of questions) {
    const hashInput = JSON.stringify({
      batch_id: item.batch_id,
      category: item.category,
      difficulty: item.difficulty,
      stimulus: item.stimulus.trim().replace(/\s+/g, ' '),
      prompt: item.prompt.trim().replace(/\s+/g, ' '),
      options: item.options,
      correct_answer: item.correct_answer,
      explanation: item.explanation.trim().replace(/\s+/g, ' '),
    });
    item.content_hash = createHash('sha256').update(hashInput).digest('hex');
  }
  return questions;
}

function validate(questions) {
  const errors = [];
  const hashes = new Set();
  const sourceKeys = new Set();
  const instructionalKeys = new Set();
  const counts = {};
  const labelCounts = {};
  const repetition = {};
  const blueprintLabelCounts = {};
  if (questions.length !== 2000) errors.push(`Expected 2000 questions, found ${questions.length}`);
  for (const [index, item] of questions.entries()) {
    const at = `Question ${index + 1}`;
    const cell = `${item.category}/${item.difficulty}`;
    counts[item.category] ??= { total: 0, easy: 0, medium: 0, hard: 0 };
    counts[item.category].total += 1;
    counts[item.category][item.difficulty] += 1;
    labelCounts[cell] ??= Object.fromEntries(LABELS.map((label) => [label, 0]));
    labelCounts[cell][item.correct_answer] = (labelCounts[cell][item.correct_answer] ?? 0) + 1;
    const blueprintCell = `${cell}/${item.batch_metadata.blueprint}`;
    blueprintLabelCounts[blueprintCell] ??= Object.fromEntries(LABELS.map((label) => [label, 0]));
    blueprintLabelCounts[blueprintCell][item.correct_answer] += 1;
    repetition[cell] ??= { total: 0, blueprints: {}, prompts: new Set(), stimuli: new Set() };
    repetition[cell].total += 1;
    repetition[cell].blueprints[item.batch_metadata.blueprint] = (repetition[cell].blueprints[item.batch_metadata.blueprint] ?? 0) + 1;
    repetition[cell].prompts.add(item.prompt.trim().toLowerCase());
    repetition[cell].stimuli.add(item.stimulus.trim().toLowerCase());
    if (!item.stimulus.trim() || !item.prompt.trim() || !item.explanation.trim()) errors.push(`${at}: blank instructional field`);
    if (item.stimulus.length < 20 || item.stimulus.length > 1200) errors.push(`${at}: stimulus length ${item.stimulus.length} is outside 20-1200 characters`);
    if (item.prompt.length < 10 || item.prompt.length > 300) errors.push(`${at}: prompt length ${item.prompt.length} is outside 10-300 characters`);
    if (item.question !== item.prompt) errors.push(`${at}: legacy question must equal structured prompt`);
    if (/\b(?:Teks|Transkrip|Pertanyaan)\s*:/i.test(`${item.stimulus} ${item.prompt}`)) errors.push(`${at}: forbidden literal prefix`);
    if (!Array.isArray(item.options) || item.options.length !== 4) errors.push(`${at}: options must contain four objects`);
    const labels = item.options.map((option) => option.label);
    const texts = item.options.map((option) => option.text.trim().toLowerCase());
    if (JSON.stringify(labels) !== JSON.stringify(LABELS)) errors.push(`${at}: non-canonical option labels`);
    if (new Set(texts).size !== 4) errors.push(`${at}: duplicate option text (case-insensitive)`);
    const correctOptions = item.options.filter((option) => option.label === item.correct_answer);
    if (correctOptions.length !== 1) errors.push(`${at}: correct answer must reference exactly one option`);
    if (!/^[a-f0-9]{64}$/.test(item.content_hash)) errors.push(`${at}: invalid SHA-256 content hash`);
    if (hashes.has(item.content_hash)) errors.push(`${at}: duplicate content hash`);
    hashes.add(item.content_hash);
    if (!/^english-bank:(?:grammar|vocabulary|reading|listening|speaking|writing):(easy|medium|hard):\d{3}$/.test(item.source_key)) errors.push(`${at}: invalid source key`);
    if (sourceKeys.has(item.source_key)) errors.push(`${at}: duplicate source key`);
    sourceKeys.add(item.source_key);
    const instructionalKey = `${item.stimulus.trim().toLowerCase()}\u0000${item.prompt.trim().toLowerCase()}`;
    if (instructionalKeys.has(instructionalKey)) errors.push(`${at}: duplicate stimulus/prompt pair`);
    instructionalKeys.add(instructionalKey);
    if (item.status !== 'published' || item.batch_id !== BATCH_ID) errors.push(`${at}: invalid publication or batch metadata`);
    if (item.content_metadata?.stimulus_type !== (item.category === 'listening' ? 'transcript' : 'text')) errors.push(`${at}: invalid session content metadata`);
    const instructionalText = `${item.stimulus} ${item.prompt} ${item.options.map(({ text }) => text).join(' ')} ${item.explanation}`;
    if (/\ba umbrella\b/i.test(instructionalText)) errors.push(`${at}: invalid indefinite article before umbrella`);
    if (/[ap]\.m\.\./i.test(instructionalText)) errors.push(`${at}: doubled punctuation after time abbreviation`);
    if (/\bwill bringing\b/i.test(instructionalText)) errors.push(`${at}: malformed future verb phrase`);
    if (/word budget has six letters|building can decide|venues were invented|data does not rhyme/i.test(instructionalText)) errors.push(`${at}: known nonsensical distractor`);
    if (item.category === 'listening' && !/^(?:Coordinator:|Announcement:|Host:)/.test(item.stimulus)) errors.push(`${at}: listening stimulus is not transcript-shaped`);
  }
  for (const [blueprintCell, labels] of Object.entries(blueprintLabelCounts)) {
    const values = Object.values(labels);
    if (Math.max(...values) - Math.min(...values) > 1) errors.push(`${blueprintCell}: correct-answer labels are not balanced (${values.join(', ')})`);
  }
  for (const [category, levels] of Object.entries(TARGETS)) {
    for (const difficulty of DIFFICULTIES) {
      if (counts[category]?.[difficulty] !== levels[difficulty]) errors.push(`${category}/${difficulty}: expected ${levels[difficulty]}, found ${counts[category]?.[difficulty] ?? 0}`);
      const cellLabels = Object.values(labelCounts[`${category}/${difficulty}`] ?? {});
      if (cellLabels.length !== 4 || Math.max(...cellLabels) - Math.min(...cellLabels) > 1) errors.push(`${category}/${difficulty}: correct-answer labels are not balanced (${cellLabels.join(', ')})`);
    }
  }
  const difficultyTotals = Object.values(counts).reduce((totals, count) => {
    for (const difficulty of DIFFICULTIES) totals[difficulty] += count[difficulty];
    return totals;
  }, { easy: 0, medium: 0, hard: 0 });
  if (JSON.stringify(difficultyTotals) !== JSON.stringify({ easy: 667, medium: 667, hard: 666 })) errors.push(`Unexpected difficulty totals: ${JSON.stringify(difficultyTotals)}`);
  if (errors.length) throw new Error(`Validation failed:\n- ${errors.slice(0, 30).join('\n- ')}${errors.length > 30 ? `\n- ...and ${errors.length - 30} more` : ''}`);
  const repetitionReport = Object.fromEntries(Object.entries(repetition).map(([cell, report]) => [cell, {
    total: report.total,
    blueprints: report.blueprints,
    uniquePrompts: report.prompts.size,
    uniqueStimuli: report.stimuli.size,
  }]));
  return { counts, difficultyTotals, hashes: hashes.size, sourceKeys: sourceKeys.size, labelCounts, blueprintLabelCounts, repetitionReport };
}

function sqlLiteral(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function renderSql(questions) {
  const rows = questions.map((item) => `  (${[
    item.category,
    item.difficulty,
    item.type,
    item.stimulus,
    item.question,
    item.prompt,
    JSON.stringify(item.options),
    item.correct_answer,
    item.explanation,
    item.status,
    JSON.stringify(item.content_metadata),
    item.content_hash,
    item.batch_id,
    JSON.stringify(item.batch_metadata),
    item.source_key,
  ].map(sqlLiteral).join(', ')})`).join(',\n');
  return `-- Generated by scripts/generate-question-bank.mjs v${VERSION}. Do not edit by hand.\n` +
    `-- Run: node scripts/generate-question-bank.mjs generate\n` +
    `-- Check: node scripts/generate-question-bank.mjs check\n` +
    `-- Session contract: question and prompt contain the same prompt; stimulus is separate.\n` +
    `-- Requires content_metadata plus planned content_hash, batch_id, and batch_metadata columns.\n` +
    `-- Stable source keys allow corrected generated items to be updated independently of content hashes.\n` +
    `-- V1 is archived only after all 2,000 V2 rows have been resolved and upserted.\n\n` +
    `BEGIN;\n\n` +
    `ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS source_key TEXT;\n` +
    `CREATE UNIQUE INDEX IF NOT EXISTS questions_source_key_unique\n  ON public.questions (source_key)\n  WHERE source_key IS NOT NULL;\n\n` +
    `CREATE TEMP TABLE question_bank_v2_incoming (\n` +
    `  category_slug TEXT NOT NULL, difficulty TEXT NOT NULL, type TEXT NOT NULL,\n` +
    `  stimulus TEXT NOT NULL, question TEXT NOT NULL, prompt TEXT NOT NULL, options TEXT NOT NULL,\n` +
    `  correct_answer TEXT NOT NULL, explanation TEXT NOT NULL, status TEXT NOT NULL,\n` +
    `  content_metadata TEXT NOT NULL, content_hash TEXT NOT NULL, batch_id TEXT NOT NULL,\n` +
    `  batch_metadata TEXT NOT NULL, source_key TEXT NOT NULL\n) ON COMMIT DROP;\n\n` +
    `INSERT INTO question_bank_v2_incoming (category_slug, difficulty, type, stimulus, question, prompt, options, correct_answer, explanation, status, content_metadata, content_hash, batch_id, batch_metadata, source_key)\nVALUES\n${rows};\n\n` +
    `DO $$\nDECLARE\n  v_incoming INTEGER;\n  v_source_keys INTEGER;\n  v_categories INTEGER;\n  v_resolved INTEGER;\nBEGIN\n` +
    `  SELECT COUNT(*), COUNT(DISTINCT source_key) INTO v_incoming, v_source_keys FROM question_bank_v2_incoming;\n` +
    `  IF v_incoming <> 2000 OR v_source_keys <> 2000 THEN\n    RAISE EXCEPTION 'V2 bank requires exactly 2000 incoming rows and source keys; got % rows and % keys', v_incoming, v_source_keys;\n  END IF;\n` +
    `  SELECT COUNT(*) INTO v_categories FROM public.categories WHERE slug IN ('grammar', 'vocabulary', 'reading', 'listening', 'speaking', 'writing');\n` +
    `  IF v_categories <> 6 THEN\n    RAISE EXCEPTION 'V2 bank requires all six category slugs; resolved %', v_categories;\n  END IF;\n` +
    `  SELECT COUNT(*) INTO v_resolved FROM question_bank_v2_incoming AS i JOIN public.categories AS c ON c.slug = i.category_slug;\n` +
    `  IF v_resolved <> 2000 THEN\n    RAISE EXCEPTION 'V2 bank requires exactly 2000 resolved rows; got %', v_resolved;\n  END IF;\nEND $$;\n\n` +
    `INSERT INTO public.questions (category_id, difficulty, type, stimulus, question, prompt, options, correct_answer, explanation, status, content_metadata, content_hash, batch_id, batch_metadata, source_key)\n` +
    `SELECT c.id, i.difficulty, i.type, i.stimulus, i.question, i.prompt, i.options::jsonb, i.correct_answer, i.explanation, i.status, i.content_metadata::jsonb, i.content_hash, i.batch_id, i.batch_metadata::jsonb, i.source_key\n` +
    `FROM question_bank_v2_incoming AS i\nJOIN public.categories AS c ON c.slug = i.category_slug\n` +
    `ON CONFLICT (source_key) WHERE source_key IS NOT NULL DO UPDATE SET\n` +
    `  category_id = EXCLUDED.category_id, difficulty = EXCLUDED.difficulty, type = EXCLUDED.type,\n` +
    `  stimulus = EXCLUDED.stimulus, question = EXCLUDED.question, prompt = EXCLUDED.prompt,\n` +
    `  options = EXCLUDED.options, correct_answer = EXCLUDED.correct_answer, explanation = EXCLUDED.explanation,\n` +
    `  status = EXCLUDED.status, content_metadata = EXCLUDED.content_metadata, content_hash = EXCLUDED.content_hash,\n` +
    `  batch_id = EXCLUDED.batch_id, batch_metadata = EXCLUDED.batch_metadata;\n\n` +
    `DO $$\nDECLARE\n  v_v2_rows INTEGER;\n  v_matched_rows INTEGER;\nBEGIN\n` +
    `  SELECT COUNT(*) INTO v_v2_rows FROM public.questions WHERE batch_id = '${BATCH_ID}';\n` +
    `  SELECT COUNT(*) INTO v_matched_rows\n  FROM public.questions AS q\n  JOIN question_bank_v2_incoming AS i ON i.source_key = q.source_key\n  WHERE q.batch_id = '${BATCH_ID}';\n` +
    `  IF v_v2_rows <> 2000 OR v_matched_rows <> 2000 THEN\n    RAISE EXCEPTION 'Refusing to archive V1: expected exactly 2000 V2 rows matched to incoming; got % total and % matched', v_v2_rows, v_matched_rows;\n  END IF;\n` +
    `  UPDATE public.questions SET status = 'archived'\n  WHERE batch_id = 'english-bank-2000-v1' AND status = 'published';\nEND $$;\n\nCOMMIT;\n`;
}

function printSummary(summary, mode) {
  console.log(`${mode}: 2000 valid questions; ${summary.hashes} unique content hashes; ${summary.sourceKeys} unique source keys.`);
  for (const [category, count] of Object.entries(summary.counts)) console.log(`  ${category}: ${count.total} (easy ${count.easy}, medium ${count.medium}, hard ${count.hard})`);
  console.log(`  difficulty totals: easy ${summary.difficultyTotals.easy}, medium ${summary.difficultyTotals.medium}, hard ${summary.difficultyTotals.hard}`);
  console.log(`  blueprint answer-label balance: ${Object.keys(summary.blueprintLabelCounts).length} blueprints validated (maximum A-D spread 1)`);
  console.log('  semantic/template repetition report:');
  for (const [cell, report] of Object.entries(summary.repetitionReport)) {
    const templates = Object.entries(report.blueprints).map(([name, count]) => `${name}=${count}`).join(', ');
    const labels = LABELS.map((label) => `${label}=${summary.labelCounts[cell][label]}`).join(', ');
    console.log(`    ${cell}: templates [${templates}]; unique prompts ${report.uniquePrompts}/${report.total}; unique stimuli ${report.uniqueStimuli}/${report.total}; labels [${labels}]`);
  }
  console.log(`  artifact: ${OUTPUT.slice(ROOT.length + 1)}`);
  console.log('  quality note: deterministic template output; no AI or human editorial review is claimed.');
}

const mode = process.argv[2] ?? 'generate';
if (!['generate', 'check'].includes(mode)) {
  console.error('Usage: node scripts/generate-question-bank.mjs [generate|check]');
  process.exit(2);
}

try {
  const questions = generateQuestions();
  const summary = validate(questions);
  const sql = renderSql(questions);
  if (mode === 'generate') {
    mkdirSync(dirname(OUTPUT), { recursive: true });
    writeFileSync(OUTPUT, sql, 'utf8');
    printSummary(summary, 'Generated');
  } else {
    const existing = readFileSync(OUTPUT, 'utf8');
    if (existing !== sql) throw new Error('Generated artifact is missing or stale; run generate mode');
    printSummary(summary, 'Checked');
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
