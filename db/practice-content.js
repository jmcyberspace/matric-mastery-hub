// Original foundational practice, not official NSC papers or a complete CAPS curriculum.
export const practiceSets = [
  {
    subject: 'maths', title: 'Algebra, functions & first derivatives',
    description: 'Six original foundation questions. Work carefully, then use the explanations to review your method.',
    questions: [
      ['Algebra','Solve x² − 5x + 6 = 0.', ['x = 1 or 6','x = 2 or 3','x = −2 or −3','x = 0 or 5'],1,'Factorise: x² − 5x + 6 = (x − 2)(x − 3). A product is zero when either factor is zero, so x = 2 or x = 3.'],
      ['Functions','If f(x) = 2x² − 3, what is f(−2)?',['−11','1','5','13'],2,'Substitute −2: f(−2) = 2(−2)² − 3 = 2(4) − 3 = 5. Square the entire negative value first.'],
      ['Number patterns','The arithmetic sequence is 5, 9, 13, 17, … What is its 10th term?',['36','41','45','50'],1,'The first term is 5 and the common difference is 4. Tₙ = 5 + (n − 1)4, so T₁₀ = 5 + 36 = 41.'],
      ['Probability','A fair six-sided die is rolled once. What is the probability of an even number?',['1/6','1/3','1/2','2/3'],2,'The even outcomes are 2, 4 and 6: three favourable outcomes out of six equally likely outcomes. 3/6 = 1/2.'],
      ['Differentiation','If f(x) = 3x² − 4x + 7, find f′(x).',['3x − 4','6x − 4','6x + 7','6x² − 4'],1,'Use the power rule on each term. The derivative of 3x² is 6x; the derivative of −4x is −4; a constant has derivative 0.'],
      ['Coordinate geometry','What is the gradient of the line through (1, 2) and (5, 10)?',['1/2','2','4','8'],1,'Gradient = (10 − 2)/(5 − 1) = 8/4 = 2. Keep the order of the coordinates consistent.'],
    ],
  },
  {
    subject: 'physics', title: 'Forces, energy & simple circuits',
    description: 'Build confidence with units, net force, energy and basic electrical calculations.',
    questions: [
      ['Newton’s second law','A net horizontal force of 12 N acts on a 3 kg object. What is its acceleration?',['0.25 m/s²','4 m/s²','9 m/s²','36 m/s²'],1,'Fnet = ma. Therefore a = Fnet/m = 12/3 = 4 m/s² in the direction of the net force.'],
      ['Momentum','A 2 kg object moves east at 5 m/s. What is its momentum?',['2.5 kg·m/s east','7 kg·m/s east','10 kg·m/s east','25 kg·m/s east'],2,'Momentum p = mv = 2 × 5 = 10 kg·m/s. Momentum is a vector, so include its direction.'],
      ['Kinetic energy','A 4 kg object moves at 3 m/s. What is its kinetic energy?',['6 J','12 J','18 J','36 J'],2,'Ek = ½mv² = ½ × 4 × 3² = 18 J. The speed is squared.'],
      ['Electric circuits','A potential difference of 12 V is applied across a 6 Ω resistor. What is the current?',['0.5 A','2 A','6 A','72 A'],1,'Ohm’s law V = IR gives I = V/R = 12/6 = 2 A.'],
      ['Electrical power','A device operates at 10 V and draws 2 A. What is its electrical power?',['5 W','12 W','20 W','100 W'],2,'Electrical power P = VI = 10 × 2 = 20 W.'],
      ['Net force','Two horizontal forces act on an object: 15 N east and 9 N west. What is the net force?',['24 N east','6 N east','6 N west','24 N west'],1,'Choose east as positive. Fnet = +15 − 9 = +6 N, which is 6 N east.'],
    ],
  },
  {
    subject: 'life-sci', title: 'Cells, inheritance & living systems',
    description: 'Check your understanding of foundational biological processes and terminology.',
    questions: [
      ['DNA','In DNA, which base pairs with adenine?',['Cytosine','Guanine','Thymine','Uracil'],2,'Adenine pairs with thymine in DNA. Cytosine pairs with guanine. RNA uses uracil instead of thymine.'],
      ['Cell division','What is a typical outcome of meiosis in a diploid cell?',['Two identical diploid cells','Four genetically varied haploid cells','Four identical diploid cells','One diploid cell'],1,'Meiosis involves two divisions and produces four haploid cells, with half the original chromosome number. Crossing over and independent assortment contribute to variation.'],
      ['Genetics','In a cross Bb × Bb, with B completely dominant over b, what fraction of offspring is expected to have genotype bb?',['0','1/4','1/2','3/4'],1,'The possible combinations are BB, Bb, Bb and bb. One of these four equally likely combinations is bb.'],
      ['Photosynthesis','Which substance is taken from the atmosphere during photosynthesis?',['Oxygen','Nitrogen','Carbon dioxide','Hydrogen'],2,'Plants take in carbon dioxide and use light energy and water to produce sugars. Oxygen is released as a product.'],
      ['Natural selection','Which statement best describes natural selection?',['Organisms change because they want to','All individuals survive equally well','Heritable traits affecting survival and reproduction can become more common','Acquired injuries are always inherited'],2,'When a heritable trait improves reproductive success in a particular environment, it can become more common over generations. The process has no goal or intention.'],
      ['Homeostasis','What is homeostasis?',['Maintaining a relatively stable internal environment','Growing without limits','Changing inherited DNA on demand','Stopping all metabolic reactions'],0,'Homeostasis uses regulatory mechanisms, often negative feedback, to keep internal conditions within suitable ranges despite external changes.'],
    ],
  },
  {
    subject: 'english', title: 'Read closely. Write clearly.',
    description: 'Practise comprehension, grammar and the language choices that make writing effective.',
    questions: [
      ['Comprehension','Read: “Naledi checked her notes before the test because she wanted to feel prepared.” Why did Naledi check her notes?',['To avoid writing the test','To feel prepared','Because she had lost them','To impress a friend'],1,'The reason is stated directly after “because”: she wanted to feel prepared. Use evidence from the sentence.'],
      ['Subject–verb agreement','Choose the correct sentence.',['The learners studies every day.','The learner study every day.','The learners study every day.','The learners studying every day.'],2,'The plural subject “learners” takes the present-tense verb “study”. A singular subject would use “studies”.'],
      ['Figurative language','“Her explanation was as clear as glass.” Which figure of speech is used?',['Metaphor','Simile','Irony','Hyperbole'],1,'A simile makes an explicit comparison using “like” or “as”. Here the explanation is compared to clear glass.'],
      ['Passive voice','Choose the passive form of “The teacher marked the scripts.”',['The scripts marked the teacher.','The scripts were marked by the teacher.','The teacher was marking scripts.','The scripts are marking.'],1,'The object “the scripts” becomes the subject. Use the past passive “were marked” to preserve the original tense.'],
      ['Connecting ideas','Choose the connector that shows contrast: “The topic was difficult; ___, she kept practising.”',['therefore','however','because','similarly'],1,'“However” signals contrast between the difficulty and her decision to keep practising. “Therefore” signals a result instead.'],
      ['Inference','Read: “Thabo looked at the dark clouds and packed an umbrella.” What can reasonably be inferred?',['Thabo expected possible rain','It had already snowed','Thabo disliked school','The umbrella was broken'],0,'The clouds and the umbrella support the inference that he expected rain. The other conclusions are not supported by the text.'],
    ],
  },
];
