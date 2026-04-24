import { useState, useEffect, useRef } from "react";

// ─── DATA ───

const SUBJECTS = [
  { id: "maths", name: "Mathematics", icon: "∑", color: "#E8553A", progress: 62, grade: "C", topics: 14, mastered: 8 },
  { id: "physics", name: "Physical Sciences", icon: "⚛", color: "#3A8FE8", progress: 45, grade: "D", topics: 12, mastered: 5 },
  { id: "life-sci", name: "Life Sciences", icon: "🧬", color: "#2EAD6B", progress: 78, grade: "B", topics: 10, mastered: 7 },
  { id: "english", name: "English FAL", icon: "Aa", color: "#9B5DE5", progress: 71, grade: "B", topics: 8, mastered: 6 },
];

const LANGUAGES = ["English", "Afrikaans", "Setswana"];

const PAST_PAPERS = [
  { year: 2024, subject: "Mathematics", paper: "Paper 1", score: null, status: "new", topics: "Algebra, Functions, Calculus, Finance, Probability", marks: 150, time: "3 hours" },
  { year: 2024, subject: "Mathematics", paper: "Paper 2", score: null, status: "new", topics: "Geometry, Trig, Analytical Geometry, Statistics", marks: 150, time: "3 hours" },
  { year: 2024, subject: "Physical Sciences", paper: "Paper 1", score: null, status: "new", topics: "Mechanics, Waves, Electricity & Magnetism", marks: 150, time: "3 hours" },
  { year: 2024, subject: "Physical Sciences", paper: "Paper 2", score: null, status: "new", topics: "Chemical Change, Matter & Materials, Chemical Systems", marks: 150, time: "3 hours" },
  { year: 2024, subject: "Life Sciences", paper: "Paper 1", score: null, status: "new", topics: "DNA, Meiosis, Genetics, Reproduction, Nervous System", marks: 150, time: "2.5 hours" },
  { year: 2024, subject: "Life Sciences", paper: "Paper 2", score: null, status: "new", topics: "Evolution, Human Impact, Biodiversity", marks: 150, time: "2.5 hours" },
  { year: 2024, subject: "English FAL", paper: "Paper 1", score: null, status: "new", topics: "Comprehension, Summary, Language Structures", marks: 80, time: "2 hours" },
  { year: 2023, subject: "Mathematics", paper: "Paper 1", score: 58, status: "marked", topics: "Algebra, Functions, Calculus, Finance, Probability", marks: 150, time: "3 hours" },
  { year: 2023, subject: "Mathematics", paper: "Paper 2", score: 52, status: "marked", topics: "Geometry, Trig, Analytical Geometry, Statistics", marks: 150, time: "3 hours" },
  { year: 2023, subject: "Physical Sciences", paper: "Paper 1", score: 42, status: "marked", topics: "Mechanics, Waves, Electricity & Magnetism", marks: 150, time: "3 hours" },
  { year: 2023, subject: "Life Sciences", paper: "Paper 1", score: 67, status: "marked", topics: "DNA, Meiosis, Genetics, Reproduction, Nervous System", marks: 150, time: "2.5 hours" },
  { year: 2022, subject: "Mathematics", paper: "Paper 1", score: 48, status: "marked", topics: "Algebra, Functions, Calculus, Finance, Probability", marks: 150, time: "3 hours" },
  { year: 2022, subject: "Physical Sciences", paper: "Paper 1", score: 39, status: "marked", topics: "Mechanics, Waves, Electricity & Magnetism", marks: 150, time: "3 hours" },
];

// ─── QUIZ / ACTIVITY DATA ───

const ACTIVITIES = {
  maths: {
    name: "Mathematics",
    color: "#E8553A",
    icon: "∑",
    quizzes: [
      { id: "m1", title: "Algebra Basics", difficulty: "Easy", questions: [
        { q: "Solve for x: 2x + 6 = 14", opts: ["x = 3", "x = 4", "x = 5", "x = 8"], ans: 1, explain: "2x + 6 = 14 → 2x = 8 → x = 4" },
        { q: "Factorise: x² - 9", opts: ["(x-3)(x+3)", "(x-9)(x+1)", "(x-3)²", "(x+9)(x-1)"], ans: 0, explain: "Difference of two squares: x² - 9 = (x-3)(x+3)" },
        { q: "Simplify: 3(2x - 4) + 2x", opts: ["8x - 12", "6x - 4", "8x - 4", "6x - 12"], ans: 0, explain: "3(2x-4) + 2x = 6x - 12 + 2x = 8x - 12" },
        { q: "If f(x) = 2x² - 3x + 1, find f(2)", opts: ["3", "5", "7", "1"], ans: 0, explain: "f(2) = 2(4) - 3(2) + 1 = 8 - 6 + 1 = 3" },
        { q: "Solve: x² - 5x + 6 = 0", opts: ["x=2 or x=3", "x=1 or x=6", "x=-2 or x=-3", "x=5 or x=1"], ans: 0, explain: "x² - 5x + 6 = (x-2)(x-3) = 0, so x=2 or x=3" },
      ]},
      { id: "m2", title: "Calculus: Differentiation", difficulty: "Medium", questions: [
        { q: "Find f'(x) if f(x) = 3x⁴", opts: ["12x³", "3x³", "12x⁴", "4x³"], ans: 0, explain: "Power rule: f'(x) = 4 × 3x³ = 12x³" },
        { q: "Differentiate: f(x) = x³ - 2x² + 5x - 1", opts: ["3x² - 4x + 5", "3x² - 2x + 5", "x² - 4x + 5", "3x³ - 4x"], ans: 0, explain: "f'(x) = 3x² - 4x + 5. The constant (-1) disappears." },
        { q: "Find dy/dx if y = (2x+1)³ using the chain rule", opts: ["6(2x+1)²", "3(2x+1)²", "6(2x+1)³", "2(2x+1)²"], ans: 0, explain: "Chain rule: 3(2x+1)² × 2 = 6(2x+1)²" },
        { q: "What is the derivative of f(x) = 5?", opts: ["0", "5", "1", "5x"], ans: 0, explain: "The derivative of any constant is 0." },
        { q: "Find the gradient of f(x) = x² - 4x at x = 3", opts: ["2", "-2", "3", "6"], ans: 0, explain: "f'(x) = 2x - 4. At x=3: f'(3) = 6 - 4 = 2" },
      ]},
      { id: "m3", title: "Functions & Graphs", difficulty: "Medium", questions: [
        { q: "What is the axis of symmetry of y = 2(x-3)² + 1?", opts: ["x = 3", "x = -3", "x = 1", "x = 2"], ans: 0, explain: "For y = a(x-p)² + q, the axis of symmetry is x = p = 3" },
        { q: "What is the range of y = -x² + 4?", opts: ["y ≤ 4", "y ≥ 4", "y ≤ 0", "y ≥ -4"], ans: 0, explain: "Since a < 0, the parabola opens down. Max value is q = 4, so y ≤ 4" },
        { q: "The y-intercept of y = 2x + 5 is:", opts: ["5", "2", "-5", "2.5"], ans: 0, explain: "Set x = 0: y = 2(0) + 5 = 5" },
        { q: "What type of function is y = 3/x?", opts: ["Hyperbola", "Parabola", "Straight line", "Exponential"], ans: 0, explain: "y = a/x is the standard form of a hyperbola" },
        { q: "If f(x) = 2ˣ, what is f(0)?", opts: ["1", "0", "2", "undefined"], ans: 0, explain: "Any number to the power of 0 equals 1. 2⁰ = 1" },
      ]},
      { id: "m4", title: "Trigonometry", difficulty: "Hard", questions: [
        { q: "What is the value of sin 30°?", opts: ["0.5", "1", "√3/2", "0"], ans: 0, explain: "sin 30° = 1/2 = 0.5 (special angle)" },
        { q: "Simplify: sin²θ + cos²θ", opts: ["1", "0", "2", "sin2θ"], ans: 0, explain: "This is the fundamental trig identity: sin²θ + cos²θ = 1" },
        { q: "What is tan 45°?", opts: ["1", "0", "√2", "undefined"], ans: 0, explain: "tan 45° = sin45°/cos45° = 1" },
        { q: "cos(90° - θ) equals:", opts: ["sinθ", "cosθ", "-sinθ", "tanθ"], ans: 0, explain: "Co-function identity: cos(90° - θ) = sinθ" },
        { q: "The period of y = sin(2x) is:", opts: ["180°", "360°", "90°", "720°"], ans: 0, explain: "Period = 360°/2 = 180°" },
      ]},
      { id: "m5", title: "Probability", difficulty: "Easy", questions: [
        { q: "A die is thrown. P(even number) = ?", opts: ["1/2", "1/3", "1/6", "2/3"], ans: 0, explain: "Even numbers: {2,4,6} = 3 outcomes out of 6. P = 3/6 = 1/2" },
        { q: "P(A) = 0.3, P(B) = 0.5, A and B independent. P(A and B) = ?", opts: ["0.15", "0.80", "0.35", "0.20"], ans: 0, explain: "Independent: P(A and B) = P(A) × P(B) = 0.3 × 0.5 = 0.15" },
        { q: "P(not A) if P(A) = 0.7:", opts: ["0.3", "0.7", "1.3", "0"], ans: 0, explain: "P(not A) = 1 - P(A) = 1 - 0.7 = 0.3" },
        { q: "How many ways to arrange 3 books on a shelf?", opts: ["6", "3", "9", "27"], ans: 0, explain: "3! = 3 × 2 × 1 = 6" },
        { q: "P(A or B) = P(A) + P(B) - P(A and B) is called:", opts: ["Addition rule", "Product rule", "Bayes theorem", "Complement rule"], ans: 0, explain: "This is the Addition Rule for probability" },
      ]},
    ]
  },
  physics: {
    name: "Physical Sciences",
    color: "#3A8FE8",
    icon: "⚛",
    quizzes: [
      { id: "p1", title: "Newton's Laws", difficulty: "Medium", questions: [
        { q: "Newton's First Law is also called the law of:", opts: ["Inertia", "Acceleration", "Reaction", "Gravity"], ans: 0, explain: "Newton's 1st Law = Law of Inertia: an object stays at rest or in motion unless acted on by a net force" },
        { q: "Fnet = ma. If F = 20N and m = 4kg, a = ?", opts: ["5 m/s²", "80 m/s²", "16 m/s²", "24 m/s²"], ans: 0, explain: "a = F/m = 20/4 = 5 m/s²" },
        { q: "Newton's 3rd Law states forces are:", opts: ["Equal and opposite", "Equal and same direction", "Unequal and opposite", "Random"], ans: 0, explain: "For every action there is an equal and opposite reaction" },
        { q: "Weight is calculated by:", opts: ["w = mg", "w = mv", "w = ma²", "w = m/g"], ans: 0, explain: "Weight = mass × gravitational acceleration (g ≈ 9.8 m/s²)" },
        { q: "The SI unit of force is:", opts: ["Newton (N)", "Joule (J)", "Watt (W)", "Pascal (Pa)"], ans: 0, explain: "Force is measured in Newtons (N). 1N = 1 kg·m/s²" },
      ]},
      { id: "p2", title: "Electricity & Circuits", difficulty: "Medium", questions: [
        { q: "Ohm's Law states:", opts: ["V = IR", "V = I/R", "V = I + R", "V = R/I"], ans: 0, explain: "Ohm's Law: Voltage = Current × Resistance (V = IR)" },
        { q: "In a series circuit, total resistance is:", opts: ["R₁ + R₂ + R₃", "1/R₁ + 1/R₂", "R₁ × R₂", "R₁ - R₂"], ans: 0, explain: "Series: resistances add up. Rtotal = R₁ + R₂ + R₃" },
        { q: "Power is calculated by:", opts: ["P = VI", "P = V/I", "P = V + I", "P = V - I"], ans: 0, explain: "Electrical power: P = VI (also P = I²R or P = V²/R)" },
        { q: "Current is measured in:", opts: ["Amperes (A)", "Volts (V)", "Ohms (Ω)", "Watts (W)"], ans: 0, explain: "Current = flow of charge, measured in Amperes (A)" },
        { q: "In parallel, voltage across each resistor is:", opts: ["The same", "Different", "Zero", "Double"], ans: 0, explain: "In parallel circuits, voltage is the same across each branch" },
      ]},
      { id: "p3", title: "Momentum & Impulse", difficulty: "Hard", questions: [
        { q: "Momentum is calculated by:", opts: ["p = mv", "p = ma", "p = Ft", "p = mgh"], ans: 0, explain: "Momentum = mass × velocity. Unit: kg·m/s" },
        { q: "The law of conservation of momentum applies to:", opts: ["Isolated systems", "Open systems", "All systems", "None"], ans: 0, explain: "Total momentum is conserved in an isolated (closed) system with no external forces" },
        { q: "Impulse equals:", opts: ["Change in momentum", "Change in energy", "Change in force", "Change in velocity"], ans: 0, explain: "Impulse = FΔt = Δp (change in momentum)" },
        { q: "In an elastic collision:", opts: ["KE is conserved", "KE is lost", "Momentum is lost", "Objects stick together"], ans: 0, explain: "Elastic collision: both momentum AND kinetic energy are conserved" },
        { q: "A 2kg ball at 3m/s. Momentum = ?", opts: ["6 kg·m/s", "5 kg·m/s", "1.5 kg·m/s", "9 kg·m/s"], ans: 0, explain: "p = mv = 2 × 3 = 6 kg·m/s" },
      ]},
    ]
  },
  "life-sci": {
    name: "Life Sciences",
    color: "#2EAD6B",
    icon: "🧬",
    quizzes: [
      { id: "l1", title: "DNA & Protein Synthesis", difficulty: "Medium", questions: [
        { q: "DNA stands for:", opts: ["Deoxyribonucleic acid", "Dinitrogen acid", "Deoxyribose nucleic acid", "Denatured nucleic acid"], ans: 0, explain: "DNA = Deoxyribonucleic acid, the molecule that carries genetic information" },
        { q: "Base pairing rule: Adenine pairs with:", opts: ["Thymine", "Guanine", "Cytosine", "Uracil"], ans: 0, explain: "In DNA: A-T (2 hydrogen bonds), G-C (3 hydrogen bonds)" },
        { q: "Which enzyme unzips DNA during replication?", opts: ["Helicase", "Polymerase", "Ligase", "Protease"], ans: 0, explain: "Helicase breaks hydrogen bonds between base pairs to unzip the double helix" },
        { q: "mRNA is made during which process?", opts: ["Transcription", "Translation", "Replication", "Mutation"], ans: 0, explain: "Transcription: DNA → mRNA (happens in the nucleus)" },
        { q: "Proteins are made at the:", opts: ["Ribosome", "Nucleus", "Mitochondria", "Cell membrane"], ans: 0, explain: "Translation occurs at ribosomes, where mRNA is read to build proteins" },
      ]},
      { id: "l2", title: "Meiosis & Genetics", difficulty: "Medium", questions: [
        { q: "Meiosis produces:", opts: ["4 haploid cells", "2 diploid cells", "4 diploid cells", "2 haploid cells"], ans: 0, explain: "Meiosis: 2 divisions → 4 genetically unique haploid (n) cells" },
        { q: "Crossing over occurs during:", opts: ["Prophase I", "Metaphase I", "Anaphase II", "Telophase I"], ans: 0, explain: "Crossing over happens in Prophase I when homologous chromosomes exchange genetic material" },
        { q: "A heterozygous genotype is:", opts: ["Bb", "BB", "bb", "None"], ans: 0, explain: "Heterozygous = two different alleles (e.g., Bb)" },
        { q: "In a cross Bb × Bb, ratio of phenotypes:", opts: ["3:1", "1:1", "2:1", "4:0"], ans: 0, explain: "BB:Bb:bb = 1:2:1. Phenotype ratio: 3 dominant : 1 recessive" },
        { q: "Meiosis differs from mitosis because:", opts: ["It produces haploid cells", "It produces diploid cells", "No DNA replication", "Only 1 division"], ans: 0, explain: "Meiosis → haploid (n), Mitosis → diploid (2n). Meiosis has 2 divisions, mitosis has 1." },
      ]},
      { id: "l3", title: "Evolution", difficulty: "Easy", questions: [
        { q: "Natural selection was proposed by:", opts: ["Charles Darwin", "Gregor Mendel", "Louis Pasteur", "Jean Lamarck"], ans: 0, explain: "Charles Darwin proposed natural selection as the mechanism of evolution" },
        { q: "Which is evidence for evolution?", opts: ["Fossils", "Prayer", "Weather patterns", "Cooking recipes"], ans: 0, explain: "Fossils, comparative anatomy, DNA evidence, and biogeography all support evolution" },
        { q: "'Survival of the fittest' means:", opts: ["Best adapted survive", "Strongest survive", "Fastest survive", "Biggest survive"], ans: 0, explain: "Fittest = best adapted to the environment, not necessarily physically strongest" },
        { q: "Homologous structures suggest:", opts: ["Common ancestor", "No relation", "Convergent evolution", "Mutation"], ans: 0, explain: "Similar structures in different species suggest they evolved from a common ancestor" },
        { q: "Lamarck's theory is largely:", opts: ["Rejected", "Accepted", "Proven", "Unchanged"], ans: 0, explain: "Lamarck's theory of inheritance of acquired characteristics is mostly rejected" },
      ]},
    ]
  },
  english: {
    name: "English FAL",
    color: "#9B5DE5",
    icon: "Aa",
    quizzes: [
      { id: "e1", title: "Grammar & Language", difficulty: "Easy", questions: [
        { q: "Change to passive: 'The dog bit the boy'", opts: ["The boy was bitten by the dog", "The boy bit the dog", "The dog was bitten", "The boy is biting the dog"], ans: 0, explain: "Passive: Object becomes subject + was/were + past participle + by + agent" },
        { q: "Identify the figure of speech: 'Life is a journey'", opts: ["Metaphor", "Simile", "Alliteration", "Hyperbole"], ans: 0, explain: "Metaphor: direct comparison without 'like' or 'as'" },
        { q: "Change to reported speech: She said, 'I am happy'", opts: ["She said that she was happy", "She said that I am happy", "She says she is happy", "She said that she is happy"], ans: 0, explain: "Reported speech: change tense back, pronouns shift. 'am' → 'was', 'I' → 'she'" },
        { q: "'The wind whispered through the trees' is:", opts: ["Personification", "Simile", "Irony", "Oxymoron"], ans: 0, explain: "Personification: giving human qualities (whispering) to non-human things (wind)" },
        { q: "Subject-verb agreement: 'The group of boys ___ playing'", opts: ["is", "are", "were", "been"], ans: 0, explain: "The subject is 'group' (singular), so the verb is 'is'" },
      ]},
      { id: "e2", title: "Comprehension Skills", difficulty: "Medium", questions: [
        { q: "'Read between the lines' means to find:", opts: ["Implied meaning", "Direct facts", "The title", "Page numbers"], ans: 0, explain: "Inference: understanding what the author implies but doesn't directly state" },
        { q: "A topic sentence is usually found:", opts: ["At the start of a paragraph", "At the end", "In the middle", "Nowhere specific"], ans: 0, explain: "The topic sentence introduces the main idea and is typically the first sentence" },
        { q: "When asked to answer 'in your own words', you must:", opts: ["Rephrase the text", "Copy from the text", "Make up an answer", "Skip the question"], ans: 0, explain: "Paraphrase: express the same meaning using different words" },
        { q: "A 2-mark question requires:", opts: ["2 points or facts", "1 long answer", "2 pages", "2 examples only"], ans: 0, explain: "Generally, each mark requires one valid point or fact" },
        { q: "The tone of a text refers to:", opts: ["The author's attitude", "The volume", "The font size", "The length"], ans: 0, explain: "Tone = the author's attitude toward the subject (e.g., sarcastic, hopeful, critical)" },
      ]},
      { id: "e3", title: "Essay Writing", difficulty: "Medium", questions: [
        { q: "A good essay introduction should include:", opts: ["A hook and thesis statement", "The conclusion", "All supporting evidence", "A bibliography"], ans: 0, explain: "Introduction: Hook (attention grabber) + Background + Thesis (main argument)" },
        { q: "Each body paragraph should start with a:", opts: ["Topic sentence", "Quotation", "Question", "Conclusion"], ans: 0, explain: "Topic sentence introduces the main point of that paragraph" },
        { q: "Linking words like 'Furthermore' and 'However' are called:", opts: ["Conjunctions/connectors", "Nouns", "Adjectives", "Prepositions"], ans: 0, explain: "Discourse markers/connectors link ideas and show relationships between paragraphs" },
        { q: "An essay conclusion should:", opts: ["Summarise and restate the thesis", "Introduce new arguments", "Ask questions", "Copy the introduction"], ans: 0, explain: "Conclusion: restate thesis (in different words), summarise key points, end with a thought-provoking statement" },
        { q: "For FAL, an essay should be approximately:", opts: ["250-300 words", "1000 words", "50 words", "500-600 words"], ans: 0, explain: "English FAL essays: 250-300 words. Home Language: 350-400 words." },
      ]},
    ]
  },
};

const INITIAL_MESSAGES = {
  maths: [{ role: "assistant", content: "Molo, Keitumetse! 👋 I'm your Maths tutor. I can see you're working on Calculus — specifically differentiation. Would you like me to explain the chain rule, or shall we practice with past-paper questions? I'm here to help you push that 62% up!" }],
  physics: [{ role: "assistant", content: "Hello, Keitumetse! Let's tackle Physical Sciences together. Your diagnostic shows Newton's Laws need attention. Want to start with a quick concept check, or jump into a problem?" }],
  "life-sci": [{ role: "assistant", content: "Hi Keitumetse! 🧬 Great work on Life Sciences — 78% is solid! Let's push for that distinction. What would you like to work on? DNA & protein synthesis, genetics, evolution, or something else?" }],
  english: [{ role: "assistant", content: "Hello Keitumetse! 📚 Your English is looking good at 71%. Let's sharpen those skills — I can help with essay writing, comprehension strategies, literature analysis, or grammar. What do you need today?" }],
};

const WEEKLY_DATA = [
  { day: "Mon", minutes: 45 }, { day: "Tue", minutes: 30 }, { day: "Wed", minutes: 60 },
  { day: "Thu", minutes: 20 }, { day: "Fri", minutes: 55 }, { day: "Sat", minutes: 90 }, { day: "Sun", minutes: 40 },
];

const STUDENTS = [
  { id: 1, name: "Keitumetse D.", school: "Upington High", grade: 12, avatar: "K", maths: 62, physics: 45, lifeSci: 78, english: 71, avgScore: 64, trend: "improving", lastActive: "today", studyMin: 340, streak: 12, risk: "low", bachelorProb: 68, papers: 5, weakTopic: "Calculus" },
  { id: 2, name: "Thabo M.", school: "Rietfontein Combined", grade: 12, avatar: "T", maths: 31, physics: 38, lifeSci: 52, english: 44, avgScore: 41, trend: "declining", lastActive: "3 days ago", studyMin: 85, streak: 0, risk: "high", bachelorProb: 18, papers: 1, weakTopic: "Algebra" },
  { id: 3, name: "Lerato K.", school: "Pofadder High", grade: 11, avatar: "L", maths: 55, physics: 34, lifeSci: 61, english: 58, avgScore: 52, trend: "stagnant", lastActive: "1 day ago", studyMin: 160, streak: 3, risk: "medium", bachelorProb: 42, papers: 3, weakTopic: "Newton's Laws" },
  { id: 4, name: "Pieter vdM.", school: "Kakamas High", grade: 12, avatar: "P", maths: 28, physics: 25, lifeSci: 40, english: 35, avgScore: 32, trend: "declining", lastActive: "5 days ago", studyMin: 30, streak: 0, risk: "high", bachelorProb: 8, papers: 0, weakTopic: "Trigonometry" },
  { id: 5, name: "Naledi S.", school: "Springbok Combined", grade: 11, avatar: "N", maths: 72, physics: 68, lifeSci: 81, english: 75, avgScore: 74, trend: "improving", lastActive: "today", studyMin: 420, streak: 21, risk: "low", bachelorProb: 88, papers: 8, weakTopic: "Organic Chemistry" },
  { id: 6, name: "Johannes F.", school: "Upington High", grade: 12, avatar: "J", maths: 48, physics: 52, lifeSci: 60, english: 55, avgScore: 54, trend: "improving", lastActive: "today", studyMin: 210, streak: 7, risk: "medium", bachelorProb: 45, papers: 4, weakTopic: "Electrostatics" },
  { id: 7, name: "Amogelang R.", school: "Rietfontein Combined", grade: 12, avatar: "A", maths: 40, physics: 36, lifeSci: 55, english: 50, avgScore: 45, trend: "stagnant", lastActive: "2 days ago", studyMin: 100, streak: 1, risk: "medium", bachelorProb: 28, papers: 2, weakTopic: "Functions & Graphs" },
  { id: 8, name: "Maria vW.", school: "Kakamas High", grade: 11, avatar: "M", maths: 85, physics: 78, lifeSci: 90, english: 82, avgScore: 84, trend: "improving", lastActive: "today", studyMin: 510, streak: 30, risk: "low", bachelorProb: 96, papers: 12, weakTopic: "Probability" },
  { id: 9, name: "Sipho N.", school: "Pofadder High", grade: 12, avatar: "S", maths: 35, physics: 30, lifeSci: 48, english: 42, avgScore: 39, trend: "declining", lastActive: "4 days ago", studyMin: 55, streak: 0, risk: "high", bachelorProb: 12, papers: 1, weakTopic: "Differentiation" },
  { id: 10, name: "Refilwe T.", school: "Springbok Combined", grade: 11, avatar: "R", maths: 60, physics: 57, lifeSci: 70, english: 65, avgScore: 63, trend: "improving", lastActive: "today", studyMin: 290, streak: 9, risk: "low", bachelorProb: 62, papers: 6, weakTopic: "Work, Energy, Power" },
];

const SCHOOLS = ["All Schools", "Upington High", "Rietfontein Combined", "Pofadder High", "Kakamas High", "Springbok Combined"];

const MONTHLY_TRENDS = [
  { month: "Jan", avg: 38 }, { month: "Feb", avg: 41 }, { month: "Mar", avg: 44 },
  { month: "Apr", avg: 48 }, { month: "May", avg: 46 }, { month: "Jun", avg: 50 },
  { month: "Jul", avg: 53 }, { month: "Aug", avg: 55 }, { month: "Sep", avg: 54 }, { month: "Oct", avg: 57 },
];

// ─── SHARED COMPONENTS ───

function CircularProgress({ value, size = 80, stroke = 6, color, children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}

function MiniBar({ data, color, height = 60 }) {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ width: 18, borderRadius: 4, height: Math.max(4, (d.value / max) * height * 0.85), background: color || "#E8553A", opacity: 0.7 + (d.value / max) * 0.3, transition: "height 0.5s ease" }} />
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function RiskBadge({ risk }) {
  const c = risk === "high" ? "#E8553A" : risk === "medium" ? "#FFB930" : "#2EAD6B";
  return <span style={{ padding: "3px 10px", borderRadius: 10, fontSize: 10, fontWeight: 600, textTransform: "uppercase", background: c + "18", color: c }}>{risk}</span>;
}

function TrendArrow({ trend }) {
  const c = trend === "declining" ? "#E8553A" : trend === "improving" ? "#2EAD6B" : "#FFB930";
  return <span style={{ fontSize: 15, color: c }}>{trend === "declining" ? "↓" : trend === "improving" ? "↑" : "→"}</span>;
}

function ScoreBar({ value, color }) {
  return (
    <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", width: "100%" }}>
      <div style={{ height: "100%", borderRadius: 3, background: color || "#E8553A", width: (value) + "%", transition: "width 0.8s ease", minWidth: 2 }} />
    </div>
  );
}

function AreaChart({ data, color, height = 100 }) {
  const max = Math.max(...data.map(d => d.value));
  const min = Math.min(...data.map(d => d.value)) * 0.8;
  const w = 100, h = height;
  const points = data.map((d, i) => ({ x: (i / (data.length - 1)) * w, y: h - ((d.value - min) / (max - min)) * (h * 0.8) - h * 0.1 }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = linePath + ` L${w},${h} L0,${h} Z`;
  const gid = `grad-${color.replace("#","")}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <path d={areaPath} fill={`url(#${gid})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} />)}
    </svg>
  );
}

// ─── LIVE AI BADGE ───

function LiveAIBadge() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 12, background: "rgba(46,173,107,0.12)", border: "1px solid rgba(46,173,107,0.25)" }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2EAD6B", animation: "pulse 2s ease infinite" }} />
      <span style={{ fontSize: 9, fontWeight: 600, color: "#2EAD6B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Live AI</span>
    </div>
  );
}

// ─── LEARNER: HOME ───

function HomeScreen({ onNavigate, learnerName }) {
  const [lang, setLang] = useState(0);
  const totalMinutes = WEEKLY_DATA.reduce((a, d) => a + d.minutes, 0);
  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingTop: 16 }}>
        <div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>Good afternoon,</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 0", color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{learnerName}</h1>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setLang((lang + 1) % 3)} style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "6px 12px", color: "#fff", fontSize: 11, cursor: "pointer" }}>🌍 {LANGUAGES[lang]}</button>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #E8553A, #FF8C42)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{learnerName[0]}</div>
        </div>
      </div>

      <div style={{ background: "linear-gradient(135deg, rgba(232,85,58,0.15), rgba(255,140,66,0.1))", border: "1px solid rgba(232,85,58,0.25)", borderRadius: 16, padding: 16, marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 28 }}>🔥</span>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#E8553A", fontFamily: "'Outfit', sans-serif" }}>12 Day Streak</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", margin: 0 }}>Keep it up!</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{totalMinutes}<span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.4)" }}> min</span></p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>this week</p>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)", margin: "0 0 12px", fontFamily: "'Outfit', sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>Weekly Activity</h3>
        <MiniBar data={WEEKLY_DATA.map(d => ({ value: d.minutes, label: d.day }))} height={50} color="#E8553A" />
      </div>

      <div style={{ marginTop: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.6)", margin: "0 0 14px", fontFamily: "'Outfit', sans-serif", letterSpacing: "0.5px", textTransform: "uppercase" }}>My Subjects</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {SUBJECTS.map(sub => (
            <button key={sub.id} onClick={() => onNavigate("tutor", sub.id)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16, cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: sub.color, opacity: 0.06 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span style={{ fontSize: 28 }}>{sub.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: sub.color, background: sub.color + "18", padding: "2px 8px", borderRadius: 8 }}>{sub.grade}</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", margin: "10px 0 2px" }}>{sub.name}</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", margin: 0 }}>{sub.mastered}/{sub.topics} topics</p>
              <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
                <div style={{ height: "100%", borderRadius: 2, background: sub.color, width: sub.progress + "%" }} />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 28, display: "flex", gap: 10 }}>
        {[{ label: "Past Papers", icon: "📝", action: () => onNavigate("papers") }, { label: "Activities", icon: "🧠", action: () => onNavigate("activities") }, { label: "AI Tutor", icon: "🤖", action: () => onNavigate("tutor", "maths") }, { label: "Progress", icon: "📊", action: () => onNavigate("progress") }].map((a, i) => (
          <button key={i} onClick={a.action} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "14px 8px", cursor: "pointer", textAlign: "center" }}>
            <span style={{ fontSize: 22, display: "block" }}>{a.icon}</span>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 6, display: "block" }}>{a.label}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 12, background: "rgba(46,173,107,0.08)", border: "1px solid rgba(46,173,107,0.2)" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2EAD6B" }} />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Live AI demo — powered by JM CYBER SPACE AI</span>
      </div>
    </div>
  );
}

// ─── SMART MOCK AI RESPONSES ───

const MOCK_RESPONSES = {
  maths: {
    keywords: {
      "chain": "Great question! The chain rule is one of the most important tools in calculus. 🔗\n\nIf y = f(g(x)), then:\n\ndy/dx = f'(g(x)) · g'(x)\n\nThink of it like peeling layers of an onion:\n1️⃣ Differentiate the outer function\n2️⃣ Keep the inner function as is\n3️⃣ Multiply by the derivative of the inner function\n\n📝 Example:\ny = (3x + 1)⁵\n→ dy/dx = 5(3x + 1)⁴ · 3\n→ dy/dx = 15(3x + 1)⁴\n\nShall I give you a practice question to try?",
      "practice": "Here's a past-paper style question for you! 📝\n\nQ: Determine f'(x) if f(x) = (2x² - 1)³\n\nHint: Use the chain rule — identify your outer function and inner function first.\n\nTake your time and send me your working. I'll mark each step! 💪",
      "function": "Functions & Graphs is a big part of Paper 1! Let me break down the key types you need to know:\n\n📈 Straight line: y = mx + c\n📈 Parabola: y = a(x - p)² + q\n📈 Hyperbola: y = a/(x - p) + q\n📈 Exponential: y = abˣ + q\n\nFor each one, you must know:\n• How to sketch it\n• Domain and range\n• Asymptotes (where applicable)\n• How to find intercepts\n\nWhich type would you like to work on? Or shall I give you a mixed practice question?",
      "differentiat": "Differentiation is finding the rate of change — how fast something changes! 📊\n\nThe basic rules you must know:\n\n1. Power Rule: If f(x) = xⁿ, then f'(x) = nxⁿ⁻¹\n2. Constant Rule: If f(x) = c, then f'(x) = 0\n3. Sum Rule: Differentiate each term separately\n4. Chain Rule: For composite functions\n\n📝 Example:\nf(x) = 3x⁴ - 2x² + 7x - 5\nf'(x) = 12x³ - 4x + 7\n\nNotice how the constant (-5) disappears? That's because the derivative of any constant is 0.\n\nWant to try one yourself?",
      "trigonometry": "Trig is essential for Paper 2! Here are the key identities you MUST memorise:\n\n🔺 sin²θ + cos²θ = 1\n🔺 tanθ = sinθ/cosθ\n🔺 sin(90° - θ) = cosθ\n🔺 cos(90° - θ) = sinθ\n\nCompound angles:\n• sin(A ± B) = sinAcosB ± cosAsinB\n• cos(A ± B) = cosAcosB ∓ sinAsinB\n\nDouble angles:\n• sin2A = 2sinAcosA\n• cos2A = cos²A - sin²A = 2cos²A - 1 = 1 - 2sin²A\n\nWhich area gives you the most trouble? I can focus on that! 💪",
      "algebra": "Let's strengthen your algebra! These are the key areas for Paper 1:\n\n🧮 Factorising: Common factor, difference of squares, trinomials, sum/difference of cubes, grouping\n\n🧮 Equations: Linear, quadratic (factoring, completing the square, formula), simultaneous, exponential\n\n🧮 Inequalities: Linear and quadratic\n\nQuadratic formula (memorise this!):\nx = (-b ± √(b² - 4ac)) / 2a\n\nWant me to work through a specific type, or shall I test you with a question?",
      "probability": "Probability comes up in Paper 1 — usually around 15-20 marks! 🎲\n\nKey concepts:\n• P(A) = n(A)/n(S) — favourable outcomes ÷ total outcomes\n• P(A or B) = P(A) + P(B) - P(A and B)\n• P(A and B) = P(A) × P(B) — only if independent!\n• Complementary: P(not A) = 1 - P(A)\n\nYou also need to know:\n• Venn diagrams (2 and 3 events)\n• Tree diagrams\n• Contingency tables\n• Counting principle\n\nWhich area should we focus on?",
      "mark": "Sure, send me your answer and I'll mark it step by step! 📝\n\nWhen you write out your working, try to show:\n• Each step clearly\n• The rule you're applying\n• Your final answer\n\nThis is exactly how the NSC markers want to see it — you earn marks for method, not just the answer! So even if your final answer is wrong, good working can still get you marks. 💪\n\nGo ahead, I'm ready!",
      "help": "Of course! I'm here to help you succeed, Keitumetse! 🌟\n\nHere's what I can do for you:\n📖 Explain any maths concept step-by-step\n📝 Give you practice questions from past papers\n✅ Mark your answers and show where you went wrong\n🎯 Focus on your weak areas (like calculus)\n💡 Share exam tips and tricks\n\nWhat would you like to work on? Remember, your 12-day streak shows real commitment — keep it up!",
      "exam": "Great that you're thinking about exam prep! Here's your NSC Maths exam structure:\n\n📋 Paper 1 (3 hours, 150 marks):\n• Algebra & Equations (±25 marks)\n• Functions & Graphs (±35 marks)\n• Calculus (±35 marks)\n• Financial Maths (±15 marks)\n• Probability (±15 marks)\n• Number Patterns (±25 marks)\n\n📋 Paper 2 (3 hours, 150 marks):\n• Euclidean Geometry (±40 marks)\n• Analytical Geometry (±30 marks)\n• Trigonometry (±40 marks)\n• Statistics (±20 marks)\n\n💡 Tip: Start with the topics you're strongest in to build confidence, then tackle the harder sections.\n\nWhich paper would you like to focus on?",
    },
    fallback: "That's a great question, Keitumetse! 💭\n\nLet me help you with that. Could you tell me a bit more about what specifically you'd like to understand? For example:\n\n• Do you need a concept explained from scratch?\n• Would you like a worked example?\n• Do you want a practice question to try?\n• Or should I focus on exam technique?\n\nThe more specific you are, the better I can help you push that maths mark up! 📈"
  },
  physics: {
    keywords: {
      "newton": "Newton's Laws are fundamental to mechanics — let's nail them! ⚡\n\n🔹 Newton's 1st Law (Inertia):\nAn object remains at rest or in uniform motion unless acted on by a net force.\n\n🔹 Newton's 2nd Law:\nFnet = ma\nThe net force equals mass × acceleration. Direction matters!\n\n🔹 Newton's 3rd Law:\nWhen object A exerts a force on object B, B exerts an equal but opposite force on A.\n\n📝 Key exam tip: Always draw a free-body diagram first! Label ALL forces (weight, normal, friction, applied, tension).\n\nWant me to work through a problem, or shall I give you one to try?",
      "practice": "Here's a classic NSC-style question! 📝\n\nA 5 kg block is pulled along a rough horizontal surface by a force of 30 N applied at 25° above the horizontal. The coefficient of kinetic friction is 0,2.\n\na) Draw a free-body diagram showing all forces.\nb) Calculate the normal force.\nc) Calculate the frictional force.\nd) Calculate the acceleration of the block.\n\nRemember: Break the applied force into components first!\n\nTake your time and show your working. I'll check each step! 💪",
      "momentum": "Momentum is a key topic in mechanics! 🚀\n\nMomentum: p = mv (unit: kg·m·s⁻¹)\n\nKey principles:\n\n📌 Impulse-Momentum Theorem:\nFnet·Δt = Δp = m(vf - vi)\n\n📌 Conservation of Momentum:\nΣpi = Σpf (in an isolated system)\nFor two objects: m₁v₁ᵢ + m₂v₂ᵢ = m₁v₁f + m₂v₂f\n\n📌 Types of collisions:\n• Elastic: kinetic energy conserved\n• Inelastic: kinetic energy NOT conserved\n\n💡 Exam tip: Always define a positive direction first and stick with it!\n\nShall I work through a collision problem?",
      "electr": "Let's break down electricity & electrostatics! ⚡\n\nElectrostatics:\n• Coulomb's Law: F = kQ₁Q₂/r² (k = 9 × 10⁹ N·m²·C⁻²)\n• Electric field: E = F/q = kQ/r²\n\nCircuits (Ohm's Law):\n• V = IR\n• Series: Rtotal = R₁ + R₂ + R₃\n• Parallel: 1/Rtotal = 1/R₁ + 1/R₂ + 1/R₃\n• Power: P = VI = I²R = V²/R\n• Energy: W = VIt = I²Rt\n\n💡 Key tip: In circuit problems, always identify series and parallel sections first before calculating.\n\nWhat specifically would you like to practice?",
      "energy": "Work, Energy & Power — big marks in Paper 1! 💪\n\nWork: W = FΔxcosθ (unit: Joule)\n• Only the component of force in the direction of motion does work\n\nWork-Energy Theorem:\nWnet = ΔEk = ½mv²f - ½mv²i\n\nConservation of Energy:\nEk₁ + Ep₁ + Wfric = Ek₂ + Ep₂\n\nPower: P = W/Δt = Fv (unit: Watt)\n\n📝 Exam approach:\n1. Draw a diagram\n2. List known values with units\n3. Choose the right formula\n4. Substitute and solve\n\nWant a practice problem?",
      "help": "I'm here to help you improve that Physics mark, Keitumetse! 🌟\n\nPhysical Sciences covers:\n🔬 Physics: Mechanics, Waves, Electricity\n🧪 Chemistry: Chemical change, organic chemistry\n\nI can:\n• Explain concepts with real-world examples\n• Work through calculations step-by-step\n• Give you past paper questions\n• Help you understand the formula sheet\n\nWhat topic should we tackle?",
    },
    fallback: "Good question! 🔬\n\nLet me help you with that. To give you the best explanation, could you tell me:\n\n• Is this a Physics or Chemistry question?\n• Do you need the concept explained, or help with a calculation?\n• Would a practice question help?\n\nRemember, Physical Sciences is all about understanding the concepts first, then applying them to problems. Let's work through this together! 💪"
  },
  "life-sci": {
    keywords: {
      "dna": "DNA is the blueprint of life! Let's break it down 🧬\n\nDNA Structure:\n• Double helix (twisted ladder)\n• Made of nucleotides, each with: deoxyribose sugar + phosphate group + nitrogenous base\n• Base pairing: A-T (2 hydrogen bonds), G-C (3 hydrogen bonds)\n• Strands run antiparallel (3'→5' and 5'→3')\n\nDNA Replication (semi-conservative):\n1. Helicase unwinds and unzips the double helix\n2. Each strand acts as a template\n3. DNA polymerase adds complementary nucleotides (5'→3')\n4. Two identical DNA molecules formed\n\n💡 Exam tip: Know the difference between DNA and RNA!\n\nWant me to explain protein synthesis next?",
      "meiosis": "Meiosis produces gametes (sex cells) — crucial for genetics! 🔬\n\nMeiosis I (reduction division):\n• Prophase I: Crossing over occurs — chromosomes exchange genetic material\n• Metaphase I: Homologous pairs line up at the equator\n• Anaphase I: Homologous pairs separate (not sister chromatids!)\n• Telophase I: Two haploid cells formed\n\nMeiosis II (similar to mitosis):\n• Sister chromatids separate\n• Result: 4 genetically unique haploid cells\n\n🔑 Key differences from mitosis:\n• 2 divisions, not 1\n• Produces 4 cells, not 2\n• Haploid (n), not diploid (2n)\n• Genetically different, not identical\n• Crossing over creates variation\n\nShall I explain how this links to genetics?",
      "practice": "Here's an exam-style question! 📝\n\nStudy the diagram showing a cell undergoing division. [Imagine a cell in Anaphase I]\n\na) Identify the type of cell division shown. Give a reason. (2)\nb) Name the phase shown in the diagram. (1)\nc) How many chromosomes will be in each daughter cell? (1)\nd) Explain the biological significance of crossing over during this process. (3)\n\nRemember to use correct biological terminology in your answers — the examiners love that!\n\nTake your time and I'll mark it! ✅",
      "genetics": "Genetics is one of the most tested topics! 🧬\n\nKey terminology:\n• Genotype: genetic makeup (e.g., Bb)\n• Phenotype: physical appearance (e.g., brown eyes)\n• Homozygous: same alleles (BB or bb)\n• Heterozygous: different alleles (Bb)\n• Dominant: expressed in heterozygous (B)\n• Recessive: only expressed in homozygous (bb)\n\nMonohybrid cross (Punnet square):\nParents: Bb × Bb\n    B    b\nB  BB   Bb\nb  Bb   bb\nRatio: 3:1 (dominant:recessive)\n\nDihybrid crosses follow the same logic but with two traits!\n\n💡 Exam tip: Always define your symbols first (e.g., B = brown, b = blue)\n\nWant me to explain sex-linked inheritance or blood groups?",
      "evolution": "Evolution is a key section in Life Sciences! 🌍\n\nTheories to know:\n🔹 Lamarck: Use and disuse, inheritance of acquired characteristics (mostly rejected)\n🔹 Darwin: Natural selection — \"survival of the fittest\"\n\nNatural Selection steps:\n1. Variation exists in a population\n2. Struggle for survival (limited resources)\n3. Those with favourable traits survive and reproduce\n4. Favourable traits passed to offspring\n5. Over time, population changes\n\nEvidence for evolution:\n• Fossils (transitional forms)\n• Comparative anatomy (homologous structures)\n• Biogeography\n• DNA/molecular evidence\n\nHuman evolution: Know the timeline from Australopithecus → Homo habilis → Homo erectus → Homo sapiens\n\nWhat would you like to explore further?",
      "help": "You're doing great at 78%, Keitumetse! Let's push for that distinction! 🌟\n\nLife Sciences Paper 1 covers:\n• DNA, RNA & Protein synthesis\n• Meiosis\n• Genetics & Inheritance\n• Human Reproduction\n• Responding to the environment (nervous & endocrine)\n\nPaper 2:\n• Evolution\n• Human impact on the environment\n• Biodiversity\n\nI can help with explanations, diagrams, practice questions, or essay technique. What do you need?",
    },
    fallback: "Great question! 🧬\n\nLife Sciences is all about understanding living systems. Let me help you — could you tell me:\n\n• Which topic area is this about?\n• Do you need a concept explained or help with an exam question?\n• Would a diagram or flow chart help?\n\nRemember, at 78% you're so close to a distinction! Every bit of focused study counts. Let's keep that momentum going! 📈"
  },
  english: {
    keywords: {
      "essay": "Essay writing is worth big marks in Paper 3! Let's get your structure right ✍️\n\nEssay Structure (250-300 words for FAL):\n\n📌 Introduction (1 paragraph):\n• Hook — grab attention (question, quote, or bold statement)\n• Background — briefly introduce the topic\n• Thesis statement — your main argument\n\n📌 Body (2-3 paragraphs):\n• Topic sentence (main point)\n• Supporting evidence/examples\n• Explanation of how it links to your thesis\n• Linking sentence to next paragraph\n\n📌 Conclusion (1 paragraph):\n• Restate your thesis (different words)\n• Summarise main points\n• End with a thought-provoking statement\n\n💡 Tip: Use linking words! (Furthermore, However, In addition, Consequently, Nevertheless)\n\nWant me to help you plan an essay on a specific topic?",
      "practice": "Let's try this exam-style comprehension exercise! 📝\n\nRead the following extract and answer:\n\n\"The youth of South Africa hold the key to the nation's future. With access to education and technology, young people today have opportunities that previous generations could only dream of.\"\n\na) What is the main idea of this passage? (2)\nb) Explain what \"hold the key\" means in this context. (2)\nc) Do you agree with the writer's viewpoint? Support your answer with a reason. (3)\n\nRemember:\n• Quote from the text to support answers\n• Use full sentences\n• For opinion questions, there's no wrong answer — just support it well!\n\nGive it a go! ✅",
      "grammar": "Let's sharpen your grammar! These are the most tested areas in Paper 1 📚\n\n🔹 Tenses:\n• Past: She walked (simple), She was walking (continuous), She had walked (perfect)\n• Present: She walks, She is walking, She has walked\n• Future: She will walk\n\n🔹 Active vs Passive Voice:\n• Active: The dog bit the boy.\n• Passive: The boy was bitten by the dog.\n\n🔹 Direct vs Indirect Speech:\n• Direct: She said, \"I am happy.\"\n• Indirect: She said that she was happy.\n(Note the tense shift and pronoun change!)\n\n🔹 Concord (Subject-Verb Agreement):\n• The boy walks (singular)\n• The boys walk (plural)\n\nWhich area would you like to practise?",
      "comprehension": "Comprehension tips for Paper 1! 📖\n\nStrategy:\n1. Read the passage TWICE before answering\n2. Read the questions carefully — underline key words\n3. Look for clues in the text\n4. Answer in FULL sentences\n5. Check your marks allocation — 2 marks = 2 points needed\n\nQuestion types you'll see:\n📌 Factual: Answer is directly in the text\n📌 Inference: Read between the lines\n📌 Vocabulary: Meaning in context\n📌 Figure of speech: Identify and explain effect\n📌 Opinion: Give your view + support it\n\n💡 Tip: For \"in your own words\" questions, you MUST rephrase — don't copy from the text!\n\nWould you like a practice passage to work through?",
      "literature": "Literature analysis is key for Paper 2! Let's sharpen your skills 📚\n\nWhen analysing any text, consider:\n\n🎭 Characters: motivations, development, relationships\n📖 Themes: main ideas the author explores\n🗣️ Tone/Mood: how the author/narrator feels\n✍️ Style: figurative language, imagery, symbolism\n📐 Structure: how the text is organised\n\nFigures of speech to know:\n• Simile: \"as brave as a lion\"\n• Metaphor: \"life is a journey\"\n• Personification: \"the wind whispered\"\n• Alliteration: \"Peter Piper picked...\"\n• Hyperbole: exaggeration for effect\n• Irony: opposite of what's expected\n\n💡 Always explain the EFFECT of a figure of speech, not just name it!\n\nWhich set work would you like to discuss?",
      "summary": "Summary writing is a guaranteed question in Paper 1 — easy marks if you know the technique! ✨\n\nRules:\n• Usually 7 points required in about 90 words\n• Read the passage carefully\n• Identify key points (number them)\n• Write in YOUR OWN words\n• Use FULL sentences\n• NO personal opinion\n• NO examples or illustrations from the text\n• Count your words!\n\nMethod:\n1. Read the passage twice\n2. Identify and underline the 7 main points\n3. Rewrite each point in your own words\n4. Combine into a flowing paragraph\n5. Count words and edit if over limit\n\n💡 Tip: Practise rewriting sentences in fewer words. This is a skill that gets better with practice!\n\nWant me to give you a summary exercise?",
      "help": "Your English is looking good at 71%, Keitumetse! Let's aim higher! 🌟\n\nI can help you with:\n📖 Paper 1: Comprehension, Summary, Language structures\n📚 Paper 2: Literature (poetry, novel, drama)\n✍️ Paper 3: Creative writing (essay, transactional)\n\nQuick wins for improving your mark:\n• Learn your figures of speech\n• Practice summary technique\n• Use varied vocabulary in essays\n• Structure answers clearly\n\nWhat would you like to work on today?",
    },
    fallback: "Good question! 📚\n\nEnglish FAL is all about communication — reading, writing, and understanding. Let me help you!\n\nCould you tell me:\n• Is this about reading (comprehension), writing (essays), language (grammar), or literature?\n• Do you need something explained or want to practise?\n\nRemember, strong English skills help in every other subject too — understanding questions and structuring answers well can earn you extra marks across the board! 💪\n\nWhat shall we focus on?"
  },
};

function getSmartResponse(subjectId, userMessage) {
  const lower = userMessage.toLowerCase();
  const subjectData = MOCK_RESPONSES[subjectId] || MOCK_RESPONSES.maths;

  for (const [keyword, response] of Object.entries(subjectData.keywords)) {
    if (lower.includes(keyword)) return response;
  }
  return subjectData.fallback;
}

// ─── LEARNER: AI TUTOR ───

function TutorScreen({ subjectId, onBack }) {
  const subject = SUBJECTS.find(s => s.id === subjectId) || SUBJECTS[0];
  const [messages, setMessages] = useState(INITIAL_MESSAGES[subjectId] || INITIAL_MESSAGES.maths);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const quickPrompts = {
    maths: ["Explain chain rule", "Practice question", "Help with functions"],
    physics: ["Newton's Laws", "Practice question", "Explain momentum"],
    "life-sci": ["DNA replication", "Practice question", "Explain meiosis"],
    english: ["Essay structure", "Practice question", "Grammar help"],
  };

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMessage = { role: "user", content: msg };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    // Try live AI first, fall back to smart mock
    try {
      const apiMessages = updatedMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, messages: apiMessages }),
      });

      if (!response.ok) throw new Error("API error");

      const data = await response.json();
      if (data.text) {
        setMessages(prev => [...prev, { role: "assistant", content: data.text }]);
        setLoading(false);
        return;
      }
      throw new Error("Empty response");
    } catch (err) {
      // Fallback to smart mock responses
      console.log("Using smart mock fallback:", err.message);
      const delay = 600 + Math.random() * 800;
      setTimeout(() => {
        const response = getSmartResponse(subjectId, msg);
        setMessages(prev => [...prev, { role: "assistant", content: response }]);
        setLoading(false);
      }, delay);
    }
  };

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, loading]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
        <div style={{ width: 36, height: 36, borderRadius: 12, background: subject.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{subject.icon}</div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{subject.name} Tutor</p>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>CAPS-aligned · Adaptive</p>
        </div>
        <LiveAIBadge />
      </div>
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
            <div style={{ padding: "12px 16px", borderRadius: 16, background: msg.role === "user" ? subject.color : "rgba(255,255,255,0.06)", borderBottomRightRadius: msg.role === "user" ? 4 : 16, borderBottomLeftRadius: msg.role === "user" ? 16 : 4 }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: msg.role === "user" ? "#fff" : "rgba(255,255,255,0.85)", whiteSpace: "pre-wrap" }}>{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", maxWidth: "85%" }}>
            <div style={{ padding: "12px 16px", borderRadius: 16, background: "rgba(255,255,255,0.06)", borderBottomLeftRadius: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ display: "flex", gap: 4 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: subject.color, opacity: 0.6, animation: `bounce 1.2s ease ${i*0.15}s infinite` }} />)}
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div style={{ padding: "12px 20px 28px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            placeholder="Ask me anything..."
            disabled={loading}
            style={{ flex: 1, padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 13, outline: "none", opacity: loading ? 0.5 : 1 }}
          />
          <button
            onClick={() => handleSend()}
            disabled={loading}
            style={{ width: 44, height: 44, borderRadius: 12, border: "none", background: loading ? "rgba(255,255,255,0.1)" : subject.color, color: "#fff", fontSize: 18, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s" }}
          >↑</button>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          {(quickPrompts[subjectId] || quickPrompts.maths).map((s, i) => (
            <button
              key={i}
              onClick={() => handleSend(s)}
              disabled={loading}
              style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.5)", fontSize: 11, cursor: loading ? "default" : "pointer", opacity: loading ? 0.4 : 1 }}
            >{s}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── LEARNER: PAST PAPERS (EXPANDED) ───

function PapersScreen({ onBack }) {
  const [filter, setFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [activePaper, setActivePaper] = useState(null);
  const subjects = ["All", "Mathematics", "Physical Sciences", "Life Sciences", "English FAL"];
  const filtered = PAST_PAPERS.filter(p => (filter === "all" || p.status === filter) && (subjectFilter === "All" || p.subject === subjectFilter));

  if (activePaper) return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16 }}>
        <button onClick={() => setActivePaper(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Outfit', sans-serif" }}>{activePaper.subject}</h2>
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, marginBottom: 16 }}>{activePaper.year} · {activePaper.paper}</p>

      <div style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{activePaper.paper}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{activePaper.marks} marks · {activePaper.time}</p>
          </div>
          {activePaper.score && <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: activePaper.score >= 60 ? "#2EAD6B" : activePaper.score >= 40 ? "#FFB930" : "#E8553A", fontFamily: "'Outfit', sans-serif" }}>{activePaper.score}%</p>
          </div>}
        </div>
        <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>📋 Topics: {activePaper.topics}</p>
      </div>

      <div style={{ padding: 16, borderRadius: 14, background: "rgba(58,143,232,0.06)", border: "1px solid rgba(58,143,232,0.15)", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#3A8FE8" }}>📥 Download from DBE</p>
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Papers are sourced from the Department of Basic Education. Tap below to access the official papers and memos.</p>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => window.open("https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations/NSCPastExaminationpapers.aspx", "_blank")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "#3A8FE8", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>📄 Question Paper</button>
          <button onClick={() => window.open("https://www.saexampapers.co.za", "_blank")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>📝 Memo</button>
        </div>
      </div>

      <div style={{ padding: 16, borderRadius: 14, background: "rgba(46,173,107,0.06)", border: "1px solid rgba(46,173,107,0.15)", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#2EAD6B" }}>🤖 AI Study Mode</p>
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>Work through this paper with the AI tutor. It will explain each question, check your answers, and give you tips.</p>
        <button style={{ marginTop: 10, width: "100%", padding: "10px", borderRadius: 10, border: "none", background: "#2EAD6B", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Start AI-Assisted Practice →</button>
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "20px 0 10px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Topics Breakdown</h3>
      {activePaper.topics.split(", ").map((topic, i) => (
        <div key={i} style={{ padding: "10px 14px", borderRadius: 12, marginBottom: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{topic}</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>~{Math.round(activePaper.marks / activePaper.topics.split(", ").length)} marks</span>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Past Papers</h2>
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, marginBottom: 12 }}>NSC papers from the Department of Basic Education · {PAST_PAPERS.length} papers</p>

      <div style={{ display: "flex", gap: 6, marginBottom: 10, overflowX: "auto" }}>
        {subjects.map(s => (
          <button key={s} onClick={() => setSubjectFilter(s)} style={{ padding: "6px 12px", borderRadius: 16, border: "1px solid", borderColor: subjectFilter === s ? "#3A8FE8" : "rgba(255,255,255,0.08)", background: subjectFilter === s ? "rgba(58,143,232,0.12)" : "transparent", color: subjectFilter === s ? "#3A8FE8" : "rgba(255,255,255,0.4)", fontSize: 10, cursor: "pointer", whiteSpace: "nowrap" }}>{s}</button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["all", "new", "marked"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "7px 16px", borderRadius: 20, border: "1px solid", borderColor: filter === f ? "#E8553A" : "rgba(255,255,255,0.1)", background: filter === f ? "rgba(232,85,58,0.15)" : "transparent", color: filter === f ? "#E8553A" : "rgba(255,255,255,0.5)", fontSize: 12, cursor: "pointer", textTransform: "capitalize" }}>{f} ({f === "all" ? PAST_PAPERS.length : PAST_PAPERS.filter(p => p.status === f).length})</button>
        ))}
      </div>
      {filtered.length === 0 && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", padding: 40 }}>No papers found for this filter.</p>}
      {filtered.map((paper, i) => (
        <button key={i} onClick={() => setActivePaper(paper)} style={{ width: "100%", padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, cursor: "pointer", textAlign: "left" }}>
          <div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{paper.subject}</p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{paper.year} · {paper.paper} · {paper.marks} marks</p>
          </div>
          {paper.status === "marked" ? (
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: paper.score >= 60 ? "#2EAD6B" : paper.score >= 40 ? "#FFB930" : "#E8553A" }}>{paper.score}%</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>AI Marked</p>
            </div>
          ) : <span style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: "rgba(232,85,58,0.15)", color: "#E8553A" }}>Start →</span>}
        </button>
      ))}

      <div style={{ marginTop: 20, padding: 14, borderRadius: 14, background: "rgba(155,93,229,0.06)", border: "1px solid rgba(155,93,229,0.15)" }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#9B5DE5" }}>🌐 More Papers Online</p>
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>Access 20,000+ CAPS-aligned NSC papers from 2008-2025 with memos.</p>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button onClick={() => window.open("https://www.education.gov.za/Curriculum/NationalSeniorCertificate(NSC)Examinations/NSCPastExaminationpapers.aspx", "_blank")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: "#9B5DE5", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>DBE Official</button>
          <button onClick={() => window.open("https://www.saexampapers.co.za", "_blank")} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "1px solid rgba(155,93,229,0.3)", background: "transparent", color: "#9B5DE5", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>SA Exam Papers</button>
        </div>
      </div>
    </div>
  );
}

// ─── LEARNER: ACTIVITIES ───

function ActivitiesScreen({ onBack, onNavigate }) {
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [answers, setAnswers] = useState([]);

  const resetQuiz = () => { setCurrentQ(0); setSelected(null); setShowAnswer(false); setScore(0); setCompleted(false); setAnswers([]); };

  // Quiz completed screen
  if (completed && activeQuiz) {
    const pct = Math.round((score / activeQuiz.questions.length) * 100);
    return (
      <div style={{ padding: "0 20px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16 }}>
          <button onClick={() => { setActiveQuiz(null); resetQuiz(); }} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Results</h2>
        </div>

        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <CircularProgress value={pct} size={120} stroke={8} color={pct >= 60 ? "#2EAD6B" : pct >= 40 ? "#FFB930" : "#E8553A"}>
            <span style={{ fontSize: 28, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{pct}%</span>
          </CircularProgress>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: "16px 0 4px", fontFamily: "'Outfit', sans-serif" }}>
            {pct >= 80 ? "Excellent! 🌟" : pct >= 60 ? "Good work! 💪" : pct >= 40 ? "Keep practising! 📚" : "Don't give up! 🔥"}
          </p>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>{score}/{activeQuiz.questions.length} correct · {activeQuiz.title}</p>
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Review Answers</h3>
        {activeQuiz.questions.map((q, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 12, marginBottom: 8, background: answers[i] === q.ans ? "rgba(46,173,107,0.06)" : "rgba(232,85,58,0.06)", border: `1px solid ${answers[i] === q.ans ? "rgba(46,173,107,0.15)" : "rgba(232,85,58,0.15)"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14 }}>{answers[i] === q.ans ? "✅" : "❌"}</span>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#fff" }}>Q{i+1}: {q.q}</p>
            </div>
            {answers[i] !== q.ans && <p style={{ margin: "0 0 4px", fontSize: 11, color: "#E8553A" }}>Your answer: {q.opts[answers[i]]}</p>}
            <p style={{ margin: 0, fontSize: 11, color: "#2EAD6B" }}>Correct: {q.opts[q.ans]}</p>
            <p style={{ margin: "4px 0 0", fontSize: 10, color: "rgba(255,255,255,0.4)" }}>💡 {q.explain}</p>
          </div>
        ))}

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={() => { resetQuiz(); }} style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: ACTIVITIES[activeSubject].color, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🔄 Try Again</button>
          <button onClick={() => { setActiveQuiz(null); resetQuiz(); }} style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>More Activities</button>
        </div>
      </div>
    );
  }

  // Active quiz
  if (activeQuiz && activeSubject) {
    const question = activeQuiz.questions[currentQ];
    const subColor = ACTIVITIES[activeSubject].color;
    return (
      <div style={{ padding: "0 20px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16 }}>
          <button onClick={() => { setActiveQuiz(null); resetQuiz(); }} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{activeQuiz.title}</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Question {currentQ + 1} of {activeQuiz.questions.length}</p>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: subColor, fontFamily: "'Outfit', sans-serif" }}>{score}/{currentQ + (showAnswer ? 1 : 0)}</span>
        </div>

        <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginTop: 16 }}>
          <div style={{ height: "100%", borderRadius: 2, background: subColor, width: ((currentQ + (showAnswer ? 1 : 0)) / activeQuiz.questions.length * 100) + "%", transition: "width 0.5s ease" }} />
        </div>

        <div style={{ padding: 20, borderRadius: 16, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginTop: 20 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#fff", lineHeight: 1.6 }}>{question.q}</p>
        </div>

        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {question.opts.map((opt, i) => {
            let bg = "rgba(255,255,255,0.04)";
            let border = "rgba(255,255,255,0.08)";
            let color = "rgba(255,255,255,0.8)";
            if (showAnswer) {
              if (i === question.ans) { bg = "rgba(46,173,107,0.12)"; border = "rgba(46,173,107,0.3)"; color = "#2EAD6B"; }
              else if (i === selected && i !== question.ans) { bg = "rgba(232,85,58,0.12)"; border = "rgba(232,85,58,0.3)"; color = "#E8553A"; }
              else { color = "rgba(255,255,255,0.3)"; }
            } else if (selected === i) { bg = subColor + "18"; border = subColor + "40"; color = subColor; }
            return (
              <button key={i} onClick={() => !showAnswer && setSelected(i)} disabled={showAnswer} style={{ padding: "14px 16px", borderRadius: 12, background: bg, border: `1px solid ${border}`, cursor: showAnswer ? "default" : "pointer", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color, flexShrink: 0 }}>
                    {showAnswer ? (i === question.ans ? "✓" : i === selected ? "✗" : "") : String.fromCharCode(65 + i)}
                  </div>
                  <span style={{ fontSize: 13, color }}>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {showAnswer && (
          <div style={{ padding: 14, borderRadius: 12, background: "rgba(58,143,232,0.06)", border: "1px solid rgba(58,143,232,0.15)", marginTop: 12 }}>
            <p style={{ margin: 0, fontSize: 12, color: "#3A8FE8", fontWeight: 600 }}>💡 Explanation</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{question.explain}</p>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          {!showAnswer ? (
            <button onClick={() => { if (selected === null) return; setShowAnswer(true); if (selected === question.ans) setScore(s => s + 1); setAnswers(a => [...a, selected]); }} disabled={selected === null} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: selected === null ? "rgba(255,255,255,0.06)" : subColor, color: "#fff", fontSize: 14, fontWeight: 600, cursor: selected === null ? "default" : "pointer", opacity: selected === null ? 0.4 : 1 }}>Check Answer</button>
          ) : (
            <button onClick={() => { if (currentQ < activeQuiz.questions.length - 1) { setCurrentQ(c => c + 1); setSelected(null); setShowAnswer(false); } else { setCompleted(true); } }} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: subColor, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
              {currentQ < activeQuiz.questions.length - 1 ? "Next Question →" : "See Results 🎯"}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Subject quiz list
  if (activeSubject) {
    const sub = ACTIVITIES[activeSubject];
    return (
      <div style={{ padding: "0 20px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16 }}>
          <button onClick={() => setActiveSubject(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
          <span style={{ fontSize: 24 }}>{sub.icon}</span>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Outfit', sans-serif" }}>{sub.name}</h2>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, marginBottom: 20 }}>{sub.quizzes.length} activities · {sub.quizzes.reduce((a, q) => a + q.questions.length, 0)} questions</p>

        {sub.quizzes.map((quiz, i) => (
          <button key={i} onClick={() => { setActiveQuiz(quiz); resetQuiz(); }} style={{ width: "100%", padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 10, cursor: "pointer", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{quiz.title}</p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{quiz.questions.length} questions · {quiz.difficulty}</p>
              </div>
              <span style={{ padding: "4px 10px", borderRadius: 10, fontSize: 10, fontWeight: 600, background: quiz.difficulty === "Easy" ? "rgba(46,173,107,0.12)" : quiz.difficulty === "Hard" ? "rgba(232,85,58,0.12)" : "rgba(255,185,48,0.12)", color: quiz.difficulty === "Easy" ? "#2EAD6B" : quiz.difficulty === "Hard" ? "#E8553A" : "#FFB930" }}>{quiz.difficulty}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)" }} />
              <span style={{ fontSize: 12, color: sub.color, fontWeight: 600 }}>Start →</span>
            </div>
          </button>
        ))}

        <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: sub.color + "08", border: `1px solid ${sub.color}20` }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: sub.color }}>🤖 Want deeper practice?</p>
          <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Chat with the AI tutor for unlimited practice questions with step-by-step explanations.</p>
          <button onClick={() => onNavigate("tutor", activeSubject)} style={{ marginTop: 10, padding: "8px 16px", borderRadius: 10, border: "none", background: sub.color, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Open AI Tutor →</button>
        </div>
      </div>
    );
  }

  // Main activities grid
  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Activities</h2>
      </div>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4, marginBottom: 20 }}>Interactive quizzes to test your knowledge · CAPS-aligned</p>

      <div style={{ padding: 16, borderRadius: 14, background: "linear-gradient(135deg, rgba(232,85,58,0.1), rgba(255,140,66,0.06))", border: "1px solid rgba(232,85,58,0.2)", marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 36 }}>🧠</span>
        <div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{Object.values(ACTIVITIES).reduce((a, s) => a + s.quizzes.reduce((b, q) => b + q.questions.length, 0), 0)} Questions</p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{Object.values(ACTIVITIES).reduce((a, s) => a + s.quizzes.length, 0)} quizzes across 4 subjects</p>
        </div>
      </div>

      {Object.entries(ACTIVITIES).map(([key, sub]) => (
        <button key={key} onClick={() => setActiveSubject(key)} style={{ width: "100%", padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 10, cursor: "pointer", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: sub.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{sub.icon}</div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{sub.name}</p>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{sub.quizzes.length} quizzes · {sub.quizzes.reduce((a, q) => a + q.questions.length, 0)} questions</p>
            </div>
            <span style={{ fontSize: 12, color: sub.color, fontWeight: 600 }}>→</span>
          </div>
        </button>
      ))}

      <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: "rgba(46,173,107,0.06)", border: "1px solid rgba(46,173,107,0.15)" }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#2EAD6B" }}>💡 Study Tip</p>
        <p style={{ margin: "6px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>Do at least one quiz per subject per day. After completing a quiz, review your wrong answers and ask the AI tutor to explain any concepts you struggled with.</p>
      </div>
    </div>
  );
}

// ─── LEARNER: PROGRESS ───

function ProgressScreen({ onBack }) {
  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Outfit', sans-serif" }}>My Progress</h2>
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", margin: "20px 0 28px" }}>
        {SUBJECTS.map(sub => (
          <div key={sub.id} style={{ textAlign: "center" }}>
            <CircularProgress value={sub.progress} size={64} stroke={5} color={sub.color}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{sub.progress}%</span>
            </CircularProgress>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 6 }}>{sub.name.split(" ")[0]}</p>
          </div>
        ))}
      </div>
      <div style={{ padding: 16, borderRadius: 14, background: "linear-gradient(135deg, rgba(46,173,107,0.1), rgba(46,173,107,0.05))", border: "1px solid rgba(46,173,107,0.2)", marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Bachelor Pass Probability</p>
            <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700, color: "#2EAD6B", fontFamily: "'Outfit', sans-serif" }}>68%</p>
          </div>
          <div style={{ textAlign: "right" }}><p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#2EAD6B" }}>↑ Improving</p></div>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>Focus: Improve Mathematics to 55%+ for a strong bachelor pass.</p>
      </div>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Today's Path</h3>
      {[{ time: "25 min", topic: "Calculus: Chain Rule Practice", sub: "Mathematics", done: true }, { time: "20 min", topic: "Newton's 2nd Law Problems", sub: "Physical Sciences", done: false }, { time: "15 min", topic: "Essay Structure Review", sub: "English FAL", done: false }].map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, marginBottom: 8, background: item.done ? "rgba(46,173,107,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${item.done ? "rgba(46,173,107,0.15)" : "rgba(255,255,255,0.06)"}` }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", border: `2px solid ${item.done ? "#2EAD6B" : "rgba(255,255,255,0.15)"}`, background: item.done ? "#2EAD6B" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>{item.done ? "✓" : ""}</div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: item.done ? "rgba(255,255,255,0.4)" : "#fff", textDecoration: item.done ? "line-through" : "none" }}>{item.topic}</p>
            <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{item.sub}</p>
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{item.time}</span>
        </div>
      ))}
    </div>
  );
}

// ─── MODAL OVERLAY ───

function ModalOverlay({ title, icon, color, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", background: "#0D0F14" }}>
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.3)" }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{title}</h2>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>{children}</div>
    </div>
  );
}

function GeneratedTag({ color }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 10, background: (color || "#3A8FE8") + "15", marginBottom: 16 }}>
      <span style={{ fontSize: 10 }}>⚡</span>
      <span style={{ fontSize: 10, fontWeight: 600, color: color || "#3A8FE8", textTransform: "uppercase", letterSpacing: "0.5px" }}>AI-Generated by JM CYBER SPACE</span>
    </div>
  );
}

// ─── ADMIN: STUDENT DETAIL ───

function StudentDetail({ student, onBack }) {
  const [activeModal, setActiveModal] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState({});

  const generate = (key) => {
    setActiveModal(key);
    if (!generated[key]) {
      setGenerating(true);
      setTimeout(() => { setGenerating(false); setGenerated(prev => ({ ...prev, [key]: true })); }, 1500);
    }
  };

  // ── Remedial Plan Modal
  if (activeModal === "remedial") return (
    <ModalOverlay title="Remedial Plan" icon="🎯" color="#3A8FE8" onClose={() => setActiveModal(null)}>
      {generating ? <LoadingSpinner label="Generating personalised plan..." /> : <>
        <GeneratedTag color="#3A8FE8" />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 4px", fontFamily: "'Outfit', sans-serif" }}>Remedial Plan: {student.name}</h3>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>{student.school} · Grade {student.grade} · Focus: {student.weakTopic}</p>

        <SectionCard title="📊 Diagnostic Summary" color="#E8553A">
          <p style={modalP}>Current average: <strong style={{ color: student.avgScore >= 50 ? "#2EAD6B" : "#E8553A" }}>{student.avgScore}%</strong></p>
          <p style={modalP}>Primary weakness: <strong style={{ color: "#FFB930" }}>{student.weakTopic}</strong></p>
          <p style={modalP}>Bachelor pass probability: <strong style={{ color: student.bachelorProb >= 50 ? "#2EAD6B" : "#E8553A" }}>{student.bachelorProb}%</strong></p>
          <p style={modalP}>Study time this week: <strong>{student.studyMin} min</strong> ({student.studyMin < 150 ? "⚠️ Below target" : "✅ On track"})</p>
        </SectionCard>

        <SectionCard title="🗓️ 4-Week Intervention Plan" color="#3A8FE8">
          {[
            { week: "Week 1", focus: `${student.weakTopic} — Foundation concepts`, tasks: "Daily 20-min focused sessions, concept video + worksheet", target: "Understand core definitions and basic problems" },
            { week: "Week 2", focus: `${student.weakTopic} — Guided practice`, tasks: "Worked examples, peer tutoring session, AI tutor practice", target: "Solve standard problems independently" },
            { week: "Week 3", focus: `${student.weakTopic} — Past paper drills`, tasks: "3× timed past paper sections, error analysis journal", target: "Complete questions under exam conditions" },
            { week: "Week 4", focus: "Consolidation & assessment", tasks: "Mock test, review weak areas, confidence building", target: `Improve ${student.weakTopic} score by 15%+` },
          ].map((w, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#3A8FE8" }}>{w.week}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{w.focus}</span>
              </div>
              <p style={{ ...modalP, marginTop: 4 }}>📌 {w.tasks}</p>
              <p style={{ ...modalP, color: "#2EAD6B" }}>🎯 Target: {w.target}</p>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="💡 Teacher Recommendations" color="#9B5DE5">
          <p style={modalP}>• Schedule a 1-on-1 check-in with {student.name.split(" ")[0]} at the start of Week 1</p>
          <p style={modalP}>• Pair with a stronger learner for peer tutoring in Week 2</p>
          <p style={modalP}>• {student.streak === 0 ? "Re-engage with the platform — set up daily SMS reminders" : `Maintain the ${student.streak}-day streak with encouragement`}</p>
          <p style={modalP}>• Contact parent/guardian if no improvement by end of Week 2</p>
        </SectionCard>
      </>}
    </ModalOverlay>
  );

  // ── Worksheet Modal
  if (activeModal === "worksheet") return (
    <ModalOverlay title="Custom Worksheet" icon="📄" color="#E8553A" onClose={() => setActiveModal(null)}>
      {generating ? <LoadingSpinner label="Building worksheet from weak topics..." /> : <>
        <GeneratedTag color="#E8553A" />
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 4px", fontFamily: "'Outfit', sans-serif" }}>Worksheet: {student.weakTopic}</h3>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 20px" }}>Prepared for {student.name} · {student.school}</p>

        <SectionCard title="Section A — Multiple Choice (10 marks)" color="#E8553A">
          {[
            { q: "1. Which of the following best describes " + student.weakTopic + "?", opts: ["A) A fundamental concept in the CAPS curriculum", "B) An advanced topic not in the syllabus", "C) A topic only in Paper 2", "D) None of the above"], ans: "A" },
            { q: "2. What is the first step when approaching a " + student.weakTopic + " problem?", opts: ["A) Write the final answer", "B) Identify what is given and what is required", "C) Skip to the next question", "D) Draw a random diagram"], ans: "B" },
            { q: "3. In which NSC paper does " + student.weakTopic + " primarily appear?", opts: ["A) Paper 1 only", "B) Paper 2 only", "C) Both papers", "D) Neither paper"], ans: "A" },
          ].map((item, i) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <p style={{ ...modalP, fontWeight: 600, color: "#fff" }}>{item.q}</p>
              {item.opts.map((o, j) => <p key={j} style={{ ...modalP, paddingLeft: 12 }}>{o}</p>)}
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Section B — Structured Questions (30 marks)" color="#FFB930">
          <div style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <p style={{ ...modalP, fontWeight: 600, color: "#fff" }}>Question 4 (8 marks)</p>
            <p style={modalP}>Study the information below and answer the questions that follow.</p>
            <p style={modalP}>4.1 Define {student.weakTopic} in your own words. (2)</p>
            <p style={modalP}>4.2 Explain why this concept is important in the context of the CAPS curriculum. (3)</p>
            <p style={modalP}>4.3 Give ONE real-world example of {student.weakTopic}. (3)</p>
          </div>
          <div style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <p style={{ ...modalP, fontWeight: 600, color: "#fff" }}>Question 5 (10 marks)</p>
            <p style={modalP}>A learner is struggling with {student.weakTopic}.</p>
            <p style={modalP}>5.1 Identify TWO common mistakes learners make. (4)</p>
            <p style={modalP}>5.2 Show the correct method with a worked example. (6)</p>
          </div>
          <div style={{ padding: "10px 0" }}>
            <p style={{ ...modalP, fontWeight: 600, color: "#fff" }}>Question 6 (12 marks)</p>
            <p style={modalP}>NSC-style problem based on {student.weakTopic}.</p>
            <p style={modalP}>6.1 Calculate the answer, showing ALL working. (8)</p>
            <p style={modalP}>6.2 Verify your answer using an alternative method. (4)</p>
          </div>
        </SectionCard>

        <div style={{ padding: 14, borderRadius: 12, background: "rgba(46,173,107,0.08)", border: "1px solid rgba(46,173,107,0.2)", marginTop: 8 }}>
          <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>📎 Total: 40 marks · Time: 45 minutes · Memo included for teacher use</p>
        </div>
      </>}
    </ModalOverlay>
  );

  // ── Parent Alert Modal
  if (activeModal === "parent") return (
    <ModalOverlay title="Parent Notification" icon="📧" color="#9B5DE5" onClose={() => setActiveModal(null)}>
      {generating ? <LoadingSpinner label="Drafting parent notification..." /> : <>
        <GeneratedTag color="#9B5DE5" />
        <SectionCard title="📧 Draft SMS / WhatsApp Message" color="#9B5DE5">
          <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ ...modalP, color: "#fff", lineHeight: 1.7 }}>
              Dear Parent/Guardian of {student.name},
              {"\n\n"}
              This is a progress update from {student.school} via the Matric Mastery platform.
              {"\n\n"}
              📊 Current average: {student.avgScore}%
              {"\n"}📈 Trend: {student.trend === "declining" ? "⚠️ Declining — needs attention" : student.trend === "improving" ? "✅ Improving — good progress" : "➡️ Stable — room for improvement"}
              {"\n"}📚 Weakest area: {student.weakTopic}
              {"\n"}🔥 Study streak: {student.streak} days
              {"\n"}⏱️ Study time this week: {student.studyMin} min
              {"\n\n"}
              {student.risk === "high" ?
                `⚠️ ${student.name.split(" ")[0]} is at risk of not achieving a bachelor pass. We recommend increased study time and parental support at home. A remedial plan has been created.` :
                student.risk === "medium" ?
                `${student.name.split(" ")[0]} is making progress but needs consistent effort. Please encourage daily study sessions of at least 30 minutes.` :
                `${student.name.split(" ")[0]} is performing well! Continued support and encouragement will help maintain this momentum.`}
              {"\n\n"}
              Please contact the school if you have any questions.
              {"\n\n"}
              — Matric Mastery AI · {student.school}
            </p>
          </div>
        </SectionCard>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button style={{ flex: 1, padding: "12px", borderRadius: 12, border: "none", background: "#2EAD6B", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📱 Send via WhatsApp</button>
          <button style={{ flex: 1, padding: "12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📋 Copy Text</button>
        </div>
      </>}
    </ModalOverlay>
  );

  // ── Check-in Modal
  if (activeModal === "checkin") return (
    <ModalOverlay title="Schedule Check-in" icon="📅" color="#FFB930" onClose={() => setActiveModal(null)}>
      {generating ? <LoadingSpinner label="Setting up check-in..." /> : <>
        <GeneratedTag color="#FFB930" />
        <SectionCard title="📅 Check-in Scheduled" color="#FFB930">
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>✅</span>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 4px", fontFamily: "'Outfit', sans-serif" }}>Check-in set for {student.name}</p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", margin: 0 }}>Next Monday · 08:30 AM</p>
          </div>
        </SectionCard>
        <SectionCard title="📋 Suggested Discussion Points" color="#3A8FE8">
          <p style={modalP}>1. Review progress on {student.weakTopic} — has understanding improved?</p>
          <p style={modalP}>2. Check study habits — {student.studyMin < 150 ? "discuss strategies to increase study time" : "maintain current routine"}</p>
          <p style={modalP}>3. {student.streak === 0 ? "Understand barriers to engagement — why has the streak broken?" : `Celebrate the ${student.streak}-day streak and set a new target`}</p>
          <p style={modalP}>4. Set 2 specific goals for the coming week</p>
          <p style={modalP}>5. {student.risk === "high" ? "Discuss remedial plan and parent involvement" : "Encourage participation in peer study groups"}</p>
        </SectionCard>
        <SectionCard title="🔔 Reminders Set" color="#2EAD6B">
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>📱 SMS to teacher</span>
            <span style={{ fontSize: 12, color: "#2EAD6B" }}>Monday 07:00</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>📱 SMS to {student.name.split(" ")[0]}</span>
            <span style={{ fontSize: 12, color: "#2EAD6B" }}>Monday 07:30</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>📧 Follow-up report</span>
            <span style={{ fontSize: 12, color: "#2EAD6B" }}>Monday 15:00</span>
          </div>
        </SectionCard>
      </>}
    </ModalOverlay>
  );

  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: 0 }}>←</button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, fontFamily: "'Outfit', sans-serif" }}>Learner Profile</h2>
      </div>

      <div style={{ padding: 20, borderRadius: 16, marginBottom: 20, background: "linear-gradient(135deg, rgba(58,143,232,0.1), rgba(155,93,229,0.08))", border: "1px solid rgba(58,143,232,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: "linear-gradient(135deg, #3A8FE8, #9B5DE5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{student.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{student.name}</h3>
              <RiskBadge risk={student.risk} />
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{student.school} · Grade {student.grade}</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
          {[{ label: "Avg Score", value: student.avgScore + "%", color: student.avgScore >= 50 ? "#2EAD6B" : "#E8553A" }, { label: "Streak", value: student.streak + "d", color: student.streak > 0 ? "#FFB930" : "rgba(255,255,255,0.3)" }, { label: "Study/wk", value: student.studyMin + "m", color: "#3A8FE8" }].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "'Outfit', sans-serif" }}>{s.value}</p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 16, borderRadius: 14, marginBottom: 20, background: student.bachelorProb >= 50 ? "rgba(46,173,107,0.06)" : "rgba(232,85,58,0.06)", border: `1px solid ${student.bachelorProb >= 50 ? "rgba(46,173,107,0.2)" : "rgba(232,85,58,0.2)"}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Bachelor Pass Probability</p>
            <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: student.bachelorProb >= 50 ? "#2EAD6B" : "#E8553A" }}>{student.bachelorProb}%</p>
          </div>
          <div style={{ textAlign: "right" }}><TrendArrow trend={student.trend} /><p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)", textTransform: "capitalize" }}>{student.trend}</p></div>
        </div>
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Subject Scores</h3>
      {[{ name: "Mathematics", val: student.maths, color: "#E8553A" }, { name: "Physical Sciences", val: student.physics, color: "#3A8FE8" }, { name: "Life Sciences", val: student.lifeSci, color: "#2EAD6B" }, { name: "English FAL", val: student.english, color: "#9B5DE5" }].map((sub, i) => (
        <div key={i} style={{ padding: 12, borderRadius: 12, marginBottom: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{sub.name}</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: sub.val >= 50 ? sub.color : "#E8553A", fontFamily: "'Outfit', sans-serif" }}>{sub.val}%</span>
          </div>
          <ScoreBar value={sub.val} color={sub.val >= 50 ? sub.color : "#E8553A"} />
        </div>
      ))}

      <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "20px 0 12px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Activity</h3>
      <div style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
        {[{ label: "Last Active", value: student.lastActive }, { label: "Papers Completed", value: student.papers }, { label: "Weakest Topic", value: student.weakTopic }, { label: "Study This Week", value: student.studyMin + " min" }].map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{item.label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{item.value}</span>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Intervention Actions</h3>
      {[
        { label: "Generate Remedial Plan", icon: "🎯", desc: `Focus on ${student.weakTopic}`, key: "remedial", color: "#3A8FE8" },
        { label: "Create Custom Worksheet", icon: "📄", desc: "Based on weak areas", key: "worksheet", color: "#E8553A" },
        { label: "Send Parent Notification", icon: "📧", desc: "Alert about progress", key: "parent", color: "#9B5DE5" },
        { label: "Schedule Check-in", icon: "📅", desc: "Set a follow-up reminder", key: "checkin", color: "#FFB930" },
      ].map((a, i) => (
        <button key={i} onClick={() => generate(a.key)} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10, marginBottom: 8, textAlign: "left" }}>
          <span style={{ fontSize: 20 }}>{a.icon}</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>{a.label}</p>
            <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{a.desc}</p>
          </div>
          <span style={{ fontSize: 12, color: a.color, fontWeight: 600 }}>Generate →</span>
        </button>
      ))}
    </div>
  );
}

const modalP = { margin: "4px 0", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 };

function SectionCard({ title, color, children }) {
  return (
    <div style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 12 }}>
      <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: color || "#fff", fontFamily: "'Outfit', sans-serif" }}>{title}</h4>
      {children}
    </div>
  );
}

function LoadingSpinner({ label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 16 }}>
      <div style={{ width: 40, height: 40, border: "3px solid rgba(255,255,255,0.08)", borderTop: "3px solid #3A8FE8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>{label}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── ADMIN: MAIN DASHBOARD ───

function AdminDashboard({ onSwitchToLearner }) {
  const [tab, setTab] = useState("overview");
  const [schoolFilter, setSchoolFilter] = useState("All Schools");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sortBy, setSortBy] = useState("risk");
  const [toolModal, setToolModal] = useState(null);
  const [toolLoading, setToolLoading] = useState(false);

  const openTool = (key) => {
    setToolModal(key);
    setToolLoading(true);
    setTimeout(() => setToolLoading(false), 1400);
  };

  const filtered = schoolFilter === "All Schools" ? STUDENTS : STUDENTS.filter(s => s.school === schoolFilter);
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "risk") return ({ high: 0, medium: 1, low: 2 })[a.risk] - ({ high: 0, medium: 1, low: 2 })[b.risk];
    if (sortBy === "score") return a.avgScore - b.avgScore;
    if (sortBy === "active") return a.studyMin - b.studyMin;
    return a.name.localeCompare(b.name);
  });

  const highRisk = filtered.filter(s => s.risk === "high").length;
  const medRisk = filtered.filter(s => s.risk === "medium").length;
  const lowRisk = filtered.filter(s => s.risk === "low").length;
  const avgScore = Math.round(filtered.reduce((a, s) => a + s.avgScore, 0) / filtered.length);
  const avgStudy = Math.round(filtered.reduce((a, s) => a + s.studyMin, 0) / filtered.length);
  const totalPapers = filtered.reduce((a, s) => a + s.papers, 0);

  if (selectedStudent) return <StudentDetail student={selectedStudent} onBack={() => setSelectedStudent(null)} />;

  return (
    <div style={{ padding: "0 20px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 16, marginBottom: 4 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: 0 }}>Northern Cape Dashboard</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: "2px 0 0", color: "#fff", fontFamily: "'Outfit', sans-serif" }}>Teacher View</h1>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, margin: "12px 0 16px", overflowX: "auto" }}>
        {["overview", "learners", "alerts", "tools"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "7px 14px", borderRadius: 20, border: "1px solid", borderColor: tab === t ? "#3A8FE8" : "rgba(255,255,255,0.08)", background: tab === t ? "rgba(58,143,232,0.15)" : "transparent", color: tab === t ? "#3A8FE8" : "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer", textTransform: "capitalize", whiteSpace: "nowrap", fontWeight: tab === t ? 600 : 400 }}>{t}</button>
        ))}
      </div>

      <select value={schoolFilter} onChange={e => setSchoolFilter(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 12, marginBottom: 16, outline: "none" }}>
        {SCHOOLS.map(s => <option key={s} value={s} style={{ background: "#1a1c24" }}>{s}</option>)}
      </select>

      {/* ── OVERVIEW ── */}
      {tab === "overview" && <>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[{ label: "High Risk", value: highRisk, color: "#E8553A" }, { label: "Medium", value: medRisk, color: "#FFB930" }, { label: "On Track", value: lowRisk, color: "#2EAD6B" }].map((r, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 14, textAlign: "center", background: r.color + "08", border: `1px solid ${r.color}20` }}>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: r.color, fontFamily: "'Outfit', sans-serif" }}>{r.value}</p>
              <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{r.label}</p>
            </div>
          ))}
        </div>

        <div style={{ padding: 16, borderRadius: 14, marginBottom: 16, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>Class Average</p>
            <p style={{ margin: 0, fontSize: 22, fontWeight: 700, color: avgScore >= 50 ? "#2EAD6B" : "#E8553A", fontFamily: "'Outfit', sans-serif" }}>{avgScore}%</p>
          </div>
          <AreaChart data={MONTHLY_TRENDS.map(d => ({ value: d.avg, label: d.month }))} color="#3A8FE8" height={80} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            {MONTHLY_TRENDS.filter((_, i) => i % 3 === 0).map(d => <span key={d.month} style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{d.month}</span>)}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[{ label: "Avg Study/Week", value: avgStudy + "m", icon: "⏱" }, { label: "Papers Done", value: totalPapers, icon: "📝" }, { label: "Active Today", value: filtered.filter(s => s.lastActive === "today").length, icon: "✅" }, { label: "Pred. Bachelor", value: Math.round(filtered.filter(s => s.bachelorProb >= 50).length / filtered.length * 100) + "%", icon: "🎓" }].map((s, i) => (
            <div key={i} style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{s.value}</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Subject Averages</h3>
        {[{ name: "Mathematics", val: Math.round(filtered.reduce((a, s) => a + s.maths, 0) / filtered.length), color: "#E8553A" }, { name: "Physical Sciences", val: Math.round(filtered.reduce((a, s) => a + s.physics, 0) / filtered.length), color: "#3A8FE8" }, { name: "Life Sciences", val: Math.round(filtered.reduce((a, s) => a + s.lifeSci, 0) / filtered.length), color: "#2EAD6B" }, { name: "English FAL", val: Math.round(filtered.reduce((a, s) => a + s.english, 0) / filtered.length), color: "#9B5DE5" }].map((sub, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", width: 90 }}>{sub.name}</span>
            <div style={{ flex: 1 }}><ScoreBar value={sub.val} color={sub.color} /></div>
            <span style={{ fontSize: 13, fontWeight: 700, color: sub.color, fontFamily: "'Outfit', sans-serif", width: 32, textAlign: "right" }}>{sub.val}%</span>
          </div>
        ))}
      </>}

      {/* ── LEARNERS ── */}
      {tab === "learners" && <>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {[{ id: "risk", label: "Risk" }, { id: "score", label: "Score" }, { id: "active", label: "Activity" }, { id: "name", label: "Name" }].map(s => (
            <button key={s.id} onClick={() => setSortBy(s.id)} style={{ padding: "5px 10px", borderRadius: 16, border: "1px solid", borderColor: sortBy === s.id ? "#3A8FE8" : "rgba(255,255,255,0.08)", background: sortBy === s.id ? "rgba(58,143,232,0.12)" : "transparent", color: sortBy === s.id ? "#3A8FE8" : "rgba(255,255,255,0.35)", fontSize: 10, cursor: "pointer" }}>{s.label}</button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 12px" }}>{sorted.length} learner{sorted.length !== 1 ? "s" : ""}</p>
        {sorted.map(student => (
          <button key={student.id} onClick={() => setSelectedStudent(student)} style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", textAlign: "left", width: "100%", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: student.risk === "high" ? "rgba(232,85,58,0.15)" : student.risk === "medium" ? "rgba(255,185,48,0.15)" : "rgba(46,173,107,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{student.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}>{student.name}</p>
                  <TrendArrow trend={student.trend} />
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{student.school} · Gr {student.grade}</p>
              </div>
              <RiskBadge risk={student.risk} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
              {[{ label: "Maths", val: student.maths, color: "#E8553A" }, { label: "Physics", val: student.physics, color: "#3A8FE8" }, { label: "Life Sci", val: student.lifeSci, color: "#2EAD6B" }, { label: "English", val: student.english, color: "#9B5DE5" }].map((s, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", width: 42 }}>{s.label}</span>
                  <div style={{ flex: 1 }}><ScoreBar value={s.val} color={s.color} /></div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", width: 22, textAlign: "right" }}>{s.val}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>Active: {student.lastActive}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{student.studyMin}m/wk · 🔥{student.streak}d</span>
              <span style={{ fontSize: 10, color: "#3A8FE8" }}>View →</span>
            </div>
          </button>
        ))}
      </>}

      {/* ── ALERTS ── */}
      {tab === "alerts" && <>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Early Warning System</h3>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", margin: "0 0 16px" }}>AI-flagged learners needing intervention</p>

        {filtered.filter(s => s.risk === "high").length > 0 && (
          <div style={{ padding: 14, borderRadius: 14, marginBottom: 16, background: "rgba(232,85,58,0.06)", border: "1px solid rgba(232,85,58,0.2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 16 }}>🚨</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#E8553A", fontFamily: "'Outfit', sans-serif" }}>Urgent — {filtered.filter(s => s.risk === "high").length} learners need attention</span>
            </div>
            {filtered.filter(s => s.risk === "high").map((s, i) => (
              <div key={i} style={{ padding: "10px 12px", borderRadius: 10, marginBottom: 6, background: "rgba(232,85,58,0.06)", border: "1px solid rgba(232,85,58,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>{s.name}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Avg: {s.avgScore}% · Weak: {s.weakTopic}</p>
                </div>
                <button onClick={() => setSelectedStudent(s)} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(232,85,58,0.3)", background: "rgba(232,85,58,0.1)", color: "#E8553A", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Intervene</button>
              </div>
            ))}
          </div>
        )}

        <h4 style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", margin: "0 0 10px", fontFamily: "'Outfit', sans-serif" }}>⏰ Inactive Learners</h4>
        {filtered.filter(s => s.streak === 0).map((s, i) => (
          <div key={i} style={{ padding: 12, borderRadius: 12, marginBottom: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span>😴</span>
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#fff" }}>{s.name}</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Last active: {s.lastActive}</p>
              </div>
            </div>
            <RiskBadge risk={s.risk} />
          </div>
        ))}

        <h4 style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", margin: "16px 0 10px", fontFamily: "'Outfit', sans-serif" }}>📉 Declining Performance</h4>
        {filtered.filter(s => s.trend === "declining").map((s, i) => (
          <div key={i} style={{ padding: 12, borderRadius: 12, marginBottom: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TrendArrow trend="declining" />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#fff" }}>{s.name}</p>
                <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Avg: {s.avgScore}% · Weakest: {s.weakTopic}</p>
              </div>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#E8553A", fontFamily: "'Outfit', sans-serif" }}>{s.bachelorProb}%</span>
          </div>
        ))}

        <h4 style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)", margin: "16px 0 10px", fontFamily: "'Outfit', sans-serif" }}>🎓 Low Bachelor Pass (&lt;30%)</h4>
        {filtered.filter(s => s.bachelorProb < 30).map((s, i) => (
          <div key={i} style={{ padding: 12, borderRadius: 12, marginBottom: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#fff" }}>{s.name}</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{s.school} · Gr {s.grade}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#E8553A", fontFamily: "'Outfit', sans-serif" }}>{s.bachelorProb}%</p>
              <p style={{ margin: 0, fontSize: 9, color: "rgba(255,255,255,0.25)" }}>bach. prob.</p>
            </div>
          </div>
        ))}
      </>}

      {/* ── TOOLS ── */}
      {tab === "tools" && <>
        {toolModal === "worksheet" && (
          <ModalOverlay title="Generate Worksheet" icon="📄" color="#E8553A" onClose={() => setToolModal(null)}>
            {toolLoading ? <LoadingSpinner label="Generating class worksheet..." /> : <>
              <GeneratedTag color="#E8553A" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 16px", fontFamily: "'Outfit', sans-serif" }}>Class Worksheet: Top Weak Topics</h3>
              <SectionCard title="🔍 Analysis" color="#E8553A">
                <p style={modalP}>Based on {filtered.length} learners, the most common weak topics are:</p>
                {["Calculus/Differentiation", "Newton's Laws", "Trigonometry", "Functions & Graphs", "Algebra"].map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, background: "#E8553A18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#E8553A" }}>{i+1}</div>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{t}</span>
                    <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{[4,3,3,2,2][i]} learners struggling</span>
                  </div>
                ))}
              </SectionCard>
              <SectionCard title="📄 Generated Worksheet Preview" color="#FFB930">
                <p style={{ ...modalP, fontWeight: 600, color: "#fff" }}>Section A: Calculus (20 marks)</p>
                <p style={modalP}>Q1. Differentiate: f(x) = 3x⁴ - 2x² + 5x - 1 (4)</p>
                <p style={modalP}>Q2. Use the chain rule: f(x) = (2x + 3)⁵ (4)</p>
                <p style={modalP}>Q3. Find f'(x) if f(x) = √(4x² - 1) (4)</p>
                <p style={modalP}>Q4. Application: A ball's height is h(t) = -5t² + 20t + 2. Find maximum height. (8)</p>
                <p style={{ ...modalP, fontWeight: 600, color: "#fff", marginTop: 12 }}>Section B: Newton's Laws (20 marks)</p>
                <p style={modalP}>Q5. State Newton's Second Law of Motion. (2)</p>
                <p style={modalP}>Q6. A 10 kg box is pushed with 50 N at 30° on a rough surface (μ=0.2). Calculate acceleration. (8)</p>
                <p style={modalP}>Q7. Draw a free-body diagram for Q6. (4)</p>
                <p style={modalP}>Q8. Two blocks connected by a string on a frictionless surface. Find tension. (6)</p>
              </SectionCard>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "#E8553A", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📥 Download PDF</button>
                <button style={{ flex: 1, padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📥 Download Memo</button>
              </div>
            </>}
          </ModalOverlay>
        )}

        {toolModal === "remedial" && (
          <ModalOverlay title="Class Remedial Plan" icon="🎯" color="#3A8FE8" onClose={() => setToolModal(null)}>
            {toolLoading ? <LoadingSpinner label="Analysing learner data..." /> : <>
              <GeneratedTag color="#3A8FE8" />
              <SectionCard title="🚨 Priority Interventions" color="#E8553A">
                {filtered.filter(s => s.risk === "high").map((s, i) => (
                  <div key={i} style={{ padding: "10px 0", borderBottom: i < filtered.filter(s => s.risk === "high").length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{s.name}</span>
                      <RiskBadge risk="high" />
                    </div>
                    <p style={modalP}>Focus: {s.weakTopic} · Current: {s.avgScore}% · Target: {s.avgScore + 15}%</p>
                    <p style={{ ...modalP, color: "#FFB930" }}>→ Daily 30-min AI tutor sessions + weekly teacher check-in</p>
                  </div>
                ))}
              </SectionCard>
              <SectionCard title="⚠️ Watch List" color="#FFB930">
                {filtered.filter(s => s.risk === "medium").map((s, i) => (
                  <div key={i} style={{ padding: "8px 0", borderBottom: i < filtered.filter(s => s.risk === "medium").length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{s.name}</span>
                    <p style={modalP}>→ Peer study group + bi-weekly progress review</p>
                  </div>
                ))}
              </SectionCard>
              <SectionCard title="📅 Recommended Schedule" color="#2EAD6B">
                {["Monday: Maths remedial group (14:00-15:00)", "Tuesday: Individual AI tutor sessions", "Wednesday: Physics remedial group (14:00-15:00)", "Thursday: Peer tutoring pairs", "Friday: Progress assessment & feedback"].map((d, i) => (
                  <p key={i} style={{ ...modalP, padding: "4px 0" }}>📌 {d}</p>
                ))}
              </SectionCard>
            </>}
          </ModalOverlay>
        )}

        {toolModal === "report" && (
          <ModalOverlay title="Progress Report" icon="📊" color="#2EAD6B" onClose={() => setToolModal(null)}>
            {toolLoading ? <LoadingSpinner label="Compiling NCDoE report..." /> : <>
              <GeneratedTag color="#2EAD6B" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 4px", fontFamily: "'Outfit', sans-serif" }}>NCDoE Progress Report</h3>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: "0 0 16px" }}>Generated: {new Date().toLocaleDateString('en-ZA')} · {schoolFilter === "All Schools" ? "All Schools" : schoolFilter}</p>
              <SectionCard title="📊 Performance Summary" color="#2EAD6B">
                {[
                  { label: "Total Learners", value: filtered.length },
                  { label: "Class Average", value: avgScore + "%" },
                  { label: "On Track for Bachelor Pass", value: filtered.filter(s => s.bachelorProb >= 50).length + " (" + Math.round(filtered.filter(s => s.bachelorProb >= 50).length / filtered.length * 100) + "%)" },
                  { label: "At-Risk Learners", value: highRisk },
                  { label: "Avg Weekly Study Time", value: avgStudy + " min" },
                  { label: "Total Papers Completed", value: totalPapers },
                  { label: "Improvement Since Jan", value: "+19 percentage points" },
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: i < 6 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{item.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>{item.value}</span>
                  </div>
                ))}
              </SectionCard>
              <SectionCard title="📈 Subject Averages" color="#3A8FE8">
                {[
                  { name: "Mathematics", val: Math.round(filtered.reduce((a, s) => a + s.maths, 0) / filtered.length), color: "#E8553A" },
                  { name: "Physical Sciences", val: Math.round(filtered.reduce((a, s) => a + s.physics, 0) / filtered.length), color: "#3A8FE8" },
                  { name: "Life Sciences", val: Math.round(filtered.reduce((a, s) => a + s.lifeSci, 0) / filtered.length), color: "#2EAD6B" },
                  { name: "English FAL", val: Math.round(filtered.reduce((a, s) => a + s.english, 0) / filtered.length), color: "#9B5DE5" },
                ].map((sub, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", width: 100 }}>{sub.name}</span>
                    <div style={{ flex: 1 }}><ScoreBar value={sub.val} color={sub.color} /></div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: sub.color, width: 30, textAlign: "right" }}>{sub.val}%</span>
                  </div>
                ))}
              </SectionCard>
              <button style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: "#2EAD6B", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📥 Export as PDF for NCDoE</button>
            </>}
          </ModalOverlay>
        )}

        {toolModal === "parent-bulk" && (
          <ModalOverlay title="Bulk Parent Alerts" icon="📧" color="#9B5DE5" onClose={() => setToolModal(null)}>
            {toolLoading ? <LoadingSpinner label="Drafting notifications..." /> : <>
              <GeneratedTag color="#9B5DE5" />
              <SectionCard title="📧 Notifications Ready to Send" color="#9B5DE5">
                <p style={modalP}>{filtered.length} parent messages drafted based on each learner's performance data.</p>
              </SectionCard>
              {filtered.filter(s => s.risk === "high").map((s, i) => (
                <div key={i} style={{ padding: 12, borderRadius: 12, marginBottom: 8, background: "rgba(232,85,58,0.06)", border: "1px solid rgba(232,85,58,0.15)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{s.name}'s Parent</span>
                    <RiskBadge risk="high" />
                  </div>
                  <p style={modalP}>⚠️ "Your child is at risk. Current avg: {s.avgScore}%. Weak area: {s.weakTopic}. Please support with daily study at home."</p>
                  <button style={{ marginTop: 6, padding: "6px 12px", borderRadius: 8, border: "none", background: "#9B5DE5", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📱 Send via WhatsApp</button>
                </div>
              ))}
              {filtered.filter(s => s.risk === "low").length > 0 && (
                <div style={{ padding: 12, borderRadius: 12, background: "rgba(46,173,107,0.06)", border: "1px solid rgba(46,173,107,0.15)" }}>
                  <p style={{ ...modalP, color: "#2EAD6B", fontWeight: 600 }}>✅ {filtered.filter(s => s.risk === "low").length} positive progress messages ready</p>
                  <p style={modalP}>Encouraging updates for on-track learners to maintain momentum.</p>
                  <button style={{ marginTop: 6, padding: "6px 12px", borderRadius: 8, border: "none", background: "#2EAD6B", color: "#fff", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>📱 Send All Positive Updates</button>
                </div>
              )}
            </>}
          </ModalOverlay>
        )}

        {toolModal === "diagnostic" && (
          <ModalOverlay title="Diagnostic Test" icon="🧪" color="#E8553A" onClose={() => setToolModal(null)}>
            {toolLoading ? <LoadingSpinner label="Generating baseline assessment..." /> : <>
              <GeneratedTag color="#E8553A" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 16px", fontFamily: "'Outfit', sans-serif" }}>Baseline Diagnostic Assessment</h3>
              <SectionCard title="📋 Test Structure" color="#E8553A">
                {[
                  { section: "Section A: Mathematics", questions: 15, marks: 30, time: "25 min" },
                  { section: "Section B: Physical Sciences", questions: 12, marks: 25, time: "20 min" },
                  { section: "Section C: Life Sciences", questions: 10, marks: 20, time: "15 min" },
                  { section: "Section D: English FAL", questions: 8, marks: 15, time: "15 min" },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{s.section}</span>
                      <p style={{ ...modalP, margin: "2px 0 0" }}>{s.questions} questions · {s.marks} marks</p>
                    </div>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>⏱ {s.time}</span>
                  </div>
                ))}
              </SectionCard>
              <SectionCard title="🎯 Topics Covered" color="#3A8FE8">
                <p style={modalP}>Maths: Number patterns, algebra, functions, basic calculus, probability</p>
                <p style={modalP}>Physics: Forces, energy, circuits, waves</p>
                <p style={modalP}>Life Sci: Cell biology, genetics, human systems</p>
                <p style={modalP}>English: Comprehension, grammar, vocabulary, writing</p>
              </SectionCard>
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(255,185,48,0.08)", border: "1px solid rgba(255,185,48,0.2)", marginBottom: 12 }}>
                <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>💡 Total: 90 marks · 75 minutes · Results auto-analysed by AI to identify per-learner weak areas</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "#E8553A", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📥 Download Test</button>
                <button style={{ flex: 1, padding: 12, borderRadius: 12, border: "none", background: "#3A8FE8", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>📱 Push to Learners</button>
              </div>
            </>}
          </ModalOverlay>
        )}

        {toolModal === "overview-print" && (
          <ModalOverlay title="Class Overview" icon="📋" color="#FFB930" onClose={() => setToolModal(null)}>
            {toolLoading ? <LoadingSpinner label="Compiling class summary..." /> : <>
              <GeneratedTag color="#FFB930" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: "0 0 16px", fontFamily: "'Outfit', sans-serif" }}>Class Summary — Print Ready</h3>
              <SectionCard title="📊 At a Glance" color="#FFB930">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Learners", value: filtered.length, color: "#3A8FE8" },
                    { label: "Class Avg", value: avgScore + "%", color: avgScore >= 50 ? "#2EAD6B" : "#E8553A" },
                    { label: "High Risk", value: highRisk, color: "#E8553A" },
                    { label: "Bachelor Rate", value: Math.round(filtered.filter(s => s.bachelorProb >= 50).length / filtered.length * 100) + "%", color: "#2EAD6B" },
                  ].map((item, i) => (
                    <div key={i} style={{ textAlign: "center", padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.04)" }}>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: item.color, fontFamily: "'Outfit', sans-serif" }}>{item.value}</p>
                      <p style={{ margin: "2px 0 0", fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{item.label}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="👥 All Learners" color="#3A8FE8">
                {sorted.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < sorted.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                    <span style={{ fontSize: 12, color: "#fff" }}>{s.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{s.avgScore}%</span>
                      <TrendArrow trend={s.trend} />
                      <RiskBadge risk={s.risk} />
                    </div>
                  </div>
                ))}
              </SectionCard>
              <button style={{ width: "100%", padding: 12, borderRadius: 12, border: "none", background: "#FFB930", color: "#0D0F14", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>🖨️ Print Summary</button>
            </>}
          </ModalOverlay>
        )}

        {!toolModal && <>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>Teacher Tools</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {[
              { icon: "📄", title: "Generate Worksheet", desc: "Auto-create from weak topics", color: "#E8553A", key: "worksheet" },
              { icon: "🎯", title: "Remedial Plan", desc: "AI per-learner intervention", color: "#3A8FE8", key: "remedial" },
              { icon: "📊", title: "Export Report", desc: "NCDoE-ready progress reports", color: "#2EAD6B", key: "report" },
              { icon: "📧", title: "Parent Alert", desc: "Auto-draft notifications", color: "#9B5DE5", key: "parent-bulk" },
              { icon: "📋", title: "Class Overview", desc: "Print-ready class summary", color: "#FFB930", key: "overview-print" },
              { icon: "🧪", title: "Diagnostic Test", desc: "Generate baseline assessment", color: "#E8553A", key: "diagnostic" },
            ].map((tool, i) => (
              <button key={i} onClick={() => openTool(tool.key)} style={{ padding: 16, borderRadius: 14, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "left" }}>
                <span style={{ fontSize: 26, display: "block", marginBottom: 8 }}>{tool.icon}</span>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#fff" }}>{tool.title}</p>
                <p style={{ margin: "4px 0 0", fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{tool.desc}</p>
              </button>
            ))}
          </div>

          <h3 style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.5px", fontFamily: "'Outfit', sans-serif" }}>NCDoE Quick Stats</h3>
          <div style={{ padding: 16, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {[{ label: "Total Learners", value: filtered.length }, { label: "Active This Week", value: filtered.filter(s => s.lastActive === "today" || s.lastActive.includes("1 day")).length }, { label: "Avg Study/Week", value: avgStudy + " min" }, { label: "Papers Completed", value: totalPapers }, { label: "Pred. Bachelor Pass Rate", value: Math.round(filtered.filter(s => s.bachelorProb >= 50).length / filtered.length * 100) + "%" }, { label: "Improvement Since Jan", value: "+19%" }].map((stat, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{stat.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </>}
      </>}
    </div>
  );
}

// ─── MAIN APP ───

export default function App() {
  const [mode, setMode] = useState("learner");
  const [screen, setScreen] = useState("home");
  const [subjectId, setSubjectId] = useState("maths");

  const navigate = (s, sub) => { setScreen(s); if (sub) setSubjectId(sub); };
  const goHome = () => { setScreen("home"); setMode("learner"); };

  return (
    <div style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", background: "#0D0F14", fontFamily: "'DM Sans', -apple-system, sans-serif", color: "#fff", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; }
        ::-webkit-scrollbar { width: 0; }
        input::placeholder { color: rgba(255,255,255,0.3); }
        button { font-family: 'DM Sans', sans-serif; }
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      <div style={{ position: "fixed", top: -100, right: -100, width: 300, height: 300, borderRadius: "50%", background: mode === "admin" ? "radial-gradient(circle, rgba(58,143,232,0.08), transparent 70%)" : "radial-gradient(circle, rgba(232,85,58,0.08), transparent 70%)", pointerEvents: "none" }} />

      {/* Top Bar */}
      {screen !== "tutor" && (
        <div style={{ padding: "12px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: mode === "admin" ? "linear-gradient(135deg, #3A8FE8, #9B5DE5)" : "linear-gradient(135deg, #E8553A, #FF8C42)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}>M</div>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "'Outfit', sans-serif" }}>Matric Mastery</span>
          </div>
          <button onClick={() => { const next = mode === "learner" ? "admin" : "learner"; setMode(next); setScreen(next === "admin" ? "admin" : "home"); }} style={{ padding: "5px 10px", borderRadius: 8, border: "1px solid", borderColor: mode === "admin" ? "rgba(58,143,232,0.3)" : "rgba(255,255,255,0.1)", background: mode === "admin" ? "rgba(58,143,232,0.12)" : "rgba(255,255,255,0.04)", color: mode === "admin" ? "#3A8FE8" : "rgba(255,255,255,0.5)", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
            {mode === "admin" ? "👨‍🏫 Admin" : "📚 Learner"}
          </button>
        </div>
      )}

      {/* Screens */}
      <div style={{ height: screen === "tutor" ? "100vh" : "auto" }}>
        {screen === "home" && <HomeScreen onNavigate={navigate} learnerName="Keitumetse" />}
        {screen === "tutor" && <TutorScreen subjectId={subjectId} onBack={goHome} />}
        {screen === "papers" && <PapersScreen onBack={goHome} />}
        {screen === "activities" && <ActivitiesScreen onBack={goHome} onNavigate={navigate} />}
        {screen === "progress" && <ProgressScreen onBack={goHome} />}
        {screen === "admin" && <AdminDashboard onSwitchToLearner={goHome} />}
      </div>

      {/* Bottom Nav */}
      {screen !== "tutor" && (
        <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 420, padding: "10px 20px 18px", display: "flex", justifyContent: "space-around", background: "linear-gradient(to top, rgba(13,15,20,0.98), rgba(13,15,20,0.85))", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {mode === "learner" ? (
            [{ id: "home", icon: "🏠", label: "Home" }, { id: "tutor", icon: "🤖", label: "Tutor", sub: "maths" }, { id: "activities", icon: "🧠", label: "Activities" }, { id: "papers", icon: "📝", label: "Papers" }, { id: "progress", icon: "📊", label: "Progress" }].map(tab => (
              <button key={tab.id} onClick={() => navigate(tab.id, tab.sub)} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center", padding: "4px 8px" }}>
                <span style={{ fontSize: 20, display: "block", opacity: screen === tab.id ? 1 : 0.4 }}>{tab.icon}</span>
                <span style={{ fontSize: 10, display: "block", marginTop: 2, color: screen === tab.id ? "#E8553A" : "rgba(255,255,255,0.3)", fontWeight: screen === tab.id ? 600 : 400 }}>{tab.label}</span>
              </button>
            ))
          ) : (
            [{ id: "admin", icon: "📊", label: "Dashboard" }, { id: "home", icon: "📚", label: "Learner View", action: goHome }].map(tab => (
              <button key={tab.id} onClick={tab.action || (() => setScreen(tab.id))} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "center", padding: "4px 16px" }}>
                <span style={{ fontSize: 20, display: "block", opacity: screen === tab.id ? 1 : 0.4 }}>{tab.icon}</span>
                <span style={{ fontSize: 10, display: "block", marginTop: 2, color: screen === tab.id ? "#3A8FE8" : "rgba(255,255,255,0.3)", fontWeight: screen === tab.id ? 600 : 400 }}>{tab.label}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
