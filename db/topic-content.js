// Original foundation guides for guided tutoring. Subject-teacher review is still required
// before a school rollout; these are not a complete or certified CAPS course.
const question = (id, prompt, options, answer, explanation) => ({ id, prompt, options, answer, explanation });
export const topics = [
  {
    id: 'quadratic-equations', subject: 'maths', title: 'Quadratic equations',
    description: 'Understand why a quadratic can have two solutions.', goal: 'Solve a factorisable quadratic and check both roots.',
    keywords: ['algebra', 'factorise', 'roots', 'equations'],
    guide: {
      idea: 'A quadratic contains an x² term. When it is written as a product equal to zero, at least one factor must equal zero.',
      steps: ['Move every term to one side so the other side is zero.', 'For x² + bx + c, look for two numbers with sum b and product c.', 'Set each factor equal to zero and solve.', 'Substitute both answers into the original equation.'],
      example: { prompt: 'Solve x² − 7x + 12 = 0.', steps: ['−3 and −4 add to −7 and multiply to 12.', '(x − 3)(x − 4) = 0.', 'x − 3 = 0 or x − 4 = 0, so x = 3 or x = 4.', 'Check: 9 − 21 + 12 = 0 and 16 − 28 + 12 = 0.'] },
      caution: 'The zero-product rule applies only when the product equals zero. Not every quadratic factorises neatly; other methods may be needed.',
    },
    questions: [
      question('roots-a', 'Solve x² − 9x + 20 = 0.', ['x = 2 or 10', 'x = −4 or −5', 'x = 4 or 5', 'x = 9 or 20'], 2, '−4 and −5 add to −9 and multiply to 20. (x − 4)(x − 5) = 0, giving x = 4 or 5.'),
      question('zero-product-a', 'Why does (x − 2)(x + 3) = 0 give two possible values of x?', ['Both factors must equal 1', 'At least one factor must equal zero', 'x must equal zero', 'The factors must be equal'], 1, 'A product can equal zero only if at least one factor is zero. Here x = 2 or x = −3.'),
      question('roots-b', 'Solve x² + x − 6 = 0.', ['x = 2 or −3', 'x = −2 or 3', 'x = 1 or −6', 'x = 0 or 6'], 0, '(x + 3)(x − 2) = 0 because 3 + (−2) = 1 and 3 × (−2) = −6. The roots are −3 and 2.'),
      question('zero-product-b', 'Before applying the zero-product rule to x² = 3x + 10, what should you do?', ['Divide by x and discard x = 0', 'Set x² equal to zero', 'Add 10 to both sides only', 'Write x² − 3x − 10 = 0'], 3, 'Subtract 3x and 10 from both sides. Then (x − 5)(x + 2) = 0 can be solved.'),
    ],
  },
  {
    id: 'function-values', subject: 'maths', title: 'Functions & substitution',
    description: 'Make sense of f(x), inputs and outputs.', goal: 'Evaluate a function using the correct order of operations.',
    keywords: ['functions', 'substitution', 'input', 'output', 'algebra'],
    guide: {
      idea: 'A function assigns one output to each allowed input. f(3) means the output when the input x is 3; it does not mean f multiplied by 3.',
      steps: ['Replace every x with the given input.', 'Put negative inputs in brackets.', 'Calculate powers before multiplication, then add or subtract.'],
      example: { prompt: 'If f(x) = 2x² − 5, find f(−3).', steps: ['f(−3) = 2(−3)² − 5.', '(−3)² = 9.', '2 × 9 − 5 = 13, so f(−3) = 13.'] },
      caution: '(−3)² = 9, but −3² = −9. Brackets change what is being squared.',
    },
    questions: [
      question('function-a', 'If f(x) = 3x² + 1, what is f(−2)?', ['−11', '7', '−5', '13'], 3, '3(−2)² + 1 = 3 × 4 + 1 = 13.'),
      question('notation-a', 'What does g(4) mean?', ['The output of g at input 4', 'g multiplied by 4', 'The fourth power of g', 'The gradient is 4'], 0, 'The number inside the brackets is the input to the function.'),
      question('function-b', 'If h(x) = x² − 2x, what is h(−3)?', ['3', '−3', '15', '−15'], 2, '(−3)² − 2(−3) = 9 + 6 = 15.'),
      question('notation-b', 'If f(2) = 7, which point lies on the graph y = f(x)?', ['(7, 2)', '(2, 7)', '(2, 2)', '(7, 7)'], 1, 'The input is the x-coordinate and the output is the y-coordinate: (2, 7).'),
    ],
  },
  {
    id: 'net-force', subject: 'physics', title: 'Net force & acceleration',
    description: 'Connect forces, mass and a change in motion.', goal: 'Find a resultant force and use Fnet = ma with units.',
    keywords: ['newton', 'forces', 'acceleration', 'motion', 'mechanics'],
    guide: {
      idea: 'Acceleration depends on the net force, which is the vector sum of all forces. A zero net force means zero acceleration, not necessarily zero velocity.',
      steps: ['Choose a positive direction.', 'Add forces with signs to get the net force.', 'Use Fnet = ma and rearrange for the unknown.', 'Give the unit and direction.'],
      example: { prompt: 'A 4 kg trolley has forces of 18 N east and 6 N west. Find its acceleration.', steps: ['Choose east as positive.', 'Fnet = 18 − 6 = 12 N east.', 'a = Fnet / m = 12 / 4 = 3 m/s² east.'] },
      caution: 'Use the net force, not just the largest force. Force and acceleration have direction.',
    },
    questions: [
      question('force-a', 'Forces of 20 N east and 8 N west act on a 3 kg object. Find its acceleration.', ['4 m/s² east', '4 m/s² west', '9.33 m/s² east', '12 m/s² east'], 0, 'Fnet = 20 − 8 = 12 N east. a = 12 / 3 = 4 m/s² east.'),
      question('motion-a', 'An object moves in a straight line at constant velocity. What is its net force?', ['Equal to its mass', 'Always directed forward', 'Zero', 'Increasing'], 2, 'Constant velocity means zero acceleration. Therefore Fnet = ma = 0.'),
      question('force-b', 'A net force of 15 N acts west on a 5 kg object. What is its acceleration?', ['75 m/s² west', '10 m/s² west', '3 m/s² east', '3 m/s² west'], 3, 'a = Fnet / m = 15 / 5 = 3 m/s² in the same direction as the net force: west.'),
      question('motion-b', 'For the same non-zero net force, doubling the mass does what to acceleration?', ['Doubles it', 'Halves it', 'Leaves it unchanged', 'Makes it zero'], 1, 'a = Fnet / m. With force fixed, twice the mass gives half the acceleration.'),
    ],
  },
  {
    id: 'ohms-law', subject: 'physics', title: 'Ohm’s law',
    description: 'Relate potential difference, current and resistance.', goal: 'Choose and rearrange V = IR for a resistor.',
    keywords: ['electricity', 'circuits', 'current', 'resistance', 'voltage'],
    guide: {
      idea: 'For an ohmic conductor at constant temperature, potential difference is proportional to current. V = IR relates volts, amperes and ohms.',
      steps: ['Identify V, I and R and convert units if necessary.', 'Rearrange V = IR before substituting.', 'Calculate and state the correct unit.'],
      example: { prompt: 'A 9 V potential difference is across a 3 Ω resistor. Find the current.', steps: ['V = IR, so I = V / R.', 'I = 9 / 3 = 3 A.'] },
      caution: 'V = IR must refer to the same component or equivalent section of a circuit. Not every device has constant resistance.',
    },
    questions: [
      question('current-a', 'A 15 V supply is across a 5 Ω resistor. What is the current?', ['75 A', '3 A', '10 A', '0.33 A'], 1, 'I = V / R = 15 / 5 = 3 A.'),
      question('resistance-a', 'At a fixed voltage, doubling resistance does what to current?', ['Doubles it', 'Makes it zero', 'Halves it', 'Leaves it unchanged'], 2, 'I = V / R, so doubling R at the same V halves I.'),
      question('current-b', 'A resistor carries 0.5 A with 6 V across it. What is its resistance?', ['12 Ω', '3 Ω', '6.5 Ω', '0.083 Ω'], 0, 'R = V / I = 6 / 0.5 = 12 Ω.'),
      question('voltage-b', 'What potential difference is needed for 2 A through a 4 Ω resistor?', ['2 V', '6 V', '0.5 V', '8 V'], 3, 'V = IR = 2 × 4 = 8 V.'),
    ],
  },
  {
    id: 'dna-bases', subject: 'life-sci', title: 'DNA & base pairing',
    description: 'Understand the pairing rule inside DNA.', goal: 'Identify complementary DNA bases and distinguish DNA from RNA.',
    keywords: ['DNA', 'genetics', 'adenine', 'thymine', 'bases'],
    guide: {
      idea: 'DNA is built from nucleotides. Its two strands are complementary: adenine pairs with thymine, and cytosine pairs with guanine.',
      steps: ['Use A ↔ T and C ↔ G for DNA.', 'Pair each base individually.', 'Remember that RNA uses uracil in place of thymine.'],
      example: { prompt: 'Which bases pair directly opposite the DNA sequence A C T G?', steps: ['A pairs with T; C pairs with G.', 'T pairs with A; G pairs with C.', 'The bases directly opposite are T G A C. Strand directions would need labels if writing 5′ to 3′ sequences.'] },
      caution: 'A DNA base sequence is not the same as a complete protein. Gene expression involves further steps.',
    },
    questions: [
      question('pair-a', 'Which base pairs with cytosine in DNA?', ['Adenine', 'Thymine', 'Uracil', 'Guanine'], 3, 'Cytosine pairs with guanine. Adenine pairs with thymine in DNA.'),
      question('rna-a', 'Which base is used in RNA in place of thymine?', ['Uracil', 'Guanine', 'Adenine', 'Cytosine'], 0, 'RNA uses uracil; DNA uses thymine.'),
      question('pair-b', 'Which bases pair directly opposite A G T C in DNA?', ['A G T C', 'T C A G', 'U C A G', 'G A C T'], 1, 'Pair each base: A→T, G→C, T→A, C→G. The directly opposite bases are T C A G.'),
      question('structure-b', 'What is the repeating building unit of a DNA strand?', ['An amino acid', 'A fatty acid', 'A nucleotide', 'A glucose molecule'], 2, 'DNA consists of nucleotides, each containing a sugar, phosphate and nitrogenous base.'),
    ],
  },
  {
    id: 'genetic-crosses', subject: 'life-sci', title: 'Simple genetic crosses',
    description: 'Read genotypes and use a Punnett square.', goal: 'Calculate expected genotype proportions for a single-gene cross.',
    keywords: ['genetics', 'inheritance', 'punnett', 'dominant', 'recessive'],
    guide: {
      idea: 'For a diploid organism, a genotype contains two alleles for a gene. In a simple complete-dominance model, one dominant allele is enough to show the dominant phenotype.',
      steps: ['Write the parent genotypes and possible gametes.', 'Combine one allele from each parent in a Punnett square.', 'Count genotypes, then translate to phenotypes using the stated inheritance model.'],
      example: { prompt: 'Cross Aa × aa, where A is completely dominant.', steps: ['The first parent produces A or a gametes; the second produces a gametes.', 'The combinations are Aa and aa in equal expected proportions.', 'Expected genotypes: ½ Aa and ½ aa. Expected phenotypes: ½ dominant and ½ recessive.'] },
      caution: 'Expected proportions are probabilities, not a promise about a small family. Dominant does not mean better, stronger or more common.',
    },
    questions: [
      question('cross-a', 'For Bb × bb, what proportion is expected to be bb?', ['0', '1/4', '1/2', '1'], 2, 'Bb gives B or b; bb gives b. The equally likely offspring genotypes are Bb and bb.'),
      question('genotype-a', 'Which genotype is heterozygous?', ['AA', 'aa', 'BB', 'Aa'], 3, 'Heterozygous means the two alleles differ, as in Aa.'),
      question('cross-b', 'For Aa × Aa, what proportion is expected to be AA?', ['1/4', '1/2', '3/4', '1'], 0, 'The four equally likely combinations are AA, Aa, Aa and aa. One in four is AA.'),
      question('dominance-b', 'In a simple complete-dominance model, which statement is correct?', ['A dominant allele must be common', 'Aa shows the dominant phenotype', 'aa contains a dominant allele', 'All traits follow complete dominance'], 1, 'With complete dominance, Aa expresses the dominant phenotype. This model does not describe every trait.'),
    ],
  },
  {
    id: 'reading-inference', subject: 'english', title: 'Reading between the lines',
    description: 'Support an inference with clues from a passage.', goal: 'Distinguish stated information from an evidence-based inference.',
    keywords: ['comprehension', 'inference', 'reading', 'evidence'],
    guide: {
      idea: 'An inference is a conclusion supported by clues in a text and reasoning. It goes beyond what is directly stated, but is not an unsupported guess.',
      steps: ['Read the exact question.', 'Identify words or actions that provide clues.', 'Explain what those clues suggest.', 'Avoid claiming more than the passage supports.'],
      example: { prompt: '“Zola checked the clock again and tapped her foot by the door.” What might this suggest?', steps: ['Repeated clock-checking and foot-tapping are the clues.', 'They suggest she may be impatient or worried about time.', 'The passage does not establish exactly where she is going.'] },
      caution: 'More than one inference can be reasonable. Support yours with evidence rather than treating it as a certain fact.',
    },
    questions: [
      question('inference-a', '“Rain dripped from Sam’s jacket as he stepped inside.” Which inference is best supported?', ['Sam owns no umbrella', 'Sam has probably been outside in the rain', 'Sam lives alone', 'It has rained all week'], 1, 'The wet jacket suggests recent exposure to rain. The other claims need information not given.'),
      question('evidence-a', 'What strengthens an inference in a comprehension answer?', ['Repeating the question', 'Adding an unrelated opinion', 'Using the longest sentence possible', 'Pointing to a relevant clue in the passage'], 3, 'An inference is stronger when you explain the connection between a textual clue and your conclusion.'),
      question('inference-b', '“Lebo rehearsed her opening line three times before walking on stage.” What is directly stated?', ['Lebo is terrified', 'The audience is large', 'Lebo rehearsed her opening line three times', 'Lebo will win a prize'], 2, 'The rehearsal is explicitly stated. Her feelings and the outcome are not stated.'),
      question('evidence-b', 'Which wording distinguishes an inference from a certain fact?', ['“This suggests that…” followed by evidence', '“This proves everything…” without evidence', '“I know the author personally…”', '“The passage is wrong…”'], 0, '“This suggests” signals a supported interpretation while leaving room for uncertainty.'),
    ],
  },
  {
    id: 'figurative-language', subject: 'english', title: 'Figurative language',
    description: 'Explain what a comparison adds to a sentence.', goal: 'Identify simile, metaphor and personification and explain their effects.',
    keywords: ['simile', 'metaphor', 'personification', 'poetry', 'language'],
    guide: {
      idea: 'Figurative language creates meaning beyond a literal statement. A strong answer identifies the device and explains its effect in context.',
      steps: ['Identify the words doing the comparison or description.', 'Name the device if asked.', 'Explain the shared quality or image.', 'Connect that effect to the passage.'],
      example: { prompt: 'Explain “The classroom was a beehive.”', steps: ['It directly compares the classroom to a beehive, so it is a metaphor.', 'A beehive suggests busy, bustling activity.', 'The exact effect depends on the surrounding passage; it may suggest energy or noisy activity.'] },
      caution: 'The word “like” alone does not always signal a simile. There must be a comparison, and context matters.',
    },
    questions: [
      question('device-a', '“Her smile was as bright as sunshine” is an example of what?', ['Personification', 'A literal instruction', 'A simile', 'A question'], 2, 'It compares her smile with sunshine using “as … as”, suggesting brightness or warmth.'),
      question('effect-a', 'Why is “The wind whispered through the trees” personification?', ['It gives the wind a human action', 'It includes the word trees', 'It states a measurement', 'It compares using like'], 0, 'Whispering is presented as a human action carried out by the wind, suggesting a soft sound.'),
      question('device-b', '“Time is a thief” is best described as what?', ['A simile using as', 'A literal fact', 'An instruction', 'A metaphor'], 3, 'It directly compares time to a thief, suggesting that time takes something away.'),
      question('effect-b', 'A strong explanation of a metaphor should do what?', ['Only repeat the metaphor', 'Explain the comparison and its effect in context', 'Always say it is humorous', 'Ignore the rest of the passage'], 1, 'Naming a device is only part of the task. Explain the meaning created by the comparison in that passage.'),
    ],
  },
].map(topic => ({ ...topic, version: 1, level: 'Foundation', grades: [11, 12] }));
export const topicById = id => topics.find(topic => topic.id === id);
export const publicTopic = ({ questions, ...topic }) => topic;
