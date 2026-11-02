/**
 * bias/data.js
 * Thinking biases and case files for Bias Buster (Hard list).
 *
 * A case has:
 *   title  short name        text  the scenario (1 to 3 sentences)
 *   b      key of the bias (see BIASES)
 *   why    how the bias shows up in this case
 *   bust   [best strategy, wrong strategy, wrong strategy]
 *   not    (optional) biases that look too similar, never shown as wrong answers
 * Keep each bias unique inside its level.
 */
const BIAS = (() => {
  const BIASES = {
    // Beginner
    confirmation: { e: "🧲", name: "Confirmation bias", def: "Looking for and favouring information that supports what you already believe." },
    anchoring:    { e: "⚓", name: "Anchoring bias", def: "Relying too heavily on the first number or piece of information you see." },
    availability: { e: "📺", name: "Availability heuristic", def: "Judging how likely something is by how easily examples come to mind." },
    halo:         { e: "😇", name: "Halo effect", def: "Letting one good trait colour your opinion of everything else about a person or thing." },
    overconf:     { e: "🎯", name: "Overconfidence bias", def: "Being more certain than your knowledge or track record justifies." },
    hindsight:    { e: "⏪", name: "Hindsight bias", def: "Believing after the fact that you “knew it all along”." },
    fae:          { e: "🎭", name: "Fundamental attribution error", def: "Blaming a person’s character for their behaviour while ignoring the situation." },
    framing:      { e: "🖼️", name: "Framing effect", def: "Reacting differently to the same facts depending on how they are presented." },
    planning:     { e: "📅", name: "Planning fallacy", def: "Underestimating how long a task will take, even when similar tasks took longer." },
    selfserving:  { e: "🏅", name: "Self-serving bias", def: "Taking credit for success but blaming outside factors for failure." },
    // Intermediate
    loss:         { e: "😖", name: "Loss aversion", def: "Feeling a loss more strongly than an equal gain." },
    statusquo:    { e: "🛋️", name: "Status quo bias", def: "Preferring things to stay the same, even when a change would be better." },
    endowment:    { e: "🧸", name: "Endowment effect", def: "Valuing something more simply because you own it." },
    gambler:      { e: "🎰", name: "Gambler’s fallacy", def: "Believing a random streak must “balance out” soon." },
    optimism:     { e: "🌈", name: "Optimism bias", def: "Believing you are less likely than others to suffer bad events." },
    spotlight:    { e: "🔦", name: "Spotlight effect", def: "Overestimating how much other people notice you." },
    curse:        { e: "🎓", name: "Curse of knowledge", def: "Forgetting what it is like not to know something you know well." },
    ingroup:      { e: "👥", name: "In-group bias", def: "Favouring people who belong to your own group." },
    control:      { e: "🎲", name: "Illusion of control", def: "Believing you can influence outcomes that are really down to chance." },
    blindspot:    { e: "🕶️", name: "Bias blind spot", def: "Spotting bias in other people more easily than in yourself." },
    // Expert
    outcome:      { e: "🎬", name: "Outcome bias", def: "Judging a decision by how it turned out, not by how good the choice was at the time." },
    groupthink:   { e: "🐑", name: "Groupthink", def: "A group stays silent about doubts to keep agreement." },
    narrative:    { e: "📖", name: "Narrative fallacy", def: "Building a neat story to explain events that are partly random." },
    recency:      { e: "🕐", name: "Recency bias", def: "Giving too much weight to the most recent events." },
    affect:       { e: "😍", name: "Affect heuristic", def: "Letting your feelings about something decide how risky or beneficial you think it is." },
    harking:      { e: "🏹", name: "HARKing", def: "Making up a hypothesis after seeing the results and presenting it as planned." },
    pubbias:      { e: "📚", name: "Publication bias", def: "Exciting results get published more than dull ones, so published evidence looks stronger." },
    observer:     { e: "👓", name: "Observer-expectancy bias", def: "What the researcher expects quietly shapes how results are measured." },
    zerorisk:     { e: "🛡️", name: "Zero-risk bias", def: "Preferring to remove a small risk completely over reducing a bigger risk." },
    denominator:  { e: "🔢", name: "Denominator neglect", def: "Focusing on the number of cases and ignoring the size of the group." }
  };

  const LEVELS = [
    {
      id: "beginner", name: "Beginner", icon: "🌱", desc: "Everyday thinking traps",
      cases: [
        { title: "The Horoscope Fan", b: "confirmation",
          text: "Sara believes her daily horoscope is accurate. She remembers every day it matched her life and forgets the days it was wrong.",
          why: "Sara keeps the hits that support her belief and ignores the misses.",
          bust: ["Actively look for days when it was wrong, and count both", "Count only the days it was right", "Ask friends who also believe in horoscopes"] },
        { title: "The Price Tag", b: "anchoring",
          text: "A shop shows a jacket as “was $300, now $120”. Leo decides $120 is a bargain without checking what similar jackets cost.",
          why: "The first number ($300) became Leo’s reference point for what the jacket is worth.",
          bust: ["Compare prices of similar jackets before deciding", "Trust the crossed-out price as the real value", "Buy quickly before the sale ends"] },
        { title: "Shark News", b: "availability",
          text: "After watching news about a shark attack, Maya refuses to swim in the sea. The next day she happily drives to the beach.",
          why: "A vivid news story comes to mind easily, so Maya overestimates the risk, while the far bigger risk of driving feels small.",
          bust: ["Look up real statistics on how often each thing happens", "Trust how vivid the memory feels", "Ask others which story they remember best"] },
        { title: "The Charming Candidate", b: "halo",
          text: "A student council candidate is very friendly, so voters assume she is also organised and honest. Nobody reads her plans.",
          why: "One good trait (friendliness) is colouring the judgement of every other trait.",
          bust: ["Judge each quality separately, using evidence", "Vote for the friendliest person", "Ask the candidate how friendly she thinks she is"] },
        { title: "The Sure Thing", b: "overconf", not: ["planning", "hindsight"],
          text: "Before a test, Omar is “100% sure” he will score above 90. He hasn’t done a practice exam and has never scored above 75.",
          why: "Omar’s certainty is much higher than his preparation and track record support.",
          bust: ["Check your past results and take a practice test", "Study less because you feel so sure", "Imagine how great success will feel"] },
        { title: "I Knew It!", b: "hindsight", not: ["overconf"],
          text: "After his team loses, Ben says, “I knew they would lose.” Before the match, he had predicted they would win.",
          why: "Knowing the result changed how Ben remembers his own prediction.",
          bust: ["Write predictions down beforehand and check them later", "Trust your memory of what you thought", "Only make predictions after the result is known"] },
        { title: "The Late Classmate", b: "fae", not: ["selfserving"],
          text: "Sam arrives late to a group meeting. Chris tells everyone, “Sam is so lazy,” without asking what happened.",
          why: "Chris explains the behaviour by Sam’s character and ignores possible situations like a delayed bus.",
          bust: ["Ask what situation might explain it before judging character", "Assume the first explanation is the true one", "Judge people by their worst moments"] },
        { title: "Two Labels", b: "framing",
          text: "Yogurt A is labelled “90% fat-free”. Yogurt B says “contains 10% fat”. They are identical, but Zoe believes A is healthier.",
          why: "The same fact sounds better or worse depending on the wording.",
          bust: ["Rewrite both claims in the same form and compare", "Pick the one with the more positive wording", "Ignore the numbers on the label"] },
        { title: "The Report", b: "planning", not: ["overconf"],
          text: "Lina plans to finish her report in two days, though her last three reports each took a full week.",
          why: "Lina plans for the best case and ignores how long similar tasks really took.",
          bust: ["Base the estimate on how long similar tasks really took", "Assume this time everything will go perfectly", "Plan for exactly the best case"] },
        { title: "The Test Result", b: "selfserving", not: ["fae"],
          text: "Dan says he aced one exam because he is smart. After failing the next one, he says the teacher set unfair questions.",
          why: "Dan credits himself for success but blames outside factors for failure.",
          bust: ["Ask what part you controlled in both results", "Credit yourself for good results only", "Blame yourself for everything"] }
      ]
    },
    {
      id: "intermediate", name: "Intermediate", icon: "🚀", desc: "Biases in choices, risk and groups",
      cases: [
        { title: "The Coin Flip", b: "loss", not: ["endowment"],
          text: "Priya is offered a coin-flip bet: 50% to win $120, 50% to lose $100. She refuses, though on average she would gain $10 per bet.",
          why: "The possible $100 loss feels bigger to Priya than the possible $120 gain.",
          bust: ["Compare the average outcome in numbers, not feelings", "Refuse any bet where a loss is possible", "Accept only if you cannot lose"] },
        { title: "The Old Plan", b: "statusquo", not: ["endowment"],
          text: "Mark keeps his old phone plan, though a new one offers more data for $10 less. He says, “Changing is a hassle.”",
          why: "Mark sticks with the current option just because it is the current option.",
          bust: ["List the costs and benefits of switching versus staying", "Keep what you have, it is safer", "Switch only if a friend switches too"] },
        { title: "The Mug", b: "endowment", not: ["loss", "statusquo"],
          text: "Elena buys a mug for $5. Once it is hers, she refuses to sell it for $12, though she would never pay $12 for it in a shop.",
          why: "Owning the mug made Elena value it more than she did before she owned it.",
          bust: ["Ask yourself whether you would pay this price to buy it today", "Set the price by how attached you feel", "Never sell anything you own"] },
        { title: "Red Again", b: "gambler", not: ["control"],
          text: "A roulette wheel lands on red five times in a row. Jonas bets big on black because it is “due”.",
          why: "Each spin is independent, so the past streak does not make black more likely.",
          bust: ["Remember that each spin is independent of the last", "Bet on the colour that has appeared less", "Double the bet after every loss"] },
        { title: "Won’t Happen to Me", b: "optimism",
          text: "Tom skips wearing a helmet on his bike because accidents “happen to other people”.",
          why: "Tom believes his own risk is lower than the real risk for people like him.",
          bust: ["Use real accident rates for people like you", "Rely on your lucky streak", "Ask only people who have never had an accident"] },
        { title: "The Stain", b: "spotlight",
          text: "Rina is sure everyone noticed a small stain on her shirt. She stays quiet and avoids people all day.",
          why: "Rina overestimates how much others notice her; most were focused on themselves.",
          bust: ["Remember most people focus on themselves, and test it by asking a friend", "Assume everyone notices every detail", "Hide in a corner for the rest of the day"] },
        { title: "The Tutor", b: "curse",
          text: "A tutor explains fractions using jargon and skips steps that feel obvious to her. The beginner is completely lost.",
          why: "The tutor can’t remember what it was like not to understand fractions.",
          bust: ["Ask the learner to explain it back, then adjust", "Explain faster so there is less time to get confused", "Use more advanced words to sound clear"] },
        { title: "Team Picks", b: "ingroup",
          text: "Manager Eli picks a candidate from his old university as “the best”, although two other applicants are stronger on paper.",
          why: "Eli favours someone from his own group over better-qualified outsiders.",
          bust: ["Score every candidate with the same written criteria, ideally anonymised", "Trust the person who feels most like you", "Interview only people you already know"] },
        { title: "Lucky Dice", b: "control", not: ["gambler"],
          text: "Kai blows on the dice before every throw and is convinced it makes sixes more likely.",
          why: "Kai believes a ritual influences an outcome that is pure chance.",
          bust: ["Test it: record many throws with and without blowing", "Blow harder on important throws", "Remember only the throws where it worked"] },
        { title: "Not Me", b: "blindspot",
          text: "After reading about thinking biases, Nia says, “Lots of people are biased, but my judgements are objective.”",
          why: "Nia sees bias in others but not in herself.",
          bust: ["Use checklists and outside feedback to catch your own biases", "Trust that you are the exception", "Point out biases only in other people"] }
      ]
    },
    {
      id: "expert", name: "Expert", icon: "👑", desc: "Biases in research, teams and risk",
      cases: [
        { title: "The Risky Bet", b: "outcome",
          text: "A manager made a well-researched investment that lost money because of a freak event. Her team says she decided badly.",
          why: "The team judges the decision by its result, not by the information available when it was made.",
          bust: ["Judge the decision by what was known when it was made", "Judge it only by the profit", "Never take investment risks again"] },
        { title: "The Meeting", b: "groupthink",
          text: "Everyone on the team has doubts about a plan, but nobody speaks because the leader looks confident and the room seems united.",
          why: "The group suppresses doubts to protect agreement.",
          bust: ["Collect private opinions first and assign someone to argue against the plan", "Ask for a show of hands straight away", "Let the most senior person decide at once"] },
        { title: "The Founder Story", b: "narrative", not: ["harking"],
          text: "A magazine explains a startup’s success by the founder’s morning routine, ignoring luck and timing.",
          why: "A neat story hides how much of the outcome was chance.",
          bust: ["Ask which parts were luck, and look for cases that contradict the story", "Choose the most inspiring explanation", "Add more personal details to the story"] },
        { title: "Performance Review", b: "recency",
          text: "A manager rates an employee mostly on the last two weeks, although the employee did excellent work for the other 50 weeks.",
          why: "Recent events weigh far more heavily than the full year of evidence.",
          bust: ["Review the whole year using notes or data", "Trust what you remember best", "Ask the employee how they feel"] },
        { title: "The Cute Robot", b: "affect",
          text: "Because she loves the friendly look of a new gadget, Ines rates its privacy risks as “very low” without reading anything.",
          why: "Ines’s positive feelings about the gadget decide how risky she thinks it is.",
          bust: ["Separate how you feel from what the evidence says about the risks", "Trust your gut reaction", "Ask the company whether it is safe"] },
        { title: "The Paper", b: "harking", not: ["narrative"],
          text: "A researcher finds an unexpected effect, then writes the introduction as if she had predicted it from the start.",
          why: "The hypothesis was made up after the results were known but presented as planned.",
          bust: ["Pre-register hypotheses and label surprises as exploratory", "Rewrite the story so it sounds more impressive", "Delete results that do not fit"] },
        { title: "The Drug Review", b: "pubbias",
          text: "A review finds 8 published studies showing a drug works. It does not mention 12 unpublished studies that found no effect.",
          why: "Positive results get published more often, so the visible evidence looks stronger than it is.",
          bust: ["Search trial registries for unpublished results and include them", "Review only the best journals", "Trust whichever side has more papers online"] },
        { title: "The Essay Marker", b: "observer",
          text: "A teacher who knows which students tried her new method unconsciously gives their essays higher marks.",
          why: "Her expectations shape how she scores the work.",
          bust: ["Use blinding: the marker should not know which group each student is in", "Mark more quickly to avoid overthinking", "Ask the students how well the method worked"] },
        { title: "Safety Budget", b: "zerorisk", not: ["denominator"],
          text: "A city can remove one hazard that causes 2 injuries a year entirely, or cut another hazard from 50 to 25 injuries a year. Officials choose the first because it gives “zero risk”.",
          why: "Removing a small risk completely feels better than a bigger reduction in a larger risk.",
          bust: ["Compare how many injuries each option prevents overall", "Pick the option that removes a risk completely", "Pick the cheaper-looking option without counting injuries"] },
        { title: "Which Bag?", b: "denominator", not: ["zerorisk"],
          text: "Bag A has 1 winning ticket out of 10. Bag B has 8 winning tickets out of 100. Leo picks Bag B because it has more winning tickets.",
          why: "Leo looks at the number of winners and ignores how many tickets each bag holds (10% vs 8%).",
          bust: ["Convert both to the same base, such as percentages, before comparing", "Choose the bag with more winning tickets", "Pick at random since the odds look similar"] }
      ]
    }
  ];

  return { BIASES, LEVELS };
})();
