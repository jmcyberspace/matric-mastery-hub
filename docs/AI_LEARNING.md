# AI-guided learning

The learning loop is: choose a topic, understand the idea, work through an example, try a check and discuss the reasoning. A learner can also ask their own question in any supported subject. AI messages and checks remain private to that account; staff dashboards show class counts and aggregate service activity, not private conversations.

## Current scope

Eight original foundation guides cover quadratic equations, function substitution, net force, Ohm's law, DNA base pairing, simple genetic crosses, reading inference and figurative language. Each has four check questions, shown as two alternating pairs. These are shared foundations for Grades 11 and 12, not a complete syllabus, official examination content or a teacher-reviewed course. Teacher-authored assessments remain separate from repeatable topic checks.

The selected topic's reference guide is sent with the tutor's server-controlled prompt. The four modes change that prompt: explanation, worked example, one hint, or one conversational question. Mode labels express intended behaviour; a real model still needs evaluation. Switching mode retains the conversation. Changing the topic starts a new conversation. Opening a topic or a saved conversation never sends a paid request by itself.

Check scores come from deterministic server marking. AI conversational quizzes do not award marks. The learner must select **Review my reasoning with AI** to send their check feedback to the provider. A correct two-question check is limited practice evidence, not a reliable measure of mastery.

## Content review and maintenance

Edit `db/topic-content.js` on the server. Use stable topic and question IDs, a correct subject and grade range, a concise learning goal, an accurate original guide, a worked example and four questions with four options each. The answer index is zero-based. Increase the topic version when questions or meaning change; older browser submissions will then request a reload. Keep IDs for retained topics so existing conversations can still find their references.

Have a subject teacher review accuracy, notation, prerequisite knowledge, reading level, distractors, feedback and curriculum placement before a learner pilot. The catalog is intentionally small so those reviews can be concrete. It is not editable through the teacher assessment builder yet.

## Local acceptance checks

Use separate administrator and learner browser sessions with synthetic accounts. Follow `LOCAL_TESTING.md` to enable the provider without exposing credentials. A configured status alone is not a successful provider test.

| Action | Expected result |
| --- | --- |
| Open a topic without AI settings | Guide, example and two-question check work; live reply controls explain that setup is needed |
| Ask for a simple explanation | Accurate core idea in readable steps, with a brief check question |
| Say “I still do not understand” | A different explanation or useful diagnostic question |
| Choose a worked example | Reasoning for each step, then a similar question to try |
| Give an attempted solution in hint mode | One useful hint; no immediate final answer |
| Choose Quiz me, then answer incorrectly | One question at a time, followed by feedback on the reasoning |
| Submit a topic check and reload | Saved score persists; the next pair of questions is offered |
| Review check reasoning with AI | Tutor receives the learner-selected feedback and discusses it |
| Reopen a saved topic conversation | Correct subject, topic and stored messages |
| Interrupt a request or simulate a gateway failure | Retry checks the original ID until failure is confirmed; an already received reply does not invite a second paid request |
| Switch between learner and staff accounts | Learner topic home versus staff management home; no private chats shared |
| Use 320px, 390px and desktop widths | No horizontal page scroll; navigation, checks and message composer remain usable |

Repeat teaching checks for English, Afrikaans and Setswana with a fluent reviewer. Record inaccurate answers and unhelpful hints before choosing a model and expanding the topic catalog. Automated provider stubs verify requests and recovery, not explanation quality, provider availability, latency or actual billing.

## Pilot measures

For a small teacher-supervised pilot, compare independent topic questions before and after tutoring, ask learners to explain their reasoning, and collect the steps they still find unclear. Review factual errors and teacher corrections alongside completion, return use, reply latency and cost per useful session. The current app does not implement those pilot analytics or an automated mastery model.
